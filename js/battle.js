// 三国·天命 — Battle Engine
// 5v5 turn-based with unit counters, rage, skills

const Battle = {
  state: null,
  log: [],
  onUpdate: null, // UI callback

  // Create battle state
  init(playerTeam, enemyTeam, terrain='plains', weather='clear', enemyScale=1) {
    this.log = [];
    this.vfx = []; // Visual effects queue for UI layer
    this.state = {
      turn: 0,
      phase: 'ready', // ready, fighting, victory, defeat
      terrain, weather,
      player: playerTeam.map((h,i) => this.createFighter(h, 'player', i)),
      enemy: enemyTeam.map((h,i) => this.createFighter(h, 'enemy', i, enemyScale)),
    };
    // Apply passives
    this.applyBattleStartPassives();
    return this.state;
  },

  createFighter(heroId, side, pos, enemyScale) {
    const hero = typeof heroId === 'string' ? HEROES[heroId] : heroId;
    if (!hero) return null;
    const level = side === 'player' ? (Storage?.getHeroLevel?.(hero.id) || 1) : 1;
    const stars = side === 'player' ? (Storage?.getHeroStars?.(hero.id) || hero.rarity || 1) : (hero.rarity || 1);
    let mult = (1 + (level - 1) * 0.08) * (1 + (stars - 1) * 0.15);
    // Scale enemy fighters for dungeon/arena/raid
    if (side === 'enemy' && enemyScale > 1) mult *= enemyScale;

    let eqHP=0, eqATK=0, eqDEF=0, eqSPD=0, eqINT=0;
    let equipEffects = { crit_pct:0, skill_dmg_pct:0, reflect_pct:0 };
    // Apply equipment stats for player heroes
    if (side === 'player' && typeof Equipment !== 'undefined') {
      const eqData = Equipment.getHeroEquipmentStats(hero.id);
      if (eqData) { eqHP=eqData.stats.hp; eqATK=eqData.stats.atk; eqDEF=eqData.stats.def; eqSPD=eqData.stats.spd; eqINT=eqData.stats.int; }
      equipEffects = Equipment.getHeroBattleEffects(hero.id);
    }

    let baseHP  = Math.floor(hero.baseStats.hp * mult)  + eqHP;
    let baseATK = Math.floor(hero.baseStats.atk * mult) + eqATK;
    let baseDEF = Math.floor(hero.baseStats.def * mult) + eqDEF;
    let baseSPD = Math.floor(hero.baseStats.spd * mult) + eqSPD;
    let baseINT = Math.floor(hero.baseStats.int * mult) + eqINT;

    // Apply skill tree bonuses for player heroes
    let specials = [];
    if (side === 'player' && typeof SkillTree !== 'undefined') {
      const stBonuses = SkillTree.getStatBonuses(hero.id);
      if (stBonuses.atk_pct) baseATK = Math.floor(baseATK * (1 + stBonuses.atk_pct / 100));
      if (stBonuses.def_pct) baseDEF = Math.floor(baseDEF * (1 + stBonuses.def_pct / 100));
      if (stBonuses.hp_pct)  baseHP  = Math.floor(baseHP  * (1 + stBonuses.hp_pct / 100));
      if (stBonuses.spd_pct) baseSPD = Math.floor(baseSPD * (1 + stBonuses.spd_pct / 100));
      if (stBonuses.int_pct) baseINT = Math.floor(baseINT * (1 + stBonuses.int_pct / 100));
      // Merge skill tree combat effects into equipEffects
      if (stBonuses.crit_pct)      equipEffects.crit_pct      += stBonuses.crit_pct;
      if (stBonuses.skill_dmg_pct) equipEffects.skill_dmg_pct += stBonuses.skill_dmg_pct;
      if (stBonuses.crit_dmg_pct)  equipEffects.crit_dmg_pct  = (equipEffects.crit_dmg_pct || 0) + stBonuses.crit_dmg_pct;
      if (stBonuses.dodge_pct)     equipEffects.dodge_pct     = (equipEffects.dodge_pct || 0) + stBonuses.dodge_pct;
      // Collect special abilities from skill tree
      specials = SkillTree.getSpecials(hero.id);
    }

    // City Builder combat bonuses
    if (side === 'player' && typeof City !== 'undefined') {
      const cityBonus = City.getCombatBonuses();
      if (cityBonus.atk_pct) baseATK = Math.floor(baseATK * (1 + cityBonus.atk_pct / 100));
      if (cityBonus.def_pct) baseDEF = Math.floor(baseDEF * (1 + cityBonus.def_pct / 100));
    }

    // Element from HERO_ELEMENTS map
    const element = (typeof HERO_ELEMENTS !== 'undefined') ? (HERO_ELEMENTS[hero.id] || null) : null;

    return {
      id: hero.id,
      name: hero.name,
      emoji: hero.emoji,
      side, pos,
      unit: hero.unit,
      faction: hero.faction,
      rarity: hero.rarity,
      element,
      hp: baseHP,
      maxHp: baseHP,
      atk: baseATK,
      def: baseDEF,
      spd: baseSPD,
      int: baseINT,
      rage: 0,
      maxRage: hero.skill?.rage || 100,
      skill: hero.skill,
      passive: hero.passive,
      alive: true,
      buffs: [],   // {stat, pct, duration}
      debuffs: [],
      effects: [], // stun, charm, invincible
      equipEffects, // from equipment sets
      _specials: specials, // from skill tree
      appliedElement: null, // for element reaction system
    };
  },

  // ===== CORE BATTLE LOOP =====
  async run(speed = 1) {
    this.state.phase = 'fighting';
    while (this.state.phase === 'fighting') {
      this.state.turn++;
      await this.executeTurn(speed);
      // Check win/lose
      const playerAlive = this.state.player.filter(f => f?.alive).length;
      const enemyAlive = this.state.enemy.filter(f => f?.alive).length;
      if (enemyAlive === 0) { this.state.phase = 'victory'; break; }
      if (playerAlive === 0) { this.state.phase = 'defeat'; break; }
      if (this.state.turn > 30) { this.state.phase = 'defeat'; break; } // timeout
    }
    return this.state.phase;
  },

  async executeTurn(speed) {
    // Strategy: turn-start hooks
    let vanguardExtra = null;
    if (typeof Strategy !== 'undefined') {
      vanguardExtra = Strategy.onTurnStart(this.state.turn, this.state);
    }

    // Tick buffs/debuffs
    [...this.state.player, ...this.state.enemy].filter(f => f?.alive).forEach(f => {
      this.tickEffects(f);
      // Turn-start passives (e.g. heal per turn)
      if (f.passive?.condition === 'turn_start' && f.passive.heal_pct) {
        const heal = Math.floor(f.maxHp * f.passive.heal_pct / 100);
        f.hp = Math.min(f.maxHp, f.hp + heal);
        this.addLog(`${Visuals.heroTag(f.id)} ${f.name} 回复 ${heal} HP`);
      }
    });

    // Sort all alive fighters by SPD (desc)
    const order = [...this.state.player, ...this.state.enemy]
      .filter(f => f?.alive)
      .sort((a, b) => this.getEffStat(b, 'spd') - this.getEffStat(a, 'spd'));

    // Strategy: Vanguard extra action at start of turn 1
    if (vanguardExtra && vanguardExtra.alive) {
      const enemies = (vanguardExtra.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
      if (enemies.length > 0) {
        const target = enemies.sort((a, b) => a.pos - b.pos)[0];
        this.doAttack(vanguardExtra, target);
        if (this.onUpdate) this.onUpdate(this.state);
        await this.wait(Math.floor(400 / speed));
      }
    }

    for (const fighter of order) {
      if (!fighter.alive) continue;
      if (fighter.effects.some(e => e.type === 'stun')) {
        this.addLog(`${Visuals.heroTag(fighter.id)} ${fighter.name} 被眩晕，无法行动！`);
        continue;
      }
      if (fighter.effects.some(e => e.type === 'charm')) {
        // Attack own ally
        const allies = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive && f !== fighter);
        if (allies.length > 0) {
          const target = allies[Math.floor(Math.random() * allies.length)];
          this.doAttack(fighter, target);
          this.addLog(`${Visuals.heroTag(fighter.id)} ${fighter.name} 被魅惑，攻击了 ${target.name}！`);
        }
        continue;
      }

      // Check if rage full → use skill (auto for enemy, manual-ready for player)
      if (fighter.rage >= fighter.maxRage && fighter.skill) {
        this.useSkill(fighter);
      } else {
        // Normal attack
        const enemies = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
        if (enemies.length === 0) continue;
        // Strategy: Chain Stratagem target locking
        let target = null;
        if (typeof Strategy !== 'undefined') {
          target = Strategy.getChainTarget(fighter, this.state);
        }
        if (!target) {
          // Target: front row first, then back
          target = enemies.sort((a, b) => a.pos - b.pos)[0];
        }
        this.doAttack(fighter, target);
      }

      if (this.onUpdate) this.onUpdate(this.state);
      await this.wait(Math.floor(400 / speed));
    }

    // Strategy: turn-end hooks
    if (typeof Strategy !== 'undefined') {
      Strategy.onTurnEnd(this.state.turn, this.state);
    }
  },

  // ===== COMBAT MECHANICS =====
  doAttack(attacker, defender) {
    if (!defender?.alive) return;

    // Dodge check from skill tree
    if (defender._specials) {
      let dodgeChance = 0;
      if (defender._specials.includes('dodge_pct')) dodgeChance += 10;
      const dodgeBonuses = defender.equipEffects?.dodge_pct || 0;
      dodgeChance += dodgeBonuses;
      // Emergency dodge at low HP
      if (defender._specials.includes('emergency_dodge') && defender.hp < defender.maxHp * 0.4) dodgeChance += 30;
      if (dodgeChance > 0 && Math.random() * 100 < dodgeChance) {
        this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 闪避了攻击！`);
        // Dodge heal
        if (defender._specials.includes('dodge_heal')) {
          const heal = Math.floor(defender.maxHp * 0.05);
          defender.hp = Math.min(defender.maxHp, defender.hp + heal);
        }
        // Dodge counter
        if (defender._specials.includes('dodge_counter') && attacker.alive) {
          const counterDmg = Math.floor(this.getEffStat(defender, 'atk'));
          attacker.hp = Math.max(0, attacker.hp - counterDmg);
          this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 闪避反击！${counterDmg}伤害`);
          if (attacker.hp <= 0) attacker.alive = false;
        }
        defender.rage = Math.min(defender.maxRage, (defender.rage || 0) + 5);
        return;
      }
    }

    let dmg = this.calcDamage(attacker, defender);
    
    // Unit type advantage
    const advMult = this.getUnitAdvantage(attacker.unit, defender.unit);
    dmg = Math.floor(dmg * advMult);

    // Terrain bonus
    dmg = Math.floor(dmg * this.getTerrainMult(attacker.unit, this.state.terrain));

    // Weather effect
    dmg = Math.floor(dmg * this.getWeatherMult(attacker, this.state.weather));

    // Strategy: damage modification hook
    if (typeof Strategy !== 'undefined') {
      dmg = Strategy.onAttack(attacker, defender, dmg, this.state);
    }

    // Apply damage
    defender.hp = Math.max(0, defender.hp - dmg);
    if (defender.hp <= 0) {
      // Cheat death from skill tree or passive
      let cheated = false;
      if (defender._specials?.includes('cheat_death') || defender._specials?.includes('cheat_death_50') || defender._specials?.includes('undying_once')) {
        const chance = defender._specials.includes('undying_once') ? 100 : 50;
        if (!defender._cheatedDeath && Math.random() * 100 < chance) {
          defender.hp = 1;
          defender.alive = true;
          defender._cheatedDeath = true;
          cheated = true;
          this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 不屈意志！以1HP存活！`);
        }
      }
      // Sima Yi passive: on_lethal
      if (!cheated && defender.passive?.condition === 'on_lethal' && !defender._cheatedDeath) {
        if (Math.random() * 100 < (defender.passive.chance || 0)) {
          defender.hp = 1;
          defender.alive = true;
          defender._cheatedDeath = true;
          cheated = true;
          this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 隐忍！以1HP存活！`);
        }
      }
      // Strategy: revival hook (七星灯)
      if (!cheated && typeof Strategy !== 'undefined') {
        cheated = Strategy.onDeath(defender, this.state);
      }
      if (!cheated) {
        defender.alive = false;
        this.addLog(`${Visuals.heroTag(attacker.id)} ${attacker.name} 击杀了 ${Visuals.heroTag(defender.id)} ${defender.name}！`);
        this.vfx.push({ type: 'kill', target: `${defender.side}-${defender.pos}` });
      }
    } else {
      this.addLog(`${Visuals.heroTag(attacker.id)} ${attacker.name} → ${Visuals.heroTag(defender.id)} ${defender.name} ${dmg}伤害${advMult > 1 ? ' (克制!)' : ''}`);
    }

    // Equipment set: 玄甲 reflect damage
    if (defender.alive && defender.equipEffects?.reflect_pct > 0) {
      const reflectDmg = Math.floor(dmg * defender.equipEffects.reflect_pct / 100);
      if (reflectDmg > 0) {
        attacker.hp = Math.max(0, attacker.hp - reflectDmg);
        this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 玄甲反弹 ${reflectDmg}伤害！`);
        if (attacker.hp <= 0) { attacker.alive = false; }
      }
    }

    // Element reaction check
    if (attacker.element && defender.alive && typeof ELEMENT_REACTIONS !== 'undefined') {
      this.checkElementReaction(attacker, defender);
    }

    // Gain rage
    attacker.rage = Math.min(attacker.maxRage, attacker.rage + 20);
    defender.rage = Math.min(defender.maxRage, (defender.rage || 0) + 10);

    // Queue visual effects for UI layer
    this.vfx.push({ type: 'attack', attacker: `${attacker.side}-${attacker.pos}`, target: `${defender.side}-${defender.pos}`, dmg, isCrit: this._lastCrit || false });

    // Skill tree specials: lifesteal
    if (attacker.alive && attacker._specials) {
      if (attacker._specials.includes('lifesteal_10') || attacker._specials.includes('lifesteal_8')) {
        const pct = attacker._specials.includes('lifesteal_10') ? 10 : 8;
        const heal = Math.floor(dmg * pct / 100);
        if (heal > 0) {
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
          this.addLog(`${Visuals.heroTag(attacker.id)} ${attacker.name} 吸血 +${heal} HP`);
        }
      }
      // Stun on hit
      if (defender.alive && (attacker._specials.includes('stun_on_hit') || attacker._specials.includes('stun_on_hit_15'))) {
        const chance = attacker._specials.includes('stun_on_hit') ? 20 : 15;
        if (Math.random() * 100 < chance && !defender.effects.some(e => e.type === 'invincible')) {
          defender.effects.push({ type: 'stun', duration: 1 });
          this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 被眩晕！`);
        }
      }
      // Double strike
      if (defender.alive && (attacker._specials.includes('double_strike') || attacker._specials.includes('double_strike_20'))) {
        if (Math.random() * 100 < 20) {
          const extraDmg = Math.floor(dmg * 0.5);
          defender.hp = Math.max(0, defender.hp - extraDmg);
          this.addLog(`${Visuals.heroTag(attacker.id)} ${attacker.name} 连击！额外 ${extraDmg} 伤害`);
          if (defender.hp <= 0) { defender.alive = false; }
        }
      }
    }

    // Check counter-attack passive
    if (defender.alive && defender.passive?.condition === 'on_hit' && Math.random() * 100 < (defender.passive.chance || 0)) {
      const counterDmg = Math.floor(this.calcDamage(defender, attacker) * (defender.passive.value || 0.5));
      attacker.hp = Math.max(0, attacker.hp - counterDmg);
      this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 反击！${counterDmg}伤害`);
      if (attacker.hp <= 0) attacker.alive = false;
    }

    // Skill tree specials: counter on defend
    if (defender.alive && defender._specials) {
      const counterChance =
        defender._specials.includes('counter_50') ? 50 :
        defender._specials.includes('counter_40') ? 40 :
        defender._specials.includes('counter_30') ? 30 : 0;
      if (counterChance > 0 && Math.random() * 100 < counterChance && !defender.effects.some(e => e.type === 'stun')) {
        const counterDmg = Math.floor(this.calcDamage(defender, attacker) * 0.8);
        attacker.hp = Math.max(0, attacker.hp - counterDmg);
        this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 天赋反击！${counterDmg}伤害`);
        if (attacker.hp <= 0) attacker.alive = false;
      }
    }
  },

  calcDamage(atk, def) {
    const atkStat = this.getEffStat(atk, 'atk');
    let defStat = this.getEffStat(def, 'def');
    // Armor penetration from skill tree
    if (atk._specials) {
      const armorPenPcts = atk._specials.filter(s => s === 'armor_pen_pct').length;
      // Check stat bonuses for armor_pen_pct (accumulated in SkillTree.getStatBonuses)
      // For simplicity, check _specials strings
    }
    const base = Math.max(1, atkStat - defStat * 0.5);
    const variance = 0.9 + Math.random() * 0.2;
    // Crit chance: 10% base + buff + equipment set bonus
    const equipCrit = atk.equipEffects?.crit_pct || 0;
    const critChance = 10 + (atk.buffs.find(b => b.stat === 'crit')?.pct || 0) + equipCrit;
    const isCrit = Math.random() * 100 < critChance;
    // Crit damage bonus from skill tree
    let critMult = 1.5;
    if (isCrit && atk.equipEffects?.crit_dmg_pct) critMult += atk.equipEffects.crit_dmg_pct / 100;
    this._lastCrit = isCrit; // Expose crit status for VFX
    return Math.floor(base * variance * (isCrit ? critMult : 1));
  },

  getEffStat(fighter, stat) {
    let val = fighter[stat] || 0;
    // Apply buffs
    for (const b of fighter.buffs) {
      if (b.stat === stat) val = Math.floor(val * (1 + b.pct / 100));
    }
    // Apply debuffs
    for (const d of fighter.debuffs) {
      if (d.stat === stat) val = Math.floor(val * (1 + d.pct / 100)); // pct is negative
    }
    // Conditional passives
    const p = fighter.passive;
    if (p && p.stat === stat) {
      if (p.condition === 'hp_below_30' && fighter.hp < fighter.maxHp * 0.3) val = Math.floor(val * (1 + p.pct / 100));
      if (p.condition === 'hp_above_70' && fighter.hp > fighter.maxHp * 0.7) val = Math.floor(val * (1 + p.pct / 100));
      if (p.condition === 'turn_gt_5' && this.state.turn > 5) val = Math.floor(val * (1 + p.pct / 100));
    }
    return val;
  },

  // Unit advantage: 1.3x strong, 0.7x weak, 1.0x neutral
  getUnitAdvantage(atkUnit, defUnit) {
    const ut = UNIT_TYPES[atkUnit];
    if (!ut) return 1;
    if (ut.strong === defUnit) return 1.3;
    if (ut.weak === defUnit) return 0.7;
    return 1;
  },

  // Terrain multipliers
  getTerrainMult(unit, terrain) {
    const bonuses = {
      plains:  { cavalry: 1.2, spear: 1.0, archer: 1.0, shield: 1.0, mage: 1.0 },
      mountain:{ cavalry: 0.8, spear: 1.0, archer: 1.2, shield: 1.1, mage: 1.0 },
      water:   { cavalry: 0.7, spear: 0.9, archer: 1.0, shield: 0.8, mage: 1.3 },
      river:   { cavalry: 0.7, spear: 0.9, archer: 1.0, shield: 0.8, mage: 1.3 },
      forest:  { cavalry: 0.8, spear: 1.1, archer: 1.2, shield: 0.9, mage: 1.1 },
      castle:  { cavalry: 0.8, spear: 1.0, archer: 1.1, shield: 1.3, mage: 1.0 }
    };
    return bonuses[terrain]?.[unit] || 1;
  },

  // Weather effects (isSkill=true when casting a skill, false for normal attacks)
  getWeatherMult(fighter, weather, isSkill = false) {
    if (weather === 'rain' && isSkill && fighter.skill?.type === 'magic') return 0.5;
    if (weather === 'fog') return Math.random() > 0.3 ? 1 : 0.5; // 30% miss in fog
    if (weather === 'fire' && fighter.unit === 'mage') return 1.2;
    if (weather === 'wind' && fighter.unit === 'archer') return 1.15; // Wind aids arrows
    if (weather === 'wind' && isSkill && fighter.skill?.type === 'magic') return 1.1; // Wind fans magical flames
    return 1;
  },

  // ===== SKILLS =====
  useSkill(fighter) {
    const s = fighter.skill;
    if (!s) return;
    fighter.rage = 0;
    const enemies = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
    const allies = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive);

    this.addLog(`${Visuals.heroTag(fighter.id)} ${fighter.name} 释放【${s.name}】！`);
    this.vfx.push({ type: 'skill', caster: `${fighter.side}-${fighter.pos}`, skillName: s.name });

    // Equipment set: 凤翼 skill damage bonus
    const skillDmgBonus = fighter.equipEffects?.skill_dmg_pct || 0;

    switch (s.type) {
      case 'damage': {
        let targets;
        if (enemies.length === 0) break; // No targets — skip
        if (s.target === 'single_enemy') targets = [enemies.sort((a,b) => a.hp - b.hp)[0]];
        else if (s.target === 'all_enemy') targets = enemies;
        else if (s.target === 'back_row') targets = enemies.filter(f => f.pos >= 2).length > 0 ? enemies.filter(f => f.pos >= 2) : enemies;
        else if (s.target === 'front_row') targets = enemies.filter(f => f.pos < 2).length > 0 ? enemies.filter(f => f.pos < 2) : enemies;
        else targets = [enemies[0]];
        targets = targets.filter(Boolean); // Safety: remove nulls

        for (const t of targets) {
          const hits = s.hits || 1;
          for (let h = 0; h < hits; h++) {
            let dmg = Math.floor(this.getEffStat(fighter, 'atk') * s.value);
            dmg = Math.floor(dmg * (1 + skillDmgBonus / 100));
            if (s.guaranteed_crit) dmg = Math.floor(dmg * 1.5);
            t.hp = Math.max(0, t.hp - dmg);
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} -${dmg} HP`);
            if (t.hp <= 0) { t.alive = false; break; }
          }
        }
        // Apply debuff to targets (e.g. Xu Huang armor break, Dong Zhuo fear)
        if (s.debuff) {
          for (const t of targets) {
            if (t.alive && !t.effects.some(e => e.type === 'invincible')) {
              t.debuffs.push({ stat: s.debuff.stat, pct: s.debuff.pct, duration: s.debuff.duration });
              this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} ${s.debuff.stat}${s.debuff.pct}% ${s.debuff.duration}回合`);
            }
          }
        }
        // Self buff (e.g. Zhao Yun invincible, shield militia DEF up)
        if (s.selfBuff) {
          if (s.selfBuff.effect) fighter.effects.push({ type: s.selfBuff.effect, duration: s.selfBuff.duration });
          if (s.selfBuff.stat) fighter.buffs.push({ stat: s.selfBuff.stat, pct: s.selfBuff.pct, duration: s.selfBuff.duration });
        }
        break;
      }
      case 'magic': {
        if (enemies.length === 0) break;
        const targets = s.target === 'all_enemy' ? enemies : [enemies.sort((a,b) => a.hp - b.hp)[0]];
        for (const t of targets) {
          let dmg = Math.floor(this.getEffStat(fighter, 'int') * s.value);
          dmg = Math.floor(dmg * (1 + skillDmgBonus / 100));
          // Weather affects magic skills (e.g. rain weakens fire magic)
          dmg = Math.floor(dmg * this.getWeatherMult(fighter, this.state.weather, true));
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} -${dmg} 法伤`);
          if (t.hp <= 0) t.alive = false;
          // Element reaction from skills
          else if (fighter.element && typeof ELEMENT_REACTIONS !== 'undefined') {
            this.checkElementReaction(fighter, t);
          }
        }
        break;
      }
      case 'heal': {
        if (allies.length === 0) break;
        const targets = (s.target === 'all_ally' ? allies : [allies.sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0]]).filter(Boolean);
        for (const t of targets) {
          const heal = Math.floor(t.maxHp * s.value);
          t.hp = Math.min(t.maxHp, t.hp + heal);
          this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} +${heal} HP`);
        }
        break;
      }
      case 'buff': {
        const targets = s.target === 'all_ally' ? allies : [fighter];
        for (const t of targets) {
          t.buffs.push({ stat: s.stat, pct: s.pct, duration: s.duration });
          this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} ${s.stat}+${s.pct}% (${s.duration}回合)`);
        }
        break;
      }
      case 'cc': {
        if (enemies.length === 0) break;
        let targets;
        if (s.target === 'all_enemy') targets = enemies;
        else if (s.target === 'highest_atk_enemy') targets = [enemies.sort((a,b) => b.atk - a.atk)[0]];
        else targets = [enemies[0]];
        targets = targets.filter(Boolean);
        for (const t of targets) {
          if (t.effects.some(e => e.type === 'invincible')) {
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} 无敌，免疫控制！`);
          } else {
            t.effects.push({ type: s.effect, duration: s.duration });
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} 被${s.effect === 'stun' ? '眩晕' : '魅惑'}${s.duration}回合！`);
          }
        }
        break;
      }
      case 'debuff': {
        if (enemies.length === 0) break;
        // Apply debuffs to enemies (e.g. Guo Jia's 十胜十败)
        const debuffTargets = (s.target === 'all_enemy' ? enemies : [enemies[0]]).filter(Boolean);
        for (const t of debuffTargets) {
          if (t.effects.some(e => e.type === 'invincible')) {
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} 无敌，免疫减益！`);
            continue;
          }
          if (s.all_pct) {
            // Debuff all stats
            for (const stat of ['atk', 'def', 'spd', 'int']) {
              t.debuffs.push({ stat, pct: s.all_pct, duration: s.duration });
            }
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} 全属性${s.all_pct}% ${s.duration}回合`);
          } else if (s.stat) {
            t.debuffs.push({ stat: s.stat, pct: s.pct, duration: s.duration });
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} ${s.stat}${s.pct}% ${s.duration}回合`);
          }
        }
        break;
      }
      case 'mirror': {
        if (enemies.length === 0) break;
        // Copy the strongest enemy's skill and use it against them
        const strongest = enemies.sort((a,b) => (b.atk + b.int) - (a.atk + a.int))[0];
        if (strongest && strongest.skill) {
          const copiedSkill = strongest.skill;
          this.addLog(`  → 复制了 ${Visuals.heroTag(strongest.id)} ${strongest.name} 的【${copiedSkill.name}】！`);
          // Execute the copied skill as a damage/magic effect
          const copyDmg = copiedSkill.type === 'magic'
            ? Math.floor(this.getEffStat(fighter, 'int') * (copiedSkill.value || 1.5))
            : Math.floor(this.getEffStat(fighter, 'atk') * (copiedSkill.value || 1.5));
          const dmgWithBonus = Math.floor(copyDmg * (1 + skillDmgBonus / 100));
          strongest.hp = Math.max(0, strongest.hp - dmgWithBonus);
          this.addLog(`  → ${Visuals.heroTag(strongest.id)} ${strongest.name} -${dmgWithBonus} ${copiedSkill.type === 'magic' ? '法伤' : '伤害'}`);
          if (strongest.hp <= 0) strongest.alive = false;
        } else {
          // Fallback: deal INT-based damage
          const fallbackDmg = Math.floor(this.getEffStat(fighter, 'int') * 2.0);
          const target = enemies[0];
          if (target) {
            target.hp = Math.max(0, target.hp - fallbackDmg);
            this.addLog(`  → ${Visuals.heroTag(target.id)} ${target.name} -${fallbackDmg} 法伤`);
            if (target.hp <= 0) target.alive = false;
          }
        }
        break;
      }
    }
  },

  // ===== PASSIVES =====
  applyBattleStartPassives() {
    const all = [...this.state.player, ...this.state.enemy].filter(f => f);
    for (const f of all) {
      if (!f.passive) continue;
      // Faction aura
      if (f.passive.condition?.startsWith('faction_')) {
        const fac = f.passive.condition.split('_')[1];
        const team = f.side === 'player' ? this.state.player : this.state.enemy;
        for (const t of team.filter(x => x?.faction === fac)) {
          t[f.passive.stat] = Math.floor(t[f.passive.stat] * (1 + f.passive.pct / 100));
        }
      }
      // Battle start debuff (Cao Cao)
      if (f.passive.condition === 'battle_start' && f.passive.target === 'random_enemy') {
        const enemies = (f.side === 'player' ? this.state.enemy : this.state.player).filter(x => x?.alive);
        if (enemies.length > 0) {
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          target.debuffs.push({ stat: f.passive.stat, pct: f.passive.pct, duration: 99 });
        }
      }
    }
    // Kingdom allegiance buff: +10% all stats to matching faction heroes
    if (typeof Storage !== 'undefined') {
      const kingdom = Storage.getKingdom?.();
      if (kingdom) {
        for (const f of this.state.player.filter(x => x && x.faction === kingdom)) {
          f.atk   = Math.floor(f.atk * 1.1);
          f.def   = Math.floor(f.def * 1.1);
          f.hp    = Math.floor(f.hp * 1.1);
          f.maxHp = Math.floor(f.maxHp * 1.1);
          f.int   = Math.floor(f.int * 1.1);
          f.spd   = Math.floor(f.spd * 1.1);
        }
      }
    }

    // Hero affinity bonuses (羁绊)
    if (typeof getActiveAffinities === 'function') {
      const playerIds = this.state.player.filter(f => f).map(f => f.id);
      const affinities = getActiveAffinities(playerIds);
      for (const aff of affinities) {
        for (const f of this.state.player.filter(x => x && aff.heroes.includes(x.id))) {
          if (aff.bonus.all_pct)  { f.atk = Math.floor(f.atk * (1 + aff.bonus.all_pct / 100)); f.def = Math.floor(f.def * (1 + aff.bonus.all_pct / 100)); f.hp = Math.floor(f.hp * (1 + aff.bonus.all_pct / 100)); f.maxHp = Math.floor(f.maxHp * (1 + aff.bonus.all_pct / 100)); f.int = Math.floor(f.int * (1 + aff.bonus.all_pct / 100)); f.spd = Math.floor(f.spd * (1 + aff.bonus.all_pct / 100)); }
          if (aff.bonus.atk_pct) { f.atk = Math.floor(f.atk * (1 + aff.bonus.atk_pct / 100)); }
          if (aff.bonus.def_pct) { f.def = Math.floor(f.def * (1 + aff.bonus.def_pct / 100)); }
          if (aff.bonus.int_pct) { f.int = Math.floor(f.int * (1 + aff.bonus.int_pct / 100)); }
          if (aff.bonus.hp_pct)  { f.hp = Math.floor(f.hp * (1 + aff.bonus.hp_pct / 100)); f.maxHp = Math.floor(f.maxHp * (1 + aff.bonus.hp_pct / 100)); }
          if (aff.bonus.spd_pct) { f.spd = Math.floor(f.spd * (1 + aff.bonus.spd_pct / 100)); }
        }
      }
    }

    // Faction synergy
    for (const side of ['player', 'enemy']) {
      const team = this.state[side].filter(f => f);
      const factionCount = {};
      team.forEach(f => { factionCount[f.faction] = (factionCount[f.faction] || 0) + 1; });
      for (const [fac, count] of Object.entries(factionCount)) {
        const bonus = count >= 5 ? FACTION_BONUS[5] : count >= 3 ? FACTION_BONUS[3] : null;
        if (bonus) {
          for (const f of team.filter(x => x.faction === fac)) {
            if (bonus.atkPct) f.atk = Math.floor(f.atk * (1 + bonus.atkPct / 100));
            if (bonus.defPct) f.def = Math.floor(f.def * (1 + bonus.defPct / 100));
          }
        }
      }
    }
  },

  tickEffects(fighter) {
    fighter.buffs = fighter.buffs.filter(b => { b.duration--; return b.duration > 0; });
    fighter.debuffs = fighter.debuffs.filter(d => { d.duration--; return d.duration > 0; });
    fighter.effects = fighter.effects.filter(e => { e.duration--; return e.duration > 0; });
  },

  // ===== ELEMENT REACTIONS =====
  checkElementReaction(attacker, defender) {
    if (!attacker.element || !defender.alive) return;
    const existing = defender.appliedElement;
    if (!existing) {
      // Apply element aura to target
      defender.appliedElement = attacker.element;
      return;
    }
    if (existing === attacker.element) return; // Same element, no reaction

    const key = existing + '+' + attacker.element;
    const reaction = ELEMENT_REACTIONS[key];
    if (!reaction) {
      // No valid reaction, overwrite element
      defender.appliedElement = attacker.element;
      return;
    }

    // Consume the applied element
    defender.appliedElement = null;

    switch (reaction.type) {
      case 'firestorm': {
        // AoE damage to all enemies of defender's side
        const targets = (defender.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive);
        const aoeDmg = Math.floor(this.getEffStat(attacker, 'atk') * 0.5);
        this.addLog(reaction.name + '！元素反应触发！');
        for (const t of targets) {
          t.hp = Math.max(0, t.hp - aoeDmg);
          this.addLog(`  ${Visuals.heroTag(t.id)} ${t.name} 受到 ${aoeDmg} 火风暴伤害`);
          if (t.hp <= 0) { t.alive = false; }
        }
        break;
      }
      case 'freeze': {
        // Stun target for 1 turn
        if (!defender.effects.some(e => e.type === 'invincible')) {
          defender.effects.push({ type: 'stun', duration: 1 });
          this.addLog(reaction.name + '！' + defender.name + ' 被冰冻！无法行动1回合');
        }
        break;
      }
      case 'shatter': {
        // Defense break -30% for 2 turns
        defender.debuffs.push({ stat: 'def', pct: -30, duration: 2 });
        this.addLog(reaction.name + '！' + defender.name + ' 防御碎裂！DEF-30% 2回合');
        break;
      }
    }
  },

  // ===== UTILS =====
  addLog(msg) { this.log.push({ turn: this.state.turn, msg }); },
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

if (typeof window !== 'undefined') window.Battle = Battle;

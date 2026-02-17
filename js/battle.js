// 三国·天命 — Battle Engine
// 5v5 turn-based with unit counters, rage, skills

const Battle = {
  state: null,
  log: [],
  onUpdate: null, // UI callback

  // Create battle state
  init(playerTeam, enemyTeam, terrain='plains', weather='clear') {
    this.log = [];
    this.state = {
      turn: 0,
      phase: 'ready', // ready, fighting, victory, defeat
      terrain, weather,
      player: playerTeam.map((h,i) => this.createFighter(h, 'player', i)),
      enemy: enemyTeam.map((h,i) => this.createFighter(h, 'enemy', i)),
    };
    // Apply passives
    this.applyBattleStartPassives();
    return this.state;
  },

  createFighter(heroId, side, pos) {
    const hero = typeof heroId === 'string' ? HEROES[heroId] : heroId;
    if (!hero) return null;
    const level = side === 'player' ? (Storage?.getHeroLevel?.(hero.id) || 1) : 1;
    const stars = side === 'player' ? (Storage?.getHeroStars?.(hero.id) || hero.rarity || 1) : (hero.rarity || 1);
    const mult = (1 + (level - 1) * 0.08) * (1 + (stars - 1) * 0.15);
    return {
      id: hero.id,
      name: hero.name,
      emoji: hero.emoji,
      side, pos,
      unit: hero.unit,
      faction: hero.faction,
      rarity: hero.rarity,
      hp: Math.floor(hero.baseStats.hp * mult),
      maxHp: Math.floor(hero.baseStats.hp * mult),
      atk: Math.floor(hero.baseStats.atk * mult),
      def: Math.floor(hero.baseStats.def * mult),
      spd: Math.floor(hero.baseStats.spd * mult),
      int: Math.floor(hero.baseStats.int * mult),
      rage: 0,
      maxRage: hero.skill?.rage || 100,
      skill: hero.skill,
      passive: hero.passive,
      alive: true,
      buffs: [],   // {stat, pct, duration}
      debuffs: [],
      effects: [], // stun, charm, invincible
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
    // Tick buffs/debuffs
    [...this.state.player, ...this.state.enemy].filter(f => f?.alive).forEach(f => {
      this.tickEffects(f);
      // Turn-start passives (e.g. heal per turn)
      if (f.passive?.condition === 'turn_start' && f.passive.heal_pct) {
        const heal = Math.floor(f.maxHp * f.passive.heal_pct / 100);
        f.hp = Math.min(f.maxHp, f.hp + heal);
        this.addLog(`${f.emoji} ${f.name} 回复 ${heal} HP`);
      }
    });

    // Sort all alive fighters by SPD (desc)
    const order = [...this.state.player, ...this.state.enemy]
      .filter(f => f?.alive)
      .sort((a, b) => this.getEffStat(b, 'spd') - this.getEffStat(a, 'spd'));

    for (const fighter of order) {
      if (!fighter.alive) continue;
      if (fighter.effects.some(e => e.type === 'stun')) {
        this.addLog(`${fighter.emoji} ${fighter.name} 被眩晕，无法行动！`);
        continue;
      }
      if (fighter.effects.some(e => e.type === 'charm')) {
        // Attack own ally
        const allies = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive && f !== fighter);
        if (allies.length > 0) {
          const target = allies[Math.floor(Math.random() * allies.length)];
          this.doAttack(fighter, target);
          this.addLog(`${fighter.emoji} ${fighter.name} 被魅惑，攻击了 ${target.name}！`);
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
        // Target: front row first, then back
        const target = enemies.sort((a, b) => a.pos - b.pos)[0];
        this.doAttack(fighter, target);
      }

      if (this.onUpdate) this.onUpdate(this.state);
      await this.wait(Math.floor(400 / speed));
    }
  },

  // ===== COMBAT MECHANICS =====
  doAttack(attacker, defender) {
    if (!defender?.alive) return;
    let dmg = this.calcDamage(attacker, defender);
    
    // Unit type advantage
    const advMult = this.getUnitAdvantage(attacker.unit, defender.unit);
    dmg = Math.floor(dmg * advMult);

    // Terrain bonus
    dmg = Math.floor(dmg * this.getTerrainMult(attacker.unit, this.state.terrain));

    // Weather effect
    dmg = Math.floor(dmg * this.getWeatherMult(attacker, this.state.weather));

    // Apply damage
    defender.hp = Math.max(0, defender.hp - dmg);
    if (defender.hp <= 0) {
      defender.alive = false;
      this.addLog(`${attacker.emoji} ${attacker.name} 击杀了 ${defender.emoji} ${defender.name}！`);
    } else {
      this.addLog(`${attacker.emoji} ${attacker.name} → ${defender.emoji} ${defender.name} ${dmg}伤害${advMult > 1 ? ' (克制!)' : ''}`);
    }

    // Gain rage
    attacker.rage = Math.min(attacker.maxRage, attacker.rage + 20);
    defender.rage = Math.min(defender.maxRage, (defender.rage || 0) + 10);

    // Check counter-attack passive
    if (defender.alive && defender.passive?.condition === 'on_hit' && Math.random() * 100 < (defender.passive.chance || 0)) {
      const counterDmg = Math.floor(this.calcDamage(defender, attacker) * (defender.passive.value || 0.5));
      attacker.hp = Math.max(0, attacker.hp - counterDmg);
      this.addLog(`${defender.emoji} ${defender.name} 反击！${counterDmg}伤害`);
      if (attacker.hp <= 0) attacker.alive = false;
    }
  },

  calcDamage(atk, def) {
    const atkStat = this.getEffStat(atk, 'atk');
    const defStat = this.getEffStat(def, 'def');
    const base = Math.max(1, atkStat - defStat * 0.5);
    const variance = 0.9 + Math.random() * 0.2;
    // Crit chance: 10% base
    const critChance = 10 + (atk.buffs.find(b => b.stat === 'crit')?.pct || 0);
    const isCrit = Math.random() * 100 < critChance;
    return Math.floor(base * variance * (isCrit ? 1.5 : 1));
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
      castle:  { cavalry: 0.8, spear: 1.0, archer: 1.1, shield: 1.3, mage: 1.0 }
    };
    return bonuses[terrain]?.[unit] || 1;
  },

  // Weather effects (isSkill=true when casting a skill, false for normal attacks)
  getWeatherMult(fighter, weather, isSkill = false) {
    if (weather === 'rain' && isSkill && fighter.skill?.type === 'magic') return 0.5;
    if (weather === 'fog') return Math.random() > 0.3 ? 1 : 0.5; // 30% miss in fog
    if (weather === 'fire' && fighter.unit === 'mage') return 1.2;
    return 1;
  },

  // ===== SKILLS =====
  useSkill(fighter) {
    const s = fighter.skill;
    if (!s) return;
    fighter.rage = 0;
    const enemies = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
    const allies = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive);

    this.addLog(`⚡ ${fighter.emoji} ${fighter.name} 释放【${s.name}】！`);

    switch (s.type) {
      case 'damage': {
        let targets;
        if (s.target === 'single_enemy') targets = [enemies.sort((a,b) => a.hp - b.hp)[0]]; // lowest HP
        else if (s.target === 'all_enemy') targets = enemies;
        else if (s.target === 'back_row') targets = enemies.filter(f => f.pos >= 2).length > 0 ? enemies.filter(f => f.pos >= 2) : enemies;
        else if (s.target === 'front_row') targets = enemies.filter(f => f.pos < 2).length > 0 ? enemies.filter(f => f.pos < 2) : enemies;
        else targets = [enemies[0]];

        for (const t of targets) {
          const hits = s.hits || 1;
          for (let h = 0; h < hits; h++) {
            let dmg = Math.floor(this.getEffStat(fighter, 'atk') * s.value);
            if (s.guaranteed_crit) dmg = Math.floor(dmg * 1.5);
            t.hp = Math.max(0, t.hp - dmg);
            this.addLog(`  → ${t.emoji} ${t.name} -${dmg} HP`);
            if (t.hp <= 0) { t.alive = false; break; }
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
        const targets = s.target === 'all_enemy' ? enemies : [enemies.sort((a,b) => a.hp - b.hp)[0]];
        for (const t of targets) {
          let dmg = Math.floor(this.getEffStat(fighter, 'int') * s.value);
          // Weather affects magic skills (e.g. rain weakens fire magic)
          dmg = Math.floor(dmg * this.getWeatherMult(fighter, this.state.weather, true));
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → ${t.emoji} ${t.name} -${dmg} 法伤`);
          if (t.hp <= 0) t.alive = false;
        }
        break;
      }
      case 'heal': {
        const targets = s.target === 'all_ally' ? allies : [allies.sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0]];
        for (const t of targets) {
          const heal = Math.floor(t.maxHp * s.value);
          t.hp = Math.min(t.maxHp, t.hp + heal);
          this.addLog(`  → ${t.emoji} ${t.name} +${heal} HP`);
        }
        break;
      }
      case 'buff': {
        const targets = s.target === 'all_ally' ? allies : [fighter];
        for (const t of targets) {
          t.buffs.push({ stat: s.stat, pct: s.pct, duration: s.duration });
          this.addLog(`  → ${t.emoji} ${t.name} ${s.stat}+${s.pct}% (${s.duration}回合)`);
        }
        break;
      }
      case 'cc': {
        let targets;
        if (s.target === 'all_enemy') targets = enemies;
        else if (s.target === 'highest_atk_enemy') targets = [enemies.sort((a,b) => b.atk - a.atk)[0]];
        else targets = [enemies[0]];
        for (const t of targets) {
          if (t.effects.some(e => e.type === 'invincible')) {
            this.addLog(`  → ${t.emoji} ${t.name} 无敌，免疫控制！`);
          } else {
            t.effects.push({ type: s.effect, duration: s.duration });
            this.addLog(`  → ${t.emoji} ${t.name} 被${s.effect === 'stun' ? '眩晕' : '魅惑'}${s.duration}回合！`);
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

  // ===== UTILS =====
  addLog(msg) { this.log.push({ turn: this.state.turn, msg }); },
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

if (typeof window !== 'undefined') window.Battle = Battle;

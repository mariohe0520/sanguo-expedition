// 三国·天命 — Battle Engine
// 5v5 turn-based with unit counters, rage, skills

const Battle = {
  state: null,
  log: [],
  onUpdate: null, // UI callback

  /**
   * 初始化战斗状态
   * @param {string[]} playerTeam - 玩家阵容 hero ID 数组
   * @param {string[]} enemyTeam - 敌方阵容 hero ID 数组
   * @param {string} terrain - 地形类型 (plains/mountain/river/forest/castle)
   * @param {string} weather - 天气类型 (clear/fog/wind)
   * @param {number} enemyScale - 敌方属性倍率
   * @param {string|null} territoryId - 领地 ID（用于动态战场）
   * @param {object|null} bossEnhanced - Boss 强化配置
   * @param {object|null} warContext - 战争导演系统上下文
   * @returns {object} 初始化后的战斗状态
   */
  init(playerTeam, enemyTeam, terrain='plains', weather='clear', enemyScale=1, territoryId=null, bossEnhanced=null, warContext=null) {
    this.log = [];
    this.vfx = []; // Visual effects queue for UI layer
    this.bossEnhanced = bossEnhanced || null;
    // Track total damage dealt for stalemate resolution (Feature 6)
    this._totalDamagePlayer = 0;
    this._totalDamageEnemy = 0;
    this.state = {
      turn: 0,
      phase: 'ready', // ready, fighting, victory, defeat
      terrain, weather,
      player: playerTeam.map((h,i) => this.createFighter(h, 'player', i)).filter(Boolean),
      enemy: enemyTeam.map((h,i) => this.createFighter(h, 'enemy', i, enemyScale)).filter(Boolean),
      warContext: warContext || null,
    };
    // Initialize Dynamic Battlefield system
    if (typeof DynamicBattlefield !== 'undefined') {
      DynamicBattlefield.init(territoryId, terrain, weather);
      // Update terrain/weather from battlefield system
      if (DynamicBattlefield.state) {
        this.state.terrain = DynamicBattlefield.state.terrain;
        this.state.weather = DynamicBattlefield.state.weather;
      }
    }
    // Apply passives
    this.applyBattleStartPassives();
    // Apply hero personality effects (mood, bonds, loyalty)
    this.applyPersonalityEffects();
    // Apply war-director battlefield modifiers
    if (typeof WarDirector !== 'undefined') {
      try { WarDirector.applyBattleModifiers(this.state, warContext); } catch (e) { console.error('[WarDirector battle init]', e); }
    }
    return this.state;
  },

  createFighter(heroId, side, pos, enemyScale) {
    const hero = typeof heroId === 'string' ? HEROES[heroId] : heroId;
    if (!hero) return null;
    // Block mystery/locked placeholder heroes from entering battle
    if (hero.mystery || hero.locked) return null;
    const level = side === 'player' ? (Storage?.getHeroLevel?.(hero.id) || 1) : 1;
    const stars = side === 'player' ? (Storage?.getHeroStars?.(hero.id) || hero.rarity || 1) : (hero.rarity || 1);
    const _HG = (typeof GAME_BALANCE !== 'undefined') ? GAME_BALANCE.HERO_GROWTH : {};
    let mult = (1 + (level - 1) * (_HG.LEVEL_MULT_PER_LEVEL || 0.08)) * (1 + (stars - 1) * (_HG.STAR_MULT_PER_STAR || 0.15));
    // Scale enemy fighters by chapter/dungeon/arena difficulty
    if (side === 'enemy' && enemyScale && enemyScale !== 1) mult *= enemyScale;

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

    // --- Feature 1: Apply Destiny system buffs to player heroes ---
    if (side === 'player' && typeof Destiny !== 'undefined') {
      try {
        // Team-wide buffs from destiny choices
        const teamBuffs = Destiny.getTeamBuffs();
        for (const buff of teamBuffs) {
          if (buff.atk)  baseATK = Math.floor(baseATK * (1 + buff.atk));
          if (buff.def)  baseDEF = Math.floor(baseDEF * (1 + buff.def));
          if (buff.allStats) {
            baseATK = Math.floor(baseATK * (1 + buff.allStats));
            baseDEF = Math.floor(baseDEF * (1 + buff.allStats));
            baseHP  = Math.floor(baseHP  * (1 + buff.allStats));
            baseSPD = Math.floor(baseSPD * (1 + buff.allStats));
            baseINT = Math.floor(baseINT * (1 + buff.allStats));
          }
        }
        // Hero-specific buffs from destiny choices
        const heroBuffs = Destiny.getHeroBuffs(hero.id);
        for (const buff of heroBuffs) {
          if (buff.allStats) {
            baseATK = Math.floor(baseATK * (1 + buff.allStats));
            baseDEF = Math.floor(baseDEF * (1 + buff.allStats));
            baseHP  = Math.floor(baseHP  * (1 + buff.allStats));
            baseSPD = Math.floor(baseSPD * (1 + buff.allStats));
            baseINT = Math.floor(baseINT * (1 + buff.allStats));
          }
        }
        // Class-specific buffs from destiny choices
        const classBuffs = Destiny.getClassBuffs(hero.unit);
        for (const buff of classBuffs) {
          if (buff.atk) baseATK = Math.floor(baseATK * (1 + buff.atk));
          if (buff.spd) baseSPD = Math.floor(baseSPD * (1 + buff.spd));
        }
      } catch(e) { console.error('[Battle Destiny buffs]', e); }
    }

    // --- Feature 1: Apply Destiny enemy buffs ---
    if (side === 'enemy' && typeof Destiny !== 'undefined') {
      try {
        const destinyState = Destiny.getState();
        const activeBuffs = destinyState?.activeBuffs || [];
        for (const buff of activeBuffs) {
          if (buff.type === 'enemy_buff') {
            // Apply if faction matches or territory matches
            if (buff.faction && hero.faction === buff.faction) {
              if (buff.atk) baseATK = Math.floor(baseATK * (1 + buff.atk));
              if (buff.def) baseDEF = Math.floor(baseDEF * (1 + buff.def));
            }
          }
        }
      } catch(e) { console.error('[Battle Destiny enemy buffs]', e); }
    }

    // --- Feature 2: Collect ultimate ability from skill tree ---
    let ultimateAbility = null;
    if (side === 'player' && specials.length > 0) {
      // Find the ultimate in the specials list
      const ULTIMATE_DEFS = typeof SkillTree !== 'undefined' ? this._getUltimateDefs() : {};
      for (const sp of specials) {
        if (ULTIMATE_DEFS[sp]) {
          ultimateAbility = { id: sp, ...ULTIMATE_DEFS[sp] };
          break; // Only one ultimate active at a time
        }
      }
    }

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
      // Feature 2: Ultimate system
      _ultimate: ultimateAbility,
      _ultimateCharge: 0,
      _ultimateMaxCharge: 100, // fills from dealing/taking damage
      _ultimateFired: false,
    };
  },

  // Feature 2: Ultimate ability definitions
  _getUltimateDefs() {
    return {
      dragon_charge:     { name: '龙骑冲锋', type: 'aoe_damage',  mult: 3.0,  stat: 'atk', pen: 0.5, desc: '对全体250%ATK，无视50%防御' },
      true_seven:        { name: '七进七出·真', type: 'multi_hit', hits: 7, mult: 0.5, stat: 'atk', invincible: 2, desc: '无敌2回合+7次随机攻击' },
      changshan_shield:  { name: '常山之盾', type: 'team_shield', mult: 0.4, reducePct: 50, duration: 3, desc: '全队无敌1回合+回复40%HP' },
      wine_slash:        { name: '温酒斩华雄', type: 'single_nuke', mult: 5.0, stat: 'atk', guaranteed_crit: true, desc: '单体500%ATK必暴击' },
      crescent_extreme:  { name: '青龙偃月·极', type: 'single_aoe', singleMult: 3.5, aoeMult: 1.5, stat: 'atk', desc: '单体350%+全体150%ATK' },
      revive_ally:       { name: '忠义千秋', type: 'revive', healPct: 0.5, desc: '复活一名阵亡队友(50%HP)' },
      mercy_world:       { name: '仁德天下', type: 'team_heal_buff', healPct: 0.5, buffPct: 25, duration: 3, desc: '全队回复50%HP+ATK/DEF+25%' },
      emperor_decree:    { name: '帝王之令', type: 'team_buff_all', buffPct: 30, duration: 3, desc: '全队全属性+30% 3回合' },
      han_shield:        { name: '汉室之盾', type: 'self_tank', defPct: 100, duration: 3, tauntAll: true, desc: '自身DEF+100%+嘲讽全体' },
      unstoppable:       { name: '万夫不当', type: 'aoe_stun', mult: 2.0, stat: 'atk', stunDur: 2, desc: '全体200%ATK+眩晕2回合' },
      heaven_roar:       { name: '怒吼天地', type: 'single_nuke', mult: 4.0, stat: 'atk', pen: 0.5, stunDur: 1, desc: '单体400%ATK+破甲+眩晕' },
      changban_bridge:   { name: '当阳桥', type: 'self_tank', defPct: 50, duration: 3, tauntAll: true, reflectPct: 30, desc: '嘲讽3回合+反弹30%' },
      mandate_heaven:    { name: '挟天子令诸侯', type: 'team_buff_all', buffPct: 40, duration: 4, desc: '全队ATK+40%/DEF+20%' },
      villain_scheme:    { name: '奸雄之计', type: 'aoe_debuff', debuffPct: -30, duration: 3, desc: '全体敌人-30%全属性' },
      steal_power:       { name: '乱世枭雄', type: 'steal_atk', stealPct: 20, desc: '偷取全体敌人20%ATK' },
      peerless:          { name: '天下无双', type: 'single_nuke', mult: 6.0, stat: 'atk', pen: 1.0, desc: '单体600%ATK无视防御' },
      true_halberd:      { name: '方天画戟·真', type: 'aoe_execute', mult: 3.0, stat: 'atk', executeChance: 30, desc: '全体300%ATK+30%即死' },
      asura:             { name: '修罗', type: 'self_berserk', atkPct: 80, duration: 3, hpCostPct: 10, desc: '3回合ATK+80%但每回合失10%HP' },
      perfect_shot:      { name: '百步穿杨·极', type: 'single_nuke', mult: 3.0, stat: 'atk', guaranteed_crit: true, critMult: 3, desc: '单体300%ATK必暴击x3' },
      arrow_storm:       { name: '万箭齐发', type: 'aoe_multi', hits: 5, mult: 0.8, stat: 'atk', desc: '全体5次80%ATK' },
      heroine:           { name: '巾帼无双', type: 'self_dodge', dodgePct: 50, duration: 3, counterOnDodge: true, desc: '3回合闪避+50%+反击' },
      heaven_punishment: { name: '天罚', type: 'aoe_stun', mult: 2.5, stat: 'int', stunDur: 2, stunChance: 30, desc: '全体250%INT+30%眩晕' },
      yellow_sky:        { name: '黄天之怒', type: 'aoe_dot', dotPct: 15, stat: 'int', duration: 5, desc: '全体DoT 5回合' },
      taiping:           { name: '太平道法', type: 'team_heal_cleanse', healPct: 0.4, immuneDur: 2, desc: '全队回复40%HP+免疫debuff' },
      beauty_ultimate:   { name: '闭月羞花', type: 'aoe_charm', charmDur: 2, debuffPct: -30, stat: 'int', desc: '全体魅惑2回合+INT-30%' },
      moon_dance:        { name: '月华天舞', type: 'aoe_debuff', mult: 1.8, stat: 'int', debuffPct: -20, duration: 3, desc: '全体180%INT+降低全属性' },
      shadow_dance:      { name: '暗影之舞', type: 'self_stealth', duration: 3, dotMult: 1.0, stat: 'int', desc: '3回合隐身+每回合INT伤害' },
      dingjun_slash:     { name: '定军斩将', type: 'single_nuke', mult: 4.5, stat: 'atk', guaranteed_crit: true, pen: 1.0, desc: '单体450%ATK必暴击无视防御' },
      eternal_vigor:     { name: '老当益壮', type: 'self_permabuff', atkPct: 50, critDuration: 3, desc: 'ATK永久+50%+3回合必暴击' },
      fortress_archer:   { name: '磐石射手', type: 'self_tank', defPct: 50, duration: 3, critCounter: true, desc: 'DEF+50%+反击必暴击' },
      // Archetype ultimates
      cavalry_charge:    { name: '铁骑冲锋', type: 'aoe_damage', mult: 1.8, stat: 'atk', desc: '全体180%ATK' },
      lethal_strike:     { name: '致命打击', type: 'single_nuke', mult: 3.5, stat: 'atk', guaranteed_crit: true, desc: '单体350%ATK必暴击' },
      iron_rider:        { name: '不倒战骑', type: 'self_tank', defPct: 50, duration: 3, regenPct: 20, desc: 'DEF+50%+回复20%HP/回合' },
      spear_wall:        { name: '枪阵无双', type: 'front_damage', mult: 2.5, stat: 'atk', defBuff: 30, duration: 2, desc: '前排250%ATK+DEF+30%' },
      pierce_all:        { name: '万枪齐发', type: 'aoe_damage', mult: 2.0, stat: 'atk', pen: 0.3, desc: '全体200%ATK+破甲30%' },
      fortress:          { name: '铜墙铁壁', type: 'team_buff_all', buffPct: 35, duration: 3, desc: '全队DEF+35%' },
      absolute_defense:  { name: '绝对防御', type: 'self_tank', defPct: 80, duration: 2, reflectPct: 50, desc: '2回合减伤80%+反弹50%' },
      immortal_body:     { name: '不灭之躯', type: 'self_regen', regenPct: 15, duration: 3, ccImmune: true, desc: '3回合回复15%HP+免控' },
      iron_command:      { name: '钢铁号令', type: 'team_buff_all', buffPct: 40, duration: 3, reflectPct: 15, desc: '全队DEF+40%+反弹15%' },
      god_arrow:         { name: '神箭', type: 'single_nuke', mult: 4.0, stat: 'atk', guaranteed_crit: true, desc: '单体400%ATK必暴击' },
      arrow_rain:        { name: '万箭齐发', type: 'aoe_multi', hits: 3, mult: 1.0, stat: 'atk', desc: '全体3次100%ATK' },
      snare_all:         { name: '天罗地网', type: 'aoe_debuff', debuffPct: -40, stat: 'spd', duration: 2, stunDur: 1, desc: '全体SPD-40%+定身1回合' },
      destruction:       { name: '毁灭法术', type: 'aoe_damage', mult: 2.5, stat: 'int', desc: '全体250%INT' },
      magic_lockdown:    { name: '法术封锁', type: 'aoe_debuff', debuffPct: -25, stat: 'int', silenceDur: 2, desc: '全体沉默2回合+INT-25%' },
      supreme_wisdom:    { name: '大智若愚', type: 'team_heal_buff', healPct: 0.3, buffPct: 25, duration: 2, desc: '全队+25%全属性+回复30%HP' },
    };
  },

  // ===== CORE BATTLE LOOP =====
  async run(speed = 1) {
    this._speedOverride = null; // reset dynamic speed
    this.state.phase = 'fighting';
    while (this.state.phase === 'fighting') {
      this.state.turn++;
      const currentSpeed = this._speedOverride || speed;
      await this.executeTurn(currentSpeed);
      // Check win/lose
      const playerAlive = this.state.player.filter(f => f?.alive).length;
      const enemyAlive = this.state.enemy.filter(f => f?.alive).length;
      if (enemyAlive === 0) {
        this.state.phase = 'victory';
        // Victory dialogue
        const survivors = this.state.player.filter(f => f?.alive);
        if (survivors.length > 0) {
          const speaker = survivors[Math.floor(Math.random() * survivors.length)];
          this.triggerDialogue(speaker, 'victory');
        }
        break;
      }
      if (playerAlive === 0) {
        this.state.phase = 'defeat';
        // Defeat dialogue (from last fallen)
        const allPlayers = this.state.player.filter(f => f);
        if (allPlayers.length > 0) {
          const speaker = allPlayers[Math.floor(Math.random() * allPlayers.length)];
          this.triggerDialogue(speaker, 'defeat');
        }
        break;
      }
      if (this.state.turn > ((typeof GAME_BALANCE !== 'undefined' && GAME_BALANCE.BATTLE.MAX_TURNS) || 60)) {
        // Feature 6: Stalemate resolved by total damage dealt, not HP%
        this.state.phase = this._totalDamagePlayer >= this._totalDamageEnemy ? 'victory' : 'defeat';
        this.addLog(`⏱ 战斗超时！我方总伤害 ${this._totalDamagePlayer} vs 敌方 ${this._totalDamageEnemy}`);
        this.addLog(`${this.state.phase === 'victory' ? '我方伤害更高，判定胜利！' : '敌方伤害更高，判定失败...'}`);
        break;
      }
    }
    return this.state.phase;
  },

  async executeTurn(speed) {
    // Reset combo tracker each turn
    this._comboTracker = {};

    // Feature 6: Announce escalation at turn 31
    if (this.state.turn === 31) {
      this.addLog('<span class="log-ultimate">天地之力涌动！伤害开始逐回合递增！</span>');
    }

    // Dynamic Battlefield: turn-start (weather changes, hazards, day/night)
    if (typeof DynamicBattlefield !== 'undefined') {
      const bfEvents = DynamicBattlefield.onTurnStart(this.state.turn, this.state);
      if (bfEvents) {
        for (const ev of bfEvents) {
          if (ev.text) this.addLog('<span class="bf-hazard-log">' + ev.text + '</span>');
          // Queue VFX for hazards
          if (ev.type === 'hazard' && ev.target) {
            this.vfx.push({ type: 'hazard', target: ev.target.side + '-' + ev.target.pos, hazardType: ev.hazard.dmgType, dmg: ev.dmg });
          }
          if (ev.type === 'weather_change') {
            this.vfx.push({ type: 'weather_change', weather: ev.weather });
          }
        }
      }
      // Sync terrain/weather from DynamicBattlefield to Battle.state
      if (DynamicBattlefield.state) {
        this.state.terrain = DynamicBattlefield.state.terrain;
        this.state.weather = DynamicBattlefield.state.weather;
      }
    }

    // Boss Enhanced Mechanics
    if (this.bossEnhanced) {
      const bossUnit = this.state.enemy.find(f => f?.alive);
      if (bossUnit) {
        const hpPct = bossUnit.hp / bossUnit.maxHp;
        // enrage: below 40% HP, ATK/INT +60% (triggers once)
        if (this.bossEnhanced.enrage && hpPct < 0.4 && !bossUnit._enraged) {
          bossUnit._enraged = true;
          bossUnit.atk = Math.floor(bossUnit.atk * 1.6);
          bossUnit.int = Math.floor(bossUnit.int * 1.6);
          this.addLog(`⚠️ Boss 暴怒！攻击力大幅提升！`);
          this.vfx.push({ type: 'boss_enrage', target: `enemy-${bossUnit.pos}` });
        }
        // teleport: every 5 turns, boss swaps to lowest-HP player target
        if (this.bossEnhanced.teleport && this.state.turn % 5 === 0 && this.state.turn > 0) {
          const playerAlive = this.state.player.filter(f => f?.alive && f.hp > 0);
          if (playerAlive.length > 1) {
            const weakest = playerAlive.sort((a,b) => a.hp/a.maxHp - b.hp/b.maxHp)[0];
            if (weakest && weakest.alive && weakest.hp > 0) {
              const hit = Math.floor(this.getEffStat(bossUnit, 'atk') * 1.5);
              weakest.hp = Math.max(0, weakest.hp - hit);
              if (weakest.hp <= 0) { weakest.alive = false; this.vfx.push({ type: 'kill', target: `${weakest.side}-${weakest.pos}` }); }
              this.addLog(`⚡ Boss 瞬移至 ${weakest.name} 身后，偷袭 ${hit} 伤害！`);
              this.vfx.push({ type: 'attack', attacker: `enemy-${bossUnit.pos}`, target: `${weakest.side}-${weakest.pos}`, dmg: hit, isCrit: false });
            }
          }
        }
        // mirror: on even turns, boss copies the highest-ATK player skill
        if (this.bossEnhanced.mirror && this.state.turn % 4 === 2) {
          const playerAlive = this.state.player.filter(f => f?.alive && f.hp > 0 && f.skill);
          if (playerAlive.length > 0) {
            const strongest = playerAlive.sort((a,b) => (b.atk + b.int) - (a.atk + a.int))[0];
            if (strongest && strongest.alive && strongest.hp > 0) {
              const mirrorDmg = Math.floor((this.getEffStat(bossUnit, 'int') || this.getEffStat(bossUnit, 'atk')) * 1.2);
              strongest.hp = Math.max(0, strongest.hp - mirrorDmg);
              if (strongest.hp <= 0) { strongest.alive = false; this.vfx.push({ type: 'kill', target: `${strongest.side}-${strongest.pos}` }); }
              this.addLog(`🔮 Boss 镜像了【${strongest.skill?.name || '技能'}】！对 ${strongest.name} 造成 ${mirrorDmg} 伤害！`);
              this.vfx.push({ type: 'attack', attacker: `enemy-${bossUnit.pos}`, target: `${strongest.side}-${strongest.pos}`, dmg: mirrorDmg, isCrit: false });
            }
          }
        }
      }
    }

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
      .filter(f => f?.alive && f.hp > 0)
      .sort((a, b) => this.getEffStat(b, 'spd') - this.getEffStat(a, 'spd'));

    // Strategy: Vanguard extra action at start of turn 1
    if (vanguardExtra && vanguardExtra.alive) {
      const vgEnemies = (vanguardExtra.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
      if (vgEnemies.length > 0) {
        const vgTarget = vgEnemies.sort((a, b) => a.pos - b.pos)[0];
        // Guard: vgTarget must be alive before attacking
        if (vgTarget && vgTarget.alive && vgTarget.hp > 0) {
          this.doAttack(vanguardExtra, vgTarget);
          if (this.onUpdate) this.onUpdate(this.state);
          await this.wait(Math.floor(400 / speed));
          // Immediately check if all enemies are dead after vanguard attack
          if (!this.state.player.some(f => f?.alive) || !this.state.enemy.some(f => f?.alive)) {
            return; // Battle ended — abort the rest of the turn
          }
        }
      }
    }

    // Hero personality: battle start dialogue (turn 1 only)
    if (this.state.turn === 1 && typeof HeroPersonality !== 'undefined') {
      const alivePlayers = this.state.player.filter(f => f?.alive);
      if (alivePlayers.length > 0) {
        const speaker = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        this.triggerDialogue(speaker, 'battleStart');

        // Push battle cry VFX for the leading general (shown prominently on canvas)
        const battleCryLine = HeroPersonality.getLine(speaker.id, 'battleStart');
        if (battleCryLine) {
          this.vfx.push({ type: 'battleCry', hero: `${speaker.side}-${speaker.pos}`, text: battleCryLine, heroName: speaker.name });
        }

        // Bond meeting dialogues + visual bond banner
        const activeBondIds = [];
        for (const f of alivePlayers) {
          const bonds = HeroPersonality.getHeroBonds(f.id);
          for (const bond of bonds) {
            const partners = bond.heroes.filter(h => h !== f.id && alivePlayers.some(p => p.id === h));
            if (partners.length > 0) {
              this.triggerDialogue(f, 'bondMet', { partnerId: partners[0] });
              if (!activeBondIds.includes(bond.id)) {
                activeBondIds.push(bond.id);
                // Push bond activation VFX
                this.vfx.push({ type: 'bondActivate', bondId: bond.id, bondName: bond.name, bondIcon: bond.icon, bonusDesc: bond.bonusDesc });
              }
              break;
            }
          }
        }
      }
    }

    for (const fighter of order) {
      // STRICT DEATH CHECK: skip dead fighters (they may have died earlier this turn)
      if (!fighter || !fighter.alive) continue;

      // Early-exit: check if the battle is already over (all enemies or all players dead)
      const playerStillAlive = this.state.player.some(f => f?.alive);
      const enemyStillAlive = this.state.enemy.some(f => f?.alive);
      if (!playerStillAlive || !enemyStillAlive) break;

      // Sanity-check HP: if hp somehow <= 0 but alive flag not cleared, clear it now
      if (fighter.hp <= 0) { fighter.hp = 0; fighter.alive = false; continue; }

      if (fighter.effects.some(e => e.type === 'stun')) {
        this.addLog(`${Visuals.heroTag(fighter.id)} ${fighter.name} 被眩晕，无法行动！`);
        continue;
      }
      if (fighter.effects.some(e => e.type === 'charm')) {
        // Attack own ally
        const allies = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive && f !== fighter);
        if (allies.length > 0) {
          const charmTarget = allies[Math.floor(Math.random() * allies.length)];
          if (charmTarget && charmTarget.alive && charmTarget.hp > 0) {
            this.doAttack(fighter, charmTarget);
            this.addLog(`${Visuals.heroTag(fighter.id)} ${fighter.name} 被魅惑，攻击了 ${charmTarget.name}！`);
          }
        }
        // After charm attack: synchronously check if all fighters on one side are dead
        if (!this.state.player.some(f => f?.alive) || !this.state.enemy.some(f => f?.alive)) break;
        continue;
      }

      // Hero personality: loyalty refusal / furious ally attack
      const personalityResult = this.checkPersonalityBeforeAction(fighter);
      if (personalityResult === 'skip') continue;

      // Check if rage full → use skill (auto for enemy, manual-ready for player)
      if (fighter.rage >= fighter.maxRage && fighter.skill) {
        this.useSkill(fighter);
        this.triggerDialogue(fighter, 'skill');
        // Synchronous battle-end check after skill
        if (!this.state.player.some(f => f?.alive) || !this.state.enemy.some(f => f?.alive)) break;
      } else {
        // Normal attack
        let enemies = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive && f.hp > 0);
        // Stealth: filter out stealthed targets (unless no other targets exist)
        const nonStealthEnemies = enemies.filter(f => !f._ultimateStealth);
        if (nonStealthEnemies.length > 0) enemies = nonStealthEnemies;
        if (enemies.length === 0) continue;
        // Taunt: force target taunting enemies
        const taunters = enemies.filter(f => f.effects.some(e => e.type === 'taunt'));
        // Strategy: Chain Stratagem target locking
        let target = null;
        if (taunters.length > 0) {
          target = taunters[0]; // Attack the taunter
        } else if (typeof Strategy !== 'undefined') {
          target = Strategy.getChainTarget(fighter, this.state);
        }
        if (!target || !target.alive || target.hp <= 0) {
          // Target: front row first, then back — always re-check alive AND hp > 0
          target = enemies.filter(f => f?.alive && f.hp > 0).sort((a, b) => a.pos - b.pos)[0];
        }
        if (!target || !target.alive || target.hp <= 0) continue; // No valid target
        this.doAttack(fighter, target);
        // Synchronous battle-end check after attack
        if (!this.state.player.some(f => f?.alive) || !this.state.enemy.some(f => f?.alive)) break;
      }

      if (this.onUpdate) this.onUpdate(this.state);
      await this.wait(Math.floor(400 / speed));
    }

    // Feature 2: Check and fire ultimate abilities at end of turn
    for (const fighter of [...this.state.player, ...this.state.enemy]) {
      if (!fighter || !fighter.alive || fighter.hp <= 0) continue;
      if (fighter._ultimate && !fighter._ultimateFired && fighter._ultimateCharge >= fighter._ultimateMaxCharge) {
        fighter._ultimateFired = true;
        this.executeUltimate(fighter);
        this.vfx.push({ type: 'ultimate', caster: `${fighter.side}-${fighter.pos}`, ultimateName: fighter._ultimate.name });
        if (this.onUpdate) this.onUpdate(this.state);
        await this.wait(Math.floor(600 / speed));
        if (!this.state.player.some(f => f?.alive) || !this.state.enemy.some(f => f?.alive)) break;
      }
    }

    // Strategy: turn-end hooks
    if (typeof Strategy !== 'undefined') {
      Strategy.onTurnEnd(this.state.turn, this.state);
    }
  },

  // Feature 2: Execute an ultimate ability
  executeUltimate(fighter) {
    // Definitive dead-unit guard: queued ultimates from a stale turn snapshot must never fire.
    if (!fighter || !fighter.alive || fighter.hp <= 0) return;
    if (!this.state.player.some(f => f?.alive) || !this.state.enemy.some(f => f?.alive)) return;

    const ult = fighter._ultimate;
    if (!ult) return;

    const enemies = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
    const allies = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive);
    const allAllies = (fighter.side === 'player' ? this.state.player : this.state.enemy); // includes dead for revive

    this.addLog(`<span class="log-ultimate">${Visuals.heroTag(fighter.id)} ${fighter.name} 发动终结技【${ult.name}】！</span>`);

    const atkStat = this.getEffStat(fighter, ult.stat === 'int' ? 'int' : 'atk');

    switch (ult.type) {
      case 'aoe_damage': {
        for (const t of enemies) {
          if (!t.alive) continue; // Skip already-dead targets
          let defStat = this.getEffStat(t, 'def');
          if (ult.pen) defStat = Math.floor(defStat * (1 - ult.pen));
          const dmg = Math.floor(Math.max(1, atkStat * ult.mult - defStat * 0.3));
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → ${t.name} -${dmg}`);
          if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
        }
        break;
      }
      case 'multi_hit': {
        if (ult.invincible) fighter.effects.push({ type: 'invincible', duration: ult.invincible });
        for (let i = 0; i < ult.hits; i++) {
          const alive = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
          if (alive.length === 0) break;
          const t = alive[Math.floor(Math.random() * alive.length)];
          const dmg = Math.floor(atkStat * ult.mult);
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → 第${i + 1}击 ${t.name} -${dmg}`);
          if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
        }
        break;
      }
      case 'aoe_multi': {
        for (let i = 0; i < ult.hits; i++) {
          for (const t of [...enemies]) {
            if (!t.alive) continue;
            const dmg = Math.floor(atkStat * ult.mult);
            t.hp = Math.max(0, t.hp - dmg);
            if (i === 0) this.addLog(`  → ${t.name} -${dmg} x${ult.hits}`);
            if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
          }
        }
        break;
      }
      case 'single_nuke': {
        if (enemies.length === 0) break;
        const t = enemies.filter(f => f.alive).sort((a, b) => a.hp - b.hp)[0]; // lowest HP, only alive
        if (!t) break;
        let defStat = this.getEffStat(t, 'def');
        if (ult.pen) defStat = Math.floor(defStat * (1 - ult.pen));
        let dmg = Math.floor(Math.max(1, atkStat * ult.mult - defStat * 0.3));
        if (ult.guaranteed_crit) dmg = Math.floor(dmg * (ult.critMult || 1.5));
        t.hp = Math.max(0, t.hp - dmg);
        this.addLog(`  → ${t.name} -${dmg}${ult.guaranteed_crit ? ' 暴击!' : ''}`);
        if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
        if (ult.stunDur && t.alive) t.effects.push({ type: 'stun', duration: ult.stunDur });
        break;
      }
      case 'single_aoe': {
        if (enemies.length === 0) break;
        const primary = enemies.filter(f => f.alive).sort((a, b) => a.hp - b.hp)[0];
        if (!primary) break;
        const singleDmg = Math.floor(atkStat * ult.singleMult);
        primary.hp = Math.max(0, primary.hp - singleDmg);
        this.addLog(`  → ${primary.name} -${singleDmg}`);
        if (primary.hp <= 0) { primary.alive = false; this.vfx.push({ type: 'kill', target: `${primary.side}-${primary.pos}` }); }
        for (const t of enemies) {
          if (!t.alive || t === primary) continue;
          const aoeDmg = Math.floor(atkStat * ult.aoeMult);
          t.hp = Math.max(0, t.hp - aoeDmg);
          this.addLog(`  → ${t.name} -${aoeDmg}`);
          if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
        }
        break;
      }
      case 'team_shield': {
        for (const a of allies) {
          const heal = Math.floor(a.maxHp * ult.mult);
          a.hp = Math.min(a.maxHp, a.hp + heal);
          a.effects.push({ type: 'invincible', duration: 1 });
          a.buffs.push({ stat: 'def', pct: ult.reducePct, duration: ult.duration });
          this.addLog(`  → ${a.name} +${heal}HP 无敌1回合 减伤${ult.duration}回合`);
        }
        break;
      }
      case 'team_heal_buff': {
        for (const a of allies) {
          const heal = Math.floor(a.maxHp * ult.healPct);
          a.hp = Math.min(a.maxHp, a.hp + heal);
          a.buffs.push({ stat: 'atk', pct: ult.buffPct, duration: ult.duration });
          a.buffs.push({ stat: 'def', pct: ult.buffPct, duration: ult.duration });
          this.addLog(`  → ${a.name} +${heal}HP ATK/DEF+${ult.buffPct}%`);
        }
        break;
      }
      case 'team_heal_cleanse': {
        for (const a of allies) {
          const heal = Math.floor(a.maxHp * ult.healPct);
          a.hp = Math.min(a.maxHp, a.hp + heal);
          a.debuffs = [];
          a.effects = a.effects.filter(e => e.type === 'invincible');
          this.addLog(`  → ${a.name} +${heal}HP 净化debuff`);
        }
        break;
      }
      case 'team_buff_all': {
        for (const a of allies) {
          a.buffs.push({ stat: 'atk', pct: ult.buffPct, duration: ult.duration });
          a.buffs.push({ stat: 'def', pct: Math.floor(ult.buffPct * 0.6), duration: ult.duration });
          a.buffs.push({ stat: 'spd', pct: Math.floor(ult.buffPct * 0.4), duration: ult.duration });
          this.addLog(`  → ${a.name} 全属性+${ult.buffPct}% ${ult.duration}回合`);
        }
        break;
      }
      case 'self_tank': {
        fighter.buffs.push({ stat: 'def', pct: ult.defPct, duration: ult.duration });
        if (ult.tauntAll) fighter.effects.push({ type: 'taunt', duration: ult.duration });
        if (ult.reflectPct) fighter._ultimateReflect = { pct: ult.reflectPct, duration: ult.duration };
        if (ult.regenPct) fighter._ultimateRegen = { pct: ult.regenPct, duration: ult.duration };
        if (ult.critCounter) fighter._ultimateCritCounter = { duration: ult.duration };
        this.addLog(`  → ${fighter.name} DEF+${ult.defPct}%${ult.tauntAll ? ' 嘲讽全体' : ''}${ult.reflectPct ? ' 反弹' + ult.reflectPct + '%' : ''}`);
        break;
      }
      case 'self_berserk': {
        fighter.buffs.push({ stat: 'atk', pct: ult.atkPct, duration: ult.duration });
        fighter._ultimateBerserk = { hpCost: ult.hpCostPct, duration: ult.duration };
        this.addLog(`  → ${fighter.name} ATK+${ult.atkPct}% ${ult.duration}回合 (每回合消耗${ult.hpCostPct}%HP)`);
        break;
      }
      case 'self_permabuff': {
        fighter.atk = Math.floor(fighter.atk * (1 + ult.atkPct / 100));
        if (ult.critDuration) fighter.buffs.push({ stat: 'crit', pct: 100, duration: ult.critDuration });
        this.addLog(`  → ${fighter.name} ATK永久+${ult.atkPct}%`);
        break;
      }
      case 'self_dodge': {
        fighter._ultimateDodge = { pct: ult.dodgePct, duration: ult.duration, counter: ult.counterOnDodge };
        this.addLog(`  → ${fighter.name} 闪避+${ult.dodgePct}% ${ult.duration}回合`);
        break;
      }
      case 'self_stealth': {
        fighter._ultimateStealth = { duration: ult.duration };
        this.addLog(`  → ${fighter.name} 进入隐身 ${ult.duration}回合`);
        break;
      }
      case 'self_regen': {
        fighter._ultimateRegen = { pct: ult.regenPct, duration: ult.duration };
        if (ult.ccImmune) fighter._ultimateCCImmune = { duration: ult.duration };
        this.addLog(`  → ${fighter.name} 每回合回复${ult.regenPct}%HP ${ult.duration}回合`);
        break;
      }
      case 'aoe_stun': {
        for (const t of enemies) {
          if (!t.alive) continue;
          const dmg = Math.floor(atkStat * ult.mult);
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → ${t.name} -${dmg}`);
          if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); continue; }
          const stunChance = ult.stunChance || 100;
          if (Math.random() * 100 < stunChance) {
            t.effects.push({ type: 'stun', duration: ult.stunDur });
            this.addLog(`  → ${t.name} 被眩晕${ult.stunDur}回合`);
          }
        }
        break;
      }
      case 'aoe_debuff': {
        for (const t of enemies) {
          if (!t.alive) continue;
          if (ult.mult) {
            const dmg = Math.floor(atkStat * ult.mult);
            t.hp = Math.max(0, t.hp - dmg);
            this.addLog(`  → ${t.name} -${dmg}`);
            if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); continue; }
          }
          for (const stat of ['atk', 'def', 'spd', 'int']) {
            t.debuffs.push({ stat, pct: ult.debuffPct, duration: ult.duration });
          }
          if (ult.stunDur) t.effects.push({ type: 'stun', duration: ult.stunDur });
          if (ult.silenceDur) t.effects.push({ type: 'stun', duration: ult.silenceDur }); // silence = stun for now
          this.addLog(`  → ${t.name} 全属性${ult.debuffPct}% ${ult.duration}回合`);
        }
        break;
      }
      case 'aoe_charm': {
        for (const t of enemies) {
          if (!t.alive) continue; // Skip dead targets
          if (!t.effects.some(e => e.type === 'invincible')) {
            t.effects.push({ type: 'charm', duration: ult.charmDur });
            if (ult.debuffPct) t.debuffs.push({ stat: 'int', pct: ult.debuffPct, duration: ult.charmDur });
            this.addLog(`  → ${t.name} 被魅惑${ult.charmDur}回合`);
          }
        }
        break;
      }
      case 'aoe_dot': {
        for (const t of enemies) {
          if (!t.alive) continue; // Skip dead targets
          t._ultimateDot = { dmgPerTurn: Math.floor(atkStat * ult.dotPct / 100), duration: ult.duration };
          this.addLog(`  → ${t.name} 持续伤害 ${ult.duration}回合`);
        }
        break;
      }
      case 'aoe_execute': {
        for (const t of enemies) {
          if (!t.alive) continue;
          const dmg = Math.floor(atkStat * ult.mult);
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → ${t.name} -${dmg}`);
          if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); continue; }
          if (ult.executeChance && Math.random() * 100 < ult.executeChance) {
            t.hp = 0; t.alive = false;
            this.addLog(`  → ${t.name} 即死！`);
            this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` });
          }
        }
        break;
      }
      case 'steal_atk': {
        let totalStolen = 0;
        for (const t of enemies) {
          if (!t.alive) continue; // Skip dead targets
          const stolen = Math.floor(this.getEffStat(t, 'atk') * ult.stealPct / 100);
          t.debuffs.push({ stat: 'atk', pct: -ult.stealPct, duration: 3 });
          totalStolen += stolen;
          this.addLog(`  → 偷取 ${t.name} ${stolen} ATK`);
        }
        fighter.buffs.push({ stat: 'atk', pct: Math.floor(totalStolen / Math.max(1, fighter.atk) * 100), duration: 3 });
        this.addLog(`  → ${fighter.name} ATK+${totalStolen} (3回合)`);
        break;
      }
      case 'revive': {
        const dead = allAllies.filter(f => f && !f.alive);
        if (dead.length > 0) {
          const target = dead[0];
          target.alive = true;
          target.hp = Math.floor(target.maxHp * ult.healPct);
          target.effects = [];
          target.debuffs = [];
          this.addLog(`  → 复活 ${target.name} (${target.hp}HP)`);
        } else {
          // No dead allies — heal lowest HP ally instead
          const lowest = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (lowest) {
            const heal = Math.floor(lowest.maxHp * ult.healPct);
            lowest.hp = Math.min(lowest.maxHp, lowest.hp + heal);
            this.addLog(`  → 无人可复活，治疗 ${lowest.name} +${heal}HP`);
          }
        }
        break;
      }
      case 'front_damage': {
        const frontEnemies = enemies.filter(f => f.alive && f.pos < 2).length > 0 ? enemies.filter(f => f.alive && f.pos < 2) : enemies.filter(f => f.alive).slice(0, 2);
        for (const t of frontEnemies) {
          if (!t.alive) continue;
          const dmg = Math.floor(atkStat * ult.mult);
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → ${t.name} -${dmg}`);
          if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
        }
        if (ult.defBuff) {
          fighter.buffs.push({ stat: 'def', pct: ult.defBuff, duration: ult.duration });
          this.addLog(`  → ${fighter.name} DEF+${ult.defBuff}%`);
        }
        break;
      }
      default:
        this.addLog(`  → ${ult.name} 效果生效！`);
        break;
    }
  },

  // ===== COMBAT MECHANICS =====
  doAttack(attacker, defender) {
    // DEFINITIVE DEAD-UNIT GUARD: both attacker AND defender must be alive
    if (!attacker?.alive || attacker.hp <= 0) return;
    if (!defender?.alive || defender.hp <= 0) return;

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

    // Ultimate Dodge check (from self_dodge ultimate ability)
    if (defender._ultimateDodge && defender._ultimateDodge.pct > 0) {
      if (Math.random() * 100 < defender._ultimateDodge.pct) {
        this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 灵巧闪避！`);
        // Counter on dodge
        if (defender._ultimateDodge.counter && attacker.alive) {
          const counterDmg = Math.floor(this.getEffStat(defender, 'atk') * 0.8);
          attacker.hp = Math.max(0, attacker.hp - counterDmg);
          this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 闪避反击！${counterDmg}伤害`);
          if (attacker.hp <= 0) { attacker.alive = false; }
        }
        return;
      }
    }

    let dmg = this.calcDamage(attacker, defender);
    
    // Play attack sound
    if (typeof BattleSound !== 'undefined') {
      BattleSound.playAttack(attacker.faction);
    }
    
    // Unit type advantage
    const advMult = this.getUnitAdvantage(attacker.unit, defender.unit);
    dmg = Math.floor(dmg * advMult);

    // Terrain bonus
    dmg = Math.floor(dmg * this.getTerrainMult(attacker.unit, this.state.terrain));

    // Weather effect
    const weatherMult = this.getWeatherMult(attacker, this.state.weather);
    if (weatherMult === 0) {
      // Fog miss: attack completely whiffs, give attacker small rage gain and return
      attacker.rage = Math.min(attacker.maxRage, attacker.rage + 5);
      this.vfx.push({ type: 'miss', target: `${defender.side}-${defender.pos}` });
      return;
    }
    dmg = Math.floor(dmg * weatherMult);

    // Dynamic Battlefield damage modifier (weather + terrain + time of day)
    if (typeof DynamicBattlefield !== 'undefined') {
      const bfMod = DynamicBattlefield.getDamageModifier(attacker, defender, dmg, false);
      if (bfMod === 0) {
        this.addLog(Visuals.heroTag(attacker.id) + ' ' + attacker.name + ' 的攻击落空了！');
        attacker.rage = Math.min(attacker.maxRage, attacker.rage + 10);
        return;
      }
      dmg = Math.floor(dmg * bfMod);
      // Track fire hits on forest terrain
      if (attacker.element === 'fire' || (attacker.skill && attacker.skill.type === 'magic')) {
        DynamicBattlefield.onFireHit();
      }
    }

    // Strategy: damage modification hook
    if (typeof Strategy !== 'undefined') {
      dmg = Strategy.onAttack(attacker, defender, dmg, this.state);
    }

    // War Director targeted damage boosts (boss / elite directives)
    if (attacker.side === 'player' && defender.side === 'enemy' && this.state?.warContext) {
      if (this.state.warContext.isBoss && attacker._warBossDmg) {
        dmg = Math.floor(dmg * (1 + attacker._warBossDmg));
      } else if (this.state.warContext.isElite && attacker._warEliteDmg) {
        dmg = Math.floor(dmg * (1 + attacker._warEliteDmg));
      }
    }

    // Feature 6: Escalating damage multiplier after turn 30 to prevent stalemates
    if (this.state.turn > 30) {
      const escalation = 1 + (this.state.turn - 30) * 0.05;
      dmg = Math.floor(dmg * escalation);
    }

    // Feature 6: Track total damage dealt per side
    if (attacker.side === 'player') {
      this._totalDamagePlayer = (this._totalDamagePlayer || 0) + dmg;
    } else {
      this._totalDamageEnemy = (this._totalDamageEnemy || 0) + dmg;
    }

    // Feature 2: Charge ultimate on dealing damage
    if (attacker._ultimate && !attacker._ultimateFired) {
      attacker._ultimateCharge = Math.min(attacker._ultimateMaxCharge, (attacker._ultimateCharge || 0) + 10);
    }
    // Feature 2: Charge ultimate on taking damage
    if (defender._ultimate && !defender._ultimateFired) {
      defender._ultimateCharge = Math.min(defender._ultimateMaxCharge, (defender._ultimateCharge || 0) + 8);
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
    if (defender.alive && attacker.alive && defender.equipEffects?.reflect_pct > 0) {
      const reflectDmg = Math.floor(dmg * defender.equipEffects.reflect_pct / 100);
      if (reflectDmg > 0) {
        attacker.hp = Math.max(0, attacker.hp - reflectDmg);
        this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 玄甲反弹 ${reflectDmg}伤害！`);
        if (attacker.hp <= 0) { attacker.alive = false; this.vfx.push({ type: 'kill', target: `${attacker.side}-${attacker.pos}` }); }
      }
    }

    // Early return if attacker died from equipment reflect
    if (!attacker.alive) return;

    // Ultimate reflect damage (from self_tank ultimates like changban_bridge)
    if (defender.alive && attacker.alive && defender._ultimateReflect && defender._ultimateReflect.pct > 0) {
      const ultReflect = Math.floor(dmg * defender._ultimateReflect.pct / 100);
      if (ultReflect > 0) {
        attacker.hp = Math.max(0, attacker.hp - ultReflect);
        this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 终结技反弹 ${ultReflect}伤害！`);
        if (attacker.hp <= 0) { attacker.alive = false; this.vfx.push({ type: 'kill', target: `${attacker.side}-${attacker.pos}` }); }
      }
    }

    // Ultimate crit counter (from fortress_archer ultimate)
    if (defender.alive && attacker.alive && defender._ultimateCritCounter) {
      const counterDmg = Math.floor(this.calcDamage(defender, attacker) * 1.5); // Guaranteed crit counter
      attacker.hp = Math.max(0, attacker.hp - counterDmg);
      this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 磐石反击！${counterDmg}伤害(暴击)`);
      if (attacker.hp <= 0) { attacker.alive = false; this.vfx.push({ type: 'kill', target: `${attacker.side}-${attacker.pos}` }); }
    }

    // Early return if attacker died from reflect/counter
    if (!attacker.alive) return;

    // Element reaction check
    if (attacker.element && defender.alive && typeof ELEMENT_REACTIONS !== 'undefined') {
      this.checkElementReaction(attacker, defender);
    }

    // Gain rage (with personality bonuses)
    let atkRageGain = 20;
    let defRageGain = 10;
    // Mood: excited gives +20% rage gain
    if (attacker._mood?.rageGainBonus) atkRageGain = Math.floor(atkRageGain * (1 + attacker._mood.rageGainBonus));
    if (defender._mood?.rageGainBonus) defRageGain = Math.floor(defRageGain * (1 + defender._mood.rageGainBonus));
    // Bond: rage_gain bonus
    if (attacker._bondRageGain) atkRageGain = Math.floor(atkRageGain * (1 + attacker._bondRageGain));
    if (defender._bondRageGain) defRageGain = Math.floor(defRageGain * (1 + defender._bondRageGain));
    if (attacker._warRageGain) atkRageGain = Math.floor(atkRageGain * (1 + attacker._warRageGain));
    if (defender._warRageGain) defRageGain = Math.floor(defRageGain * (1 + defender._warRageGain));
    attacker.rage = Math.min(attacker.maxRage, attacker.rage + atkRageGain);
    defender.rage = Math.min(defender.maxRage, (defender.rage || 0) + defRageGain);

    // Combo tracking: hits on same target within same turn = combo
    const comboKey = `${attacker.side}-${attacker.pos}`;
    if (!this._comboTracker) this._comboTracker = {};
    if (!this._comboTracker[comboKey]) this._comboTracker[comboKey] = { target: null, count: 0, turn: -1 };
    const ct = this._comboTracker[comboKey];
    const targetKey = `${defender.side}-${defender.pos}`;
    if (ct.target === targetKey && ct.turn === this.state.turn) {
      ct.count++;
    } else {
      ct.target = targetKey; ct.count = 1; ct.turn = this.state.turn;
    }
    const comboCount = ct.count;

    // Queue visual effects for UI layer
    this.vfx.push({ type: 'attack', attacker: `${attacker.side}-${attacker.pos}`, target: `${defender.side}-${defender.pos}`, dmg, isCrit: this._lastCrit || false, combo: comboCount > 1 ? comboCount : 0 });

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
      // Double strike — only if both attacker AND defender are still alive
      if (!attacker.alive || !defender.alive) return;
      if (attacker._specials.includes('double_strike') || attacker._specials.includes('double_strike_20')) {
        if (Math.random() * 100 < 20) {
          const extraDmg = Math.floor(dmg * 0.5);
          defender.hp = Math.max(0, defender.hp - extraDmg);
          this.addLog(`${Visuals.heroTag(attacker.id)} ${attacker.name} 连击！额外 ${extraDmg} 伤害`);
          if (defender.hp <= 0) { defender.alive = false; this.vfx.push({ type: 'kill', target: `${defender.side}-${defender.pos}` }); }
        }
      }
    }

    // Check counter-attack passive — only if BOTH units are alive
    if (!attacker.alive || !defender.alive) return;
    if (defender.passive?.condition === 'on_hit' && Math.random() * 100 < (defender.passive.chance || 0)) {
      const counterDmg = Math.floor(this.calcDamage(defender, attacker) * (defender.passive.value || 0.5));
      attacker.hp = Math.max(0, attacker.hp - counterDmg);
      this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 反击！${counterDmg}伤害`);
      if (attacker.hp <= 0) { attacker.alive = false; this.vfx.push({ type: 'kill', target: `${attacker.side}-${attacker.pos}` }); }
    }

    // Skill tree specials: counter on defend — only if BOTH units are alive
    if (!attacker.alive || !defender.alive) return;
    if (defender._specials) {
      const counterChance =
        defender._specials.includes('counter_50') ? 50 :
        defender._specials.includes('counter_40') ? 40 :
        defender._specials.includes('counter_30') ? 30 : 0;
      if (counterChance > 0 && Math.random() * 100 < counterChance && !defender.effects.some(e => e.type === 'stun')) {
        const counterDmg = Math.floor(this.calcDamage(defender, attacker) * 0.8);
        attacker.hp = Math.max(0, attacker.hp - counterDmg);
        this.addLog(`${Visuals.heroTag(defender.id)} ${defender.name} 天赋反击！${counterDmg}伤害`);
        if (attacker.hp <= 0) { attacker.alive = false; this.vfx.push({ type: 'kill', target: `${attacker.side}-${attacker.pos}` }); }
      }
    }
  },

  calcDamage(atk, def) {
    const atkStat = this.getEffStat(atk, 'atk');
    let defStat = this.getEffStat(def, 'def');
    // Armor penetration from skill tree
    if (typeof SkillTree !== 'undefined') {
      const bonuses = SkillTree.getStatBonuses(atk.id);
      if (bonuses && bonuses.armor_pen_pct) {
        defStat = Math.floor(defStat * (1 - bonuses.armor_pen_pct / 100));
      }
    }
    const _B = (typeof GAME_BALANCE !== 'undefined') ? GAME_BALANCE.BATTLE : {};
    const base = Math.max(_B.MIN_DAMAGE || 1, atkStat - defStat * (_B.DEF_REDUCTION || 0.5));
    const variance = (_B.VARIANCE_MIN || 0.9) + Math.random() * ((_B.VARIANCE_MAX || 1.1) - (_B.VARIANCE_MIN || 0.9));
    // Crit chance: base + buff + equipment set bonus
    const equipCrit = atk.equipEffects?.crit_pct || 0;
    const bondCrit = atk._bondCrit || 0;
    const critChance = (_B.CRIT_RATE_BASE || 10) + (atk.buffs.find(b => b.stat === 'crit')?.pct || 0) + equipCrit + bondCrit;
    const isCrit = Math.random() * 100 < critChance;
    // Play crit sound
    if (isCrit && typeof BattleSound !== 'undefined') {
      BattleSound.playCrit();
    }
    // Crit damage bonus from skill tree
    let critMult = (_B.CRIT_MULT || 1.5);
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
    const _UA = (typeof GAME_BALANCE !== 'undefined') ? GAME_BALANCE.UNIT_ADVANTAGE : {};
    if (ut.strong === defUnit) return _UA.STRONG_MULT || 1.3;
    if (ut.weak === defUnit) return _UA.WEAK_MULT || 0.7;
    return _UA.NEUTRAL_MULT || 1;
  },

  // Terrain multipliers — values from GAME_BALANCE.TERRAIN
  getTerrainMult(unit, terrain) {
    const bonuses = (typeof GAME_BALANCE !== 'undefined' && GAME_BALANCE.TERRAIN) ? GAME_BALANCE.TERRAIN : {
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
    if (weather === 'fog') {
      if (Math.random() <= 0.3) {
        this.addLog(`${Visuals.heroTag(fighter.id)} ${fighter.name} 在浓雾中未命中！`);
        return 0; // 30% miss in fog — actual miss (0 damage)
      }
      return 1;
    }
    if (weather === 'fire' && fighter.unit === 'mage') return 1.2;
    if (weather === 'wind' && fighter.unit === 'archer') return 1.15; // Wind aids arrows
    if (weather === 'wind' && isSkill && fighter.skill?.type === 'magic') return 1.1; // Wind fans magical flames
    return 1;
  },

  // ===== SKILLS =====
  useSkill(fighter) {
    const s = fighter.skill;
    if (!s) return;
    // DEFINITIVE DEAD-UNIT GUARD: dead fighters cannot cast skills
    if (!fighter.alive || fighter.hp <= 0) return;
    fighter.rage = 0;
    const enemies = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
    const allies = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive);

    this.addLog(`${Visuals.heroTag(fighter.id)} ${fighter.name} 释放【${s.name}】！`);
    this.vfx.push({ type: 'skill', caster: `${fighter.side}-${fighter.pos}`, skillName: s.name });
    
    // Play skill sound
    if (typeof BattleSound !== 'undefined') {
      BattleSound.playSkill();
    }

    // Equipment set: 凤翼 skill damage bonus
    let skillDmgBonus = fighter.equipEffects?.skill_dmg_pct || 0;
    // Mood skill damage bonus (elated: +10%)
    if (fighter._mood?.effects?.skill_dmg) skillDmgBonus += fighter._mood.effects.skill_dmg * 100;
    // Bond skill damage bonus
    if (fighter._bondSkillDmg) skillDmgBonus += fighter._bondSkillDmg * 100;

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
          if (!t.alive) continue; // Skip already-dead targets
          const hits = s.hits || 1;
          for (let h = 0; h < hits; h++) {
            if (!t.alive) break; // Re-check alive status between multi-hits
            let dmg = Math.floor(this.getEffStat(fighter, 'atk') * s.value);
            dmg = Math.floor(dmg * (1 + skillDmgBonus / 100));
            if (s.guaranteed_crit) dmg = Math.floor(dmg * 1.5);
            // Feature 6: Escalating damage after turn 30
            if (this.state.turn > 30) dmg = Math.floor(dmg * (1 + (this.state.turn - 30) * 0.05));
            // Feature 6: Track damage
            if (fighter.side === 'player') this._totalDamagePlayer += dmg;
            else this._totalDamageEnemy += dmg;
            t.hp = Math.max(0, t.hp - dmg);
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} -${dmg} HP`);
            if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); break; }
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
        // 姜维继志北伐：若诸葛亮在队，额外释放卧龙遗计（全体法伤）
        if (s.inherit) {
          const inheritHero = s.inherit.hero;
          const teamAlive = (fighter.side === 'player' ? this.state.player : this.state.enemy).filter(f => f?.alive);
          const hasInherit = teamAlive.some(f => f.id === inheritHero);
          if (hasInherit) {
            const bonus = s.inherit.bonus_skill;
            this.addLog(`✨ ${fighter.name} 感诸葛亮在侧，触发【卧龙遗计】！`);
            const liveEnemies = (fighter.side === 'player' ? this.state.enemy : this.state.player).filter(f => f?.alive);
            for (const t of liveEnemies) {
              if (!t.alive) continue; // Re-check alive in case previous iteration killed them
              const inheritDmg = Math.floor(this.getEffStat(fighter, 'int') * (bonus.value || 1.5));
              t.hp = Math.max(0, t.hp - inheritDmg);
              this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} -${inheritDmg} 法伤（遗计）`);
              if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
            }
          }
        }
        break;
      }
      case 'magic': {
        if (enemies.length === 0) break;
        const targets = s.target === 'all_enemy' ? enemies : [enemies.sort((a,b) => a.hp - b.hp)[0]];
        for (const t of targets) {
          if (!t.alive) continue; // Skip already-dead targets
          let dmg = Math.floor(this.getEffStat(fighter, 'int') * s.value);
          dmg = Math.floor(dmg * (1 + skillDmgBonus / 100));
          // Weather affects magic skills (e.g. rain weakens fire magic)
          dmg = Math.floor(dmg * this.getWeatherMult(fighter, this.state.weather, true));
          // Feature 6: Escalating damage after turn 30
          if (this.state.turn > 30) dmg = Math.floor(dmg * (1 + (this.state.turn - 30) * 0.05));
          // Feature 6: Track damage
          if (fighter.side === 'player') this._totalDamagePlayer += dmg;
          else this._totalDamageEnemy += dmg;
          t.hp = Math.max(0, t.hp - dmg);
          this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} -${dmg} 法伤`);
          if (t.hp <= 0) { t.alive = false; this.vfx.push({ type: 'kill', target: `${t.side}-${t.pos}` }); }
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
          // Cleanse: remove all debuffs and negative effects (华佗五禽戏)
          if (s.cleanse) {
            t.debuffs = [];
            t.effects = t.effects.filter(e => e.type === 'invincible'); // keep invincible only
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} 负面效果全部解除！`);
          }
        }
        // Buff component of heal skill (e.g. 孙权坐断东南)
        if (s.stat && s.pct && s.duration) {
          for (const t of targets) {
            t.buffs.push({ stat: s.stat, pct: s.pct, duration: s.duration });
          }
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
        else if (s.target === 'random_2_enemy') {
          // 庞统连环计：随机选2个敌人互相攻击
          const shuffled = enemies.slice().sort(() => Math.random() - 0.5);
          targets = shuffled.slice(0, Math.min(2, shuffled.length));
          if (s.effect === 'confuse' && targets.length >= 2) {
            // Make them deal damage to each other — re-check alive before each hit
            this.addLog(`  ⚙ 庞统连环计：${targets.map(t=>t.name).join('、')} 互相攻击！`);
            const [t1, t2] = targets;
            if (t1.alive && t2.alive) {
              const dmg1 = Math.floor(this.calcDamage(t1, t2) * 0.8);
              t2.hp = Math.max(0, t2.hp - dmg1);
              if (t2.hp <= 0) { t2.alive = false; this.vfx.push({ type: 'kill', target: `${t2.side}-${t2.pos}` }); }
              this.addLog(`  → ${Visuals.heroTag(t1.id)} ${t1.name} 攻击 ${t2.name} ${dmg1}伤害`);
            }
            if (t1.alive && t2.alive) {
              const dmg2 = Math.floor(this.calcDamage(t2, t1) * 0.8);
              t1.hp = Math.max(0, t1.hp - dmg2);
              if (t1.hp <= 0) { t1.alive = false; this.vfx.push({ type: 'kill', target: `${t1.side}-${t1.pos}` }); }
              this.addLog(`  → ${Visuals.heroTag(t2.id)} ${t2.name} 攻击 ${t1.name} ${dmg2}伤害`);
            }
            break;
          }
        }
        else targets = [enemies[0]];
        targets = targets.filter(Boolean);
        for (const t of targets) {
          if (t.effects.some(e => e.type === 'invincible')) {
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} 无敌，免疫控制！`);
          } else {
            t.effects.push({ type: s.effect, duration: s.duration });
            this.addLog(`  → ${Visuals.heroTag(t.id)} ${t.name} 被${s.effect === 'stun' ? '眩晕' : s.effect === 'confuse' ? '混乱' : '魅惑'}${s.duration}回合！`);
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
          if (strongest.hp <= 0) { strongest.alive = false; this.vfx.push({ type: 'kill', target: `${strongest.side}-${strongest.pos}` }); }
        } else {
          // Fallback: deal INT-based damage
          const fallbackDmg = Math.floor(this.getEffStat(fighter, 'int') * 2.0);
          const target = enemies[0];
          if (target && target.alive) {
            target.hp = Math.max(0, target.hp - fallbackDmg);
            this.addLog(`  → ${Visuals.heroTag(target.id)} ${target.name} -${fallbackDmg} 法伤`);
            if (target.hp <= 0) { target.alive = false; this.vfx.push({ type: 'kill', target: `${target.side}-${target.pos}` }); }
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

    // Ultimate DoT: deal damage per turn
    if (fighter._ultimateDot && fighter._ultimateDot.duration > 0 && fighter.alive) {
      const dotDmg = fighter._ultimateDot.dmgPerTurn;
      fighter.hp = Math.max(0, fighter.hp - dotDmg);
      this.addLog(`  ${Visuals.heroTag(fighter.id)} ${fighter.name} 持续伤害 -${dotDmg}`);
      if (fighter.hp <= 0) { fighter.alive = false; this.vfx.push({ type: 'kill', target: `${fighter.side}-${fighter.pos}` }); }
      fighter._ultimateDot.duration--;
      if (fighter._ultimateDot.duration <= 0) fighter._ultimateDot = null;
    }

    // Ultimate Berserk: HP cost per turn
    if (fighter._ultimateBerserk && fighter._ultimateBerserk.duration > 0 && fighter.alive) {
      const hpCost = Math.floor(fighter.maxHp * fighter._ultimateBerserk.hpCost / 100);
      fighter.hp = Math.max(1, fighter.hp - hpCost); // Berserk never self-kills, min 1 HP
      this.addLog(`  ${Visuals.heroTag(fighter.id)} ${fighter.name} 狂暴代价 -${hpCost} HP`);
      fighter._ultimateBerserk.duration--;
      if (fighter._ultimateBerserk.duration <= 0) fighter._ultimateBerserk = null;
    }

    // Ultimate Regen: heal per turn
    if (fighter._ultimateRegen && fighter._ultimateRegen.duration > 0 && fighter.alive) {
      const heal = Math.floor(fighter.maxHp * fighter._ultimateRegen.pct / 100);
      fighter.hp = Math.min(fighter.maxHp, fighter.hp + heal);
      this.addLog(`  ${Visuals.heroTag(fighter.id)} ${fighter.name} 回复 +${heal} HP`);
      fighter._ultimateRegen.duration--;
      if (fighter._ultimateRegen.duration <= 0) fighter._ultimateRegen = null;
    }

    // Ultimate Stealth: tick down
    if (fighter._ultimateStealth && fighter._ultimateStealth.duration > 0) {
      fighter._ultimateStealth.duration--;
      if (fighter._ultimateStealth.duration <= 0) fighter._ultimateStealth = null;
    }

    // Ultimate Dodge: tick down
    if (fighter._ultimateDodge && fighter._ultimateDodge.duration > 0) {
      fighter._ultimateDodge.duration--;
      if (fighter._ultimateDodge.duration <= 0) fighter._ultimateDodge = null;
    }

    // Ultimate CC Immune: tick down
    if (fighter._ultimateCCImmune && fighter._ultimateCCImmune.duration > 0) {
      fighter._ultimateCCImmune.duration--;
      if (fighter._ultimateCCImmune.duration <= 0) fighter._ultimateCCImmune = null;
    }

    // Ultimate Reflect: tick down
    if (fighter._ultimateReflect && fighter._ultimateReflect.duration > 0) {
      fighter._ultimateReflect.duration--;
      if (fighter._ultimateReflect.duration <= 0) fighter._ultimateReflect = null;
    }

    // Ultimate Crit Counter: tick down
    if (fighter._ultimateCritCounter && fighter._ultimateCritCounter.duration > 0) {
      fighter._ultimateCritCounter.duration--;
      if (fighter._ultimateCritCounter.duration <= 0) fighter._ultimateCritCounter = null;
    }
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

  // ===== HERO PERSONALITY INTEGRATION =====
  applyPersonalityEffects() {
    if (typeof HeroPersonality === 'undefined') return;
    // Apply mood & loyalty to player fighters only
    for (const f of this.state.player) {
      if (!f) continue;
      HeroPersonality.applyMoodEffects(f);
      HeroPersonality.applyLoyaltyEffects(f);
    }
    // Apply bond bonuses to player team
    const playerIds = this.state.player.filter(f => f).map(f => f.id);
    this._activeBonds = HeroPersonality.applyBondEffects(this.state.player.filter(f => f));
    // Store active bonds for UI display
    this._battleBondIds = playerIds;
  },

  // Check personality effects before a fighter acts
  checkPersonalityBeforeAction(fighter) {
    if (typeof HeroPersonality === 'undefined' || fighter.side !== 'player') return 'proceed';

    // Loyalty refusal check
    if (HeroPersonality.checkLoyaltyRefusal(fighter)) {
      this.addLog('<span class="battle-refusal-msg">💔 ' + Visuals.heroTag(fighter.id) + ' ' + fighter.name + ' 心怀不满，拒绝出战！</span>');
      this.triggerDialogue(fighter, 'lowMorale');
      return 'skip';
    }

    // Furious ally attack check
    if (HeroPersonality.checkFuriousAllyAttack(fighter)) {
      const allies = this.state.player.filter(f => f?.alive && f !== fighter);
      if (allies.length > 0) {
        const target = allies[Math.floor(Math.random() * allies.length)];
        this.addLog('<span class="battle-fury-msg">😤 ' + Visuals.heroTag(fighter.id) + ' ' + fighter.name + ' 暴怒失控，攻击了 ' + target.name + '！</span>');
        this.doAttack(fighter, target);
        this.triggerDialogue(fighter, 'battleStart');
        return 'skip';
      }
    }

    return 'proceed';
  },

  // Trigger dialogue bubble during battle
  triggerDialogue(fighter, event, context) {
    if (typeof HeroPersonality === 'undefined') return;
    const line = HeroPersonality.getLine(fighter.id, event, context);
    if (!line) return;

    // Queue dialogue for UI layer to render
    if (!this._dialogueQueue) this._dialogueQueue = [];
    this._dialogueQueue.push({
      heroId: fighter.id,
      text: line,
      side: fighter.side,
      pos: fighter.pos,
      time: Date.now(),
    });
  },

  // Get and clear pending dialogues (called by UI layer)
  popDialogues() {
    const q = this._dialogueQueue || [];
    this._dialogueQueue = [];
    return q;
  },

  // ===== UTILS =====
  addLog(msg) { this.log.push({ turn: this.state.turn, msg }); },
  wait(ms) { return new Promise(r => setTimeout(r, ms)); }
};

if (typeof window !== 'undefined') window.Battle = Battle;

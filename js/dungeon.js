// 三国·天命 — Endless Dungeon + Daily Dungeon + Weekly Boss Raid

const Dungeon = {
  // ===== ENDLESS DUNGEON (无尽副本) =====
  // Unlocked after completing Chapter 6

  ENEMY_POOL: [
    { id: 'soldier', weight: 30 },
    { id: 'archer_recruit', weight: 25 },
    { id: 'shield_militia', weight: 20 },
    { id: 'mage_acolyte', weight: 20 },
    { id: 'elite_cavalry', weight: 15 },
    { id: 'elite_spear', weight: 15 },
    { id: 'navy_soldier', weight: 12 },
    { id: 'fire_archer', weight: 12 },
    { id: 'strategist', weight: 10 },
    { id: 'crossbow_corps', weight: 10 },
    { id: 'fire_soldier', weight: 8 },
    { id: 'supply_guard', weight: 8 },
  ],

  BOSS_POOL: [
    { id: 'zhangjiao', name: '张角·幽冥', emoji: '角', title: '天公复生' },
    { id: 'lvbu', name: '吕布·修罗', emoji: '吕', title: '无双鬼神' },
    { id: 'caocao', name: '曹操·霸王', emoji: '曹', title: '乱世霸主' },
    { id: 'simayi', name: '司马懿·暗影', emoji: '司', title: '冢虎觉醒' },
    { id: 'zhouyu', name: '周瑜·烈焰', emoji: '瑜', title: '赤壁之魂' },
    { id: 'luXun', name: '陆逊·焚天', emoji: '逊', title: '夷陵之火' },
  ],

  EVENT_TYPES: [
    { type: 'merchant', name: '神秘商人', emoji: '', desc: '以优惠价格出售装备和补给' },
    { type: 'treasure', name: '宝箱', emoji: '', desc: '发现远古宝箱！' },
    { type: 'trap', name: '陷阱', emoji: '', desc: '前方有埋伏！全队损失HP' },
    { type: 'ally_rescue', name: '援军', emoji: '', desc: '解救被困武将，获得临时增益' },
    { type: 'shrine', name: '祭坛', emoji: '', desc: '远古祭坛，祈祷获得祝福' },
    { type: 'challenge', name: '精英挑战', emoji: '', desc: '精英怪物出没，击败获双倍奖励' },
  ],

  TERRAINS: ['plains', 'mountain', 'river', 'forest', 'castle'],
  WEATHERS: ['clear', 'rain', 'fog', 'wind', 'fire'],

  isUnlocked() {
    const progress = Storage.getCampaignProgress();
    return progress.chapter > 6 || (progress.chapter === 6 && progress.stage > 10);
  },

  seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 13) % 2147483647; return (s - 1) / 2147483646; };
  },

  generateFloor(floorNumber) {
    const rng = this.seededRandom(floorNumber * 3571 + 42);
    const scaleMult = 1 + floorNumber * 0.08;
    const isBossFloor = floorNumber % 10 === 0 && floorNumber > 0;
    const isEventFloor = floorNumber % 5 === 0 && !isBossFloor;

    const terrain = this.TERRAINS[Math.floor(rng() * this.TERRAINS.length)];
    const weather = this.WEATHERS[Math.floor(rng() * this.WEATHERS.length)];

    let enemies = [];
    let event = null;
    let boss = null;

    if (isBossFloor) {
      // Boss floor
      const bossTemplate = this.BOSS_POOL[Math.floor(rng() * this.BOSS_POOL.length)];
      boss = {
        ...bossTemplate,
        scaleMult: scaleMult * 3, // Bosses are 3x stronger
        floorNumber,
      };
      // Boss + 2 minions
      enemies = [this._pickEnemy(rng), bossTemplate.id, this._pickEnemy(rng)];
    } else {
      // Normal enemies, 3-5 based on floor
      const count = 3 + Math.floor(rng() * Math.min(3, 1 + Math.floor(floorNumber / 10)));
      for (let i = 0; i < count; i++) {
        enemies.push(this._pickEnemy(rng));
      }
    }

    if (isEventFloor) {
      event = this.EVENT_TYPES[Math.floor(rng() * this.EVENT_TYPES.length)];
    }

    // Rewards scale with floor
    const baseGold = 200 + floorNumber * 50;
    const baseExp = 100 + floorNumber * 30;
    const reward = {
      gold: Math.floor(baseGold * (1 + rng() * 0.3)),
      exp: Math.floor(baseExp * (1 + rng() * 0.3)),
      gems: isBossFloor ? Math.floor(5 + floorNumber / 10) : (rng() > 0.8 ? 1 : 0),
    };

    return {
      floor: floorNumber,
      enemies,
      terrain,
      weather,
      scaleMult,
      isBossFloor,
      isEventFloor,
      event,
      boss,
      reward,
      name: isBossFloor ? `第${floorNumber}层 · BOSS` : `第${floorNumber}层`,
    };
  },

  _pickEnemy(rng) {
    const totalWeight = this.ENEMY_POOL.reduce((s, e) => s + e.weight, 0);
    let roll = rng() * totalWeight;
    for (const e of this.ENEMY_POOL) {
      roll -= e.weight;
      if (roll <= 0) return e.id;
    }
    return this.ENEMY_POOL[0].id;
  },

  // Create scaled fighter for dungeon
  createDungeonFighter(heroId, scaleMult) {
    const hero = HEROES[heroId];
    if (!hero) return null;
    return {
      id: hero.id,
      name: hero.name,
      emoji: hero.emoji,
      side: 'enemy',
      pos: 0,
      unit: hero.unit,
      faction: hero.faction,
      rarity: hero.rarity,
      hp: Math.floor(hero.baseStats.hp * scaleMult),
      maxHp: Math.floor(hero.baseStats.hp * scaleMult),
      atk: Math.floor(hero.baseStats.atk * scaleMult),
      def: Math.floor(hero.baseStats.def * scaleMult),
      spd: Math.floor(hero.baseStats.spd * scaleMult),
      int: Math.floor(hero.baseStats.int * scaleMult),
      rage: 0,
      maxRage: hero.skill?.rage || 100,
      skill: hero.skill,
      passive: hero.passive,
      alive: true,
      buffs: [],
      debuffs: [],
      effects: [],
      equipEffects: { crit_pct: 0, skill_dmg_pct: 0, reflect_pct: 0 },
    };
  },

  // Process event effects (with duplication prevention)
  processEvent(event, floorNumber) {
    const state = this.getState();
    if (!state.processedEvents) state.processedEvents = {};
    if (state.processedEvents[floorNumber]) {
      return { message: '此事件已处理过', rewards: {}, effects: [], alreadyProcessed: true };
    }
    state.processedEvents[floorNumber] = true;
    this.saveState(state);

    const results = { message: '', rewards: {}, effects: [] };
    switch (event.type) {
      case 'merchant':
        const goldCost = 100 + floorNumber * 10;
        results.message = `商人出售补给，花费${goldCost}金币可回复全队HP`;
        results.merchantCost = goldCost;
        results.merchantEffect = 'heal_all';
        break;
      case 'treasure':
        const gold = 300 + floorNumber * 30;
        const gems = Math.floor(floorNumber / 20) + 1;
        results.message = `发现宝箱！获得 ${gold}金币 ${gems}宝石`;
        results.rewards = { gold, gems };
        Storage.addGold(gold);
        Storage.addGems(gems);
        break;
      case 'trap':
        results.message = '触发陷阱！全队损失15%HP（战斗中生效）';
        results.effects.push({ type: 'hp_drain', pct: 15 });
        break;
      case 'ally_rescue':
        results.message = '解救友军！全队ATK+20%持续本层战斗';
        results.effects.push({ type: 'buff', stat: 'atk', pct: 20 });
        break;
      case 'shrine':
        results.message = '祭坛祈祷，全队回复30%HP';
        results.effects.push({ type: 'heal', pct: 30 });
        break;
      case 'challenge':
        results.message = '精英挑战！敌人更强但奖励翻倍';
        results.effects.push({ type: 'elite_challenge' });
        break;
    }
    return results;
  },

  // Get dungeon state
  getState() {
    return Storage._get('dungeonState', {
      currentFloor: 1,
      highestFloor: 0,
      totalRuns: 0,
      active: false,
      processedEvents: {}, // Track processed floor events
    });
  },

  saveState(s) { Storage._set('dungeonState', s); },

  startRun() {
    const state = this.getState();
    state.currentFloor = 1;
    state.active = true;
    state.totalRuns++;
    state.processedEvents = {}; // Reset processed events for new run
    this.saveState(state);
    return state;
  },

  advanceFloor() {
    const state = this.getState();
    state.currentFloor++;
    if (state.currentFloor > state.highestFloor) {
      state.highestFloor = state.currentFloor;
    }
    this.saveState(state);
    return state;
  },

  endRun() {
    const state = this.getState();
    state.active = false;
    this.saveState(state);
    return state;
  },

  // ===== DAILY DUNGEON (每日副本) =====
  DAILY_DUNGEONS: {
    gold: {
      name: '金币副本',
      emoji: '',
      desc: '击败守财奴，掠夺金库！',
      color: '#fbbf24',
      baseReward: { gold: 2000 },
      rewardMult: { gold: 1 },
    },
    exp: {
      name: '经验副本',
      emoji: '',
      desc: '挑战经验丰富的老将！',
      color: '#6366f1',
      baseReward: { exp: 1500 },
      rewardMult: { exp: 1 },
    },
    material: {
      name: '材料副本',
      emoji: '',
      desc: '收集精良材料，打造神兵！',
      color: '#22c55e',
      baseReward: { gold: 500, equipChance: 1.0 },
      rewardMult: { gold: 0.5 },
    },
  },

  MAX_DAILY_ATTEMPTS: 3,

  getDailyDungeonType() {
    const day = new Date().getDay(); // 0=Sun, 1=Mon...
    const types = ['gold', 'exp', 'material'];
    return types[day % 3];
  },

  getAllDailyTypes() {
    // All 3 available, but highlighted one rotates
    return ['gold', 'exp', 'material'];
  },

  getDailyState() {
    const today = new Date().toISOString().split('T')[0];
    const state = Storage._get('dailyDungeonState', { date: '', attempts: {}, streak: 0 });
    if (state.date !== today) {
      // Check streak
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const wasPlayed = state.date === yesterday && Object.values(state.attempts).some(a => a > 0);
      state.streak = wasPlayed ? (state.streak || 0) + 1 : 0;
      state.date = today;
      state.attempts = { gold: 0, exp: 0, material: 0 };
      Storage._set('dailyDungeonState', state);
    }
    return state;
  },

  saveDailyState(s) { Storage._set('dailyDungeonState', s); },

  canPlayDaily(type) {
    const state = this.getDailyState();
    return (state.attempts[type] || 0) < this.MAX_DAILY_ATTEMPTS;
  },

  recordDailyAttempt(type) {
    const state = this.getDailyState();
    state.attempts[type] = (state.attempts[type] || 0) + 1;
    this.saveDailyState(state);
    return state;
  },

  generateDailyEnemies(type) {
    const powerLevel = Leaderboard.getPlayerPower();
    const scale = Math.max(1, powerLevel / 2000);
    const enemyCount = 4 + Math.floor(Math.random() * 2);
    const enemies = [];
    const pool = type === 'gold'
      ? ['shield_militia', 'elite_spear', 'supply_guard', 'soldier']
      : type === 'exp'
      ? ['strategist', 'crossbow_corps', 'mage_acolyte', 'elite_cavalry']
      : ['fire_archer', 'fire_soldier', 'navy_soldier', 'elite_spear'];

    for (let i = 0; i < enemyCount; i++) {
      enemies.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return { enemies, scaleMult: scale };
  },

  calculateDailyReward(type) {
    const dungeon = this.DAILY_DUNGEONS[type];
    const state = this.getDailyState();
    const streakBonus = 1 + Math.min(state.streak, 7) * 0.05; // +5% per streak day, max +35%
    const reward = {};

    if (dungeon.baseReward.gold) {
      reward.gold = Math.floor(dungeon.baseReward.gold * streakBonus);
    }
    if (dungeon.baseReward.exp) {
      reward.exp = Math.floor(dungeon.baseReward.exp * streakBonus);
    }
    if (dungeon.baseReward.equipChance) {
      reward.equipChance = dungeon.baseReward.equipChance;
    }
    reward.streakBonus = Math.floor((streakBonus - 1) * 100);
    return reward;
  },

  // ===== WEEKLY BOSS RAID (周常Boss) =====
  RAID_BOSSES: [
    { id: 'raid_dongzhuo', name: '董卓·暴君', emoji: '卓', hp: 50000, atk: 200, def: 150, int: 80, spd: 40, element: 'fire', phases: 3, desc: '暴虐无道的西凉太师' },
    { id: 'raid_yuanshao', name: '袁绍·盟主', emoji: '绍', hp: 45000, atk: 180, def: 180, int: 100, spd: 50, element: 'earth', phases: 3, desc: '四世三公的讨董盟主' },
    { id: 'raid_lvbu_rage', name: '吕布·狂暴', emoji: '吕', hp: 60000, atk: 280, def: 120, int: 50, spd: 100, element: 'none', phases: 4, desc: '暴走的飞将军' },
    { id: 'raid_guandu', name: '官渡之魂', emoji: '', hp: 55000, atk: 220, def: 160, int: 120, spd: 60, element: 'dark', phases: 3, desc: '官渡战场的亡灵大军' },
    { id: 'raid_chibi', name: '赤壁火神', emoji: '赤', hp: 48000, atk: 250, def: 100, int: 200, spd: 70, element: 'fire', phases: 3, desc: '赤壁之火凝聚的元素体' },
    { id: 'raid_wuzhang', name: '五丈原幽灵', emoji: '幽', hp: 52000, atk: 200, def: 140, int: 250, spd: 55, element: 'dark', phases: 4, desc: '五丈原未散的执念' },
    { id: 'raid_hulao', name: '虎牢关守卫', emoji: '关', hp: 70000, atk: 160, def: 250, int: 60, spd: 35, element: 'earth', phases: 3, desc: '永恒守护虎牢关的石像兵' },
    { id: 'raid_nanman', name: '南蛮兽王', emoji: '蛮', hp: 58000, atk: 240, def: 170, int: 70, spd: 45, element: 'nature', phases: 3, desc: '南蛮深处的远古巨兽' },
    { id: 'raid_yiling', name: '夷陵劫火', emoji: '焰', hp: 50000, atk: 260, def: 110, int: 180, spd: 80, element: 'fire', phases: 3, desc: '七百里连营的业火化身' },
    { id: 'raid_sima', name: '司马·天命', emoji: '司', hp: 65000, atk: 230, def: 200, int: 230, spd: 65, element: 'dark', phases: 4, desc: '窃取天命的终极敌人' },
  ],

  MAX_RAID_ATTEMPTS: 3,

  getCurrentRaidBoss() {
    const week = Leaderboard.getWeekNumber();
    const idx = week % this.RAID_BOSSES.length;
    return this.RAID_BOSSES[idx];
  },

  getRaidState() {
    const week = Leaderboard.getWeekNumber();
    const state = Storage._get('raidState', { week: 0, attempts: 0, totalDamage: 0, bestDamage: 0, defeated: false });
    if (state.week !== week) {
      // New week, reset
      return { week, attempts: 0, totalDamage: 0, bestDamage: 0, defeated: false };
    }
    return state;
  },

  saveRaidState(s) { Storage._set('raidState', s); },

  canRaid() {
    const state = this.getRaidState();
    return state.attempts < this.MAX_RAID_ATTEMPTS && !state.defeated;
  },

  recordRaidAttempt(damage) {
    const state = this.getRaidState();
    state.attempts++;
    state.totalDamage += damage;
    if (damage > state.bestDamage) state.bestDamage = damage;

    const boss = this.getCurrentRaidBoss();
    if (state.totalDamage >= boss.hp) {
      state.defeated = true;
    }
    this.saveRaidState(state);
    return state;
  },

  calculateRaidReward(state) {
    const boss = this.getCurrentRaidBoss();
    const damagePct = Math.min(1, state.totalDamage / boss.hp);
    return {
      gold: Math.floor(5000 * damagePct),
      gems: Math.floor(30 * damagePct),
      exp: Math.floor(3000 * damagePct),
      defeated: state.defeated,
    };
  },

  // Generate simulated community damage for raid
  getCommunityDamage() {
    const week = Leaderboard.getWeekNumber();
    const rng = this.seededRandom(week * 4219);
    const boss = this.getCurrentRaidBoss();
    const entries = [];
    const names = ['烈焰军', '苍龙营', '虎豹骑', '飞鱼卫', '赤壁联军', '铁壁营', '青龙军', '白虎卫'];
    for (const name of names) {
      entries.push({
        name,
        damage: Math.floor(rng() * boss.hp * 0.4),
        emoji: '',
      });
    }
    // Add player
    const state = this.getRaidState();
    entries.push({
      name: Storage.getPlayer().name + '的军队',
      damage: state.totalDamage,
      emoji: '',
      isPlayer: true,
    });
    entries.sort((a, b) => b.damage - a.damage);
    return entries;
  },
};

if (typeof window !== 'undefined') window.Dungeon = Dungeon;

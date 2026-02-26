// 三国·天命 — Seasonal Content System

const Seasonal = {
  // 4 seasons per year
  SEASONS: [
    {
      id: 1, name: '春·桃园', emoji: '', color: '#f472b6',
      desc: '桃花盛开，英雄相聚',
      theme: 'shu',
      bannerHeroes: ['liubei', 'guanyu', 'zhangfei', 'zhaoyun', 'zhugeLiang'],
      boostedRates: { 5: 0.05, 4: 0.15 }, // 5% for 5-star, 15% for 4-star
      months: [3, 4, 5], // Mar-May
    },
    {
      id: 2, name: '夏·赤壁', emoji: '', color: '#ef4444',
      desc: '烈日炎炎，烽火燃江',
      theme: 'wu',
      bannerHeroes: ['zhouyu', 'luXun', 'sunshangxiang', 'ganningwu', 'sunce'],
      boostedRates: { 5: 0.05, 4: 0.15 },
      months: [6, 7, 8], // Jun-Aug
    },
    {
      id: 3, name: '秋·五丈原', emoji: '', color: '#f59e0b',
      desc: '秋风瑟瑟，壮志未酬',
      theme: 'wei',
      bannerHeroes: ['caocao', 'simayi', 'guojia', 'xunyu', 'xuhuang'],
      boostedRates: { 5: 0.05, 4: 0.15 },
      months: [9, 10, 11], // Sep-Nov
    },
    {
      id: 4, name: '冬·乱世', emoji: '', color: '#6366f1',
      desc: '寒冬凛冽，群雄割据',
      theme: 'qun',
      bannerHeroes: ['lvbu', 'diaochan', 'menghuo', 'zhurong', 'huatuo'],
      boostedRates: { 5: 0.06, 4: 0.18 }, // Slightly better rates in winter
      months: [12, 1, 2], // Dec-Feb
    },
  ],

  getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    return this.SEASONS.find(s => s.months.includes(month)) || this.SEASONS[0];
  },

  getSeasonEndDate() {
    const season = this.getCurrentSeason();
    const lastMonth = Math.max(...season.months);
    const year = new Date().getFullYear();
    // If Dec→Feb spans years, handle that
    const endYear = lastMonth < season.months[0] ? year + 1 : year;
    return new Date(endYear, lastMonth, 0); // Last day of last month
  },

  getSeasonCountdown() {
    const end = this.getSeasonEndDate();
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return '即将结束';
    const days = Math.floor(diff / 86400000);
    return `${days}天后结束`;
  },

  // Season Pass
  PASS_LEVELS: 30,
  XP_PER_LEVEL: 1000,

  PASS_REWARDS: {
    // Free track
    free: {
      1: { gold: 500 },
      3: { gems: 5 },
      5: { gold: 1000, shardType: 'random_4star', shardCount: 3 },
      7: { gems: 10 },
      10: { gold: 2000, shardType: 'random_5star', shardCount: 2 },
      13: { gems: 15 },
      15: { gold: 3000 },
      18: { gems: 20 },
      20: { gold: 5000, shardType: 'seasonal_hero', shardCount: 5 },
      23: { gems: 25 },
      25: { gold: 5000, gems: 15 },
      28: { gems: 30 },
      30: { gold: 10000, gems: 50, title: '赛季之星' },
    },
    // Premium track (additional rewards)
    premium: {
      1: { gold: 1000 },
      2: { gems: 10 },
      4: { gold: 2000 },
      5: { shardType: 'random_5star', shardCount: 5 },
      8: { gems: 20 },
      10: { gold: 5000, shardType: 'seasonal_hero', shardCount: 10 },
      12: { gems: 25 },
      15: { gold: 5000, gems: 20 },
      18: { shardType: 'random_5star', shardCount: 8 },
      20: { gold: 10000, gems: 30, title: '赛季传奇' },
      23: { gems: 40 },
      25: { gold: 10000, shardType: 'seasonal_hero', shardCount: 15 },
      28: { gems: 50 },
      30: { gold: 20000, gems: 100, title: '赛季霸主', exclusiveTitle: '霸' },
    },
  },

  // Seasonal Stages (10 unique stages per season)
  generateSeasonalStages() {
    const season = this.getCurrentSeason();
    const stages = [];
    const themeEnemies = {
      shu: ['soldier', 'elite_spear', 'strategist', 'crossbow_corps', 'supply_guard'],
      wu: ['navy_soldier', 'fire_archer', 'fire_soldier', 'elite_cavalry', 'crossbow_corps'],
      wei: ['strategist', 'crossbow_corps', 'elite_spear', 'shield_militia', 'elite_cavalry'],
      qun: ['soldier', 'archer_recruit', 'mage_acolyte', 'elite_cavalry', 'fire_archer'],
    };
    const pool = themeEnemies[season.theme] || themeEnemies.qun;

    for (let i = 1; i <= 10; i++) {
      const enemyCount = 3 + Math.floor(i / 3);
      const enemies = [];
      for (let j = 0; j < enemyCount; j++) {
        enemies.push(pool[Math.floor(Math.random() * pool.length)]);
      }

      stages.push({
        id: i,
        name: `${season.emoji} ${season.name} · 第${i}关`,
        enemies,
        reward: {
          gold: 1000 + i * 500,
          exp: 500 + i * 300,
          passXP: 100 + i * 20,
          gems: i === 5 || i === 10 ? 10 : 0,
        },
        boss: i === 5 || i === 10,
        scaleMult: 1 + (i - 1) * 0.15,
      });
    }
    return stages;
  },

  // Seasonal Achievements
  SEASONAL_ACHIEVEMENTS: [
    { id: 'clear_5', name: '赛季初探', desc: '通关5个赛季关卡', target: 5, reward: { passXP: 500 } },
    { id: 'clear_10', name: '赛季征服', desc: '通关全部10个赛季关卡', target: 10, reward: { passXP: 1000, gems: 20 } },
    { id: 'daily_7', name: '坚持不懈', desc: '连续7天完成每日副本', target: 7, reward: { passXP: 800 } },
    { id: 'arena_10', name: '竞技达人', desc: '完成10场竞技场战斗', target: 10, reward: { passXP: 600 } },
    { id: 'dungeon_20', name: '无尽探索', desc: '无尽副本到达第20层', target: 20, reward: { passXP: 1000, gems: 15 } },
    { id: 'collect_hero', name: '广纳贤才', desc: '本赛季招募3名武将', target: 3, reward: { passXP: 500 } },
    { id: 'raid_boss', name: '讨伐Boss', desc: '击败周常Boss', target: 1, reward: { passXP: 800, gems: 10 } },
  ],

  // Add pass XP
  addPassXP(amount) {
    const state = Storage.getSeasonalState();
    state.passXP = (state.passXP || 0) + amount;
    while (state.passXP >= this.XP_PER_LEVEL && state.passLevel < this.PASS_LEVELS) {
      state.passXP -= this.XP_PER_LEVEL;
      state.passLevel++;
    }
    Storage.saveSeasonalState(state);
    return state;
  },

  // Claim pass reward
  claimPassReward(level, track) {
    const state = Storage.getSeasonalState();
    if (state.passLevel < level) return null;
    if (track === 'premium' && !state.premium) return null;

    const key = `${track}_${level}`;
    if (state.claimed[key]) return null;

    const rewards = this.PASS_REWARDS[track]?.[level];
    if (!rewards) return null;

    state.claimed[key] = true;
    if (rewards.gold) Storage.addGold(rewards.gold);
    if (rewards.gems) Storage.addGems(rewards.gems);
    Storage.saveSeasonalState(state);

    return rewards;
  },

  getPassProgress() {
    const state = Storage.getSeasonalState();
    return {
      level: state.passLevel || 0,
      xp: state.passXP || 0,
      xpNeeded: this.XP_PER_LEVEL,
      premium: state.premium || false,
      claimed: state.claimed || {},
    };
  },
};

if (typeof window !== 'undefined') window.Seasonal = Seasonal;

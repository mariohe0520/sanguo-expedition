// 三国·天命 — City Builder (城池经营)
// Premium kingdom management with 8 upgradeable buildings, passive income,
// combat bonuses, daily events, and prosperity system.

const City = {
  MAX_LEVEL: 10,
  INCOME_CAP_HOURS: 24,

  // ─── Building Definitions ───
  BUILDINGS: {
    palace:     { name: '主公府', desc: '城池中枢，解锁更多功能',         bonus: '+英雄槽位',           bonusDesc: lvl => `英雄上限 +${lvl}`,                     icon: lvl => City._evolveIcon(lvl, ['🏚️','🏠','🏡','🏘️','🏰']), unlock: 0, category: 'core' },
    barracks:   { name: '兵营',   desc: '训练精兵，提升全队攻击',         bonus: '全队ATK',              bonusDesc: lvl => `全队攻击 +${lvl * 2}%`,                icon: lvl => City._evolveIcon(lvl, ['⛺','🎪','🏕️','🛡️','⚔️']),  unlock: 1, category: 'military' },
    granary:    { name: '粮仓',   desc: '囤积粮草，持续产出金币',         bonus: '金币/时',              bonusDesc: lvl => `+${lvl * 50} 金/时`,                   icon: lvl => City._evolveIcon(lvl, ['🌾','🌾','🏪','🏬','🏦']),  unlock: 1, category: 'economy' },
    smithy:     { name: '铁匠铺', desc: '锻造兵器，提升装备属性',         bonus: '装备属性',             bonusDesc: lvl => `装备属性 +${lvl * 3}%`,                icon: lvl => City._evolveIcon(lvl, ['🔨','⚒️','🔧','⚙️','🗡️']),  unlock: 2, category: 'craft' },
    academy:    { name: '书院',   desc: '贤士讲学，持续产出经验',         bonus: '经验/时',              bonusDesc: lvl => `+${lvl * 30} 经验/时`,                 icon: lvl => City._evolveIcon(lvl, ['📖','📚','🏫','🎓','🏛️']),  unlock: 2, category: 'knowledge' },
    tavern:     { name: '酒馆',   desc: '广结豪杰，降低求贤消耗',         bonus: '求贤折扣',             bonusDesc: lvl => `求贤费用 -${lvl * 2}%`,                icon: lvl => City._evolveIcon(lvl, ['🍶','🍺','🏮','🎏','🎎']),  unlock: 3, category: 'social' },
    watchtower: { name: '望楼',   desc: '高瞻远瞩，洞察敌情',             bonus: '侦察精度',             bonusDesc: lvl => `侦察精度 +${lvl * 5}%`,                icon: lvl => City._evolveIcon(lvl, ['👁️','🔭','🗼','📡','🏯']),  unlock: 3, category: 'intel' },
    wall:       { name: '城墙',   desc: '铜墙铁壁，提升全队防御',         bonus: '全队DEF',              bonusDesc: lvl => `全队防御 +${lvl * 2}%`,                icon: lvl => City._evolveIcon(lvl, ['🪵','🧱','🪨','🏗️','🏯']),  unlock: 1, category: 'military' },
  },

  // ─── Icon Evolution ───
  _evolveIcon(level, icons) {
    if (level <= 0) return '🔒';
    const idx = Math.min(Math.floor((level - 1) / 2), icons.length - 1);
    return icons[idx];
  },

  // ─── State Management ───
  getDefaultState() {
    return {
      buildings: {
        palace: 1, barracks: 0, granary: 0, smithy: 0,
        academy: 0, tavern: 0, watchtower: 0, wall: 0,
      },
      lastCollect: Date.now(),
      dailyEventSeed: 0,
      dailyEventDate: '',
      dailyEventResolved: false,
    };
  },

  getState() {
    const saved = Storage.getCityState();
    if (!saved) {
      const fresh = this.getDefaultState();
      this.saveState(fresh);
      return fresh;
    }
    // Ensure all buildings exist (forward compat)
    for (const id of Object.keys(this.BUILDINGS)) {
      if (saved.buildings[id] === undefined) saved.buildings[id] = 0;
    }
    return saved;
  },

  saveState(s) {
    Storage.saveCityState(s);
  },

  // ─── City Level (= Palace Level) ───
  getCityLevel() {
    return this.getState().buildings.palace || 1;
  },

  // ─── Prosperity Score ───
  getProsperity(state) {
    state = state || this.getState();
    let score = 0;
    for (const [id, lvl] of Object.entries(state.buildings)) {
      if (lvl <= 0) continue;
      const rarity = this.BUILDINGS[id] ? (id === 'palace' ? 3 : 1) : 1;
      score += lvl * 10 * rarity;
    }
    return score;
  },

  // ─── Income Calculation ───
  calculateIncome(state) {
    state = state || this.getState();
    const granaryLvl = state.buildings.granary || 0;
    const academyLvl = state.buildings.academy || 0;
    return {
      goldPerHour: granaryLvl * 50,
      expPerHour: academyLvl * 30,
    };
  },

  getPendingIncome(state) {
    state = state || this.getState();
    const income = this.calculateIncome(state);
    const now = Date.now();
    const elapsed = Math.min((now - state.lastCollect) / 3600000, this.INCOME_CAP_HOURS);
    return {
      gold: Math.floor(income.goldPerHour * elapsed),
      exp: Math.floor(income.expPerHour * elapsed),
      hours: elapsed,
    };
  },

  collectIncome() {
    const state = this.getState();
    const pending = this.getPendingIncome(state);
    if (pending.gold > 0) Storage.addGold(pending.gold);
    if (pending.exp > 0)  Storage.addExp(pending.exp);
    state.lastCollect = Date.now();
    this.saveState(state);
    return pending;
  },

  // ─── Upgrade System ───
  upgradeCost(buildingId, currentLevel) {
    const base = 500;
    const lvl = currentLevel || 0;
    if (lvl >= this.MAX_LEVEL) return Infinity;
    // First build costs 300, upgrades scale
    if (lvl === 0) return 300;
    return lvl * base;
  },

  canUpgrade(buildingId) {
    const state = this.getState();
    const def = this.BUILDINGS[buildingId];
    if (!def) return { ok: false, reason: '未知建筑' };
    const currentLvl = state.buildings[buildingId] || 0;
    if (currentLvl >= this.MAX_LEVEL) return { ok: false, reason: '已达最高等级' };
    // Check palace gate (unlock requirement)
    const palaceLvl = state.buildings.palace || 1;
    if (buildingId !== 'palace' && currentLvl === 0 && palaceLvl < def.unlock) {
      return { ok: false, reason: `需要主公府 Lv.${def.unlock}` };
    }
    const cost = this.upgradeCost(buildingId, currentLvl);
    const player = Storage.getPlayer();
    if (player.gold < cost) return { ok: false, reason: `金币不足 (需要 ${City.formatNum(cost)})` };
    return { ok: true, cost };
  },

  upgrade(buildingId) {
    const check = this.canUpgrade(buildingId);
    if (!check.ok) return check;
    const state = this.getState();
    const player = Storage.getPlayer();
    player.gold -= check.cost;
    Storage.savePlayer(player);
    state.buildings[buildingId] = (state.buildings[buildingId] || 0) + 1;
    this.saveState(state);
    return { ok: true, newLevel: state.buildings[buildingId], cost: check.cost };
  },

  // ─── Combat Bonuses ───
  getCombatBonuses() {
    const state = this.getState();
    const b = state.buildings;
    return {
      atk_pct: (b.barracks || 0) * 2,
      def_pct: (b.wall || 0) * 2,
      equip_pct: (b.smithy || 0) * 3,
      scout_pct: (b.watchtower || 0) * 5,
    };
  },

  // ─── Daily Events ───
  EVENTS: [
    { id: 'harvest',  name: '丰收',     icon: '🌾', desc: '五谷丰登，金币收益翻倍8小时！',     color: '#22c55e', effect: '金币收入 ×2 (8h)',        type: 'positive' },
    { id: 'bandits',  name: '匪患',     icon: '🏴', desc: '山贼来袭！击退后恢复收益。',         color: '#ef4444', effect: '需击退匪贼',               type: 'negative' },
    { id: 'scholar',  name: '名士来访', icon: '📜', desc: '名士造访，全军获得经验加成！',       color: '#6366f1', effect: '+500 经验',                type: 'positive' },
    { id: 'merchant', name: '商队',     icon: '🐫', desc: '西域商队路过，带来珍稀货物。',       color: '#f59e0b', effect: '+300 金币',                type: 'positive' },
  ],

  getDailyEvent() {
    const state = this.getState();
    const today = new Date().toDateString();
    if (state.dailyEventDate !== today) {
      // Seed new event
      state.dailyEventSeed = Math.floor(Math.random() * this.EVENTS.length);
      state.dailyEventDate = today;
      state.dailyEventResolved = false;
      this.saveState(state);
    }
    if (state.dailyEventResolved) return null;
    return this.EVENTS[state.dailyEventSeed % this.EVENTS.length];
  },

  resolveDailyEvent() {
    const state = this.getState();
    const evt = this.getDailyEvent();
    if (!evt) return null;
    state.dailyEventResolved = true;
    this.saveState(state);
    // Apply reward
    if (evt.id === 'scholar')  Storage.addExp(500);
    if (evt.id === 'merchant') Storage.addGold(300);
    if (evt.id === 'harvest')  Storage.addGold(200); // Bonus gold as instant reward
    return evt;
  },

  // ─── Utility ───
  formatNum(n) {
    if (n === Infinity) return '∞';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatTime(hours) {
    if (hours < 1) return Math.floor(hours * 60) + '分钟';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return h + '小时' + (m > 0 ? m + '分钟' : '');
  },

  // ─── Building Order for Rendering ───
  getBuildingOrder() {
    return ['palace', 'barracks', 'wall', 'granary', 'smithy', 'academy', 'tavern', 'watchtower'];
  },

  // ─── Level Stars Display ───
  getLevelStars(level) {
    if (level <= 0) return '';
    const full = Math.min(level, 5);
    const half = level > 5 ? Math.min(level - 5, 5) : 0;
    let stars = '★'.repeat(full);
    if (half > 0) stars += '✦'.repeat(half);
    return stars;
  },

  // ─── Level Color Tier ───
  getLevelTier(level) {
    if (level <= 0) return 'locked';
    if (level <= 2) return 'common';
    if (level <= 4) return 'uncommon';
    if (level <= 6) return 'rare';
    if (level <= 8) return 'epic';
    return 'legendary';
  },
};

if (typeof window !== 'undefined') window.City = City;

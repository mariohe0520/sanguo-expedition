// 三国·天命 — Storage
const Storage = {
  _get(k, def) { try { return JSON.parse(localStorage.getItem('sg-' + k)) || def; } catch { return def; } },
  _set(k, v) { localStorage.setItem('sg-' + k, JSON.stringify(v)); },

  // Player
  getPlayer() { return this._get('player', { name: '主公', level: 1, exp: 0, gold: 500, gems: 10, troops: 50 }); },
  savePlayer(p) { this._set('player', p); },
  addGold(n) { const p = this.getPlayer(); p.gold += n; this.savePlayer(p); return p.gold; },
  addGems(n) { const p = this.getPlayer(); p.gems = (p.gems || 0) + n; this.savePlayer(p); return p.gems; },
  addExp(n) { const p = this.getPlayer(); p.exp += n; while (p.exp >= p.level * 100) { p.exp -= p.level * 100; p.level++; } this.savePlayer(p); return p; },

  // Roster (owned heroes)
  getRoster() { return this._get('roster', { soldier: { level: 1, stars: 1, shards: 0 }, archer_recruit: { level: 1, stars: 1, shards: 0 } }); },
  saveRoster(r) { this._set('roster', r); },
  addHero(heroId) { const r = this.getRoster(); if (!r[heroId]) r[heroId] = { level: 1, stars: HEROES[heroId]?.rarity || 1, shards: 0 }; this.saveRoster(r); },
  getHeroLevel(heroId) { return this.getRoster()[heroId]?.level || 1; },
  getHeroStars(heroId) { const r = this.getRoster(); return r[heroId]?.stars || HEROES[heroId]?.rarity || 1; },
  addShards(heroId, n) { const r = this.getRoster(); if (!r[heroId]) r[heroId] = { level: 1, stars: HEROES[heroId]?.rarity || 1, shards: 0 }; r[heroId].shards += n; this.saveRoster(r); },

  // Team (5 slots)
  getTeam() { return this._get('team', ['soldier', 'archer_recruit', null, null, null]); },
  saveTeam(t) { this._set('team', t); },

  // Campaign progress
  getCampaignProgress() { return this._get('campaign', { chapter: 1, stage: 1, choices: {} }); },
  saveCampaignProgress(p) { this._set('campaign', p); },

  // Idle
  getIdleState() { return this._get('idle', { lastCollect: Date.now() }); },
  saveIdleState(s) { this._set('idle', s); },

  // Gacha (sincerity system)
  getGachaState() { return this._get('gacha', { visits: {}, pity: 0 }); },
  saveGachaState(s) { this._set('gacha', s); },

  // === v2: Battle Statistics ===
  getBattleStats() { return this._get('battleStats', { wins: 0, losses: 0, bossWins: 0 }); },
  saveBattleStats(s) { this._set('battleStats', s); },
  recordWin() { const s = this.getBattleStats(); s.wins++; this.saveBattleStats(s); return s; },
  recordLoss() { const s = this.getBattleStats(); s.losses++; this.saveBattleStats(s); return s; },
  recordBossWin() { const s = this.getBattleStats(); s.bossWins++; this.saveBattleStats(s); return s; },

  // === v2: Hero Upgrades ===
  levelUpHero(heroId) {
    const r = this.getRoster();
    const data = r[heroId];
    if (!data) return { error: '未拥有该武将' };
    const cost = 100 * data.level;
    const p = this.getPlayer();
    if (p.gold < cost) return { error: '金币不足 (需要' + cost + ')' };
    p.gold -= cost;
    data.level++;
    this.savePlayer(p);
    this.saveRoster(r);
    return { success: true, newLevel: data.level, cost };
  },

  starUpHero(heroId) {
    const r = this.getRoster();
    const data = r[heroId];
    if (!data) return { error: '未拥有该武将' };
    const currentStars = data.stars || HEROES[heroId]?.rarity || 1;
    if (currentStars >= 5) return { error: '已达最高星级' };
    const shardCosts = { 1: 10, 2: 20, 3: 40, 4: 80 };
    const cost = shardCosts[currentStars];
    if (!cost) return { error: '无法继续升星' };
    if ((data.shards || 0) < cost) return { error: '碎片不足 (需要' + cost + '，拥有' + (data.shards || 0) + ')' };
    data.shards -= cost;
    data.stars = currentStars + 1;
    this.saveRoster(r);
    return { success: true, newStars: data.stars, cost };
  },

  getHeroEffectiveStats(heroId) {
    const r = this.getRoster();
    const data = r[heroId];
    const hero = HEROES[heroId];
    if (!data || !hero) return null;
    const level = data.level || 1;
    const stars = data.stars || hero.rarity;
    const mult = (1 + (level - 1) * 0.08) * (1 + (stars - 1) * 0.15);
    return {
      hp: Math.floor(hero.baseStats.hp * mult),
      atk: Math.floor(hero.baseStats.atk * mult),
      def: Math.floor(hero.baseStats.def * mult),
      spd: Math.floor(hero.baseStats.spd * mult),
      int: Math.floor(hero.baseStats.int * mult),
    };
  },

  // === v2: Daily Missions ===
  getDailyMissions() { return this._get('dailyMissions', null); },
  saveDailyMissions(m) { this._set('dailyMissions', m); },

  // === v3: Equipment Inventory ===
  getEquipmentInventory() { return this._get('equipInv', []); },
  saveEquipmentInventory(arr) { this._set('equipInv', arr); },
  addEquipment(item) { const inv = this.getEquipmentInventory(); inv.push(item); this.saveEquipmentInventory(inv); return item; },
  removeEquipment(uid) { this.saveEquipmentInventory(this.getEquipmentInventory().filter(e => e.uid !== uid)); },
  getEquipmentByUid(uid) { return this.getEquipmentInventory().find(e => e.uid === uid) || null; },

  // Equipped per hero: { weapon: uid, armor: uid, accessory: uid, mount: uid }
  getEquipped(heroId) { const all = this._get('equipped', {}); return all[heroId] || { weapon:null, armor:null, accessory:null, mount:null }; },
  saveEquipped(heroId, eq) { const all = this._get('equipped', {}); all[heroId] = eq; this._set('equipped', all); },

  // === v3: Kingdom Allegiance ===
  getKingdom() { return this._get('kingdom', null); },
  saveKingdom(k) { this._set('kingdom', k); },

  // === v3: Achievements ===
  getAchievementState() { return this._get('achievements', { unlocked: {} }); },
  saveAchievementState(s) { this._set('achievements', s); },
};

if (typeof window !== 'undefined') window.Storage = Storage;

// 三国·天命 — Storage
const Storage = {
  _get(k, def) { try { return JSON.parse(localStorage.getItem('sg-' + k)) || def; } catch { return def; } },
  _set(k, v) { localStorage.setItem('sg-' + k, JSON.stringify(v)); },

  // Player
  getPlayer() { return this._get('player', { name: '主公', level: 1, exp: 0, gold: 500, gems: 10, troops: 50 }); },
  savePlayer(p) { this._set('player', p); },
  addGold(n) { const p = this.getPlayer(); p.gold += n; this.savePlayer(p); return p.gold; },
  addExp(n) { const p = this.getPlayer(); p.exp += n; while (p.exp >= p.level * 100) { p.exp -= p.level * 100; p.level++; } this.savePlayer(p); return p; },

  // Roster (owned heroes)
  getRoster() { return this._get('roster', { soldier: { level: 1, stars: 1, shards: 0 }, archer_recruit: { level: 1, stars: 1, shards: 0 } }); },
  saveRoster(r) { this._set('roster', r); },
  addHero(heroId) { const r = this.getRoster(); if (!r[heroId]) r[heroId] = { level: 1, stars: 1, shards: 0 }; this.saveRoster(r); },
  getHeroLevel(heroId) { return this.getRoster()[heroId]?.level || 1; },
  addShards(heroId, n) { const r = this.getRoster(); if (!r[heroId]) r[heroId] = { level: 1, stars: 0, shards: 0 }; r[heroId].shards += n; this.saveRoster(r); },

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
};

if (typeof window !== 'undefined') window.Storage = Storage;

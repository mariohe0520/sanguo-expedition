// 三国·天命 — App Controller (v2)

// ===== LEADERBOARD ENGINE =====
const Leaderboard = {
  RIVAL_NAMES: ['烈焰军', '苍龙营', '虎豹骑', '飞鱼卫', '赤壁联军', '铁壁营', '青龙军', '白虎卫', '玄武营'],
  RIVAL_LEADERS: ['袁绍', '袁术', '公孙瓒', '陶谦', '刘表', '马腾', '韩遂', '张鲁', '孟获'],
  RIVAL_EMOJIS: ['🦁', '🐲', '🐯', '🐟', '🔥', '🏰', '🐉', '🐺', '🐘'],

  seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 13) % 2147483647; return (s - 1) / 2147483646; };
  },

  getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  },

  generateRivals() {
    const week = this.getWeekNumber();
    const rng = this.seededRandom(week * 7919);
    const heroIds = Object.keys(HEROES).filter(id => HEROES[id].rarity >= 2);

    return this.RIVAL_NAMES.map((name, i) => {
      const basePower = 1500 + i * 500;
      const power = Math.floor(basePower + rng() * 3000);
      const progress = Math.floor(rng() * 20) + 1;
      const totalBattles = Math.floor(rng() * 80) + 20;
      const wins = Math.floor(totalBattles * (0.35 + rng() * 0.55));
      const winRate = Math.floor(wins / totalBattles * 100);

      const army = [];
      const usedIds = new Set();
      for (let j = 0; j < 5; j++) {
        let hid, attempts = 0;
        do { hid = heroIds[Math.floor(rng() * heroIds.length)]; attempts++; } while (usedIds.has(hid) && attempts < 20);
        usedIds.add(hid);
        army.push(hid);
      }

      return { rank: 0, name, leader: this.RIVAL_LEADERS[i], emoji: this.RIVAL_EMOJIS[i], power, progress, winRate, army, isPlayer: false };
    });
  },

  getPlayerPower() {
    const roster = Storage.getRoster();
    let total = 0;
    for (const [id, data] of Object.entries(roster)) {
      const hero = HEROES[id];
      if (!hero) continue;
      const level = data.level || 1;
      const stars = data.stars || hero.rarity;
      const mult = (1 + (level - 1) * 0.08) * (1 + (stars - 1) * 0.15);
      const s = hero.baseStats;
      total += Math.floor((s.hp + s.atk + s.def + s.spd + s.int) * mult);
    }
    return total;
  },

  getPlayerProgress() {
    const p = Storage.getCampaignProgress();
    return (p.chapter - 1) * 10 + p.stage;
  },

  getPlayerWinRate() {
    const s = Storage.getBattleStats();
    const total = s.wins + s.losses;
    return total > 0 ? Math.floor(s.wins / total * 100) : 0;
  },

  getRankings() {
    const rivals = this.generateRivals();
    const player = Storage.getPlayer();
    const playerEntry = {
      rank: 0, name: player.name + '的军队', leader: player.name, emoji: '👑',
      power: this.getPlayerPower(), progress: this.getPlayerProgress(),
      winRate: this.getPlayerWinRate(), army: Storage.getTeam().filter(Boolean), isPlayer: true
    };
    const all = [...rivals, playerEntry];
    all.sort((a, b) => {
      const sa = a.power + a.progress * 200 + a.winRate * 20;
      const sb = b.power + b.progress * 200 + b.winRate * 20;
      return sb - sa;
    });
    all.forEach((e, i) => e.rank = i + 1);
    return all.slice(0, 10);
  },

  getResetCountdown() {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMon = day === 0 ? 1 : (day === 1 ? 7 : 8 - day);
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMon);
    next.setHours(0, 0, 0, 0);
    const diff = next - now;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return d + '天' + h + '小时后刷新';
  }
};

// ===== DAILY MISSION ENGINE =====
const DailyMissions = {
  MISSIONS: [
    { id: 'stages', name: '征战沙场', desc: '完成3个关卡', target: 3, reward: { gold: 200 }, rewardText: '💰200', icon: '⚔️' },
    { id: 'gacha', name: '礼贤下士', desc: '拜访求贤馆1次', target: 1, reward: { gold: 100 }, rewardText: '💰100', icon: '🏯' },
    { id: 'boss', name: '斩将夺旗', desc: '击败Boss 1次', target: 1, reward: { gems: 5 }, rewardText: '💎5', icon: '💀' }
  ],

  getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  getMissions() {
    const saved = Storage.getDailyMissions();
    const today = this.getTodayKey();
    if (!saved || saved.date !== today) {
      const fresh = { date: today, progress: { stages: 0, gacha: 0, boss: 0 }, claimed: { stages: false, gacha: false, boss: false } };
      Storage.saveDailyMissions(fresh);
      return fresh;
    }
    return saved;
  },

  trackProgress(type) {
    const data = this.getMissions();
    if (!data.claimed[type]) {
      data.progress[type] = (data.progress[type] || 0) + 1;
      Storage.saveDailyMissions(data);
    }
  },

  claimReward(missionId) {
    const data = this.getMissions();
    const def = this.MISSIONS.find(m => m.id === missionId);
    if (!def) return false;
    if (data.claimed[missionId]) return false;
    if ((data.progress[missionId] || 0) < def.target) return false;
    data.claimed[missionId] = true;
    if (def.reward.gold) Storage.addGold(def.reward.gold);
    if (def.reward.gems) Storage.addGems(def.reward.gems);
    Storage.saveDailyMissions(data);
    return true;
  },

  getMidnightCountdown() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(now.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h + '时' + m + '分后重置';
  }
};

// ===== FORMATION ADVISOR =====
const FormationAdvisor = {
  analyze() {
    const roster = Storage.getRoster();
    const heroIds = Object.keys(roster);
    if (heroIds.length === 0) return null;

    // Get current stage enemies for counter analysis
    const chapter = Campaign.getCurrentChapter();
    const progress = Storage.getCampaignProgress();
    const currentStage = chapter.stages.find(s => s.id === progress.stage);
    const enemyUnits = currentStage
      ? currentStage.enemies.map(e => typeof e === 'string' ? HEROES[e]?.unit : null).filter(Boolean)
      : [];
    const enemyUnitCounts = {};
    enemyUnits.forEach(u => { enemyUnitCounts[u] = (enemyUnitCounts[u] || 0) + 1; });

    // Score each hero
    const scored = heroIds.map(id => {
      const hero = HEROES[id];
      const data = roster[id];
      if (!hero) return null;

      let score = 0;
      const reasons = [];

      // Base power from stats
      const level = data.level || 1;
      const stars = data.stars || hero.rarity;
      const mult = (1 + (level - 1) * 0.08) * (1 + (stars - 1) * 0.15);
      const s = hero.baseStats;
      score += (s.hp * 0.5 + s.atk * 5 + s.def * 3 + s.spd * 2 + s.int * 4) * mult;
      score += hero.rarity * 200;

      // Counter bonus
      const unitInfo = UNIT_TYPES[hero.unit];
      if (unitInfo && enemyUnitCounts[unitInfo.strong]) {
        score += enemyUnitCounts[unitInfo.strong] * 500;
        reasons.push('克制' + (UNIT_TYPES[unitInfo.strong]?.name || ''));
      }

      // Skill value
      if (hero.skill) {
        if (hero.skill.type === 'heal') { score += 300; reasons.push('治疗支援'); }
        else if (hero.skill.type === 'cc') { score += 250; reasons.push('控制能力'); }
        else if (hero.skill.type === 'buff') { score += 200; reasons.push('全队增益'); }
      }

      const role = hero.unit === 'shield' ? '前排坦克' :
                   hero.unit === 'mage' ? '法术核心' :
                   hero.unit === 'cavalry' ? 'DPS核心' :
                   hero.unit === 'archer' ? '远程输出' : 'DPS核心';

      return { id, hero, data, score, reasons, role, faction: hero.faction, unit: hero.unit };
    }).filter(Boolean);

    scored.sort((a, b) => b.score - a.score);

    // Select best 5 with role diversity
    const selected = [];
    const unitCounts = {};
    const factionCounts = {};

    // Categorize by role
    const byRole = { shield: [], mage: [], dps: [] };
    scored.forEach(h => {
      if (h.unit === 'shield') byRole.shield.push(h);
      else if (h.unit === 'mage') byRole.mage.push(h);
      else byRole.dps.push(h);
    });

    // Guarantee 1 tank if available
    if (byRole.shield.length > 0) {
      const pick = byRole.shield[0];
      selected.push(pick);
      unitCounts[pick.unit] = 1;
      factionCounts[pick.faction] = (factionCounts[pick.faction] || 0) + 1;
    }
    // Guarantee 1 mage if available
    if (byRole.mage.length > 0) {
      const pick = byRole.mage[0];
      selected.push(pick);
      unitCounts[pick.unit] = 1;
      factionCounts[pick.faction] = (factionCounts[pick.faction] || 0) + 1;
    }

    // Fill remaining slots from top scorers
    for (const h of scored) {
      if (selected.length >= 5) break;
      if (selected.find(s => s.id === h.id)) continue;
      if ((unitCounts[h.unit] || 0) >= 2 && scored.length > 5) continue;
      selected.push(h);
      unitCounts[h.unit] = (unitCounts[h.unit] || 0) + 1;
      factionCounts[h.faction] = (factionCounts[h.faction] || 0) + 1;
    }

    // Fallback: add any remaining if still not full
    for (const h of scored) {
      if (selected.length >= 5) break;
      if (selected.find(s => s.id === h.id)) continue;
      selected.push(h);
      factionCounts[h.faction] = (factionCounts[h.faction] || 0) + 1;
    }

    // Add faction synergy and role reasons
    for (const h of selected) {
      if ((factionCounts[h.faction] || 0) >= 3) {
        h.reasons.push((FACTIONS[h.faction]?.name || '') + '国加成');
      }
      h.reasons.unshift(h.role);
    }

    return selected;
  }
};


// ===== MAIN APP =====
const App = {
  currentPage: 'home',
  currentStage: null,
  currentVisitHero: null,
  currentDetailHero: null,

  init() {
    this.updateHeader();
    this.renderHome();
    this.renderCampaign();
    this.renderRoster();
    this.renderTeam();
    this.renderGacha();
    this.checkIdleReward();
  },

  currentDungeonTab: 'endless',
  arenaOpponents: null,

  // ===== NAVIGATION =====
  switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    const navPages = ['home', 'campaign', 'dungeon', 'arena', 'roster', 'gacha'];
    document.querySelectorAll('.nav-item').forEach((n, i) => {
      n.classList.toggle('active', navPages[i] === page);
    });
    this.currentPage = page;
    if (page === 'home') this.renderHome();
    if (page === 'campaign') this.renderCampaign();
    if (page === 'roster') this.renderRoster();
    if (page === 'team') this.renderTeam();
    if (page === 'gacha') this.renderGacha();
    if (page === 'leaderboard') this.renderLeaderboard();
    if (page === 'equipment') this.renderEquipmentPage();
    if (page === 'achievements') this.renderAchievementsPage();
    if (page === 'dungeon') this.renderDungeon();
    if (page === 'arena') this.renderArena();
    if (page === 'profile') this.renderProfile();
  },

  updateHeader() {
    const p = Storage.getPlayer();
    document.getElementById('hdr-gold').textContent = p.gold;
    document.getElementById('hdr-gems').textContent = p.gems;
  },

  toast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), duration);
  },

  // ===== HOME =====
  renderHome() {
    const p = Storage.getPlayer();
    document.getElementById('player-name').textContent = p.name;
    document.getElementById('player-level').textContent = p.level;
    const expNeeded = p.level * 100;
    document.getElementById('player-exp-bar').style.width = (p.exp / expNeeded * 100) + '%';

    const progress = Storage.getCampaignProgress();
    const chapter = Campaign.getCurrentChapter();
    document.getElementById('chapter-progress').textContent = '第' + chapter.id + '章 ' + progress.stage + '/10';
    document.getElementById('chapter-bar').style.width = (progress.stage / 10 * 100) + '%';
    this.updateHeader();
    this.renderDailyMissions();
    this.renderKingdomCard();
    // Check achievements in background
    if (typeof Achievements !== 'undefined') {
      const newAch = Achievements.checkAll();
      if (newAch.length > 0) this.toast('🏅 新成就: ' + newAch.map(a => a.name).join(', '));
    }
  },

  checkIdleReward() {
    const mins = Idle.getTimeSinceCollect();
    if (mins >= 1) {
      const gold = Math.floor(mins * Idle.RATES.goldPerMin);
      document.getElementById('idle-gold').textContent = '+' + gold;
      document.getElementById('idle-time').textContent = mins + '分钟';
      document.getElementById('idle-card').classList.remove('hidden');
    } else {
      document.getElementById('idle-card').classList.add('hidden');
    }
  },

  collectIdle() {
    const result = Idle.collectRewards();
    if (!result) return;
    this.toast('🎉 领取 ' + result.gold + '金币 + ' + result.exp + '经验！' + (result.loot.length ? ' 获得装备!' : ''));
    document.getElementById('idle-card').classList.add('hidden');
    this.renderHome();
  },

  // ===== CAMPAIGN =====
  renderCampaign() {
    const chapter = Campaign.getCurrentChapter();
    const progress = Storage.getCampaignProgress();
    document.getElementById('campaign-title').textContent = chapter.icon + ' ' + chapter.name;

    const terrainEmojis = { plains: '🌾 平原', mountain: '⛰️ 山地', water: '🌊 水域', castle: '🏰 城池' };
    const weatherEmojis = { clear: '☀️ 晴天', rain: '🌧️ 雨天', fog: '🌫️ 雾天', fire: '🔥 火烧' };
    document.getElementById('campaign-terrain').textContent = terrainEmojis[chapter.terrain] || '🌾 平原';
    document.getElementById('campaign-weather').textContent = weatherEmojis[chapter.weather] || '☀️ 晴天';

    const list = document.getElementById('stage-list');
    list.innerHTML = '';

    for (const stage of chapter.stages) {
      if (stage.branch) {
        const choice = progress.choices[chapter.id];
        if (choice && choice !== stage.branch) continue;
        if (!choice && stage.branch === 'B') continue;
      }
      const isCurrent = stage.id === progress.stage;
      const isLocked = stage.id > progress.stage;
      const isCompleted = stage.id < progress.stage;

      const div = document.createElement('div');
      div.className = 'stage-item ' + (stage.boss ? 'boss ' : '') + (isCurrent ? 'current ' : '') + (isLocked ? 'locked' : '');
      div.innerHTML = '<div class="stage-num ' + (stage.boss ? 'stage-boss' : '') + '">' + (stage.boss ? '💀' : stage.id) + '</div>' +
        '<div class="stage-info"><div class="stage-name">' + stage.name + (isCompleted ? ' ✅' : '') + '</div>' +
        '<div class="stage-reward">💰' + stage.reward.gold + ' · ⭐' + stage.reward.exp + (stage.reward.hero_shard ? ' · 🧩碎片' : '') + '</div></div>' +
        (stage.elite ? '<span class="text-gold">精英</span>' : '');
      if (!isLocked) div.onclick = () => this.enterStage(stage);
      list.appendChild(div);
    }
  },

  enterStage(stage) {
    const chapter = Campaign.getCurrentChapter();
    const progress = Storage.getCampaignProgress();
    for (const [chId, dc] of Object.entries(Campaign.DESTINY_CHOICES)) {
      if (parseInt(chId) === chapter.id && stage.id === dc.trigger_after + 1 && !progress.choices[chapter.id]) {
        this.showDestinyChoice(dc, chapter.id);
        return;
      }
    }
    this.currentStage = stage;
    this.prepareBattle(stage);
    this.switchPage('battle');
  },

  showDestinyChoice(dc, chapterId) {
    const modal = document.getElementById('destiny-modal');
    document.getElementById('destiny-title').textContent = dc.title;
    document.getElementById('destiny-desc').textContent = dc.desc;
    document.getElementById('destiny-lore').textContent = dc.lore;

    const opts = document.getElementById('destiny-options');
    opts.innerHTML = '';
    for (const opt of dc.options) {
      const div = document.createElement('div');
      div.className = 'destiny-option';
      div.innerHTML = '<div class="destiny-option-text">' + opt.text + '</div><div class="destiny-option-desc">' + opt.desc + '</div>';
      div.onclick = () => {
        Campaign.makeDestinyChoice(chapterId, opt.id);
        modal.classList.add('hidden');
        if (opt.reward.gold) Storage.addGold(opt.reward.gold);
        this.toast('天命已定：' + opt.text);
        this.renderCampaign();
      };
      opts.appendChild(div);
    }
    modal.classList.remove('hidden');
  },

  // ===== BATTLE =====
  prepareBattle(stage) {
    const team = Storage.getTeam().filter(id => id);
    if (team.length === 0) {
      this.toast('请先编队！');
      this.switchPage('team');
      return;
    }
    document.getElementById('battle-title').textContent = stage.name;
    document.getElementById('battle-turn').textContent = '回合 0';
    document.getElementById('battle-log').innerHTML = '<div class="text-dim text-center">准备战斗...</div>';
    document.getElementById('btn-battle-start').classList.remove('hidden');

    const chapter = Campaign.getCurrentChapter();
    Battle.init(team, stage.enemies, chapter.terrain, chapter.weather);
    this.renderBattleField();
  },

  renderBattleField() {
    const state = Battle.state;
    if (!state) return;

    const renderTeam = (fighters, containerId) => {
      const c = document.getElementById(containerId);
      c.innerHTML = '';
      for (const f of fighters) {
        if (!f) continue;
        const div = document.createElement('div');
        div.className = 'fighter-row ' + (f.alive ? '' : 'dead');
        const hpPct = f.alive ? (f.hp / f.maxHp * 100) : 0;
        const ragePct = f.rage / (f.maxRage || 100) * 100;
        div.innerHTML = '<span class="fighter-emoji">' + f.emoji + '</span>' +
          '<div class="fighter-bars"><div class="fighter-name">' + f.name + '</div>' +
          '<div class="bar"><div class="bar-fill hp-fill" style="width:' + hpPct + '%"></div></div>' +
          '<div class="bar"><div class="bar-fill rage-fill" style="width:' + ragePct + '%"></div></div></div>';
        c.appendChild(div);
      }
    };

    renderTeam(state.player, 'team-player');
    renderTeam(state.enemy, 'team-enemy');
    document.getElementById('battle-turn').textContent = '回合 ' + state.turn;
  },

  async startBattle() {
    document.getElementById('btn-battle-start').classList.add('hidden');

    Battle.onUpdate = (state) => {
      this.renderBattleField();
      const logEl = document.getElementById('battle-log');
      const recentLogs = Battle.log.slice(-15);
      logEl.innerHTML = recentLogs.map(l => '<div class="log-entry">' + l.msg + '</div>').join('');
      logEl.scrollTop = logEl.scrollHeight;
    };

    const result = await Battle.run(1.5);
    const modal = document.getElementById('result-modal');
    const stage = this.currentStage;

    if (result === 'victory') {
      document.getElementById('result-icon').textContent = '🎉';
      document.getElementById('result-title').textContent = '胜利！';
      Storage.addGold(stage.reward.gold);
      Storage.addExp(stage.reward.exp);
      if (stage.reward.hero_shard) Storage.addShards(stage.reward.hero_shard, 3);
      Campaign.completeStage(stage.id);

      let resultText = '+' + stage.reward.gold + '💰 +' + stage.reward.exp + '⭐' + (stage.reward.hero_shard ? ' +3🧩' : '');

      // v3: Equipment drop
      if (typeof Equipment !== 'undefined') {
        const chapter = Campaign.getCurrentChapter();
        const drop = Equipment.generateDrop(chapter.id, !!stage.boss);
        if (drop) {
          Storage.addEquipment(drop);
          const tmpl = Equipment.TEMPLATES[drop.templateId];
          const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1];
          resultText += '\n🎒 获得装备: ' + (tmpl?.emoji || '') + ' ' + (tmpl?.name || '???') + ' (' + rarInfo.label + ')';
        }
      }

      document.getElementById('result-detail').innerHTML = resultText.replace(/\n/g, '<br>');

      // v2: Track stats & missions
      Storage.recordWin();
      DailyMissions.trackProgress('stages');
      if (stage.boss) {
        Storage.recordBossWin();
        DailyMissions.trackProgress('boss');
      }

      // v3: Check achievements
      if (typeof Achievements !== 'undefined') {
        const newAch = Achievements.checkAll();
        if (newAch.length > 0) setTimeout(() => this.toast('🏅 新成就: ' + newAch.map(a => a.name).join(', '), 3000), 1500);
      }
    } else {
      document.getElementById('result-icon').textContent = '💀';
      document.getElementById('result-title').textContent = '败北...';
      document.getElementById('result-detail').innerHTML = '升级武将或调整阵容再战！';
      Storage.recordLoss();
    }
    modal.classList.remove('hidden');
    this.updateHeader();
  },

  closeResult() {
    document.getElementById('result-modal').classList.add('hidden');
    this.switchPage('campaign');
    this.renderCampaign();
  },

  // ===== ROSTER =====
  renderRoster() {
    const roster = Storage.getRoster();
    const list = document.getElementById('roster-list');
    list.innerHTML = '';

    for (const [id, data] of Object.entries(roster)) {
      const hero = HEROES[id];
      if (!hero) continue;
      const stars = data.stars || hero.rarity;
      const div = document.createElement('div');
      div.className = 'hero-card rarity-' + hero.rarity;
      div.innerHTML = '<div class="hero-emoji">' + hero.emoji + '</div>' +
        '<div class="hero-info">' +
          '<div class="hero-name">' + hero.name + (hero.title ? ' · ' + hero.title : '') + '</div>' +
          '<div class="hero-sub">Lv.' + data.level + ' · ' + (UNIT_TYPES[hero.unit]?.emoji || '') + ' ' + (UNIT_TYPES[hero.unit]?.name || '') + ' · ' + (FACTIONS[hero.faction]?.emoji || '') + ' ' + (FACTIONS[hero.faction]?.name || '') + '</div>' +
          '<div class="hero-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</div>' +
        '</div>' +
        '<div class="text-dim" style="font-size:18px">›</div>';
      div.onclick = () => this.showHeroDetail(id);
      list.appendChild(div);
    }

    if (Object.keys(roster).length === 0) {
      list.innerHTML = '<div class="text-center text-dim" style="padding:40px">还没有武将，去求贤馆招募吧！</div>';
    }
  },

  // ===== HERO DETAIL (v2) =====
  showHeroDetail(heroId) {
    this.currentDetailHero = heroId;
    this.renderHeroDetail(heroId);
    // Show page without changing nav highlight
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-hero-detail').classList.add('active');
  },

  renderHeroDetail(heroId) {
    const hero = HEROES[heroId];
    const roster = Storage.getRoster();
    const data = roster[heroId];
    if (!hero || !data) return;

    const level = data.level || 1;
    const stars = data.stars || hero.rarity;
    const stats = Storage.getHeroEffectiveStats(heroId);
    const shardCosts = { 1: 10, 2: 20, 3: 40, 4: 80 };
    const starUpCost = stars < 5 ? shardCosts[stars] : 0;
    const levelUpCost = 100 * level;

    document.getElementById('hd-title').textContent = hero.name;

    const content = document.getElementById('hero-detail-content');
    content.innerHTML =
      '<div class="hd-hero-display">' +
        '<div class="hd-emoji rarity-' + hero.rarity + '-bg">' + hero.emoji + '</div>' +
        '<div class="hd-name">' + hero.name + '</div>' +
        '<div class="hd-title-text">' + (hero.title || '') + '</div>' +
        '<div class="hd-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</div>' +
        '<div class="hd-meta">' + (UNIT_TYPES[hero.unit]?.emoji || '') + ' ' + (UNIT_TYPES[hero.unit]?.name || '') +
          ' · ' + (FACTIONS[hero.faction]?.emoji || '') + ' ' + (FACTIONS[hero.faction]?.name || '') + ' · Lv.' + level + '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:12px">📊 战斗属性</div>' +
        '<div class="stat-grid">' +
          '<div class="stat-row"><span class="stat-label">❤️ 生命</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-hp" style="width:' + Math.min(100, stats.hp / 20) + '%"></div></div><span class="stat-val">' + stats.hp + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">⚔️ 攻击</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-atk" style="width:' + Math.min(100, stats.atk / 2) + '%"></div></div><span class="stat-val">' + stats.atk + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">🛡️ 防御</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-def" style="width:' + Math.min(100, stats.def / 1.5) + '%"></div></div><span class="stat-val">' + stats.def + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">💨 速度</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-spd" style="width:' + Math.min(100, stats.spd) + '%"></div></div><span class="stat-val">' + stats.spd + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">🧠 智力</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-int" style="width:' + Math.min(100, stats.int / 1.6) + '%"></div></div><span class="stat-val">' + stats.int + '</span></div>' +
        '</div>' +
      '</div>' +

      (hero.skill ? '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px">⚡ 技能: ' + hero.skill.name + '</div>' +
        '<div class="text-dim" style="font-size:13px">' + hero.skill.desc + '</div>' +
        '<div style="font-size:11px;color:var(--gold);margin-top:6px">怒气消耗: ' + hero.skill.rage + '</div>' +
      '</div>' : '') +

      (hero.passive ? '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px">🔮 被动: ' + hero.passive.name + '</div>' +
        '<div class="text-dim" style="font-size:13px">' + hero.passive.desc + '</div>' +
      '</div>' : '') +

      '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px">📖 背景故事</div>' +
        '<div class="text-dim" style="font-size:13px;font-style:italic">"' + hero.lore + '"</div>' +
      '</div>' +

      '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:12px">⬆️ 强化武将</div>' +
        '<div class="upgrade-grid">' +
          '<button class="btn btn-primary upgrade-btn" onclick="App.doLevelUp(\'' + heroId + '\')">' +
            '<div class="upgrade-label">升级</div>' +
            '<div class="upgrade-detail">Lv.' + level + ' → Lv.' + (level + 1) + '</div>' +
            '<div class="upgrade-cost">💰 ' + levelUpCost + '</div>' +
          '</button>' +
          '<button class="btn btn-gold upgrade-btn" onclick="App.doStarUp(\'' + heroId + '\')"' + (stars >= 5 ? ' disabled' : '') + '>' +
            '<div class="upgrade-label">' + (stars >= 5 ? '已满星' : '升星') + '</div>' +
            '<div class="upgrade-detail">' + (stars >= 5 ? '★★★★★' : '★' + stars + ' → ★' + (stars + 1)) + '</div>' +
            '<div class="upgrade-cost">🧩 ' + (stars >= 5 ? '—' : starUpCost) + ' (拥有' + (data.shards || 0) + ')</div>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // v3: Equipment slots
      this._renderHeroEquipSection(heroId);
  },

  doLevelUp(heroId) {
    const result = Storage.levelUpHero(heroId);
    if (result.error) { this.toast('❌ ' + result.error); return; }
    this.toast('⬆️ 升级成功！Lv.' + (result.newLevel - 1) + ' → Lv.' + result.newLevel);
    this.renderHeroDetail(heroId);
    this.updateHeader();
  },

  doStarUp(heroId) {
    const result = Storage.starUpHero(heroId);
    if (result.error) { this.toast('❌ ' + result.error); return; }
    this.toast('⭐ 升星成功！★' + (result.newStars - 1) + ' → ★' + result.newStars);
    this.renderHeroDetail(heroId);
    this.updateHeader();
  },

  // ===== TEAM =====
  renderTeam() {
    const team = Storage.getTeam();
    const roster = Storage.getRoster();

    const slotsEl = document.getElementById('team-slots');
    slotsEl.innerHTML = '';

    const labels = ['前排①', '前排②', '后排①', '后排②', '后排③'];
    team.forEach((heroId, i) => {
      const hero = heroId ? HEROES[heroId] : null;
      const div = document.createElement('div');
      div.className = 'hero-card' + (hero ? ' rarity-' + hero.rarity : '');
      if (hero) {
        div.innerHTML = '<div class="hero-emoji">' + hero.emoji + '</div>' +
          '<div class="hero-info"><div class="hero-name">' + labels[i] + ': ' + hero.name + '</div>' +
          '<div class="hero-sub">' + (UNIT_TYPES[hero.unit]?.name || '') + ' · ' + (FACTIONS[hero.faction]?.name || '') + '</div></div>';
        div.onclick = () => { team[i] = null; Storage.saveTeam(team); this.renderTeam(); };
      } else {
        div.innerHTML = '<div class="hero-emoji" style="opacity:.3">➕</div><div class="hero-info"><div class="hero-name text-dim">' + labels[i] + ': 空位</div></div>';
      }
      slotsEl.appendChild(div);
    });

    // Available heroes
    const avail = document.getElementById('team-available');
    avail.innerHTML = '';
    for (const [id] of Object.entries(roster)) {
      if (team.includes(id)) continue;
      const hero = HEROES[id];
      if (!hero) continue;
      const div = document.createElement('div');
      div.className = 'hero-card rarity-' + hero.rarity;
      div.innerHTML = '<div class="hero-emoji">' + hero.emoji + '</div>' +
        '<div class="hero-info"><div class="hero-name">' + hero.name + '</div>' +
        '<div class="hero-sub">' + (UNIT_TYPES[hero.unit]?.name || '') + '</div></div>';
      div.onclick = () => {
        const emptySlot = team.indexOf(null);
        if (emptySlot === -1) { this.toast('队伍已满！'); return; }
        team[emptySlot] = id;
        Storage.saveTeam(team);
        this.renderTeam();
      };
      avail.appendChild(div);
    }
  },

  // ===== AUTO FORMATION (v2) =====
  autoFormation() {
    const result = FormationAdvisor.analyze();
    if (!result || result.length === 0) {
      this.toast('没有可用武将！');
      return;
    }

    const newTeam = result.map(h => h.id);
    while (newTeam.length < 5) newTeam.push(null);
    Storage.saveTeam(newTeam);

    // Show advice panel
    const adviceEl = document.getElementById('formation-advice');
    adviceEl.classList.remove('hidden');
    adviceEl.innerHTML = '<div class="card card-glow" style="border-color:var(--shu)">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:12px">🤖 编队分析</div>' +
      result.map(h =>
        '<div class="fa-entry">' +
          '<span class="fa-emoji">' + h.hero.emoji + '</span>' +
          '<span class="fa-name">' + h.hero.name + '</span>' +
          '<span class="fa-reasons">' + h.reasons.join(', ') + '</span>' +
        '</div>'
      ).join('') +
    '</div>';

    this.renderTeam();
    this.toast('🤖 智能编队完成！');
  },

  // ===== GACHA =====
  renderGacha() {
    const list = document.getElementById('gacha-list');
    list.innerHTML = '';

    for (const [id, visit] of Object.entries(Gacha.VISITS)) {
      const hero = HEROES[id];
      if (!hero) continue;
      const owned = Storage.getRoster()[id];
      const status = Gacha.getVisitStatus(id);

      const div = document.createElement('div');
      div.className = 'hero-card rarity-' + hero.rarity;
      div.innerHTML = '<div class="hero-emoji">' + hero.emoji + '</div>' +
        '<div class="hero-info">' +
          '<div class="hero-name">' + hero.name + ' · ' + hero.title + (owned ? ' ✅' : '') + '</div>' +
          '<div class="hero-sub">' + visit.hint + '</div>' +
          '<div style="margin-top:4px;font-size:11px">💰' + visit.cost + ' · 拜访' + visit.dialogues + '次 · ' + '★'.repeat(hero.rarity) +
          (status.attempts > 0 ? ' · 已访' + status.attempts + '次' : '') + '</div>' +
        '</div>';
      if (!owned) div.onclick = () => this.startVisit(id);
      list.appendChild(div);
    }
  },

  startVisit(heroId) {
    const result = Gacha.startVisit(heroId);
    if (!result) return;
    if (result.error) { this.toast(result.error); return; }

    // v2: Track gacha mission
    DailyMissions.trackProgress('gacha');

    this.currentVisitHero = heroId;
    document.getElementById('visit-hero-name').textContent = '拜访 ' + result.hero.name;
    document.getElementById('visit-hero-display').innerHTML =
      '<div class="big-emoji">' + result.hero.emoji + '</div>' +
      '<div class="hero-title">' + result.hero.name + ' · ' + result.hero.title + '</div>' +
      '<div class="text-dim mt-8" style="font-size:13px">' + result.hero.lore + '</div>';

    this.updateVisitUI();
    this.switchPage('visit');
    this.updateHeader();
  },

  updateVisitUI() {
    const heroId = this.currentVisitHero;
    const status = Gacha.getVisitStatus(heroId);
    const dialogues = Gacha.DIALOGUES[heroId] || [];
    const visit = Gacha.VISITS[heroId];

    const maxSincerity = visit.rarity === 5 ? 90 : visit.rarity === 4 ? 60 : 40;
    document.getElementById('visit-sincerity').textContent = status.sincerity;
    document.getElementById('visit-sincerity-bar').style.width = Math.min(100, status.sincerity / maxSincerity * 100) + '%';

    const d = dialogues[status.dialogueIdx];
    const box = document.getElementById('visit-dialogue');
    if (d) {
      box.innerHTML = '<div class="dialogue-text">' + d.text + '</div>' +
        '<div class="dialogue-options">' +
        d.options.map((o, i) => '<div class="dialogue-option" onclick="App.makeGachaChoice(' + i + ')">' + o.text + '</div>').join('') +
        '</div>';
    } else {
      box.innerHTML = '<div class="text-center" style="padding:20px">' +
        '<div class="text-dim">本次拜访结束</div>' +
        '<div class="mt-8">诚意度: ' + status.sincerity + '</div>' +
        '<button class="btn btn-gold btn-block mt-16" onclick="App.startVisit(\'' + heroId + '\')">再次拜访 (💰' + visit.cost + ')</button>' +
        '<button class="btn btn-sm btn-block mt-8" onclick="App.switchPage(\'gacha\')" style="background:var(--card2);color:var(--text)">返回求贤馆</button>' +
        '</div>';
    }
  },

  makeGachaChoice(idx) {
    const result = Gacha.makeChoice(this.currentVisitHero, idx);
    if (!result) return;

    if (result.recruited) {
      const hero = HEROES[this.currentVisitHero];
      this.toast('🎉 ' + hero.name + ' 加入了你的队伍！', 4000);
      setTimeout(() => this.switchPage('roster'), 2000);
    } else {
      const box = document.getElementById('visit-dialogue');
      box.innerHTML = '<div class="dialogue-text">' + result.response + '</div>' +
        '<div class="text-dim text-center mt-8" style="font-size:12px">诚意度 ' + (result.sincerity >= 0 ? '+' : '') + result.choice.sincerity + '</div>' +
        '<button class="btn btn-primary btn-block mt-16" onclick="App.updateVisitUI()">继续</button>';
      this.updateVisitUI();
    }
    this.updateHeader();
  },

  // ===== LEADERBOARD (v2 + kingdom war) =====
  renderLeaderboard() {
    const rankings = Leaderboard.getRankings();
    document.getElementById('lb-reset').textContent = Leaderboard.getResetCountdown();

    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    // Kingdom war summary
    if (typeof KingdomSystem !== 'undefined') {
      const kWar = KingdomSystem.getKingdomWar();
      const playerK = Storage.getKingdom();
      let kwHTML = '<div class="card card-glow" style="margin-bottom:12px"><div style="font-size:14px;font-weight:600;margin-bottom:10px">🏰 势力战争 · 本周</div>';
      kWar.forEach(k => {
        const isPlayer = k.id === playerK;
        kwHTML += '<div class="kw-row' + (isPlayer ? ' kw-mine' : '') + '">' +
          '<span class="kw-rank">' + (k.rank <= 3 ? ['🥇','🥈','🥉'][k.rank-1] : k.rank) + '</span>' +
          '<span class="kw-emoji" style="color:' + k.color + '">' + k.banner + '</span>' +
          '<span class="kw-name">' + k.name + (isPlayer ? ' <span class="lb-you">你</span>' : '') + '</span>' +
          '<span class="kw-power">⚡' + k.power + '</span></div>';
      });
      kwHTML += '</div>';
      list.innerHTML += kwHTML;
    }

    rankings.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'lb-entry' + (entry.isPlayer ? ' lb-player' : '');

      const rankDisplay = entry.rank <= 3
        ? ['🥇', '🥈', '🥉'][entry.rank - 1]
        : '<span class="lb-rank-num">' + entry.rank + '</span>';

      const armyEmojis = entry.army.map(id => HEROES[id]?.emoji || '❓').join(' ');

      div.innerHTML =
        '<div class="lb-rank">' + rankDisplay + '</div>' +
        '<div class="lb-info">' +
          '<div class="lb-name">' + entry.emoji + ' ' + entry.name + (entry.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div>' +
          '<div class="lb-meta">统帅: ' + entry.leader + '</div>' +
          '<div class="lb-army">' + armyEmojis + '</div>' +
        '</div>' +
        '<div class="lb-stats">' +
          '<div class="lb-power">⚡' + entry.power + '</div>' +
          '<div class="lb-winrate">胜率 ' + entry.winRate + '%</div>' +
          '<div class="lb-progress">🗺️ 进度 ' + entry.progress + '</div>' +
        '</div>';

      list.appendChild(div);
    });
  },

  // ===== DAILY MISSIONS (v2) =====
  renderDailyMissions() {
    const data = DailyMissions.getMissions();
    const list = document.getElementById('daily-missions-list');
    if (!list) return;

    const resetEl = document.getElementById('daily-reset-time');
    if (resetEl) resetEl.textContent = DailyMissions.getMidnightCountdown();

    list.innerHTML = DailyMissions.MISSIONS.map(def => {
      const progress = data.progress[def.id] || 0;
      const claimed = data.claimed[def.id];
      const complete = progress >= def.target;
      const pct = Math.min(100, progress / def.target * 100);

      return '<div class="daily-mission ' + (claimed ? 'dm-claimed' : complete ? 'dm-complete' : '') + '">' +
        '<div class="dm-icon">' + def.icon + '</div>' +
        '<div class="dm-info">' +
          '<div class="dm-name">' + def.name + '</div>' +
          '<div class="dm-desc">' + def.desc + ' (' + Math.min(progress, def.target) + '/' + def.target + ')</div>' +
          '<div class="dm-bar"><div class="dm-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<div class="dm-reward">' +
          (claimed ? '<span class="dm-done">✅</span>' :
           complete ? '<button class="btn btn-sm btn-gold" onclick="App.claimMission(\'' + def.id + '\')">' + def.rewardText + '</button>' :
           '<span class="text-dim" style="font-size:12px">' + def.rewardText + '</span>') +
        '</div>' +
      '</div>';
    }).join('');
  },

  claimMission(missionId) {
    const success = DailyMissions.claimReward(missionId);
    if (success) {
      const def = DailyMissions.MISSIONS.find(m => m.id === missionId);
      this.toast('🎁 领取奖励: ' + def.rewardText);
      this.renderDailyMissions();
      this.updateHeader();
    }
  },

  // ===== KINGDOM CARD (stub) =====
  renderKingdomCard() {
    // Kingdom card is shown on the home page — no-op if no kingdom selected yet
  },

  // ===== DUNGEON =====
  renderDungeon() {
    const p = Storage.getPlayer();
    document.getElementById('dg-gold').textContent = p.gold;
    document.getElementById('dg-gems').textContent = p.gems;
    this.switchDungeonTab(this.currentDungeonTab);
  },

  switchDungeonTab(tab) {
    this.currentDungeonTab = tab;
    document.querySelectorAll('#dungeon-tabs .tab-item').forEach((t, i) => {
      t.classList.toggle('active', ['endless', 'daily', 'raid', 'seasonal'][i] === tab);
    });
    const content = document.getElementById('dungeon-content');
    if (tab === 'endless') content.innerHTML = this._renderEndlessDungeon();
    else if (tab === 'daily') content.innerHTML = this._renderDailyDungeon();
    else if (tab === 'raid') content.innerHTML = this._renderWeeklyRaid();
    else if (tab === 'seasonal') content.innerHTML = this._renderSeasonalContent();
  },

  _renderEndlessDungeon() {
    const unlocked = Dungeon.isUnlocked();
    const state = Dungeon.getState();

    if (!unlocked) {
      return '<div class="card" style="text-align:center;padding:40px">' +
        '<div style="font-size:48px;margin-bottom:16px">🔒</div>' +
        '<div style="font-size:16px;font-weight:600">无尽副本</div>' +
        '<div class="text-dim" style="margin-top:8px">通关第六章后解锁</div>' +
      '</div>';
    }

    const floor = state.active ? state.currentFloor : 1;
    const floorData = Dungeon.generateFloor(floor);
    let html = '';

    // Stats
    html += '<div class="card">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">' +
        '<div><div style="font-size:20px;font-weight:700;color:var(--gold)">' + state.highestFloor + '</div><div class="text-dim" style="font-size:11px">最高层数</div></div>' +
        '<div><div style="font-size:20px;font-weight:700">' + (state.active ? state.currentFloor : '-') + '</div><div class="text-dim" style="font-size:11px">当前层数</div></div>' +
        '<div><div style="font-size:20px;font-weight:700">' + state.totalRuns + '</div><div class="text-dim" style="font-size:11px">总挑战</div></div>' +
      '</div>' +
    '</div>';

    if (state.active) {
      // Show current floor
      html += '<div class="card' + (floorData.isBossFloor ? ' card-glow" style="border-color:var(--gold)' : '') + '">' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:8px">' +
          (floorData.isBossFloor ? '💀 ' : '⚔️ ') + floorData.name +
        '</div>' +
        '<div class="text-dim" style="font-size:12px;margin-bottom:8px">' +
          '地形: ' + floorData.terrain + ' · 天气: ' + floorData.weather + ' · 难度x' + floorData.scaleMult.toFixed(2) +
        '</div>';

      if (floorData.isEventFloor && floorData.event) {
        html += '<div style="background:var(--card2);padding:12px;border-radius:10px;margin-bottom:12px">' +
          '<div style="font-size:14px;font-weight:600">' + floorData.event.emoji + ' ' + floorData.event.name + '</div>' +
          '<div class="text-dim" style="font-size:12px">' + floorData.event.desc + '</div>' +
          '<button class="btn btn-sm btn-primary mt-8" onclick="App.processDungeonEvent(' + floor + ')">处理事件</button>' +
        '</div>';
      }

      html += '<div style="font-size:13px;margin-bottom:8px">敌人: ' +
        floorData.enemies.map(e => HEROES[e]?.emoji || '❓').join(' ') + '</div>' +
        '<div style="font-size:12px;color:var(--gold)">奖励: 💰' + floorData.reward.gold + ' ⭐' + floorData.reward.exp +
          (floorData.reward.gems ? ' 💎' + floorData.reward.gems : '') + '</div>' +
        '<button class="btn btn-primary btn-block mt-16" onclick="App.fightDungeonFloor()">挑战本层</button>' +
        '<button class="btn btn-sm btn-block mt-8" onclick="App.retreatDungeon()" style="background:var(--card2);color:var(--text)">撤退（保留进度）</button>' +
      '</div>';
    } else {
      html += '<div class="card" style="text-align:center">' +
        '<div style="font-size:48px;margin-bottom:12px">♾️</div>' +
        '<div style="font-size:18px;font-weight:700">无尽副本</div>' +
        '<div class="text-dim mt-8">无限层数，越深越难，奖励越丰厚</div>' +
        '<div class="text-dim" style="font-size:12px;margin-top:4px">每10层: Boss · 每5层: 随机事件</div>' +
        '<button class="btn btn-gold btn-block mt-16" onclick="App.startEndlessDungeon()">开始挑战</button>' +
      '</div>';
    }

    // Leaderboard
    html += '<div style="font-size:14px;font-weight:600;margin:16px 0 8px">🏆 深渊排行</div>';
    html += this._renderDungeonLeaderboard();

    return html;
  },

  _renderDungeonLeaderboard() {
    const state = Dungeon.getState();
    const week = Leaderboard.getWeekNumber();
    const rng = Leaderboard.seededRandom(week * 5501);
    const entries = [];
    const names = ['烈焰探险队', '苍龙远征军', '虎豹精锐', '飞鱼突击', '赤壁勇士', '铁壁先锋', '青龙尖兵'];
    for (const name of names) {
      entries.push({ name, floor: Math.floor(5 + rng() * 80), isPlayer: false });
    }
    entries.push({ name: Storage.getPlayer().name, floor: state.highestFloor, isPlayer: true });
    entries.sort((a, b) => b.floor - a.floor);

    return entries.map((e, i) => {
      const rank = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1) + '';
      return '<div class="lb-entry' + (e.isPlayer ? ' lb-player' : '') + '">' +
        '<div class="lb-rank">' + rank + '</div>' +
        '<div class="lb-info"><div class="lb-name">' + e.name + (e.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div></div>' +
        '<div class="lb-stats"><div class="lb-power">🏔️ 第' + e.floor + '层</div></div>' +
      '</div>';
    }).join('');
  },

  startEndlessDungeon() {
    Dungeon.startRun();
    this.renderDungeon();
    this.toast('♾️ 无尽副本开始！');
  },

  fightDungeonFloor() {
    const team = Storage.getTeam().filter(id => id);
    if (team.length === 0) { this.toast('请先编队！'); this.switchPage('team'); return; }
    const state = Dungeon.getState();
    const floorData = Dungeon.generateFloor(state.currentFloor);
    this.currentStage = {
      name: floorData.name,
      enemies: floorData.enemies,
      reward: floorData.reward,
      boss: floorData.isBossFloor,
      _dungeonFloor: true,
      _scaleMult: floorData.scaleMult,
    };
    this.prepareBattle(this.currentStage);
    this.switchPage('battle');
  },

  processDungeonEvent(floor) {
    const floorData = Dungeon.generateFloor(floor);
    if (floorData.event) {
      const result = Dungeon.processEvent(floorData.event, floor);
      this.toast(floorData.event.emoji + ' ' + result.message);
      this.renderDungeon();
    }
  },

  retreatDungeon() {
    Dungeon.endRun();
    this.toast('已撤退，最高层数已保存');
    this.renderDungeon();
  },

  _renderDailyDungeon() {
    const types = Dungeon.getAllDailyTypes();
    const state = Dungeon.getDailyState();

    let html = '<div class="card" style="text-align:center;padding:10px">' +
      '<div style="font-size:12px;color:var(--gold)">🔥 连续签到: ' + (state.streak || 0) + '天 (奖励+' + Math.min(state.streak || 0, 7) * 5 + '%)</div>' +
    '</div>';

    for (const type of types) {
      const dungeon = Dungeon.DAILY_DUNGEONS[type];
      const attempts = state.attempts[type] || 0;
      const canPlay = attempts < Dungeon.MAX_DAILY_ATTEMPTS;
      const reward = Dungeon.calculateDailyReward(type);

      html += '<div class="card">' +
        '<div class="flex justify-between items-center mb-8">' +
          '<div style="font-size:15px;font-weight:600">' + dungeon.emoji + ' ' + dungeon.name + '</div>' +
          '<div class="text-dim" style="font-size:12px">' + attempts + '/' + Dungeon.MAX_DAILY_ATTEMPTS + '</div>' +
        '</div>' +
        '<div class="text-dim" style="font-size:12px;margin-bottom:8px">' + dungeon.desc + '</div>' +
        '<div style="font-size:12px;color:var(--gold);margin-bottom:12px">奖励: ' +
          (reward.gold ? '💰' + reward.gold + ' ' : '') +
          (reward.exp ? '⭐' + reward.exp + ' ' : '') +
          (reward.equipChance ? '⚔️装备掉落 ' : '') +
          (reward.streakBonus > 0 ? '<span style="color:var(--shu)">+' + reward.streakBonus + '%连续奖励</span>' : '') +
        '</div>' +
        '<button class="btn btn-primary btn-block" onclick="App.startDailyDungeon(\'' + type + '\')"' +
          (!canPlay ? ' disabled style="opacity:.4"' : '') + '>' +
          (canPlay ? '挑战' : '今日已完成') +
        '</button>' +
      '</div>';
    }
    return html;
  },

  startDailyDungeon(type) {
    if (!Dungeon.canPlayDaily(type)) { this.toast('今日次数已用完！'); return; }
    const team = Storage.getTeam().filter(id => id);
    if (team.length === 0) { this.toast('请先编队！'); this.switchPage('team'); return; }

    const data = Dungeon.generateDailyEnemies(type);
    const dungeon = Dungeon.DAILY_DUNGEONS[type];
    const reward = Dungeon.calculateDailyReward(type);

    this.currentStage = {
      name: dungeon.name,
      enemies: data.enemies,
      reward: { gold: reward.gold || 0, exp: reward.exp || 0 },
      boss: false,
      _dailyDungeon: type,
      _scaleMult: data.scaleMult,
    };
    this.prepareBattle(this.currentStage);
    this.switchPage('battle');
  },

  _renderWeeklyRaid() {
    const boss = Dungeon.getCurrentRaidBoss();
    const state = Dungeon.getRaidState();
    const canRaid = Dungeon.canRaid();
    const damagePct = Math.min(100, Math.floor(state.totalDamage / boss.hp * 100));
    const communityDmg = Dungeon.getCommunityDamage();

    let html = '<div class="card card-glow" style="border-color:var(--hp);text-align:center">' +
      '<div style="font-size:48px">' + boss.emoji + '</div>' +
      '<div style="font-size:20px;font-weight:700;margin:8px 0">' + boss.name + '</div>' +
      '<div class="text-dim" style="font-size:13px">' + boss.desc + '</div>' +
      '<div style="margin:12px 0">' +
        '<div class="text-dim" style="font-size:11px">Boss HP</div>' +
        '<div class="progress mt-8" style="height:12px"><div class="progress-fill" style="width:' + Math.max(0, 100 - damagePct) + '%;background:linear-gradient(90deg,var(--hp),#f97316)"></div></div>' +
        '<div style="font-size:12px;margin-top:4px">' + state.totalDamage.toLocaleString() + ' / ' + boss.hp.toLocaleString() +
          (state.defeated ? ' <span style="color:var(--shu)">✅ 已击败！</span>' : '') + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;margin:12px 0">' +
        '<div><div style="font-size:11px;color:var(--dim)">今周挑战</div><div style="font-weight:700">' + state.attempts + '/' + Dungeon.MAX_RAID_ATTEMPTS + '</div></div>' +
        '<div><div style="font-size:11px;color:var(--dim)">最高伤害</div><div style="font-weight:700;color:var(--gold)">' + state.bestDamage.toLocaleString() + '</div></div>' +
        '<div><div style="font-size:11px;color:var(--dim)">Boss阶段</div><div style="font-weight:700">' + boss.phases + '阶段</div></div>' +
      '</div>' +
      '<button class="btn btn-gold btn-block" onclick="App.startRaidBoss()"' +
        (!canRaid ? ' disabled style="opacity:.4"' : '') + '>' +
        (state.defeated ? '已击败' : canRaid ? '⚔️ 讨伐Boss' : '本周次数已用完') +
      '</button>' +
    '</div>';

    // Community damage leaderboard
    html += '<div style="font-size:14px;font-weight:600;margin:16px 0 8px">🏆 讨伐排行</div>';
    for (const entry of communityDmg) {
      html += '<div class="lb-entry' + (entry.isPlayer ? ' lb-player' : '') + '">' +
        '<div style="font-size:18px;min-width:28px;text-align:center">' + entry.emoji + '</div>' +
        '<div class="lb-info"><div class="lb-name">' + entry.name + (entry.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div></div>' +
        '<div class="lb-stats"><div class="lb-power" style="color:var(--hp)">🗡️ ' + entry.damage.toLocaleString() + '</div></div>' +
      '</div>';
    }
    return html;
  },

  startRaidBoss() {
    if (!Dungeon.canRaid()) { this.toast('本周次数已用完！'); return; }
    const team = Storage.getTeam().filter(id => id);
    if (team.length === 0) { this.toast('请先编队！'); this.switchPage('team'); return; }

    const boss = Dungeon.getCurrentRaidBoss();
    // Use strong enemies as boss encounter
    this.currentStage = {
      name: '讨伐 ' + boss.name,
      enemies: ['elite_cavalry', 'strategist', boss.id.replace('raid_', ''), 'crossbow_corps', 'elite_spear'].map(e => HEROES[e] ? e : 'elite_cavalry'),
      reward: { gold: 3000, exp: 2000 },
      boss: true,
      _raidBoss: true,
      _scaleMult: 3.0,
    };
    this.prepareBattle(this.currentStage);
    this.switchPage('battle');
  },

  _renderSeasonalContent() {
    const season = Seasonal.getCurrentSeason();
    const progress = Seasonal.getPassProgress();
    const countdown = Seasonal.getSeasonCountdown();

    let html = '<div class="card card-glow" style="border-color:' + season.color + ';text-align:center">' +
      '<div style="font-size:48px">' + season.emoji + '</div>' +
      '<div style="font-size:20px;font-weight:700;color:' + season.color + '">' + season.name + '</div>' +
      '<div class="text-dim mt-8">' + season.desc + '</div>' +
      '<div style="font-size:12px;color:var(--gold);margin-top:8px">⏰ ' + countdown + '</div>' +
    '</div>';

    // Season Pass
    html += '<div class="card">' +
      '<div style="font-size:15px;font-weight:600;margin-bottom:8px">🎫 赛季通行证</div>' +
      '<div class="flex justify-between items-center">' +
        '<div class="text-dim" style="font-size:12px">等级 ' + progress.level + '/' + Seasonal.PASS_LEVELS + '</div>' +
        '<div class="text-dim" style="font-size:12px">XP: ' + progress.xp + '/' + progress.xpNeeded + '</div>' +
      '</div>' +
      '<div class="progress mt-8"><div class="progress-fill" style="width:' + (progress.xp / progress.xpNeeded * 100) + '%;background:' + season.color + '"></div></div>' +
    '</div>';

    // Pass Rewards Preview
    html += '<div class="card">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:8px">🎁 通行证奖励</div>' +
      '<div style="display:flex;gap:8px;overflow-x:auto;padding:8px 0">';

    const freeLevels = Object.keys(Seasonal.PASS_REWARDS.free).map(Number).sort((a, b) => a - b);
    for (const lvl of freeLevels.slice(0, 8)) {
      const r = Seasonal.PASS_REWARDS.free[lvl];
      const claimed = progress.claimed['free_' + lvl];
      const canClaim = progress.level >= lvl && !claimed;
      html += '<div style="min-width:70px;text-align:center;padding:8px;background:var(--card2);border-radius:10px;border:1px solid ' +
        (canClaim ? 'var(--gold)' : claimed ? 'var(--shu)' : 'var(--border)') + '">' +
        '<div style="font-size:11px;color:var(--dim)">Lv.' + lvl + '</div>' +
        '<div style="font-size:14px;margin:4px 0">' + (r.gold ? '💰' : r.gems ? '💎' : '🧩') + '</div>' +
        '<div style="font-size:10px">' + (r.gold ? r.gold : r.gems ? r.gems : '碎片') + '</div>' +
        (canClaim ? '<div style="font-size:9px;color:var(--gold);margin-top:2px" onclick="App.claimSeasonPass(' + lvl + ')">领取</div>' : '') +
        (claimed ? '<div style="font-size:9px;color:var(--shu)">✅</div>' : '') +
      '</div>';
    }
    html += '</div></div>';

    // Featured Banner Heroes
    html += '<div class="card">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:8px">' + season.emoji + ' 赛季限定武将</div>';
    for (const heroId of season.bannerHeroes) {
      const hero = HEROES[heroId];
      if (!hero) continue;
      html += '<div class="hero-card rarity-' + hero.rarity + '">' +
        '<div class="hero-emoji">' + hero.emoji + '</div>' +
        '<div class="hero-info">' +
          '<div class="hero-name">' + hero.name + (hero.title ? ' · ' + hero.title : '') +
            (hero.comingSoon ? ' <span style="font-size:10px;color:var(--gold)">即将推出</span>' : '') + '</div>' +
          '<div class="hero-sub">' + '★'.repeat(hero.rarity) + ' · ' + (FACTIONS[hero.faction]?.name || '') + '</div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';

    // Seasonal Achievements
    html += '<div class="card">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:8px">🏅 赛季成就</div>';
    for (const ach of Seasonal.SEASONAL_ACHIEVEMENTS) {
      html += '<div class="daily-mission">' +
        '<div class="dm-icon">🏅</div>' +
        '<div class="dm-info">' +
          '<div class="dm-name">' + ach.name + '</div>' +
          '<div class="dm-desc">' + ach.desc + '</div>' +
        '</div>' +
        '<div class="dm-reward"><span class="text-dim" style="font-size:12px">+' + ach.reward.passXP + 'XP</span></div>' +
      '</div>';
    }
    html += '</div>';

    return html;
  },

  claimSeasonPass(level) {
    const result = Seasonal.claimPassReward(level, 'free');
    if (result) {
      this.toast('🎁 领取赛季奖励: ' + (result.gold ? '💰' + result.gold + ' ' : '') + (result.gems ? '💎' + result.gems : ''));
      this.updateHeader();
      this.renderDungeon();
    }
  },

  // ===== ARENA =====
  renderArena() {
    const state = Arena.getState();
    const rank = Arena.getCurrentRank(state.rating);
    const nextRank = Arena.getNextRank(state.rating);

    document.getElementById('arena-attempts').textContent = '剩余: ' + Arena.getRemainingAttempts() + '次';
    document.getElementById('arena-rank-emoji').textContent = rank.emoji;
    document.getElementById('arena-rank-name').textContent = rank.name;
    document.getElementById('arena-rating').textContent = 'Rating: ' + state.rating;
    document.getElementById('arena-wins').textContent = state.wins;
    document.getElementById('arena-losses').textContent = state.losses;
    document.getElementById('arena-streak').textContent = state.streak;

    if (nextRank) {
      const progress = (state.rating - rank.minRating) / (nextRank.minRating - rank.minRating) * 100;
      document.getElementById('arena-progress-bar').style.width = Math.min(100, progress) + '%';
      document.getElementById('arena-next-rank').textContent = '下一段位: ' + nextRank.name + ' (' + nextRank.minRating + ')';
    } else {
      document.getElementById('arena-progress-bar').style.width = '100%';
      document.getElementById('arena-next-rank').textContent = '已达最高段位！';
    }

    // Weekly reward
    const weeklyBtn = document.getElementById('arena-weekly-btn');
    document.getElementById('arena-weekly-desc').textContent = rank.name + ': 💰' + rank.weeklyGold + ' 💎' + rank.weeklyGems;
    if (state.weeklyRewardClaimed) {
      weeklyBtn.textContent = '已领取';
      weeklyBtn.disabled = true;
      weeklyBtn.style.opacity = '.4';
    } else {
      weeklyBtn.textContent = '领取';
      weeklyBtn.disabled = false;
      weeklyBtn.style.opacity = '1';
    }

    // Generate opponents
    if (!this.arenaOpponents || !Arena.canFight()) {
      this.arenaOpponents = Arena.generateOpponents();
    }
    this._renderArenaOpponents();
    this._renderArenaLeaderboard();
  },

  _renderArenaOpponents() {
    const container = document.getElementById('arena-opponents');
    if (!Arena.canFight()) {
      container.innerHTML = '<div class="card text-center text-dim" style="padding:20px">今日挑战次数已用完，明天再来！</div>';
      return;
    }

    const labels = ['🟢 简单', '🟡 普通', '🔴 困难'];
    container.innerHTML = this.arenaOpponents.map((opp, i) => {
      return '<div class="card" style="cursor:pointer" onclick="App.startArenaFight(' + i + ')">' +
        '<div class="flex justify-between items-center">' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600">' + opp.name + '</div>' +
            '<div class="text-dim" style="font-size:12px">' + opp.rank.emoji + ' ' + opp.rank.name + ' · Rating ' + opp.rating + '</div>' +
            '<div style="font-size:14px;margin-top:4px">' + opp.team.map(id => HEROES[id]?.emoji || '❓').join(' ') + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:12px;font-weight:600">' + labels[i] + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  _renderArenaLeaderboard() {
    const entries = Arena.getLeaderboard();
    const container = document.getElementById('arena-leaderboard');
    container.innerHTML = entries.map((e, i) => {
      const rankIcon = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1);
      return '<div class="lb-entry' + (e.isPlayer ? ' lb-player' : '') + '">' +
        '<div class="lb-rank">' + rankIcon + '</div>' +
        '<div class="lb-info">' +
          '<div class="lb-name">' + e.rank.emoji + ' ' + e.name + (e.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div>' +
          '<div class="lb-meta">胜场: ' + e.wins + '</div>' +
        '</div>' +
        '<div class="lb-stats"><div class="lb-power">⚡ ' + e.rating + '</div></div>' +
      '</div>';
    }).join('');
  },

  startArenaFight(idx) {
    if (!Arena.canFight()) { this.toast('今日次数已用完！'); return; }
    const team = Storage.getTeam().filter(id => id);
    if (team.length === 0) { this.toast('请先编队！'); this.switchPage('team'); return; }

    const opp = this.arenaOpponents[idx];
    this.currentStage = {
      name: '竞技场 vs ' + opp.name,
      enemies: opp.team,
      reward: { gold: 100 + Math.floor(opp.rating / 10), exp: 50 + Math.floor(opp.rating / 20) },
      boss: false,
      _arenaFight: true,
      _arenaOpponent: opp,
    };
    this.prepareBattle(this.currentStage);
    this.switchPage('battle');
  },

  claimArenaWeekly() {
    const result = Arena.claimWeeklyReward();
    if (result) {
      this.toast('🎁 周奖励: 💰' + result.gold + ' 💎' + result.gems + ' (' + result.rank + ')');
      this.updateHeader();
      this.renderArena();
    } else {
      this.toast('已领取过本周奖励');
    }
  },

  // ===== PROFILE =====
  renderProfile() {
    const stats = Storage.getProfileStats();
    const content = document.getElementById('profile-content');
    const kingdom = stats.kingdom ? KingdomSystem.KINGDOMS[stats.kingdom] : null;
    const arenaRank = Arena.getCurrentRank(stats.arenaRating);

    // Active affinities
    const team = Storage.getTeam().filter(Boolean);
    const affinities = getActiveAffinities(team);

    content.innerHTML =
      // Player Card
      '<div class="card card-glow" style="text-align:center">' +
        '<div style="font-size:48px">' + (kingdom ? kingdom.banner : '⚔️') + '</div>' +
        '<div style="font-size:22px;font-weight:700;margin:8px 0">' + stats.name + '</div>' +
        '<div class="text-dim">Lv.' + stats.level + (kingdom ? ' · ' + kingdom.name : '') + '</div>' +
        '<div style="font-size:18px;color:var(--gold);margin-top:8px">⚡ 战力 ' + stats.totalPower.toLocaleString() + '</div>' +
        '<div class="text-dim" style="font-size:11px;margin-top:4px">已游玩 ' + stats.daysSinceStart + ' 天</div>' +
      '</div>' +

      // Collection Progress
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px">📚 收集进度</div>' +
        '<div class="flex justify-between items-center mb-8">' +
          '<span style="font-size:13px">武将收集</span>' +
          '<span style="font-size:13px;color:var(--gold)">' + stats.heroCount + '/' + stats.totalHeroesInGame + ' (' + stats.collectionPct + '%)</span>' +
        '</div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + stats.collectionPct + '%;background:linear-gradient(90deg,var(--accent),var(--gold))"></div></div>' +
        '<div class="flex justify-between items-center mt-8">' +
          '<span style="font-size:13px">战役进度</span>' +
          '<span style="font-size:13px;color:var(--gold)">' + stats.stagesCleared + '/60</span>' +
        '</div>' +
        '<div class="progress mt-8"><div class="progress-fill" style="width:' + (stats.stagesCleared / 60 * 100) + '%;background:linear-gradient(90deg,var(--shu),var(--accent))"></div></div>' +
      '</div>' +

      // Battle Stats
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px">⚔️ 战斗统计</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:22px;font-weight:700;color:var(--shu)">' + stats.wins + '</div><div class="text-dim" style="font-size:11px">胜利</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:22px;font-weight:700;color:var(--hp)">' + stats.losses + '</div><div class="text-dim" style="font-size:11px">失败</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:22px;font-weight:700;color:var(--gold)">' + stats.winRate + '%</div><div class="text-dim" style="font-size:11px">胜率</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:22px;font-weight:700">' + stats.bossWins + '</div><div class="text-dim" style="font-size:11px">Boss击杀</div></div>' +
        '</div>' +
        (stats.favoriteHero ? '<div class="mt-8" style="font-size:12px;color:var(--dim)">最爱武将: ' + stats.favoriteHero.emoji + ' ' + stats.favoriteHero.name + '</div>' : '') +
      '</div>' +

      // Arena & Dungeon
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px">🏟️ 竞技 & 副本</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:16px">' + arenaRank.emoji + '</div>' +
            '<div style="font-size:14px;font-weight:700">' + stats.arenaRating + '</div><div class="text-dim" style="font-size:11px">竞技评分</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:16px">🏔️</div>' +
            '<div style="font-size:14px;font-weight:700">' + stats.dungeonHighestFloor + '</div><div class="text-dim" style="font-size:11px">无尽最深</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:14px;font-weight:700;color:var(--gold)">' + stats.arenaBestStreak + '</div><div class="text-dim" style="font-size:11px">最佳连胜</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:14px;font-weight:700">' + stats.dungeonTotalRuns + '</div><div class="text-dim" style="font-size:11px">副本总挑战</div></div>' +
        '</div>' +
      '</div>' +

      // Active Affinities
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px">💞 当前羁绊</div>' +
        (affinities.length > 0 ?
          affinities.map(a => '<div style="background:var(--card2);padding:10px;border-radius:10px;margin-bottom:8px">' +
            '<div style="font-size:14px;font-weight:600">' + a.emoji + ' ' + a.name + ' <span style="color:var(--gold);font-size:12px">' + a.bonusDesc + '</span></div>' +
            '<div class="text-dim" style="font-size:12px">' + a.desc + '</div>' +
            '<div style="font-size:12px;margin-top:4px">' + a.heroes.map(h => HEROES[h]?.emoji || '❓').join(' ') +
              ' (' + a.matchCount + '/' + a.minRequired + ')</div>' +
          '</div>').join('')
          : '<div class="text-dim text-center">编队中没有激活的羁绊</div>'
        ) +
      '</div>' +

      // All Affinities Reference
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px">📖 全部羁绊图鉴</div>' +
        HERO_AFFINITIES.map(a => {
          const isActive = affinities.find(x => x.id === a.id);
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);opacity:' + (isActive ? '1' : '.6') + '">' +
            '<div style="font-size:13px">' + a.emoji + ' ' + a.name +
              (isActive ? ' <span style="color:var(--shu)">✅</span>' : '') + '</div>' +
            '<div style="font-size:11px;color:var(--gold)">' + a.bonusDesc + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      // Navigation shortcuts
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">' +
        '<button class="btn btn-primary" onclick="App.switchPage(\'team\')">📋 编队</button>' +
        '<button class="btn btn-primary" onclick="App.switchPage(\'leaderboard\')">🏆 排行</button>' +
      '</div>';
  },

  // ===== HERO ROSTER (updated for coming soon) =====
  renderRosterExtended() {
    const roster = Storage.getRoster();
    const list = document.getElementById('roster-list');

    // After the owned heroes, show "coming soon" section
    let comingSoonHtml = '<div style="font-size:15px;font-weight:600;margin:16px 0 8px">📋 即将推出</div>';
    let mysteryHtml = '<div style="font-size:15px;font-weight:600;margin:16px 0 8px">❓ 神秘武将</div>';

    for (const [id, hero] of Object.entries(HEROES)) {
      if (roster[id]) continue; // Already owned
      if (hero.mystery) {
        mysteryHtml += '<div class="hero-card" style="opacity:.5">' +
          '<div class="hero-emoji" style="background:rgba(100,100,100,.15)">❓</div>' +
          '<div class="hero-info">' +
            '<div class="hero-name">???</div>' +
            '<div class="hero-sub">' + (FACTIONS[hero.faction]?.name || '') + ' · ' + '★'.repeat(hero.rarity) + '</div>' +
            '<div class="text-dim" style="font-size:11px;font-style:italic">' + hero.lore + '</div>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--gold)">🔒</div>' +
        '</div>';
      } else if (hero.comingSoon) {
        comingSoonHtml += '<div class="hero-card rarity-' + hero.rarity + '" style="opacity:.65">' +
          '<div class="hero-emoji">' + hero.emoji + '</div>' +
          '<div class="hero-info">' +
            '<div class="hero-name">' + hero.name + ' · ' + hero.title + ' <span style="font-size:10px;color:var(--gold)">即将推出</span></div>' +
            '<div class="hero-sub">' + (UNIT_TYPES[hero.unit]?.emoji || '') + ' ' + (UNIT_TYPES[hero.unit]?.name || '') +
              ' · ' + (FACTIONS[hero.faction]?.emoji || '') + ' ' + (FACTIONS[hero.faction]?.name || '') + '</div>' +
            '<div class="hero-stars">' + '★'.repeat(hero.rarity) + '☆'.repeat(5 - hero.rarity) + '</div>' +
          '</div>' +
        '</div>';
      }
    }

    list.innerHTML += comingSoonHtml + mysteryHtml;
  },
};

// Override startBattle to handle new modes
const _originalStartBattle = App.startBattle;
App.startBattle = async function() {
  const stage = this.currentStage;

  document.getElementById('btn-battle-start').classList.add('hidden');

  Battle.onUpdate = (state) => {
    this.renderBattleField();
    const logEl = document.getElementById('battle-log');
    const recentLogs = Battle.log.slice(-15);
    logEl.innerHTML = recentLogs.map(l => '<div class="log-entry">' + l.msg + '</div>').join('');
    logEl.scrollTop = logEl.scrollHeight;
  };

  const result = await Battle.run(1.5);
  const modal = document.getElementById('result-modal');

  if (result === 'victory') {
    document.getElementById('result-icon').textContent = '🎉';
    document.getElementById('result-title').textContent = '胜利！';
    Storage.addGold(stage.reward.gold);
    Storage.addExp(stage.reward.exp);

    let detailText = '+' + stage.reward.gold + '💰 +' + stage.reward.exp + '⭐';

    if (stage.reward.hero_shard) {
      Storage.addShards(stage.reward.hero_shard, 3);
      detailText += ' +3🧩';
    }

    // Handle different modes
    if (stage._dungeonFloor) {
      Dungeon.advanceFloor();
      detailText += ' · 进入下一层';
    } else if (stage._dailyDungeon) {
      Dungeon.recordDailyAttempt(stage._dailyDungeon);
      // Add pass XP
      Seasonal.addPassXP(50);
    } else if (stage._arenaFight) {
      const opp = stage._arenaOpponent;
      const arenaState = Arena.recordFight(true, opp.rating);
      const ratingGain = arenaState.history[0]?.ratingChange || 0;
      detailText += ' · Rating +' + ratingGain;
      this.arenaOpponents = null; // Regenerate opponents
    } else if (stage._raidBoss) {
      // Calculate damage dealt as total enemy HP - remaining HP
      const totalDmg = Battle.state.enemy.reduce((sum, f) => {
        if (!f) return sum;
        return sum + (f.maxHp - Math.max(0, f.hp));
      }, 0);
      const raidState = Dungeon.recordRaidAttempt(totalDmg);
      detailText += ' · 造成 ' + totalDmg.toLocaleString() + ' 伤害';
      if (raidState.defeated) detailText += ' 💀 Boss已击败！';
    } else {
      // Normal campaign
      Campaign.completeStage(stage.id);
    }

    document.getElementById('result-detail').textContent = detailText;

    Storage.recordWin();
    DailyMissions.trackProgress('stages');
    if (stage.boss) {
      Storage.recordBossWin();
      DailyMissions.trackProgress('boss');
    }
  } else {
    document.getElementById('result-icon').textContent = '💀';
    document.getElementById('result-title').textContent = '败北...';

    if (stage._dungeonFloor) {
      Dungeon.endRun();
      document.getElementById('result-detail').textContent = '无尽副本结束，最高层数已保存';
    } else if (stage._arenaFight) {
      const opp = stage._arenaOpponent;
      Arena.recordFight(false, opp.rating);
      this.arenaOpponents = null;
      document.getElementById('result-detail').textContent = '竞技场失败，Rating下降';
    } else if (stage._raidBoss) {
      const totalDmg = Battle.state.enemy.reduce((sum, f) => {
        if (!f) return sum;
        return sum + (f.maxHp - Math.max(0, f.hp));
      }, 0);
      Dungeon.recordRaidAttempt(totalDmg);
      document.getElementById('result-detail').textContent = '造成 ' + totalDmg.toLocaleString() + ' 伤害（已记录）';
    } else {
      document.getElementById('result-detail').textContent = '升级武将或调整阵容再战！';
    }

    Storage.recordLoss();
  }

  modal.classList.remove('hidden');
  this.updateHeader();
};

// Override closeResult to return to correct page
const _originalCloseResult = App.closeResult;
App.closeResult = function() {
  document.getElementById('result-modal').classList.add('hidden');
  const stage = this.currentStage;
  if (stage._dungeonFloor) {
    this.switchPage('dungeon');
    if (Dungeon.getState().active) this.renderDungeon();
  } else if (stage._dailyDungeon) {
    this.switchPage('dungeon');
  } else if (stage._arenaFight) {
    this.switchPage('arena');
  } else if (stage._raidBoss) {
    this.switchPage('dungeon');
    this.currentDungeonTab = 'raid';
  } else {
    this.switchPage('campaign');
    this.renderCampaign();
  }
};

// Extend init to include new features
const _originalInit = App.init;
App.init = function() {
  Storage.trackPlayTime();
  _originalInit.call(this);

  // After original roster render, add coming soon heroes
  const origRenderRoster = this.renderRoster.bind(this);
  this.renderRoster = function() {
    origRenderRoster();
    this.renderRosterExtended();
  };
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());

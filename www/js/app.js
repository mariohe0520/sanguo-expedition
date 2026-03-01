// 三国·天命 — App Controller (v2)

// ===== LEADERBOARD ENGINE =====
const Leaderboard = {
  RIVAL_NAMES: ['烈焰军', '苍龙营', '虎豹骑', '飞鱼卫', '赤壁联军', '铁壁营', '青龙军', '白虎卫', '玄武营'],
  RIVAL_LEADERS: ['袁绍', '袁术', '公孙瓒', '陶谦', '刘表', '马腾', '韩遂', '张鲁', '孟获'],
  RIVAL_EMOJIS: ['狮', '龙', '虎', '鱼', '焰', '城', '蛟', '狼', '象'],

  seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  },

  getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  },

  generateRivals() {
    const week = this.getWeekNumber();
    const rng = this.seededRandom(week * 7919);
    const heroIds = Object.keys(HEROES).filter(id => HEROES[id].rarity >= 2 && !HEROES[id].mystery && !HEROES[id].locked);

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
      rank: 0, name: player.name + '的军队', leader: player.name, emoji: '',
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
    { id: 'stages', name: '征战沙场', desc: '完成3个关卡', target: 3, reward: { gold: 200 }, rewardText: '金200', icon: 'battle' },
    { id: 'gacha', name: '礼贤下士', desc: '拜访求贤馆1次', target: 1, reward: { gold: 100 }, rewardText: '金100', icon: 'scroll' },
    { id: 'boss', name: '斩将夺旗', desc: '击败Boss 1次', target: 1, reward: { gems: 5 }, rewardText: '石5', icon: 'battle' }
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
      if (!hero || hero.mystery || hero.locked) return null;

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

  async init() {
    // Initialize Portraits first (required for hero images)
    if (typeof Portraits !== 'undefined') {
      await Portraits.init();
    }
    
    this._showSplash();
    this.updateHeader();
    
    // Delay render slightly to ensure DOM is ready
    setTimeout(() => {
      this.renderHome();
      this.renderCampaign();
      this.renderRoster();
      this.renderTeam();
      this.renderGacha();
      this.checkIdleReward();
    }, 100);
  },

  _showSplash() {
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#060810;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 0.6s';
    splash.innerHTML = `
      <style>
        @keyframes splashGlow { 0%,100%{text-shadow:0 0 20px rgba(212,168,67,.3)} 50%{text-shadow:0 0 40px rgba(212,168,67,.6),0 0 80px rgba(212,168,67,.2)} }
        @keyframes splashLine { 0%{width:0;opacity:0} 50%{opacity:1} 100%{width:120px;opacity:.4} }
        @keyframes splashFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes splashPulse { 0%,100%{opacity:.3} 50%{opacity:.8} }
      </style>
      <div style="animation:splashFadeUp .8s .1s both">
        <div style="font-size:42px;font-weight:900;color:#d4a843;letter-spacing:8px;animation:splashGlow 2s ease-in-out infinite;
          background:linear-gradient(135deg,#d4a843,#f5d98a,#d4a843);-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          filter:drop-shadow(0 2px 8px rgba(212,168,67,.4))">三国·天命</div>
      </div>
      <div style="animation:splashFadeUp .8s .4s both">
        <div style="height:1px;background:linear-gradient(90deg,transparent,#d4a84366,transparent);margin:16px auto;animation:splashLine 1s .5s both"></div>
      </div>
      <div style="animation:splashFadeUp .8s .7s both">
        <div style="font-size:12px;color:#8a7e6d;letter-spacing:6px;margin-top:4px">SANGUO · DESTINY</div>
      </div>
      <div style="position:absolute;bottom:60px;animation:splashPulse 1.5s infinite">
        <div style="font-size:11px;color:#5c5448;letter-spacing:3px">加载中...</div>
      </div>
    `;
    document.body.appendChild(splash);
    setTimeout(() => {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 600);
    }, 1800);
  },

  currentDungeonTab: 'endless',
  arenaOpponents: null,
  selectedCampaignChapter: null, // null = current progress chapter

  // ===== NAVIGATION =====
  switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (!pageEl) { console.warn('Page not found: page-' + page); return; }
    pageEl.classList.add('active');
    const navPages = ['home', 'city', 'map', 'dungeon', 'arena', 'roster', 'gacha'];
    document.querySelectorAll('.nav-item').forEach((n, i) => {
      n.classList.toggle('active', navPages[i] === page);
    });
    const oldPage = this.currentPage;
    this.currentPage = page;

    // Clean up battle when leaving battle page
    if (oldPage === 'battle' && page !== 'battle') {
      try { if (typeof BattleUI !== 'undefined') BattleUI.destroy(); } catch(e) {}
      try { if (typeof BattleCanvas !== 'undefined') BattleCanvas.stop(); } catch(e) {}
      try { if (typeof BattleSVGVFX !== 'undefined') BattleSVGVFX.clear(); } catch(e) {}
    }
    
    if (page === 'home') this.renderHome();
    if (page === 'city') this.renderCity();
    if (page === 'campaign') this.renderCampaign();
    if (page === 'map') this.renderMap();
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

  _logClass(msg) {
    if (msg.includes('log-ultimate') || msg.includes('终结技')) return 'log-ultimate';
    if (msg.startsWith('📜') || msg.startsWith('⚡ 【') || msg.startsWith('⭐ 【') || msg.startsWith('🚢 【')) return 'log-strategy';
    if (msg.startsWith('🔥') && msg.includes('灼烧')) return 'log-burn';
    if (msg.includes('释放【')) return 'log-skill';
    if (msg.includes('暴击') || msg.includes('CRIT')) return 'log-crit';
    if (msg.includes('阵亡') || msg.includes('击杀') || msg.includes('倒下')) return 'log-kill';
    if (msg.includes('+') && msg.includes('HP')) return 'log-heal';
    if (msg.includes('回合')) return 'log-turn';
    if (msg.includes('%') && (msg.includes('atk') || msg.includes('def') || msg.includes('spd'))) return 'log-buff';
    return '';
  },

  toast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.innerHTML = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), duration);
  },

  // ===== HOME =====
  renderHome() {
    try {
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
      this._renderDestinyHomeCard();
      // Check achievements in background
      if (typeof Achievements !== 'undefined') {
        const newAch = Achievements.checkAll();
        if (newAch.length > 0) this.toast('新成就: ' + newAch.map(a => a.name).join(', '));
      }
    } catch(e) { console.error('[renderHome]', e); }
  },

  checkIdleReward() {
    const mins = Idle.getTimeSinceCollect();
    if (mins >= 1) {
      // Feature 4: Use scaled reward preview
      const preview = Idle.getRewardPreview();
      if (preview) {
        document.getElementById('idle-gold').textContent = '+' + preview.gold;
        document.getElementById('idle-time').textContent = preview.minutes + '分钟' +
          (preview.chapterMult > 1 ? ' (x' + preview.chapterMult.toFixed(1) + ')' : '') +
          (preview.expeditionCount > 0 ? ' [远征' + preview.expeditionCount + '人]' : '');
      } else {
        const gold = Math.floor(mins * Idle.RATES.goldPerMin * (1 + (Storage.getPlayer().level - 1) * 0.15));
        document.getElementById('idle-gold').textContent = '+' + gold;
        document.getElementById('idle-time').textContent = mins + '分钟';
      }
      document.getElementById('idle-card').classList.remove('hidden');
    } else {
      document.getElementById('idle-card').classList.add('hidden');
    }
  },

  collectIdle() {
    const result = Idle.collectRewards();
    if (!result) return;
    let lootMsg = '';
    // Convert idle loot to Equipment system items
    if (result.loot.length > 0 && typeof Equipment !== 'undefined') {
      for (const oldLoot of result.loot) {
        try {
          const progress = Storage.getCampaignProgress();
          const drop = Equipment.generateDrop(progress.chapter || 1, false);
          if (drop) {
            const added = Storage.addEquipment(drop);
            if (added === false) { lootMsg += '装备库已满'; }
            else { const tmpl = Equipment.TEMPLATES[drop.templateId]; lootMsg += (tmpl?.name || '装备'); }
          }
        } catch(e) { console.error('[idle loot]', e); }
      }
    }

    // Show ceremony modal
    this._pendingOfflineResult = result;
    this._pendingOfflineLoot = lootMsg;
    const modal = document.getElementById('offline-modal');
    if (modal) {
      modal.classList.remove('hidden');
      // Duration text
      const mins = Idle.getTimeSinceCollect ? Idle.getTimeSinceCollect() : 0;
      const hours = (mins / 60).toFixed(1);
      const durationEl = document.getElementById('offline-duration');
      if (durationEl) durationEl.textContent = mins >= 60 ? hours + '小时' : mins + '分钟';
      // Animate counting
      this._animateCount(document.getElementById('offline-gold-val'), result.gold, 1200);
      this._animateCount(document.getElementById('offline-exp-val'), result.exp, 1000);
      // Loot row
      const lootRow = document.getElementById('offline-loot-row');
      if (lootMsg && lootRow) {
        lootRow.classList.remove('hidden');
        document.getElementById('offline-loot-val').textContent = lootMsg;
      } else if (lootRow) {
        lootRow.classList.add('hidden');
      }
      // Coin shower
      this._startCoinShower(document.getElementById('coin-shower'), Math.min(Math.floor(result.gold / 50), 15));
    } else {
      // Fallback to toast if modal element not found
      this.toast('领取 ' + result.gold + '金币 + ' + result.exp + '经验！');
    }
    document.getElementById('idle-card').classList.add('hidden');
  },

  confirmOfflineRewards() {
    const modal = document.getElementById('offline-modal');
    if (modal) modal.classList.add('hidden');
    // Show gold gain float
    this.showGoldGain(this._pendingOfflineResult?.gold || 0);
    this._pendingOfflineResult = null;
    this._pendingOfflineLoot = '';
    this.renderHome();
  },

  // 金币雨动画
  _startCoinShower(container, count) {
    if (!container) return;
    container.innerHTML = '';
    const emojis = ['\u{1FA99}', '\u{1F4B0}', '\u2728'];
    for (let i = 0; i < Math.max(count, 5); i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'coin-particle';
        coin.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        coin.style.left = Math.random() * 100 + '%';
        coin.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
        container.appendChild(coin);
        setTimeout(() => coin.remove(), 2000);
      }, i * 80);
    }
  },

  // 数字滚动动画
  _animateCount(el, targetValue, duration) {
    if (!el) return;
    duration = duration || 1000;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(targetValue * eased).toLocaleString();
      if (progress >= 1) clearInterval(timer);
    }, 16);
  },

  // 显示出战台词（战斗开始后1.5秒）
  _showBattleQuote(heroId) {
    const quotes = (window.HERO_QUOTES || {})[heroId] || (window.HERO_QUOTES || {})._default;
    if (!quotes) return;
    setTimeout(() => {
      this.toast('「' + quotes.battle + '」', 2500);
    }, 1500);
  },

  // 金币获取飘字动画
  showGoldGain(amount, sourceEl) {
    if (!amount || amount <= 0) return;
    const el = document.createElement('div');
    el.className = 'gold-gain-float';
    el.textContent = '+' + amount.toLocaleString() + ' \u{1FA99}';
    if (sourceEl) {
      const rect = sourceEl.getBoundingClientRect();
      el.style.left = rect.left + rect.width / 2 + 'px';
      el.style.top = rect.top + 'px';
    } else {
      el.style.right = '20px';
      el.style.bottom = '100px';
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  // ===== CAMPAIGN =====
  selectCampaignChapter(chapterId) {
    this.selectedCampaignChapter = chapterId;
    this.renderCampaign();
  },

  renderCampaign() {
    try { this._renderCampaignInner(); } catch(e) { console.error('[renderCampaign]', e); }
  },

  _renderCampaignInner() {
    const progress = Storage.getCampaignProgress();
    const viewChapterId = this.selectedCampaignChapter || progress.chapter;
    const chapter = Campaign.CHAPTERS.find(c => c.id === viewChapterId) || Campaign.CHAPTERS[0];
    const isCurrentChapter = chapter.id === progress.chapter;
    const isPastChapter = chapter.id < progress.chapter;

    document.getElementById('campaign-title').textContent = chapter.icon + ' ' + chapter.name;

    document.getElementById('campaign-terrain').innerHTML = Visuals.terrainLabel(chapter.terrain);
    document.getElementById('campaign-weather').innerHTML = Visuals.weatherLabel(chapter.weather);

    const list = document.getElementById('stage-list');
    list.innerHTML = '';

    // Chapter selector tabs
    const tabsDiv = document.createElement('div');
    tabsDiv.style.cssText = 'display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;padding:4px 0;-webkit-overflow-scrolling:touch';
    for (const ch of Campaign.CHAPTERS) {
      const isUnlocked = ch.id <= progress.chapter;
      const isActive = ch.id === viewChapterId;
      const isCompleted = ch.id < progress.chapter;
      const tab = document.createElement('div');
      tab.style.cssText = 'min-width:58px;text-align:center;padding:8px 6px;border-radius:10px;flex-shrink:0;' +
        'background:' + (isActive ? 'linear-gradient(135deg,rgba(212,168,67,.2),rgba(184,146,46,.15))' : 'var(--card2)') + ';' +
        'border:1px solid ' + (isActive ? 'var(--gold)' : isCompleted ? 'rgba(34,197,94,.2)' : 'var(--border)') + ';' +
        'opacity:' + (isUnlocked ? '1' : '.35') + ';' +
        'cursor:' + (isUnlocked ? 'pointer' : 'default') + ';transition:.2s';
      tab.innerHTML = '<div style="font-size:18px">' + ch.icon + '</div>' +
        '<div style="font-size:10px;' + (isActive ? 'color:var(--gold);font-weight:600' : 'color:var(--dim)') + '">' +
        (isCompleted ? '通 ' + ch.id : isActive && isCurrentChapter ? '▶ ' + ch.id : ch.id) + '</div>';
      if (isUnlocked) {
        const chId = ch.id;
        tab.onclick = () => this.selectCampaignChapter(chId);
      }
      tabsDiv.appendChild(tab);
    }
    list.appendChild(tabsDiv);

    // Chapter description
    const descDiv = document.createElement('div');
    descDiv.className = 'card';
    descDiv.style.cssText = 'padding:12px;margin-bottom:12px';
    descDiv.innerHTML = '<div class="text-dim" style="font-size:13px;font-style:italic">' + chapter.desc + '</div>';
    list.appendChild(descDiv);

    // Stages
    for (const stage of chapter.stages) {
      if (stage.branch) {
        const choice = progress.choices[chapter.id];
        if (choice && choice !== stage.branch) continue;
        if (!choice && stage.branch === 'B') continue;
      }

      let isCurrent, isLocked, isCompleted;
      if (isPastChapter) {
        isCurrent = false;
        isLocked = false;
        isCompleted = true;
      } else if (isCurrentChapter) {
        isCurrent = stage.id === progress.stage;
        isLocked = stage.id > progress.stage;
        isCompleted = stage.id < progress.stage;
      } else {
        // Future chapter
        isCurrent = false;
        isLocked = true;
        isCompleted = false;
      }

      const div = document.createElement('div');
      div.className = 'stage-item ' + (stage.boss ? 'boss ' : '') + (isCurrent ? 'current ' : '') + (isLocked ? 'locked' : '');
      const hasNarrative = typeof Narrative !== 'undefined' && Narrative.hasStory(chapter.id, stage.id, 'pre');
      div.innerHTML = '<div class="stage-num ' + (stage.boss ? 'stage-boss' : '') + '">' + (stage.boss ? Visuals.bossSkull() : stage.id) + '</div>' +
        '<div class="stage-info"><div class="stage-name">' + stage.name + (isCompleted ? ' <span style="color:var(--shu)">通</span>' : '') + (hasNarrative ? ' <span style="color:#f5c518;font-size:11px" title="有剧情">📜</span>' : '') + '</div>' +
        '<div class="stage-reward">' + Visuals.resIcon('gold') + stage.reward.gold + ' · ' + Visuals.resIcon('exp') + stage.reward.exp + (stage.reward.hero_shard ? ' · ' + Visuals.resIcon('shard') + '碎片' : '') + '</div></div>' +
        (stage.elite ? '<span class="text-gold">精英</span>' : '');
      if (!isLocked) {
        const stageRef = stage;
        const chapterRef = chapter;
        div.onclick = () => this.enterStage(stageRef, chapterRef);
      }
      list.appendChild(div);
    }
  },

  // ===== KINGDOM MAP =====
  _mapSelectedTerritory: null,
  _mapCurrentEvent: null,
  _mapBattleTerritory: null,

  renderMap() {
    try { this._renderMapInner(); } catch(e) { console.error('[renderMap]', e); }
  },

  _renderMapInner() {
    if (typeof KingdomMap === 'undefined') return;

    // Initialize map state if needed
    const state = KingdomMap.getState() || KingdomMap.initState();

    // Update header resources
    const p = Storage.getPlayer();
    const goldEl = document.getElementById('map-gold');
    const gemsEl = document.getElementById('map-gems');
    if (goldEl) goldEl.textContent = p.gold;
    if (gemsEl) gemsEl.textContent = p.gems || 0;

    // Stats bar
    const stats = KingdomMap.getStats();
    const statsBar = document.getElementById('map-stats-bar');
    if (statsBar) {
      statsBar.innerHTML =
        '<div class="stat"><div class="stat-num">' + stats.conquered + '</div><div class="stat-label">已占领</div></div>' +
        '<div class="stat"><div class="stat-num">' + stats.available + '</div><div class="stat-label">可攻打</div></div>' +
        '<div class="stat"><div class="stat-num">' + stats.locked + '</div><div class="stat-label">未发现</div></div>' +
        '<div class="stat"><div class="stat-num">' + stats.pct + '%</div><div class="stat-label">天下</div></div>';
    }

    // Income card
    const incomeCard = document.getElementById('map-income-card');
    if (incomeCard) {
      const conqueredCount = stats.conquered;
      if (conqueredCount > 0) {
        const goldPerHour = KingdomMap.INCOME_PER_HOUR.gold * conqueredCount;
        const expPerHour = KingdomMap.INCOME_PER_HOUR.exp * conqueredCount;
        incomeCard.style.display = 'flex';
        incomeCard.innerHTML =
          '<div><div style="font-size:13px;font-weight:600;color:var(--gold)">🏰 领地收益</div>' +
          '<div style="font-size:11px;color:var(--dim);margin-top:2px">' + conqueredCount + '座城池 · 每小时 +' + goldPerHour + '金 +' + expPerHour + '经验</div></div>' +
          '<div style="font-size:12px;color:var(--gold);font-weight:600">领取 ›</div>';
      } else {
        incomeCard.style.display = 'none';
      }
    }

    // Render SVG map
    const svgEl = document.getElementById('kingdom-map-svg');
    KingdomMap.renderMap(svgEl, (territoryId) => this.onTerritoryClick(territoryId));

    // Hide info panel and event panel by default
    const infoPanel = document.getElementById('map-territory-info');
    if (infoPanel) infoPanel.classList.remove('visible');
    const eventPanel = document.getElementById('map-event-panel');
    if (eventPanel) eventPanel.style.display = 'none';
    this._mapSelectedTerritory = null;
  },

  onTerritoryClick(territoryId) {
    if (typeof KingdomMap === 'undefined') return;
    this._mapSelectedTerritory = territoryId;

    const info = KingdomMap.getTerritoryInfo(territoryId);
    if (!info) return;

    const panel = document.getElementById('map-territory-info');
    if (!panel) return;

    let html = '<div class="map-info-header">' +
      '<div class="map-info-name">' + info.icon + ' ' + info.name + '</div>' +
      '<div class="map-info-level" style="border:1px solid ' + info.factionColor + '">Lv.' + info.level + ' · ' + info.factionName + '</div>' +
      '</div>' +
      '<div class="map-info-desc">' + info.desc + '</div>';

    // Stage progress dots
    html += '<div class="map-stage-dots">';
    for (let i = 0; i < 3; i++) {
      html += '<div class="map-stage-dot ' + (i < info.stagesCleared ? 'cleared' : '') + '"></div>';
    }
    html += '</div>';

    if (info.status === 'conquered') {
      html += '<div class="map-conquered-badge">🚩 已占领 · 每小时 +' + KingdomMap.INCOME_PER_HOUR.gold + '金</div>';
    } else if (info.currentStage) {
      html += '<div class="map-info-stage">' +
        '<div class="map-info-stage-icon">' + info.currentStage.icon + '</div>' +
        '<div style="flex:1">' +
          '<div style="font-weight:600">' + info.currentStage.name + '</div>' +
          '<div class="map-info-reward">奖励: +' + info.reward.gold + '金 +' + info.reward.exp + '经验' +
            (info.reward.hero_shard ? ' +碎片' : '') + '</div>' +
        '</div>' +
        '<button class="btn btn-attack" onclick="App.attackTerritory(\'' + info.id + '\')">进攻</button>' +
        '</div>';
    }

    panel.innerHTML = html;
    panel.classList.add('visible');
  },

  attackTerritory(territoryId) {
    if (typeof KingdomMap === 'undefined') return;

    const team = Storage.getTeam().filter(id => id);
    if (team.length === 0) {
      this.toast('请先编队！');
      this.switchPage('team');
      return;
    }

    const stageType = KingdomMap.getCurrentStageType(territoryId);
    if (!stageType) { this.toast('该领地已攻克！'); return; }

    const t = KingdomMap.TERRITORIES[territoryId];
    if (!t) return;

    // Move player to this territory
    KingdomMap.moveTo(territoryId);
    this._mapBattleTerritory = territoryId;

    // Check for random event
    const event = KingdomMap.rollEvent();
    if (event) {
      this._mapCurrentEvent = event;
      this._showMapEvent(event, () => {
        // After event, start the battle
        this._startMapBattle(territoryId, stageType);
      });
      return;
    }

    this._startMapBattle(territoryId, stageType);
  },

  _showMapEvent(event, onComplete) {
    const panel = document.getElementById('map-event-panel');
    if (!panel) { onComplete(); return; }

    let html = '<div class="map-event-header">' +
      '<div class="map-event-icon">' + event.icon + '</div>' +
      '<div><div class="map-event-title">' + event.name + '</div></div>' +
      '</div>' +
      '<div class="map-event-desc">' + event.desc + '</div>' +
      '<div class="map-event-options">';

    event.options.forEach((opt, i) => {
      html += '<div class="map-event-option" onclick="App._handleMapEvent(' + i + ')">' + opt.text + '</div>';
    });

    html += '</div>';
    panel.innerHTML = html;
    panel.style.display = 'block';

    // Store callback
    this._mapEventCallback = onComplete;
  },

  _handleMapEvent(optionIndex) {
    const event = this._mapCurrentEvent;
    if (!event || !event.options[optionIndex]) return;

    const opt = event.options[optionIndex];
    const extra = KingdomMap.applyEventEffect(opt.effect);

    // Show result
    const panel = document.getElementById('map-event-panel');
    let resultHtml = '<div class="map-event-header">' +
      '<div class="map-event-icon">' + event.icon + '</div>' +
      '<div><div class="map-event-title">' + event.name + '</div></div>' +
      '</div>' +
      '<div style="font-size:13px;color:var(--text);margin-bottom:12px">' + opt.result;

    if (extra && extra.shardHero) {
      const hero = typeof HEROES !== 'undefined' ? HEROES[extra.shardHero] : null;
      resultHtml += '<br><span style="color:var(--gold)">获得 ' + (hero ? hero.name : '') + ' 碎片 ×' + extra.shardCount + '</span>';
    }
    if (extra && extra.equipment) {
      const tmpl = typeof Equipment !== 'undefined' ? Equipment.TEMPLATES[extra.equipment.templateId] : null;
      resultHtml += '<br><span style="color:var(--gold)">获得装备: ' + (tmpl ? tmpl.emoji + ' ' + tmpl.name : '???') + '</span>';
    }

    resultHtml += '</div>' +
      '<button class="btn btn-primary btn-block" onclick="App._closeMapEvent()">继续进军</button>';

    panel.innerHTML = resultHtml;
    this.updateHeader();

    // Handle ambush battle
    if (opt.effect.ambushBattle) {
      this._mapEventCallback = () => {
        // Start ambush (harder enemies)
        const territoryId = this._mapBattleTerritory;
        if (territoryId) {
          this._startMapBattle(territoryId, KingdomMap.getCurrentStageType(territoryId));
        }
      };
    }
  },

  _closeMapEvent() {
    const panel = document.getElementById('map-event-panel');
    if (panel) panel.style.display = 'none';
    this._mapCurrentEvent = null;

    if (this._mapEventCallback) {
      const cb = this._mapEventCallback;
      this._mapEventCallback = null;
      cb();
    }
  },

  _startMapBattle(territoryId, stageType) {
    const t = KingdomMap.TERRITORIES[territoryId];
    if (!t) return;

    const template = KingdomMap.STAGE_TEMPLATES[stageType];
    const enemies = KingdomMap.generateEnemies(territoryId, stageType);
    const reward = KingdomMap.getStageReward(territoryId, stageType);
    const scale = KingdomMap.getEnemyScale(territoryId);

    // Create a stage-like object compatible with the existing battle system
    const stage = {
      id: territoryId + '_' + stageType,
      name: t.name + ' — ' + (template ? template.name : '战斗'),
      enemies: enemies,
      reward: reward,
      boss: stageType === 'boss',
      _chapter: { terrain: 'plains', weather: 'clear' },
      _scaleMult: scale,
      _isMapBattle: true,
      _territoryId: territoryId,
    };

    this.currentStage = stage;
    this.switchPage('battle');
    requestAnimationFrame(() => this.prepareBattle(stage));
  },

  collectMapIncome() {
    if (typeof KingdomMap === 'undefined') return;
    const income = KingdomMap.collectIncome();
    if (income.gold > 0 || income.exp > 0) {
      this.toast('+' + income.gold + '金 +' + income.exp + '经验 (' + income.conqueredCount + '城, ' + income.hours + 'h)');
      this.updateHeader();
      this.renderMap();
    } else {
      this.toast('暂无收益，继续征战吧！');
    }
  },

  enterStage(stage, chapter) {
    if (!chapter) chapter = Campaign.getCurrentChapter();
    const progress = Storage.getCampaignProgress();

    // Only trigger destiny choices on current chapter's current progress
    if (chapter.id === progress.chapter) {
      for (const [chId, dc] of Object.entries(Campaign.DESTINY_CHOICES)) {
        if (parseInt(chId) === chapter.id && stage.id === dc.trigger_after + 1 && !progress.choices[chapter.id]) {
          this.showDestinyChoice(dc, chapter.id);
          return;
        }
      }
    }

    // Store chapter info on stage for terrain/weather lookup
    this.currentStage = stage;
    this.currentStage._chapter = chapter;
    // Apply chapter difficulty scaling
    this.currentStage._scaleMult = Campaign.getEnemyScale(chapter.id);

    // Show pre-battle narrative if available
    if (typeof Narrative !== 'undefined' && Narrative.hasStory(chapter.id, stage.id, 'pre')) {
      Narrative.show(chapter.id, stage.id, 'pre', () => {
        this.switchPage('battle');
        requestAnimationFrame(() => this.prepareBattle(stage));
      });
      return;
    }

    this.switchPage('battle');
    // Delay prepareBattle so canvas parent has dimensions after page becomes visible
    requestAnimationFrame(() => this.prepareBattle(stage));
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
        // loyalty: increase sincerity for target hero in gacha system
        if (opt.reward.loyalty) {
          try {
            const gachaState = Storage.getGachaState();
            // Apply loyalty as a general sincerity boost across all visitable heroes
            // If hero_hint is also present, focus the boost on that hero
            const targetHero = opt.reward.hero_hint || null;
            if (targetHero && gachaState.visits) {
              if (!gachaState.visits[targetHero]) {
                gachaState.visits[targetHero] = { sincerity: 0, dialogueIdx: 0, attempts: 0, failedVisits: 0 };
              }
              gachaState.visits[targetHero].sincerity = Math.min(
                (gachaState.visits[targetHero].sincerity || 0) + Math.floor(opt.reward.loyalty / 5),
                100
              );
              Storage.saveGachaState(gachaState);
            }
          } catch(e) { console.error('[Destiny loyalty]', e); }
        }
        // hero_hint: show a hint to visit a specific hero in gacha
        if (opt.reward.hero_hint) {
          const hintHero = HEROES[opt.reward.hero_hint];
          if (hintHero) {
            setTimeout(() => this.toast('天命提示：前往求贤馆拜访' + hintHero.name + '！', 4000), 1000);
          }
        }
        // troops: convert troops to gold (10:1 ratio)
        if (opt.reward.troops) {
          Storage.addGold(opt.reward.troops * 10);
        }
        this.toast('天命已定：' + opt.text);
        this.renderCampaign();
      };
      opts.appendChild(div);
    }
    modal.classList.remove('hidden');
  },

  // ===== GUARANTEED FIGHTER OVERLAY (nuclear fix) =====
  _injectBattleOverlay(playerTeam, battleState) {
    try {
      const wrap = document.getElementById('battle-canvas-wrap');
      if (!wrap) return;

      // Remove any existing overlay
      const existing = wrap.querySelector('.battle-overlay');
      if (existing) existing.remove();

      // Build fighter data from battleState, fallback to HEROES
      const playerFighters = [];
      if (battleState && battleState.player) {
        battleState.player.forEach(f => {
          if (f) playerFighters.push({ id: f.id, name: f.name, rarity: f.rarity || (HEROES[f.id] ? HEROES[f.id].rarity : 1) });
        });
      } else if (playerTeam && playerTeam.length) {
        playerTeam.forEach(id => {
          const h = HEROES[id];
          if (h) playerFighters.push({ id: id, name: h.name, rarity: h.rarity });
        });
      }

      const enemyFighters = [];
      if (battleState && battleState.enemy) {
        battleState.enemy.forEach(f => {
          if (f) enemyFighters.push({ id: f.id, name: f.name, rarity: f.rarity || (HEROES[f.id] ? HEROES[f.id].rarity : 1) });
        });
      }

      // Build card HTML for a fighter
      const cardHTML = (f) => {
        let portrait = '';
        try { portrait = Visuals.heroPortrait(f.id, 'xs', f.rarity); } catch(e) { portrait = '<div style="width:24px;height:24px;background:#333;border-radius:50%"></div>'; }
        return '<div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.6);border-radius:8px;padding:4px 8px;border:1px solid rgba(212,168,67,0.2)">' +
          portrait +
          '<div>' +
            '<div style="font-size:10px;font-weight:600;color:#f0e6d3">' + (f.name || f.id) + '</div>' +
            '<div style="width:40px;height:3px;background:rgba(255,255,255,0.2);border-radius:2px;margin-top:2px">' +
              '<div style="width:100%;height:100%;background:#22c55e;border-radius:2px"></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      };

      // Player column
      let playerHTML = '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start">';
      playerFighters.forEach(f => { playerHTML += cardHTML(f); });
      playerHTML += '</div>';

      // Enemy column
      let enemyHTML = '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">';
      enemyFighters.forEach(f => { enemyHTML += cardHTML(f); });
      enemyHTML += '</div>';

      // VS divider
      const vsHTML = '<div style="font-size:18px;color:#d4a843;font-weight:900">VS</div>';

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'battle-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;pointer-events:none;z-index:5';
      overlay.innerHTML = playerHTML + vsHTML + enemyHTML;

      wrap.appendChild(overlay);
    } catch(e) {
      console.error('[_injectBattleOverlay]', e);
    }
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

    // Render team preview with swap button
    try {
      const teamListEl = document.getElementById('battle-team-list');
      const previewEl = document.getElementById('battle-team-preview');
      if (teamListEl && previewEl) {
        previewEl.style.display = 'block';
        teamListEl.innerHTML = team.map(id => {
          const hero = HEROES[id];
          if (!hero) return '';
          const data = Storage.getRoster()[id];
          const level = data?.level || 1;
          return '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--card2);border-radius:8px;flex:1;min-width:0">' +
            '<div style="flex-shrink:0">' + Visuals.heroPortrait(id, 'xs', hero.rarity) + '</div>' +
            '<div style="min-width:0">' +
              '<div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + hero.name + '</div>' +
              '<div style="font-size:9px;color:var(--dim)">Lv.' + level + ' ' + (UNIT_TYPES[hero.unit]?.name || '') + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    } catch(e) { console.error('[battle-team-preview]', e); }

    // Use stage-specific terrain/weather, fall back to chapter defaults
    let chapter;
    try { chapter = stage._chapter || Campaign.getCurrentChapter(); } catch(e) { chapter = { terrain: 'plains', weather: 'clear' }; }
    const terrain = stage.terrain || stage._terrain || chapter.terrain || 'plains';
    const weather = stage.weather || stage._weather || chapter.weather || 'clear';
    const enemyScale = stage._scaleMult || 1;
    // Pass territory ID for DynamicBattlefield terrain mapping
    const territoryId = stage._territoryId || null;
    const bossEnhanced = stage.boss_enhanced || null;

    // WarDirector scenario — safely wrapped so a crash never blocks battle
    let warContext = null;
    try {
      if (typeof WarDirector !== 'undefined') {
        warContext = WarDirector.rollScenario(stage, chapter);
      }
    } catch(e) { console.error('[WarDirector rollScenario]', e); }
    stage._warContext = warContext;

    // Initialize battle state — safely wrapped so a crash never blocks rendering
    try {
      Battle.init(team, stage.enemies, terrain, weather, enemyScale, territoryId, bossEnhanced, warContext);
    } catch(e) {
      console.error('[Battle.init CRASH]', e);
      // Emergency fallback: create minimal battle state so rendering can proceed
      if (!Battle.state) {
        Battle.state = {
          turn: 0, phase: 'ready', terrain: terrain, weather: weather,
          player: team.map((h, i) => { try { return Battle.createFighter(h, 'player', i); } catch(e2) { return null; } }).filter(Boolean),
          enemy: (stage.enemies || []).map((h, i) => { try { return Battle.createFighter(h, 'enemy', i, enemyScale); } catch(e2) { return null; } }).filter(Boolean),
        };
      }
    }

    // Nuclear fix: inject guaranteed HTML fighter overlay on top of canvas
    try { this._injectBattleOverlay(team, Battle.state); } catch(e) { console.error('[_injectBattleOverlay call]', e); }

    if (warContext && typeof Battle !== 'undefined' && Battle.state) {
      try {
        Battle.addLog(`🎯 战争导演：${warContext.name} · ${warContext.desc}`);
        const battleLog = document.getElementById('battle-log');
        if (battleLog) {
          const warPreview =
            '<div class="log-entry" style="color:#fbbf24">🎯 战略态势：' + warContext.name + '</div>' +
            '<div class="log-entry" style="color:#93c5fd">' + warContext.desc + '</div>';
          battleLog.innerHTML = warPreview + battleLog.innerHTML;
        }
      } catch(e) { console.error('[WarDirector log]', e); }
    }

    // Reset bond display for new battle
    try {
      const bondEl = document.getElementById('battle-bond-display');
      if (bondEl) { bondEl.innerHTML = ''; delete bondEl.dataset.rendered; }
      if (typeof HeroPersonality !== 'undefined') HeroPersonality.clearAllBubbles();
    } catch(e) {}

    // Clean up any previous BattleUI state (canvas renderer is used instead)
    try {
      if (typeof BattleUI !== 'undefined') BattleUI.destroy();
    } catch(e) {}

    // Ensure bui-active class is removed so canvas wrap is visible
    try {
      const battlePage = document.getElementById('page-battle');
      if (battlePage) battlePage.classList.remove('bui-active');
    } catch(e) {}

    // Initialize canvas renderer (background layer for particles)
    try {
      const canvasEl = document.getElementById('battle-canvas');
      if (canvasEl && typeof BattleCanvas !== 'undefined') {
        BattleCanvas.init(canvasEl);
        BattleCanvas.setupFighters(Battle.state);
        BattleCanvas.start();
        // Init SVG VFX overlay
        if (typeof BattleSVGVFX !== 'undefined') try { BattleSVGVFX.init(); } catch(e2) {}
        // Safety re-resize after layout settles (mobile Safari can be slow)
        setTimeout(() => {
          try {
            BattleCanvas.resize();
            BattleCanvas.initFighters(Battle.state);
          } catch(e2) { console.error('[BattleCanvas 300ms re-init]', e2); }
        }, 300);
        // Second safety net: re-init at 800ms if fighters still empty
        setTimeout(() => {
          try {
            if (typeof BattleCanvas !== 'undefined' && Object.keys(BattleCanvas.fighters).length === 0 && Battle.state) {
              BattleCanvas.resize();
              BattleCanvas.initFighters(Battle.state);
            }
          } catch(e2) { /* safe */ }
        }, 800);
      }
    } catch(e) { console.error('[BattleCanvas init]', e); }

    // Show DOM fighter display (always visible, guaranteed to work)
    const bfEl = document.getElementById('battle-field');
    if (bfEl) bfEl.classList.add('active');

    try { this.renderBattleField(); } catch(e) { console.error('[renderBattleField]', e); }
  },

  renderBattleField() {
    const state = Battle.state;
    if (!state) return;

    const renderTeam = (fighters, containerId) => {
      const c = document.getElementById(containerId);
      if (!c) return;
      c.innerHTML = '';
      for (const f of fighters) {
        if (!f) continue;
        const div = document.createElement('div');
        div.className = 'fighter-row ' + (f.alive ? '' : 'dead');
        div.setAttribute('data-fighter', f.side + '-' + f.pos);
        const hpPct = f.alive ? (f.hp / f.maxHp * 100) : 0;
        const ragePct = f.rage / (f.maxRage || 100) * 100;
        const elemBadge = f.element && typeof ELEMENT_INFO !== 'undefined' && ELEMENT_INFO[f.element]
          ? Visuals.elemBadge(f.element) : '';
        const appliedBadge = f.appliedElement && typeof ELEMENT_INFO !== 'undefined' && ELEMENT_INFO[f.appliedElement]
          ? '<span class="elem-badge" style="--ec:' + ELEMENT_INFO[f.appliedElement].color + ';border-style:dashed">' + Visuals.elemIcon(f.appliedElement) + '</span>' : '';
        div.innerHTML = Visuals.heroPortrait(f.id, 'sm', f.rarity) +
          '<div class="fighter-bars"><div class="fighter-name">' + f.name + elemBadge + appliedBadge + '</div>' +
          '<div class="bar"><div class="bar-fill hp-fill" style="width:' + hpPct + '%"></div></div>' +
          '<div class="bar"><div class="bar-fill rage-fill" style="width:' + ragePct + '%"></div></div></div>';
        c.appendChild(div);
      }
    };

    renderTeam(state.player, 'team-player');
    renderTeam(state.enemy, 'team-enemy');
    document.getElementById('battle-turn').textContent = '回合 ' + state.turn;

    // Update Dynamic Battlefield status bar
    if (typeof DynamicBattlefield !== 'undefined' && DynamicBattlefield.state) {
      const statusBar = document.getElementById('bf-status-bar');
      if (statusBar) {
        statusBar.style.display = 'flex';
        statusBar.innerHTML = DynamicBattlefield.getStatusBarHTML();
        // Pulse animation on changes
        if (DynamicBattlefield.state.weatherChanged || DynamicBattlefield.state.terrainChanged) {
          statusBar.classList.remove('bf-pulse');
          void statusBar.offsetWidth; // Force reflow
          statusBar.classList.add('bf-pulse');
        }
      }
      // Show announcements as overlays on canvas
      if (DynamicBattlefield.state.announcements && DynamicBattlefield.state.announcements.length > 0) {
        const canvasWrap = document.getElementById('battle-canvas-wrap');
        if (canvasWrap) {
          for (const ann of DynamicBattlefield.state.announcements) {
            const overlay = document.createElement('div');
            overlay.className = 'bf-announcement-overlay bf-announcement-' + (ann.type || 'weather');
            overlay.innerHTML = '<div class="bf-announcement-text">' + ann.text + '</div>';
            canvasWrap.appendChild(overlay);
            // Auto-remove after animation
            setTimeout(() => overlay.remove(), 2600);
            // Flash for hazards
            if (ann.type === 'hazard') {
              canvasWrap.classList.add('bf-hazard-flash');
              setTimeout(() => canvasWrap.classList.remove('bf-hazard-flash'), 500);
            }
            if (ann.type === 'weather' && DynamicBattlefield.state.weather === 'storm') {
              const flash = document.createElement('div');
              flash.className = 'bf-lightning-flash';
              canvasWrap.appendChild(flash);
              setTimeout(() => flash.remove(), 200);
            }
          }
        }
      }
    }

    // Render active bond banner (only once, on turn 1)
    if (state.turn <= 1 && typeof HeroPersonality !== 'undefined') {
      try {
        const bondContainer = document.getElementById('battle-bond-display');
        if (bondContainer && !bondContainer.dataset.rendered) {
          const teamIds = state.player.filter(f => f).map(f => f.id);
          bondContainer.innerHTML = HeroPersonality.renderBattleBondBanner(teamIds);
          bondContainer.dataset.rendered = '1';
        }
      } catch(e) {}
    }

    // Sync BattleUI state and process VFX through HTML/CSS renderer
    try {
      if (typeof BattleUI !== 'undefined' && BattleUI._active) {
        BattleUI.renderFighters(state);
        if (Battle.vfx && Battle.vfx.length > 0) {
          BattleUI.processVFX(Battle.vfx);
        }
      }
    } catch(e) { /* BattleUI errors should never break gameplay */ }

    // Sync canvas fighter state (HP/rage/alive) and process VFX
    try {
      if (typeof BattleCanvas !== 'undefined' && BattleCanvas.running) {
        BattleCanvas.syncState(state);
        if (Battle.vfx && Battle.vfx.length > 0) {
          BattleCanvas.processVFX(Battle.vfx);
          // SVG overlay VFX — premium effects on top
          if (typeof BattleSVGVFX !== 'undefined') {
            try { BattleSVGVFX.processVFX(Battle.vfx); } catch(e2) {}
          }
        }
      }
    } catch(e) { /* VFX errors should never break gameplay */ }
    if (Battle.vfx) Battle.vfx = [];
  },

  async startBattle() {
    document.getElementById('btn-battle-start').classList.add('hidden');
    // Hide pre-battle team preview when battle starts
    const previewEl = document.getElementById('battle-team-preview');
    if (previewEl) previewEl.style.display = 'none';

    // Show strategy card selection overlay before battle
    if (typeof Strategy !== 'undefined') {
      const selectedCards = await new Promise(resolve => {
        Strategy.showSelection(resolve);
      });
      // Apply strategy effects
      if (selectedCards && selectedCards.length > 0) {
        Strategy.applyPreBattle(Battle.state, selectedCards);
      } else {
        Strategy.applyPreBattle(Battle.state, []);
      }
      // Re-render after strategy effects applied
      this.renderBattleField();
    }

    Battle.onUpdate = (state) => {
      this.renderBattleField();
      const logEl = document.getElementById('battle-log');
      const recentLogs = Battle.log.slice(-15);
      logEl.innerHTML = recentLogs.map(l => '<div class="log-entry ' + App._logClass(l.msg) + '">' + l.msg + '</div>').join('');
      logEl.scrollTop = logEl.scrollHeight;
    };

    // Show leader battle quote
    const team = Storage.getTeam().filter(Boolean);
    if (team.length > 0) {
      this._showBattleQuote(team[0]);
    }

    // Show speed controls during battle
    this._battleSpeed = this._battleSpeed || 1;
    const spdBar = document.getElementById('battle-speed-bar');
    if (spdBar) spdBar.style.display = 'flex';
    const startBtn = document.getElementById('btn-battle-start');
    if (startBtn) startBtn.style.display = 'none';

    const result = await Battle.run(this._battleSpeed);
    // Hide speed controls, show start button again for next battle
    const spdBar2 = document.getElementById('battle-speed-bar');
    if (spdBar2) spdBar2.style.display = 'none';
    const startBtn2 = document.getElementById('btn-battle-start');
    if (startBtn2) startBtn2.style.display = '';
    // Reset strategy state
    if (typeof Strategy !== 'undefined') Strategy.reset();
    const modal = document.getElementById('result-modal');
    const stage = this.currentStage;

    if (result === 'victory') {
      document.getElementById('result-icon').innerHTML = '<span style="font-size:48px;color:var(--gold)">胜</span>';
      document.getElementById('result-title').textContent = '胜利！';
      // Check if stage was already cleared (replay exploit prevention)
      const progress = Storage.getCampaignProgress();
      const stageChapterId = (stage._chapter || Campaign.getCurrentChapter()).id;
      const alreadyCleared = stageChapterId < progress.chapter || (stageChapterId === progress.chapter && stage.id < progress.stage);
      const replayMult = alreadyCleared ? 0.1 : 1; // 10% rewards for replayed stages
      // Strategy: Empty Fort reduced loot
      const stratReducedLoot = typeof Strategy !== 'undefined' && Strategy.isReducedLoot();
      const goldReward = Math.floor((stratReducedLoot ? Math.floor(stage.reward.gold * 0.5) : stage.reward.gold) * replayMult);
      const expReward = Math.floor((stratReducedLoot ? Math.floor(stage.reward.exp * 0.5) : stage.reward.exp) * replayMult);
      Storage.addGold(goldReward);
      Storage.addExp(expReward);
      // Gold gain float animation
      if (goldReward > 0) this.showGoldGain(goldReward);
      const shardCount = alreadyCleared ? 0 : (stratReducedLoot ? 1 : 3);
      if (stage.reward.hero_shard && shardCount > 0) Storage.addShards(stage.reward.hero_shard, shardCount);
      Campaign.completeStage(stage.id, stageChapterId);

      let resultText = '+' + goldReward + '金 +' + expReward + '经验' + (stage.reward.hero_shard && shardCount > 0 ? (stratReducedLoot ? ' +1碎片' : ' +3碎片') : '') + (stratReducedLoot ? ' (空城计减半)' : '') + (alreadyCleared ? ' (重复通关减少奖励)' : '');

      // v3: Equipment drop
      if (typeof Equipment !== 'undefined') {
        const chapter = Campaign.getCurrentChapter();
        const drop = Equipment.generateDrop(chapter.id, !!stage.boss);
        if (drop) {
          const added = Storage.addEquipment(drop);
          if (added === false) {
            resultText += '\n装备库已满(上限500)，请先分解旧装备！';
          } else {
            const tmpl = Equipment.TEMPLATES[drop.templateId];
            const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1];
            resultText += '\n获得装备: ' + (tmpl?.emoji || '') + ' ' + (tmpl?.name || '???') + ' (' + rarInfo.label + ')';
          }
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
        if (newAch.length > 0) setTimeout(() => this.toast('新成就: ' + newAch.map(a => a.name).join(', '), 3000), 1500);
      }
    } else {
      document.getElementById('result-icon').innerHTML = '<span style="font-size:48px;color:var(--hp)">败</span>';
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
    try {
    const roster = Storage.getRoster();
    const list = document.getElementById('roster-list');
    list.innerHTML = '';

    for (const [id, data] of Object.entries(roster)) {
      const hero = HEROES[id];
      if (!hero) continue;
      const stars = data.stars || hero.rarity;
      const div = document.createElement('div');
      div.className = 'hero-card rarity-' + hero.rarity;
      div.setAttribute('data-rarity', String(hero.rarity));
      const rarityLabels = {1:'N',2:'R',3:'SR',4:'SSR',5:'UR'};
      div.innerHTML = '<span class="hero-rarity-badge rarity-' + (rarityLabels[hero.rarity]||hero.rarity) + '">' + (rarityLabels[hero.rarity]||'') + '</span>' +
        '<div class="hero-emoji">' + Visuals.heroPortrait(id, 'sm', hero.rarity) + '</div>' +
        '<div class="hero-info">' +
          '<div class="hero-name">' + hero.name + (hero.title ? ' · ' + hero.title : '') + '</div>' +
          '<div class="hero-sub">Lv.' + data.level + ' · ' + Visuals.unitIcon(hero.unit) + ' ' + (UNIT_TYPES[hero.unit]?.name || '') + ' · ' + Visuals.factionIcon(hero.faction) + ' ' + (FACTIONS[hero.faction]?.name || '') + '</div>' +
          '<div class="hero-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</div>' +
        '</div>' +
        '<div class="text-dim" style="font-size:18px">›</div>';
      div.onclick = () => this.showHeroDetail(id);
      list.appendChild(div);
    }

    if (Object.keys(roster).length === 0) {
      list.innerHTML = '<div class="text-center text-dim" style="padding:40px">还没有武将，去求贤馆招募吧！</div>';
    }
    } catch(e) { console.error('[renderRoster]', e); }
  },

  // ===== HERO DETAIL (v2) =====
  showHeroDetail(heroId) {
    this.currentDetailHero = heroId;
    // Switch page FIRST so user always sees something
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-hero-detail').classList.add('active');
    // Then render content (with error protection)
    try {
      this.renderHeroDetail(heroId);
    } catch(e) {
      console.error('[showHeroDetail] render error:', e);
      document.getElementById('hero-detail-content').innerHTML =
        '<div class="card" style="text-align:center;padding:24px">' +
          '<div style="font-size:16px;margin-bottom:8px">武将详情加载失败</div>' +
          '<div class="text-dim" style="font-size:12px">' + (e.message || '') + '</div>' +
          '<button class="btn btn-sm mt-16" onclick="App.switchPage(\'roster\')" style="background:var(--card2);color:var(--text)">← 返回</button>' +
        '</div>';
    }
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
        '<div class="hp-detail-bg r' + hero.rarity + '">' + Visuals.heroPortrait(heroId, 'lg', hero.rarity) + '</div>' +
        '<div class="hd-name">' + hero.name + '</div>' +
        '<div class="hd-title-text">' + (hero.title || '') + '</div>' +
        '<div class="hd-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</div>' +
        '<div class="hd-meta">' + Visuals.unitIcon(hero.unit) + ' ' + (UNIT_TYPES[hero.unit]?.name || '') +
          ' · ' + Visuals.factionIcon(hero.faction) + ' ' + (FACTIONS[hero.faction]?.name || '') + ' · Lv.' + level +
          (typeof HERO_ELEMENTS !== 'undefined' && HERO_ELEMENTS[heroId]
            ? ' · ' + Visuals.elemBadge(HERO_ELEMENTS[heroId])
            : '') + '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:12px">' + Visuals.secIcon('stats') + ' 战斗属性</div>' +
        '<div class="stat-grid">' +
          '<div class="stat-row"><span class="stat-label">HP 生命</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-hp" style="width:' + Math.min(100, stats.hp / 20) + '%"></div></div><span class="stat-val">' + stats.hp + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">ATK 攻击</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-atk" style="width:' + Math.min(100, stats.atk / 2) + '%"></div></div><span class="stat-val">' + stats.atk + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">DEF 防御</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-def" style="width:' + Math.min(100, stats.def / 1.5) + '%"></div></div><span class="stat-val">' + stats.def + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">SPD 速度</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-spd" style="width:' + Math.min(100, stats.spd) + '%"></div></div><span class="stat-val">' + stats.spd + '</span></div>' +
          '<div class="stat-row"><span class="stat-label">INT 智力</span><div class="stat-bar-wrap"><div class="stat-bar stat-bar-int" style="width:' + Math.min(100, stats.int / 1.6) + '%"></div></div><span class="stat-val">' + stats.int + '</span></div>' +
        '</div>' +
      '</div>' +

      (hero.skill ? '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px">' + Visuals.secIcon('skill') + ' 技能: ' + hero.skill.name + '</div>' +
        '<div class="text-dim" style="font-size:13px">' + hero.skill.desc + '</div>' +
        '<div style="font-size:11px;color:var(--gold);margin-top:6px">怒气消耗: ' + hero.skill.rage + '</div>' +
      '</div>' : '') +

      (hero.passive ? '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px">' + Visuals.secIcon('passive') + ' 被动: ' + hero.passive.name + '</div>' +
        '<div class="text-dim" style="font-size:13px">' + hero.passive.desc + '</div>' +
      '</div>' : '') +

      '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px">' + Visuals.secIcon('lore') + ' 背景故事</div>' +
        '<div class="text-dim" style="font-size:13px;font-style:italic">"' + hero.lore + '"</div>' +
      '</div>' +

      '<div class="card">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:12px">' + Visuals.secIcon('upgrade') + ' 强化武将</div>' +
        '<div class="upgrade-grid">' +
          '<button class="btn btn-primary upgrade-btn" onclick="App.doLevelUp(\'' + heroId + '\')">' +
            '<div class="upgrade-label">升级</div>' +
            '<div class="upgrade-detail">Lv.' + level + ' → Lv.' + (level + 1) + '</div>' +
            '<div class="upgrade-cost">'+ Visuals.resIcon('gold') + ' ' + levelUpCost + '</div>' +
          '</button>' +
          '<button class="btn btn-gold upgrade-btn" onclick="App.doStarUp(\'' + heroId + '\')"' + (stars >= 5 ? ' disabled' : '') + '>' +
            '<div class="upgrade-label">' + (stars >= 5 ? '已满星' : '升星') + '</div>' +
            '<div class="upgrade-detail">' + (stars >= 5 ? '★★★★★' : '★' + stars + ' → ★' + (stars + 1)) + '</div>' +
            '<div class="upgrade-cost">'+ Visuals.resIcon('shard') + ' ' + (stars >= 5 ? '—' : starUpCost) + ' (拥有' + (data.shards || 0) + ')</div>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Hero Personality & Bonds (with error protection)
      (function(hid) { try { return typeof HeroPersonality !== 'undefined' ? HeroPersonality.renderPersonalitySection(hid) : ''; } catch(e) { console.error('[Personality]', e); return ''; } })(heroId) +
      (function(hid) { try { return typeof HeroPersonality !== 'undefined' ? HeroPersonality.renderBondSection(hid) : ''; } catch(e) { console.error('[Bonds]', e); return ''; } })(heroId) +

      // v3: Equipment slots (with error protection)
      (function(self, hid) { try { return self._renderHeroEquipSection(hid); } catch(e) { console.error('[EquipSection]', e); return '<div class="card text-dim">装备栏加载失败</div>'; } })(this, heroId) +

      // v5: Skill Tree (with error protection)
      (function(self, hid) { try { return self._renderHeroSkillTreeSection(hid); } catch(e) { console.error('[SkillTree]', e); return '<div class="card text-dim">天赋树加载失败</div>'; } })(this, heroId);
  },

  doLevelUp(heroId) {
    const result = Storage.levelUpHero(heroId);
    if (result.error) { this.toast(result.error); return; }
    this.toast('升级成功！Lv.' + (result.newLevel - 1) + ' → Lv.' + result.newLevel);
    this.renderHeroDetail(heroId);
    this.updateHeader();
  },

  doStarUp(heroId) {
    const result = Storage.starUpHero(heroId);
    if (result.error) { this.toast(result.error); return; }
    this.toast('升星成功！★' + (result.newStars - 1) + ' → ★' + result.newStars);
    this.renderHeroDetail(heroId);
    this.updateHeader();
  },

  // ===== TEAM =====
  renderTeam() {
    try { this._renderTeamInner(); } catch(e) { console.error('[renderTeam]', e); }
  },

  selectedSlot: -1, // which team slot is selected for hero assignment

  _renderTeamInner() {
    const team = Storage.getTeam();
    const roster = Storage.getRoster();

    const slotsEl = document.getElementById('team-slots');
    slotsEl.innerHTML = '';

    const labels = ['前排①', '前排②', '后排①', '后排②', '后排③'];
    team.forEach((heroId, i) => {
      const hero = heroId ? HEROES[heroId] : null;
      const div = document.createElement('div');
      const isSelected = this.selectedSlot === i;
      div.className = 'hero-card' + (hero ? ' rarity-' + hero.rarity : '') + (isSelected ? ' slot-selected' : '') + (i < 2 ? ' team-slot front-row' : ' team-slot back-row') + (hero ? ' has-hero' : '');
      if (hero) div.setAttribute('data-rarity', String(hero.rarity));
      if (isSelected) div.style.cssText = 'border:2px solid var(--gold);box-shadow:0 0 12px rgba(212,168,67,.5)';

      const rowLabel = i < 2 ? '<span class="row-label front">前排</span> ' : '<span class="row-label back">后排</span> ';
      if (hero) {
        const rarityLabels = {1:'N',2:'R',3:'SR',4:'SSR',5:'UR'};
        div.innerHTML = '<span class="hero-rarity-badge rarity-' + (rarityLabels[hero.rarity]||hero.rarity) + '">' + (rarityLabels[hero.rarity]||'') + '</span>' +
          '<div class="hero-emoji">' + Visuals.heroPortrait(heroId, 'sm', hero.rarity) + '</div>' +
          '<div class="hero-info"><div class="hero-name">' + rowLabel + labels[i] + ': ' + hero.name + '</div>' +
          '<div class="hero-sub">' + (UNIT_TYPES[hero.unit]?.name || '') + ' · ' + (FACTIONS[hero.faction]?.name || '') +
          ' <span style="color:var(--dim);font-size:11px">(点击选中换将)</span></div></div>';
      } else {
        div.innerHTML = '<div class="hero-emoji" style="opacity:.5;font-size:28px;color:var(--gold)">+</div>' +
          '<div class="hero-info"><div class="hero-name" style="color:var(--gold)">' + rowLabel + labels[i] + ': ' +
          (isSelected ? '👆 选择下方武将' : '点击添加') + '</div></div>';
      }
      // Both empty and occupied slots are clickable — select slot for assignment
      div.onclick = () => {
        if (this.selectedSlot === i && hero) {
          // Double-click on selected occupied slot = remove hero
          team[i] = null; Storage.saveTeam(team); this.selectedSlot = -1; this.renderTeam();
        } else {
          this.selectedSlot = i;
          this.renderTeam();
        }
      };
      slotsEl.appendChild(div);
    });

    // Hint text (remove old hint first to prevent duplication)
    const oldHint = document.getElementById('team-hint');
    if (oldHint) oldHint.remove();
    const hint = document.createElement('div');
    hint.id = 'team-hint';
    hint.style.cssText = 'text-align:center;font-size:13px;color:var(--dim);margin:12px 0 8px;padding:8px;background:var(--card2);border-radius:8px';
    if (this.selectedSlot >= 0) {
      const slotLabel = labels[this.selectedSlot] || '';
      hint.innerHTML = '👇 点击下方武将放入 <b style="color:var(--gold)">' + slotLabel + '</b>（再点已选槽位可移除）';
    } else {
      hint.textContent = '👆 先点击上方槽位，再点下方武将添加';
    }
    slotsEl.parentElement.insertBefore(hint, document.getElementById('team-available'));

    // Available heroes
    const avail = document.getElementById('team-available');
    avail.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'font-size:14px;font-weight:600;margin-bottom:8px;color:var(--text)';
    header.textContent = '可用武将 (' + Object.keys(roster).filter(id => !team.includes(id) && HEROES[id]).length + ')';
    avail.appendChild(header);

    const heroList = Object.entries(roster)
      .filter(([id]) => !team.includes(id) && HEROES[id])
      .sort((a, b) => (HEROES[b[0]]?.rarity || 0) - (HEROES[a[0]]?.rarity || 0));

    if (heroList.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:20px;color:var(--dim);font-size:13px';
      empty.innerHTML = '没有更多武将了<br><span style="font-size:12px">去 <b style="color:var(--gold);cursor:pointer" onclick="App.switchPage(\'gacha\')">求贤</b> 招募新武将！</span>';
      avail.appendChild(empty);
    }

    for (const [id] of heroList) {
      const hero = HEROES[id];
      const div = document.createElement('div');
      div.className = 'hero-card rarity-' + hero.rarity;
      div.setAttribute('data-rarity', String(hero.rarity));
      div.style.cursor = 'pointer';
      const rarityLabels = {1:'N',2:'R',3:'SR',4:'SSR',5:'UR'};
      div.innerHTML = '<span class="hero-rarity-badge rarity-' + (rarityLabels[hero.rarity]||hero.rarity) + '">' + (rarityLabels[hero.rarity]||'') + '</span>' +
        '<div class="hero-emoji">' + Visuals.heroPortrait(id, 'sm', hero.rarity) + '</div>' +
        '<div class="hero-info"><div class="hero-name">' + hero.name + '</div>' +
        '<div class="hero-sub">' + (UNIT_TYPES[hero.unit]?.name || '') + ' · ' + (FACTIONS[hero.faction]?.name || '') + '</div></div>';
      div.onclick = () => {
        let targetSlot = this.selectedSlot;
        if (targetSlot < 0) {
          // No slot selected — find first empty slot
          targetSlot = team.indexOf(null);
          if (targetSlot === -1) { this.toast('队伍已满！先点击已有武将移除'); return; }
        }
        // If target slot has a hero, swap it out (hero goes back to pool)
        team[targetSlot] = id;
        Storage.saveTeam(team);
        this.selectedSlot = -1;
        this.renderTeam();
        this.toast(hero.name + ' → ' + labels[targetSlot]);
        // Soft formation constraint warning
        if (hero.unit === 'mage' && targetSlot < 2) {
          setTimeout(() => this.toast('提示：法师/术士放后排(位3-5)更安全', 3500), 800);
        } else if (hero.unit === 'shield' && targetSlot >= 2) {
          setTimeout(() => this.toast('提示：盾兵放前排(位1-2)更能发挥作用', 3500), 800);
        }
      };
      avail.appendChild(div);
    }
  },  // end _renderTeamInner

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
      '<div style="font-size:14px;font-weight:600;margin-bottom:12px">编队分析</div>' +
      result.map(h =>
        '<div class="fa-entry">' +
          '<span class="fa-emoji">' + Visuals.heroPortrait(h.id, 'xs', h.hero.rarity) + '</span>' +
          '<span class="fa-name">' + h.hero.name + '</span>' +
          '<span class="fa-reasons">' + h.reasons.join(', ') + '</span>' +
        '</div>'
      ).join('') +
    '</div>';

    this.renderTeam();
    this.toast('智能编队完成！');
  },

  // ===== GACHA =====
  renderGacha() {
    try { this._renderGachaInner(); } catch(e) { console.error('[renderGacha]', e); }
  },

  _renderGachaInner() {
    const list = document.getElementById('gacha-list');
    list.innerHTML = '';

    // Standard Banner Pull Section
    const pullState = Gacha.getPullState();
    const player = Storage.getPlayer();
    const bannerDiv = document.createElement('div');
    bannerDiv.className = 'card card-glow';
    bannerDiv.style.cssText = 'border-color:var(--gold);margin-bottom:16px';
    bannerDiv.innerHTML =
      '<div style="text-align:center;margin-bottom:12px">' +
        '<div style="font-size:18px;font-weight:700;color:var(--gold)">召</div>' +
        '<div style="font-size:16px;font-weight:700;color:var(--gold)">天命召唤</div>' +
        '<div class="text-dim" style="font-size:12px;margin-top:4px">SSR概率2% · 保底90抽 · 首次十连保底SR+</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:8px;background:var(--card2);border-radius:10px">' +
        '<div style="font-size:12px">' +
          '<span class="text-dim">已抽: </span><b>' + pullState.totalPulls + '</b>' +
          '<span class="text-dim" style="margin-left:12px">距保底: </span><b style="color:var(--gold)">' + (Gacha.SSR_PITY - pullState.pity) + '</b>' +
        '</div>' +
        '<div class="progress" style="width:80px;height:6px"><div class="progress-fill" style="width:' + (pullState.pity / Gacha.SSR_PITY * 100) + '%;background:linear-gradient(90deg,var(--accent),var(--gold))"></div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
        '<button class="btn btn-primary" onclick="App.doGachaPull(1)">单抽 · ' + Visuals.resIcon('gold') + Gacha.PULL_COST + '</button>' +
        '<button class="btn btn-gold" onclick="App.doGachaPull(10)">十连 · ' + Visuals.resIcon('gold') + Gacha.TEN_PULL_COST + '</button>' +
      '</div>' +
      '<div style="text-align:center;margin-top:8px">' +
        '<div class="text-dim" style="font-size:11px">SSR: 关羽 曹操 赵云 吕布 | SR: 刘备 张飞 孙尚香 貂蝉 张角</div>' +
      '</div>';
    list.appendChild(bannerDiv);

    // Pull result container
    const resultDiv = document.createElement('div');
    resultDiv.id = 'gacha-pull-result';
    resultDiv.className = 'hidden';
    list.appendChild(resultDiv);

    // Section divider
    const divider = document.createElement('div');
    divider.style.cssText = 'font-size:15px;font-weight:600;margin:16px 0 8px;color:var(--gold)';
    divider.textContent = '三顾茅庐 — 对话招募';
    list.appendChild(divider);

    for (const [id, visit] of Object.entries(Gacha.VISITS)) {
      const hero = HEROES[id];
      if (!hero) continue;
      const owned = Storage.getRoster()[id];
      const status = Gacha.getVisitStatus(id);
      // Feature 5: Check if blocked by Destiny
      const blocked = typeof Destiny !== 'undefined' && Destiny.isHeroBlocked(id);

      const div = document.createElement('div');
      div.className = 'hero-card rarity-' + hero.rarity;
      div.setAttribute('data-rarity', String(hero.rarity));
      // Feature 5: Show pity progress indicator
      const pityInfo = status.failedVisits > 0
        ? ' · <span style="color:' + (status.pityGuaranteed ? 'var(--gold)' : 'var(--dim)') + '">诚意' + status.failedVisits + '/' + status.pityThreshold + (status.pityGuaranteed ? ' 必成!' : '') + '</span>'
        : '';
      const rarityLabelsG = {1:'N',2:'R',3:'SR',4:'SSR',5:'UR'};
      div.innerHTML = '<span class="hero-rarity-badge rarity-' + (rarityLabelsG[hero.rarity]||hero.rarity) + '">' + (rarityLabelsG[hero.rarity]||'') + '</span>' +
        '<div class="hero-emoji">' + Visuals.heroPortrait(id, 'sm', hero.rarity) + '</div>' +
        '<div class="hero-info">' +
          '<div class="hero-name">' + hero.name + ' · ' + hero.title +
            (owned ? ' <span style="color:var(--shu)">已有</span>' : '') +
            (blocked ? ' <span style="color:var(--hp)">不可招募</span>' : '') + '</div>' +
          '<div class="hero-sub">' + visit.hint + '</div>' +
          '<div style="margin-top:4px;font-size:11px">' + Visuals.resIcon('gold') + visit.cost + ' · 拜访' + visit.dialogues + '次 · ' + '★'.repeat(hero.rarity) +
          (status.attempts > 0 ? ' · 已访' + status.attempts + '次' : '') + pityInfo + '</div>' +
        '</div>';
      if (!blocked) div.onclick = () => this.startVisit(id);
      list.appendChild(div);
    }
  },  // end _renderGachaInner

  startVisit(heroId) {
    const result = Gacha.startVisit(heroId);
    if (!result) return;
    if (result.error) { this.toast(result.error); return; }

    // v2: Track gacha mission
    DailyMissions.trackProgress('gacha');

    this.currentVisitHero = heroId;
    document.getElementById('visit-hero-name').textContent = '拜访 ' + result.hero.name;
    document.getElementById('visit-hero-display').innerHTML =
      Visuals.heroPortrait(heroId, 'lg', result.hero.rarity) +
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

    // Feature 5: Pity progress indicator
    const pityHtml = status.failedVisits > 0
      ? '<div style="margin-top:8px;padding:6px 10px;background:var(--card2);border-radius:8px;font-size:11px">' +
          '<span style="color:var(--dim)">坚持拜访: </span>' +
          '<span style="color:' + (status.pityGuaranteed ? 'var(--gold);font-weight:600' : 'var(--text)') + '">' +
          status.failedVisits + '/' + status.pityThreshold +
          (status.pityGuaranteed ? ' (下次必定成功!)' : '') + '</span>' +
          '<div class="progress mt-4" style="height:4px"><div class="progress-fill" style="width:' + Math.min(100, status.failedVisits / status.pityThreshold * 100) + '%;background:linear-gradient(90deg,var(--accent),var(--gold))"></div></div>' +
        '</div>'
      : '';
    // Feature 5: Already-owned indicator
    const ownedHtml = status.isOwned
      ? '<div style="margin-top:6px;font-size:11px;color:var(--shu);text-align:center">已拥有此武将，再次招募将获得碎片</div>'
      : '';

    if (d) {
      box.innerHTML = '<div class="dialogue-text">' + d.text + '</div>' +
        '<div class="dialogue-options">' +
        d.options.map((o, i) => '<div class="dialogue-option" onclick="App.makeGachaChoice(' + i + ')">' + o.text + '</div>').join('') +
        '</div>' + pityHtml + ownedHtml;
    } else {
      box.innerHTML = '<div class="text-center" style="padding:20px">' +
        '<div class="text-dim">本次拜访结束</div>' +
        '<div class="mt-8">诚意度: ' + status.sincerity + '</div>' +
        pityHtml + ownedHtml +
        '<button class="btn btn-gold btn-block mt-16" onclick="App.startVisit(\'' + heroId + '\')">再次拜访 (' + Visuals.resIcon('gold') + visit.cost + ')</button>' +
        '<button class="btn btn-sm btn-block mt-8" onclick="App.switchPage(\'gacha\')" style="background:var(--card2);color:var(--text)">返回求贤馆</button>' +
        '</div>';
    }
  },

  makeGachaChoice(idx) {
    const result = Gacha.makeChoice(this.currentVisitHero, idx);
    if (!result) return;

    // Update sincerity display without overwriting dialogue
    const visit = Gacha.VISITS[this.currentVisitHero];
    const maxSincerity = visit.rarity === 5 ? 90 : visit.rarity === 4 ? 60 : 40;
    document.getElementById('visit-sincerity').textContent = result.sincerity;
    document.getElementById('visit-sincerity-bar').style.width = Math.min(100, result.sincerity / maxSincerity * 100) + '%';

    const box = document.getElementById('visit-dialogue');

    if (result.recruited) {
      const hero = HEROES[this.currentVisitHero];
      const shardMsg = result.shardsGiven > 0
        ? '<div class="text-center mt-8" style="font-size:13px;color:var(--shu)">已拥有，获得 ' + result.shardsGiven + ' 碎片！</div>'
        : '';
      const pityMsg = result.pityTriggered
        ? '<div class="text-center mt-4" style="font-size:12px;color:var(--gold)">诚意打动了对方！(保底触发)</div>'
        : '';
      box.innerHTML = '<div class="dialogue-text" style="color:var(--gold);font-size:15px">' + result.response + '</div>' +
        pityMsg +
        '<div class="recruit-success" style="text-align:center;margin:16px 0">' + Visuals.heroPortrait(this.currentVisitHero, 'xl') + '</div>' +
        '<div class="text-center" style="font-size:16px;font-weight:700;color:var(--gold)">' +
          (result.shardsGiven > 0 ? hero.name + ' 赠送了碎片！' : hero.name + ' 加入了你的队伍！') + '</div>' +
        shardMsg +
        '<button class="btn btn-gold btn-block mt-16" onclick="App.switchPage(\'roster\')">查看武将</button>';
      this.toast(result.shardsGiven > 0 ? hero.name + ' 碎片 x' + result.shardsGiven : hero.name + ' 加入了你的队伍！', 4000);
    } else {
      // Feature 5: Show pity progress on failure
      const pityInfo = result.pityProgress > 0
        ? '<div style="margin-top:8px;padding:6px 10px;background:var(--card2);border-radius:8px;font-size:11px;text-align:center">' +
            '<span style="color:var(--dim)">坚持拜访: </span>' +
            '<span style="color:' + (result.pityProgress >= result.pityThreshold ? 'var(--gold);font-weight:600' : 'var(--text)') + '">' +
            result.pityProgress + '/' + result.pityThreshold +
            (result.pityProgress >= result.pityThreshold ? ' (下次必定成功!)' : '') + '</span>' +
          '</div>'
        : '';
      // Show response first -- player must click "continue" to advance
      box.innerHTML = '<div class="dialogue-text">' + result.response + '</div>' +
        '<div class="text-dim text-center mt-8" style="font-size:12px">诚意度 ' + (result.choice.sincerity >= 0 ? '+' : '') + result.choice.sincerity + '</div>' +
        (result.visitComplete
          ? '<div class="text-center mt-16">' +
              '<div style="font-size:14px;font-weight:600;color:var(--hp)">招募失败</div>' +
              '<div class="text-dim mt-8">诚意不足，下次再努力！</div>' +
              pityInfo +
              '<button class="btn btn-gold btn-block mt-16" onclick="App.startVisit(\'' + this.currentVisitHero + '\')">再次拜访 (' + Visuals.resIcon('gold') + visit.cost + ')</button>' +
              '<button class="btn btn-sm btn-block mt-8" onclick="App.switchPage(\'gacha\')" style="background:var(--card2);color:var(--text)">返回求贤馆</button>' +
            '</div>'
          : '<button class="btn btn-primary btn-block mt-16" onclick="App.updateVisitUI()">继续</button>'
        );
    }
    this.updateHeader();
  },

  // ===== GACHA PULL =====
  doGachaPull(count) {
    const result = Gacha.pull(count);
    if (result.error) { this.toast(result.error); return; }
    DailyMissions.trackProgress('gacha');

    // Launch cinematic gacha reveal
    this._gachaReveal(result, count);
    this.updateHeader();

    // Check achievements
    if (typeof Achievements !== 'undefined') {
      setTimeout(() => {
        const newAch = Achievements.checkAll();
        if (newAch.length > 0) this.toast('新成就: ' + newAch.map(a => a.name).join(', '));
      }, 3000);
    }
  },

  _gachaReveal(result, count) {
    const rarityNames = { 5: 'SSR', 4: 'SR', 3: 'R' };
    const rarityColors = { 5: '#d4a843', 4: '#a855f7', 3: '#3b82f6' };
    const rarityBg = { 5: 'radial-gradient(ellipse at center, #2a2210 0%, #0a0a0a 70%)', 4: 'radial-gradient(ellipse at center, #1a1028 0%, #0a0a0a 70%)', 3: 'radial-gradient(ellipse at center, #0a1528 0%, #0a0a0a 70%)' };

    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.className = 'gacha-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;display:flex;align-items:center;justify-content:center;flex-direction:column;opacity:0;transition:opacity 0.4s';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.style.opacity = '1');

    // Phase 1: Anticipation — swirling energy
    const bestRarity = result.bestRarity;
    overlay.style.background = rarityBg[bestRarity] || rarityBg[3];
    overlay.innerHTML = `
      <div class="gacha-stage" style="position:relative;width:100%;max-width:400px;text-align:center">
        <div class="gacha-orb" style="width:120px;height:120px;margin:0 auto;border-radius:50%;
          background:radial-gradient(circle, ${rarityColors[bestRarity]}44 0%, transparent 70%);
          border:2px solid ${rarityColors[bestRarity]}66;
          animation:gachaPulse 1s ease-in-out infinite;
          box-shadow:0 0 60px ${rarityColors[bestRarity]}33, inset 0 0 30px ${rarityColors[bestRarity]}22">
        </div>
        <div style="margin-top:24px;font-size:13px;color:${rarityColors[bestRarity]};opacity:0.6;letter-spacing:4px">
          ${bestRarity === 5 ? '金光乍现...' : bestRarity === 4 ? '紫气东来...' : '天命召唤...'}
        </div>
      </div>
      <style>
        @keyframes gachaPulse { 0%,100% { transform:scale(1); box-shadow:0 0 60px ${rarityColors[bestRarity]}33; } 50% { transform:scale(1.15); box-shadow:0 0 100px ${rarityColors[bestRarity]}55; } }
        @keyframes gachaExplode { 0% { transform:scale(1); opacity:1; } 100% { transform:scale(3); opacity:0; } }
        @keyframes gachaCardIn { 0% { transform:scale(0) rotateY(180deg); opacity:0; } 60% { transform:scale(1.1) rotateY(10deg); opacity:1; } 100% { transform:scale(1) rotateY(0); opacity:1; } }
        @keyframes gachaShine { 0% { left:-100%; } 100% { left:200%; } }
        @keyframes gachaFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        .gacha-card-reveal { animation: gachaCardIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
        .gacha-card-reveal:nth-child(2) { animation-delay:0.1s; }
        .gacha-card-reveal:nth-child(3) { animation-delay:0.15s; }
        .gacha-card-reveal:nth-child(4) { animation-delay:0.2s; }
        .gacha-card-reveal:nth-child(5) { animation-delay:0.25s; }
        .gacha-card-reveal:nth-child(6) { animation-delay:0.3s; }
        .gacha-card-reveal:nth-child(7) { animation-delay:0.35s; }
        .gacha-card-reveal:nth-child(8) { animation-delay:0.4s; }
        .gacha-card-reveal:nth-child(9) { animation-delay:0.45s; }
        .gacha-card-reveal:nth-child(10) { animation-delay:0.5s; }
      </style>
    `;

    // Phase 2: Explosion → card reveal
    setTimeout(() => {
      // Explosion flash
      const flash = document.createElement('div');
      flash.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle, ${rarityColors[bestRarity]} 0%, transparent 70%);animation:gachaExplode 0.8s ease-out forwards;pointer-events:none;z-index:1`;
      overlay.appendChild(flash);

      setTimeout(() => {
        // Build card grid
        let cardsHtml = '<div style="display:grid;grid-template-columns:repeat(' + Math.min(5, count) + ',1fr);gap:8px;padding:16px;max-width:400px;width:100%">';
        for (const r of result.results) {
          const rc = rarityColors[r.rarity];
          cardsHtml += `<div class="gacha-card-reveal" style="text-align:center;padding:10px 4px;
            background:linear-gradient(145deg, #1a1a2e, #16213e);
            border-radius:12px;border:2px solid ${rc};position:relative;overflow:hidden;
            box-shadow:0 4px 20px ${rc}44">
            <div style="position:absolute;top:0;left:-100%;width:60%;height:100%;
              background:linear-gradient(90deg,transparent,${rc}22,transparent);
              animation:gachaShine 2s 1s infinite"></div>
            ${Visuals.heroPortrait(r.heroId, 'md', r.rarity)}
            <div style="font-size:11px;font-weight:700;color:${rc};margin-top:4px;letter-spacing:1px">${rarityNames[r.rarity]}</div>
            <div style="font-size:12px;font-weight:600;color:#f0e6d3">${r.hero.name}</div>
            <div style="font-size:10px;color:${r.isNew ? '#d4a843' : '#666'}">${r.isNew ? '✦ 新武将' : '+' + r.shards + '碎片'}</div>
          </div>`;
        }
        cardsHtml += '</div>';

        // Result summary
        const summaryHtml = `
          <div style="text-align:center;margin-top:16px;font-size:13px;color:#888">
            花费 ${result.cost} ${Visuals.resIcon('gold')} · 距SSR保底: ${Gacha.SSR_PITY - result.pity}抽
          </div>
          <button onclick="this.closest('.gacha-overlay').remove()" style="
            margin-top:20px;padding:12px 48px;border:1px solid ${rarityColors[bestRarity]};
            background:transparent;color:${rarityColors[bestRarity]};border-radius:24px;
            font-size:14px;font-weight:600;cursor:pointer;letter-spacing:2px;
            transition:all 0.3s;backdrop-filter:blur(4px)">
            确 认
          </button>
        `;

        overlay.innerHTML = `
          <div style="text-align:center;font-size:20px;font-weight:700;color:${rarityColors[bestRarity]};margin-bottom:8px;letter-spacing:3px;
            text-shadow:0 0 20px ${rarityColors[bestRarity]}66">
            ${bestRarity === 5 ? '⚡ SSR ⚡' : bestRarity === 4 ? '✦ SR ✦' : '— R —'}
          </div>
          ${cardsHtml}${summaryHtml}
          <style>
            @keyframes gachaCardIn { 0% { transform:scale(0) rotateY(180deg); opacity:0; } 60% { transform:scale(1.1) rotateY(10deg); opacity:1; } 100% { transform:scale(1) rotateY(0); opacity:1; } }
            @keyframes gachaShine { 0% { left:-100%; } 100% { left:200%; } }
            .gacha-card-reveal { animation: gachaCardIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
            .gacha-card-reveal:nth-child(2) { animation-delay:0.08s; }
            .gacha-card-reveal:nth-child(3) { animation-delay:0.16s; }
            .gacha-card-reveal:nth-child(4) { animation-delay:0.24s; }
            .gacha-card-reveal:nth-child(5) { animation-delay:0.32s; }
            .gacha-card-reveal:nth-child(6) { animation-delay:0.4s; }
            .gacha-card-reveal:nth-child(7) { animation-delay:0.48s; }
            .gacha-card-reveal:nth-child(8) { animation-delay:0.56s; }
            .gacha-card-reveal:nth-child(9) { animation-delay:0.64s; }
            .gacha-card-reveal:nth-child(10) { animation-delay:0.72s; }
          </style>
        `;
      }, 400);
    }, 1500);
  },

  // ===== LEADERBOARD (v2 + kingdom war) =====
  renderLeaderboard() {
    try { this._renderLeaderboardInner(); } catch(e) { console.error('[renderLeaderboard]', e); }
  },

  _renderLeaderboardInner() {
    const rankings = Leaderboard.getRankings();
    document.getElementById('lb-reset').textContent = Leaderboard.getResetCountdown();

    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    // Kingdom war summary
    if (typeof KingdomSystem !== 'undefined') {
      const kWar = KingdomSystem.getKingdomWar();
      const playerK = Storage.getKingdom();
      let kwHTML = '<div class="card card-glow" style="margin-bottom:12px"><div style="font-size:14px;font-weight:600;margin-bottom:10px"> 势力战争 · 本周</div>';
      kWar.forEach(k => {
        const isPlayer = k.id === playerK;
        kwHTML += '<div class="kw-row' + (isPlayer ? ' kw-mine' : '') + '">' +
          '<span class="kw-rank">' + (k.rank <= 3 ? ['①','②','③'][k.rank-1] : k.rank) + '</span>' +
          '<span class="kw-emoji" style="color:' + k.color + '">' + k.banner + '</span>' +
          '<span class="kw-name">' + k.name + (isPlayer ? ' <span class="lb-you">你</span>' : '') + '</span>' +
          '<span class="kw-power">' + k.power + '</span></div>';
      });
      kwHTML += '</div>';
      list.innerHTML += kwHTML;
    }

    rankings.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'lb-entry' + (entry.isPlayer ? ' lb-player' : '');

      const rankDisplay = entry.rank <= 3
        ? ['①', '②', '③'][entry.rank - 1]
        : '<span class="lb-rank-num">' + entry.rank + '</span>';

      const armyEmojis = entry.army.map(id => HEROES[id]?.emoji || '?').join(' ');

      div.innerHTML =
        '<div class="lb-rank">' + rankDisplay + '</div>' +
        '<div class="lb-info">' +
          '<div class="lb-name">' + entry.emoji + ' ' + entry.name + (entry.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div>' +
          '<div class="lb-meta">统帅: ' + entry.leader + '</div>' +
          '<div class="lb-army">' + armyEmojis + '</div>' +
        '</div>' +
        '<div class="lb-stats">' +
          '<div class="lb-power">' + entry.power + '</div>' +
          '<div class="lb-winrate">胜率 ' + entry.winRate + '%</div>' +
          '<div class="lb-progress">进度 ' + entry.progress + '</div>' +
        '</div>';

      list.appendChild(div);
    });
  },  // end _renderLeaderboardInner

  // ===== DAILY MISSIONS (v2) =====
  renderDailyMissions() {
    try {
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
          (claimed ? '<span class="dm-done" style="color:var(--shu)">完成</span>' :
           complete ? '<button class="btn btn-sm btn-gold" onclick="App.claimMission(\'' + def.id + '\')">' + def.rewardText + '</button>' :
           '<span class="text-dim" style="font-size:12px">' + def.rewardText + '</span>') +
        '</div>' +
      '</div>';
    }).join('');
    } catch(e) { console.error('[renderDailyMissions]', e); }
  },

  claimMission(missionId) {
    const success = DailyMissions.claimReward(missionId);
    if (success) {
      const def = DailyMissions.MISSIONS.find(m => m.id === missionId);
      this.toast('领取奖励: ' + def.rewardText);
      this.renderDailyMissions();
      this.updateHeader();
    }
  },

  // ===== KINGDOM CARD (stub) =====
  renderKingdomCard() {
    // Kingdom card is shown on the home page — no-op if no kingdom selected yet
  },

  _renderDestinyHomeCard() {
    try {
      if (typeof Destiny === 'undefined') return;
      const state = Destiny.initState();
      const choices = state.choices || {};
      const madeCount = Object.keys(choices).length;
      if (madeCount === 0) return; // Don't show if no choices made yet

      const totalChoices = Destiny.CHOICES.length;
      const title = Destiny.getCurrentTitle();

      // Find or create the destiny card container
      let container = document.getElementById('destiny-home-card-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'destiny-home-card-container';
        // Insert after idle card
        const idleCard = document.getElementById('idle-card');
        if (idleCard && idleCard.parentElement) {
          idleCard.parentElement.insertBefore(container, idleCard.nextSibling);
        } else {
          document.getElementById('page-home').appendChild(container);
        }
      }

      container.innerHTML =
        '<div class="destiny-home-card" onclick="App.switchPage(\'profile\')">' +
          '<div class="destiny-home-title">⭐ 天命录</div>' +
          '<div class="destiny-home-subtitle">' + (title ? '称号：' + title : '每一个选择，都塑造了不同的三国') + '</div>' +
          '<div class="destiny-home-stats">' +
            '<div class="destiny-home-stat">抉择 <b>' + madeCount + '/' + totalChoices + '</b></div>' +
            '<div class="destiny-home-stat">声望 <b>' + (state.reputation || 0) + '</b></div>' +
          '</div>' +
        '</div>';
    } catch(e) { console.error('[DestinyHomeCard]', e); }
  },

  // ===== DUNGEON =====
  renderDungeon() {
    try {
      const p = Storage.getPlayer();
      document.getElementById('dg-gold').textContent = p.gold;
      document.getElementById('dg-gems').textContent = p.gems;
      this.switchDungeonTab(this.currentDungeonTab);
    } catch(e) { console.error('[renderDungeon]', e); }
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
        '<div style="font-size:24px;margin-bottom:16px">' + Visuals.secIcon('lock') + '</div>' +
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
          (floorData.isBossFloor ? Visuals.bossSkull() + ' ' : Visuals.secIcon('battle') + ' ') + floorData.name +
        '</div>' +
        '<div class="text-dim" style="font-size:12px;margin-bottom:8px">' +
          '地形: ' + ({plains:'平原',mountain:'山地',river:'水域',forest:'森林',castle:'城池'}[floorData.terrain]||floorData.terrain) + ' · 天气: ' + ({clear:'晴天',rain:'雨天',fog:'雾天',wind:'大风',fire:'火烧'}[floorData.weather]||floorData.weather) + ' · 难度x' + floorData.scaleMult.toFixed(2) +
        '</div>';

      if (floorData.isEventFloor && floorData.event) {
        html += '<div style="background:var(--card2);padding:12px;border-radius:10px;margin-bottom:12px">' +
          '<div style="font-size:14px;font-weight:600">' + floorData.event.emoji + ' ' + floorData.event.name + '</div>' +
          '<div class="text-dim" style="font-size:12px">' + floorData.event.desc + '</div>' +
          '<button class="btn btn-sm btn-primary mt-8" onclick="App.processDungeonEvent(' + floor + ')">处理事件</button>' +
        '</div>';
      }

      html += '<div style="font-size:13px;margin-bottom:8px">敌人: ' +
        floorData.enemies.map(e => HEROES[e]?.emoji || '?').join(' ') + '</div>' +
        '<div style="font-size:12px;color:var(--gold)">奖励: ' + Visuals.resIcon('gold') + floorData.reward.gold + ' ' + Visuals.resIcon('exp') + floorData.reward.exp +
          (floorData.reward.gems ? ' ' + Visuals.resIcon('gem') + floorData.reward.gems : '') + '</div>' +
        '<button class="btn btn-primary btn-block mt-16" onclick="App.fightDungeonFloor()">挑战本层</button>' +
        '<button class="btn btn-sm btn-block mt-8" onclick="App.retreatDungeon()" style="background:var(--card2);color:var(--text)">撤退（保留进度）</button>' +
      '</div>';
    } else {
      html += '<div class="card" style="text-align:center">' +
        '<div style="font-size:32px;font-weight:900;margin-bottom:12px;color:var(--gold)">无尽</div>' +
        '<div style="font-size:18px;font-weight:700">无尽副本</div>' +
        '<div class="text-dim mt-8">无限层数，越深越难，奖励越丰厚</div>' +
        '<div class="text-dim" style="font-size:12px;margin-top:4px">每10层: Boss · 每5层: 随机事件</div>' +
        '<button class="btn btn-gold btn-block mt-16" onclick="App.startEndlessDungeon()">开始挑战</button>' +
      '</div>';
    }

    // Leaderboard
    html += '<div style="font-size:14px;font-weight:600;margin:16px 0 8px"> 深渊排行</div>';
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
      const rank = i < 3 ? ['①', '②', '③'][i] : (i + 1) + '';
      return '<div class="lb-entry' + (e.isPlayer ? ' lb-player' : '') + '">' +
        '<div class="lb-rank">' + rank + '</div>' +
        '<div class="lb-info"><div class="lb-name">' + e.name + (e.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div></div>' +
        '<div class="lb-stats"><div class="lb-power"> 第' + e.floor + '层</div></div>' +
      '</div>';
    }).join('');
  },

  startEndlessDungeon() {
    Dungeon.startRun();
    this.renderDungeon();
    this.toast('无尽副本开始！');
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
      terrain: floorData.terrain,
      weather: floorData.weather,
      _dungeonFloor: true,
      _scaleMult: floorData.isBossFloor ? floorData.boss.scaleMult : floorData.scaleMult,
    };
    this.switchPage('battle');
    requestAnimationFrame(() => this.prepareBattle(this.currentStage));
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
      '<div style="font-size:12px;color:var(--gold)">连续签到: ' + (state.streak || 0) + '天 (奖励+' + Math.min(state.streak || 0, 7) * 5 + '%)</div>' +
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
          (reward.gold ? Visuals.resIcon('gold') + reward.gold + ' ' : '') +
          (reward.exp ? Visuals.resIcon('exp') + reward.exp + ' ' : '') +
          (reward.equipChance ? '装备掉落 ' : '') +
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
      terrain: 'plains',
      weather: 'clear',
      _dailyDungeon: type,
      _scaleMult: data.scaleMult,
    };
    this.switchPage('battle');
    requestAnimationFrame(() => this.prepareBattle(this.currentStage));
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
          (state.defeated ? ' <span style="color:var(--shu)">已击败！</span>' : '') + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;margin:12px 0">' +
        '<div><div style="font-size:11px;color:var(--dim)">今周挑战</div><div style="font-weight:700">' + state.attempts + '/' + Dungeon.MAX_RAID_ATTEMPTS + '</div></div>' +
        '<div><div style="font-size:11px;color:var(--dim)">最高伤害</div><div style="font-weight:700;color:var(--gold)">' + state.bestDamage.toLocaleString() + '</div></div>' +
        '<div><div style="font-size:11px;color:var(--dim)">Boss阶段</div><div style="font-weight:700">' + boss.phases + '阶段</div></div>' +
      '</div>' +
      '<button class="btn btn-gold btn-block" onclick="App.startRaidBoss()"' +
        (!canRaid ? ' disabled style="opacity:.4"' : '') + '>' +
        (state.defeated ? '已击败' : canRaid ? '讨伐Boss' : '本周次数已用完') +
      '</button>' +
    '</div>';

    // Community damage leaderboard
    html += '<div style="font-size:14px;font-weight:600;margin:16px 0 8px"> 讨伐排行</div>';
    for (const entry of communityDmg) {
      html += '<div class="lb-entry' + (entry.isPlayer ? ' lb-player' : '') + '">' +
        '<div style="font-size:18px;min-width:28px;text-align:center">' + entry.emoji + '</div>' +
        '<div class="lb-info"><div class="lb-name">' + entry.name + (entry.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div></div>' +
        '<div class="lb-stats"><div class="lb-power" style="color:var(--hp)"> ' + entry.damage.toLocaleString() + '</div></div>' +
      '</div>';
    }
    return html;
  },

  startRaidBoss() {
    if (!Dungeon.canRaid()) { this.toast('本周次数已用完！'); return; }
    const team = Storage.getTeam().filter(id => id);
    if (team.length === 0) { this.toast('请先编队！'); this.switchPage('team'); return; }

    const boss = Dungeon.getCurrentRaidBoss();
    // Map raid boss IDs to actual hero IDs for battle
    const bossHeroMap = {
      'raid_dongzhuo': 'dongzhuo',
      'raid_yuanshao': 'yuanshao',
      'raid_lvbu_rage': 'lvbu',
      'raid_guandu': 'caocao',
      'raid_chibi': 'zhouyu',
      'raid_wuzhang': 'simayi',
      'raid_hulao': 'lvbu',
      'raid_nanman': 'zhangjiao',  // Use Zhang Jiao as tanky mage stand-in
      'raid_yiling': 'luxun',
      'raid_sima': 'simayi',
    };
    const bossHeroId = bossHeroMap[boss.id] || 'lvbu';
    const bossWeather = boss.element === 'fire' ? 'fire' : boss.element === 'dark' ? 'fog' : 'clear';

    this.currentStage = {
      name: '讨伐 ' + boss.name,
      enemies: ['elite_cavalry', 'strategist', bossHeroId, 'crossbow_corps', 'elite_spear'],
      reward: { gold: 3000, exp: 2000 },
      boss: true,
      terrain: 'plains',
      weather: bossWeather,
      _raidBoss: true,
      _scaleMult: 3.0,
    };
    this.switchPage('battle');
    requestAnimationFrame(() => this.prepareBattle(this.currentStage));
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
      '<div style="font-size:15px;font-weight:600;margin-bottom:8px"> 赛季通行证</div>' +
      '<div class="flex justify-between items-center">' +
        '<div class="text-dim" style="font-size:12px">等级 ' + progress.level + '/' + Seasonal.PASS_LEVELS + '</div>' +
        '<div class="text-dim" style="font-size:12px">XP: ' + progress.xp + '/' + progress.xpNeeded + '</div>' +
      '</div>' +
      '<div class="progress mt-8"><div class="progress-fill" style="width:' + (progress.xp / progress.xpNeeded * 100) + '%;background:' + season.color + '"></div></div>' +
    '</div>';

    // Pass Rewards Preview
    html += '<div class="card">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:8px"> 通行证奖励</div>' +
      '<div style="display:flex;gap:8px;overflow-x:auto;padding:8px 0">';

    const freeLevels = Object.keys(Seasonal.PASS_REWARDS.free).map(Number).sort((a, b) => a - b);
    for (const lvl of freeLevels.slice(0, 8)) {
      const r = Seasonal.PASS_REWARDS.free[lvl];
      const claimed = progress.claimed['free_' + lvl];
      const canClaim = progress.level >= lvl && !claimed;
      html += '<div style="min-width:70px;text-align:center;padding:8px;background:var(--card2);border-radius:10px;border:1px solid ' +
        (canClaim ? 'var(--gold)' : claimed ? 'var(--shu)' : 'var(--border)') + '">' +
        '<div style="font-size:11px;color:var(--dim)">Lv.' + lvl + '</div>' +
        '<div style="font-size:14px;margin:4px 0">' + (r.gold ? Visuals.resIcon('gold') : r.gems ? Visuals.resIcon('gem') : Visuals.resIcon('shard')) + '</div>' +
        '<div style="font-size:10px">' + (r.gold ? r.gold : r.gems ? r.gems : '碎片') + '</div>' +
        (canClaim ? '<div style="font-size:9px;color:var(--gold);margin-top:2px" onclick="App.claimSeasonPass(' + lvl + ')">领取</div>' : '') +
        (claimed ? '<div style="font-size:9px;color:var(--shu)">完成</div>' : '') +
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
      '<div style="font-size:14px;font-weight:600;margin-bottom:8px"> 赛季成就</div>';
    for (const ach of Seasonal.SEASONAL_ACHIEVEMENTS) {
      html += '<div class="daily-mission">' +
        '<div class="dm-icon">' + Visuals.secIcon('trophy') + '</div>' +
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
      this.toast('领取赛季奖励: ' + (result.gold ? result.gold + '金 ' : '') + (result.gems ? result.gems + '石' : ''));
      this.updateHeader();
      this.renderDungeon();
    }
  },

  // ===== ARENA =====
  renderArena() {
    try { this._renderArenaInner(); } catch(e) { console.error('[renderArena]', e); }
  },

  _renderArenaInner() {
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
    document.getElementById('arena-weekly-desc').textContent = rank.name + ': ' + rank.weeklyGold + '金 ' + rank.weeklyGems + '石';
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
  },  // end _renderArenaInner

  _renderArenaOpponents() {
    const container = document.getElementById('arena-opponents');
    if (!Arena.canFight()) {
      container.innerHTML = '<div class="card text-center text-dim" style="padding:20px">今日挑战次数已用完，明天再来！</div>';
      return;
    }

    const labels = ['简单', '普通', '困难'];
    container.innerHTML = this.arenaOpponents.map((opp, i) => {
      return '<div class="card" style="cursor:pointer" onclick="App.startArenaFight(' + i + ')">' +
        '<div class="flex justify-between items-center">' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600">' + opp.name + '</div>' +
            '<div class="text-dim" style="font-size:12px">' + opp.rank.emoji + ' ' + opp.rank.name + ' · Rating ' + opp.rating + '</div>' +
            '<div style="font-size:14px;margin-top:4px">' + opp.team.map(id => HEROES[id]?.emoji || '?').join(' ') + '</div>' +
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
      const rankIcon = i < 3 ? ['①', '②', '③'][i] : (i + 1);
      return '<div class="lb-entry' + (e.isPlayer ? ' lb-player' : '') + '">' +
        '<div class="lb-rank">' + rankIcon + '</div>' +
        '<div class="lb-info">' +
          '<div class="lb-name">' + e.rank.emoji + ' ' + e.name + (e.isPlayer ? ' <span class="lb-you">你</span>' : '') + '</div>' +
          '<div class="lb-meta">胜场: ' + e.wins + '</div>' +
        '</div>' +
        '<div class="lb-stats"><div class="lb-power"> ' + e.rating + '</div></div>' +
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
      terrain: 'plains',
      weather: 'clear',
      _arenaFight: true,
      _arenaOpponent: opp,
      _scaleMult: opp.scaleMult || 1,
    };
    this.switchPage('battle');
    requestAnimationFrame(() => this.prepareBattle(this.currentStage));
  },

  claimArenaWeekly() {
    const result = Arena.claimWeeklyReward();
    if (result) {
      this.toast('周奖励: ' + result.gold + '金 ' + Visuals.resIcon('gem') + result.gems + ' (' + result.rank + ')');
      this.updateHeader();
      this.renderArena();
    } else {
      this.toast('已领取过本周奖励');
    }
  },

  // ===== PROFILE =====
  renderProfile() {
    try { this._renderProfileInner(); } catch(e) { console.error('[renderProfile]', e); }
  },

  _renderProfileInner() {
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
        '<div style="font-size:32px;font-weight:900;color:var(--gold)">' + (kingdom ? kingdom.banner : '将') + '</div>' +
        '<div style="font-size:22px;font-weight:700;margin:8px 0">' + stats.name + '</div>' +
        '<div class="text-dim">Lv.' + stats.level + (kingdom ? ' · ' + kingdom.name : '') + '</div>' +
        '<div style="font-size:18px;color:var(--gold);margin-top:8px">战力 ' + stats.totalPower.toLocaleString() + '</div>' +
        '<div class="text-dim" style="font-size:11px;margin-top:4px">已游玩 ' + stats.daysSinceStart + ' 天</div>' +
      '</div>' +

      // Collection Progress
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px"> 收集进度</div>' +
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
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px"> 战斗统计</div>' +
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
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px"> 竞技 & 副本</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:16px">' + arenaRank.emoji + '</div>' +
            '<div style="font-size:14px;font-weight:700">' + stats.arenaRating + '</div><div class="text-dim" style="font-size:11px">竞技评分</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:14px;font-weight:700;color:var(--gold)">深</div>' +
            '<div style="font-size:14px;font-weight:700">' + stats.dungeonHighestFloor + '</div><div class="text-dim" style="font-size:11px">无尽最深</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:14px;font-weight:700;color:var(--gold)">' + stats.arenaBestStreak + '</div><div class="text-dim" style="font-size:11px">最佳连胜</div></div>' +
          '<div style="background:var(--card2);padding:12px;border-radius:10px;text-align:center">' +
            '<div style="font-size:14px;font-weight:700">' + stats.dungeonTotalRuns + '</div><div class="text-dim" style="font-size:11px">副本总挑战</div></div>' +
        '</div>' +
      '</div>' +

      // Active Affinities
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px"> 当前羁绊</div>' +
        (affinities.length > 0 ?
          affinities.map(a => '<div style="background:var(--card2);padding:10px;border-radius:10px;margin-bottom:8px">' +
            '<div style="font-size:14px;font-weight:600">' + a.emoji + ' ' + a.name + ' <span style="color:var(--gold);font-size:12px">' + a.bonusDesc + '</span></div>' +
            '<div class="text-dim" style="font-size:12px">' + a.desc + '</div>' +
            '<div style="font-size:12px;margin-top:4px">' + a.heroes.map(h => HEROES[h]?.emoji || '?').join(' ') +
              ' (' + a.matchCount + '/' + a.minRequired + ')</div>' +
          '</div>').join('')
          : '<div class="text-dim text-center">编队中没有激活的羁绊</div>'
        ) +
      '</div>' +

      // All Affinities Reference
      '<div class="card">' +
        '<div style="font-size:15px;font-weight:600;margin-bottom:12px"> 全部羁绊图鉴</div>' +
        HERO_AFFINITIES.map(a => {
          const isActive = affinities.find(x => x.id === a.id);
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);opacity:' + (isActive ? '1' : '.6') + '">' +
            '<div style="font-size:13px">' + a.emoji + ' ' + a.name +
              (isActive ? ' <span style="color:var(--shu)">激活</span>' : '') + '</div>' +
            '<div style="font-size:11px;color:var(--gold)">' + a.bonusDesc + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      // Destiny Record (天命录)
      (function() {
        try {
          if (typeof Destiny !== 'undefined') {
            return '<div class="card destiny-record-section">' +
              '<div style="font-size:15px;font-weight:600;margin-bottom:12px">⭐ 天命录</div>' +
              Destiny.renderRecord() +
            '</div>';
          }
        } catch(e) { console.error('[Destiny record]', e); }
        return '';
      })() +

      // Navigation shortcuts
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">' +
        '<button class="btn btn-primary" onclick="App.switchPage(\'team\')">编队</button>' +
        '<button class="btn btn-primary" onclick="App.switchPage(\'leaderboard\')">排行</button>' +
        '<button class="btn btn-primary" onclick="App.switchPage(\'equipment\')" style="background:linear-gradient(135deg,#f59e0b,#d97706)">装备库</button>' +
        '<button class="btn btn-primary" onclick="App.switchPage(\'achievements\')" style="background:linear-gradient(135deg,#a855f7,#7c3aed)">成就</button>' +
      '</div>';
  },  // end _renderProfileInner

  // ===== TUTORIAL =====
  tutorialStep: 0,

  advanceTutorial() {
    const steps = document.querySelectorAll('.tutorial-step');
    const dots = document.querySelectorAll('.step-dot');
    if (this.tutorialStep < steps.length - 1) {
      steps[this.tutorialStep].classList.remove('active');
      dots[this.tutorialStep].classList.remove('active');
      this.tutorialStep++;
      steps[this.tutorialStep].classList.add('active');
      dots[this.tutorialStep].classList.add('active');
    }
  },

  closeTutorial() {
    document.getElementById('tutorial-overlay').classList.add('hidden');
    Storage._set('tutorialDone', true);
    // Free SSR hero for new players: Zhao Yun
    const roster = Storage.getRoster();
    if (!roster['zhaoyun']) {
      Storage.addHero('zhaoyun');
      // Auto-add to team
      const team = Storage.getTeam();
      const emptySlot = team.indexOf(null);
      if (emptySlot !== -1) { team[emptySlot] = 'zhaoyun'; Storage.saveTeam(team); }
      // Give starting gold bonus
      Storage.addGold(500);
      Storage.addGems(20);
      setTimeout(() => {
        this.toast('获得SSR武将: 赵云·常山赵子龙！附赠500金币+20宝石', 4000);
      }, 500);
    }
  },

  showTutorialIfNew() {
    const done = Storage._get('tutorialDone', false);
    if (!done) {
      document.getElementById('tutorial-overlay').classList.remove('hidden');
    }
  },

  // ===== EQUIPMENT SECTION (Hero Detail) =====
  _renderHeroEquipSection(heroId) {
    const equipped = Storage.getEquipped(heroId);
    const inv = Storage.getEquipmentInventory();
    let html = '<div class="card">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:12px"> 装备栏</div>';

    for (const [slot, info] of Object.entries(Equipment.SLOTS)) {
      const uid = equipped[slot];
      const item = uid ? Storage.getEquipmentByUid(uid) : null;
      const tmpl = item ? Equipment.TEMPLATES[item.templateId] : null;
      const rarInfo = tmpl ? Equipment.RARITIES[tmpl.rarity] : null;
      const stats = item ? Equipment.getEquipStats(item) : null;

      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card2);border-radius:10px;margin-bottom:6px">' +
        '<div style="min-width:32px;text-align:center">' + Visuals.equipSlotIcon(slot) + '</div>' +
        '<div style="flex:1">' +
          '<div style="font-size:13px;font-weight:600">' + info.name + '</div>';
      if (tmpl) {
        const statStr = Object.entries(stats).map(([k,v]) => k.toUpperCase() + '+' + v).join(' ');
        const gearScore = Equipment.getGearScore(item);
        const scoreRar = Equipment.getScoreRarity(gearScore);
        const maxLevel = (tmpl.rarity || 1) * 3;
        html += '<div style="font-size:12px;color:' + (rarInfo?.color || 'var(--dim)') + '">' +
          (tmpl.emoji || '') + ' ' + tmpl.name + ' +' + item.level + '/' + maxLevel + ' (' + (rarInfo?.label || '') + ')</div>' +
          '<div style="font-size:11px;color:var(--dim)">' + statStr + '</div>' +
          '<div style="font-size:10px;margin-top:2px"><span style="color:' + scoreRar.color + ';font-weight:700">' + gearScore + '</span> <span class="text-dim">装分</span></div>';
      } else {
        html += '<div style="font-size:12px;color:var(--dim)">空</div>';
      }
      html += '</div>';

      if (tmpl) {
        const maxLevel = (tmpl.rarity || 1) * 3;
        html += '<div style="display:flex;flex-direction:column;gap:4px">';
        if (item.level < maxLevel) {
          html += '<button class="btn btn-sm" onclick="App.showEnhanceDialog(\'' + heroId + '\',\'' + item.uid + '\')" style="background:var(--card);color:var(--gold);font-size:11px">强化</button>';
        }
        html += '<button class="btn btn-sm" onclick="App.unequipItem(\'' + heroId + '\',\'' + slot + '\')" style="background:var(--card);color:var(--hp);font-size:11px">卸下</button>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Set bonus display
    const eqData = Equipment.getHeroEquipmentStats(heroId);
    if (eqData.activeBonuses.length > 0) {
      html += '<div style="margin-top:8px;padding:8px;background:rgba(251,191,36,.08);border-radius:8px">';
      for (const b of eqData.activeBonuses) {
        html += '<div style="font-size:12px;color:var(--gold)">' + Visuals.secIcon('skill') + ' ' + b.name + ': ' + b.desc + '</div>';
      }
      html += '</div>';
    }

    // Available equipment to equip
    const unequipped = inv.filter(e => {
      // Not equipped on anyone
      const allHeroes = Object.keys(Storage.getRoster());
      for (const hid of allHeroes) {
        const eq = Storage.getEquipped(hid);
        if (Object.values(eq).includes(e.uid)) return false;
      }
      return true;
    });

    if (unequipped.length > 0) {
      html += '<div style="font-size:13px;font-weight:600;margin-top:12px;margin-bottom:8px">可装备</div>';
      for (const item of unequipped.slice(0, 10)) {
        const tmpl = Equipment.TEMPLATES[item.templateId];
        if (!tmpl) continue;
        const rarInfo = Equipment.RARITIES[tmpl.rarity];
        const stats = Equipment.getEquipStats(item);
        const statStr = Object.entries(stats).map(([k,v]) => k.toUpperCase() + '+' + v).join(' ');
        const gearScore = Equipment.getGearScore(item);
        const scoreRar = Equipment.getScoreRarity(gearScore);
        html += '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--card2);border-radius:8px;margin-bottom:4px;cursor:pointer;border-left:3px solid ' + (rarInfo?.color || 'var(--border)') + '" ' +
          'onclick="App.equipItem(\'' + heroId + '\',\'' + item.uid + '\')">' +
          '<span>' + Visuals.equipItemIcon(item.templateId, tmpl.rarity) + '</span>' +
          '<div style="flex:1">' +
            '<div style="font-size:12px;color:' + (rarInfo?.color || 'var(--dim)') + '">' + tmpl.name + ' +' + item.level + '</div>' +
            '<div style="font-size:10px;color:var(--dim)">' + statStr + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:11px;color:' + scoreRar.color + ';font-weight:700">' + gearScore + '</div>' +
            '<div style="font-size:10px;color:var(--accent)">装备</div>' +
          '</div>' +
        '</div>';
      }
    }

    html += '</div>';
    return html;
  },

  // ===== SKILL TREE SECTION (Hero Detail) =====
  _renderHeroSkillTreeSection(heroId) {
    if (typeof SkillTree === 'undefined') return '';
    const tree = SkillTree.getTree(heroId);
    if (!tree) return '';
    const state = SkillTree.getUnlocked(heroId);
    const available = SkillTree.getAvailablePoints(heroId);

    let html = '<div class="card" id="skilltree-section-' + heroId + '">' +
      '<div class="flex justify-between items-center mb-8">' +
        '<div style="font-size:14px;font-weight:600">🌳 天赋树</div>' +
        '<div style="font-size:12px;color:var(--gold)">可用点数: ' + available + (available > 0 ? ' 👆点击解锁' : ' (升级获取)') + '</div>' +
      '</div>';

    for (let bi = 0; bi < tree.branches.length; bi++) {
      const branch = tree.branches[bi];
      const unlocked = state[branch.id] || [];
      html += '<div style="margin-bottom:12px">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:6px">' + branch.icon + ' ' + branch.name + ' <span class="text-dim" style="font-size:11px">' + branch.desc + '</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(' + branch.nodes.length + ',1fr);gap:6px">';

      for (let ni = 0; ni < branch.nodes.length; ni++) {
        const node = branch.nodes[ni];
        const isUnlocked = unlocked.includes(ni);
        const canUnlock = !isUnlocked && available > 0 && (ni === 0 || unlocked.includes(ni - 1));
        const isUltimate = ni === branch.nodes.length - 1;

        html += '<div role="button" tabindex="0" style="text-align:center;padding:12px 6px;border-radius:10px;min-height:56px;' +
          'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
          'background:' + (isUnlocked ? 'rgba(212,168,67,.15)' : canUnlock ? 'rgba(100,180,255,.12)' : 'var(--card2)') + ';' +
          'border:2px solid ' + (isUnlocked ? 'var(--gold)' : canUnlock ? 'var(--accent)' : 'var(--border)') + ';' +
          (canUnlock ? 'cursor:pointer;-webkit-tap-highlight-color:rgba(255,255,255,0.2);box-shadow:0 0 8px rgba(100,180,255,.3);' : isUnlocked ? '' : 'opacity:0.5;') +
          'touch-action:manipulation;"' +
          (canUnlock ? ' onclick="event.stopPropagation();App.unlockSkillNode(\'' + heroId + '\',' + bi + ',' + ni + ')"' : '') + '>' +
          '<div style="font-size:' + (isUltimate ? '11px' : '11px') + ';font-weight:700;line-height:1.2;' + (isUltimate ? 'color:var(--gold)' : isUnlocked ? 'color:var(--gold)' : canUnlock ? 'color:#fff' : '') + '">' + node.name + '</div>' +
          '<div style="font-size:9px;color:var(--dim);margin-top:3px;line-height:1.2">' + node.desc + '</div>' +
          (isUnlocked ? '<div style="font-size:10px;color:var(--shu);margin-top:4px">✅</div>' : canUnlock ? '<div style="font-size:12px;color:var(--accent);margin-top:4px;animation:pulse 1.5s infinite">👆 点击</div>' : '') +
        '</div>';
      }
      html += '</div></div>';
    }

    // Respec button
    const spent = SkillTree._getSpentPoints(heroId);
    if (spent > 0) {
      const respecCost = spent * 200;
      html += '<button class="btn btn-sm btn-block mt-8" onclick="App.respecSkillTree(\'' + heroId + '\')" style="background:var(--card2);color:var(--hp);font-size:11px">重置天赋 (' + Visuals.resIcon('gold') + respecCost + ')</button>';
    }

    html += '</div>';
    return html;
  },

  unlockSkillNode(heroId, branchIdx, nodeIdx) {
    const result = SkillTree.unlockNode(heroId, branchIdx, nodeIdx);
    if (result.error) { this.toast(result.error); return; }
    this.toast('✅ 解锁天赋: ' + result.node.name);
    // Only re-render skill tree section, not whole page (prevents scroll jump)
    this._refreshSkillTreeOnly(heroId);
  },

  respecSkillTree(heroId) {
    const result = SkillTree.respec(heroId);
    if (result.error) { this.toast(result.error); return; }
    this.toast('天赋已重置，返还 ' + result.refunded + ' 点');
    this._refreshSkillTreeOnly(heroId);
    this.updateHeader();
  },

  _refreshSkillTreeOnly(heroId) {
    // Find the skill tree container and only update that section
    const container = document.getElementById('skilltree-section-' + heroId);
    if (container) {
      try {
        container.outerHTML = this._renderHeroSkillTreeSection(heroId);
      } catch(e) {
        console.error('[SkillTree refresh]', e);
        this.renderHeroDetail(heroId);
      }
    } else {
      this.renderHeroDetail(heroId);
    }
  },

  equipItem(heroId, equipUid) {
    const result = Equipment.equipToHero(heroId, equipUid);
    if (result.error) { this.toast(result.error); return; }
    this.toast('装备成功');
    this.renderHeroDetail(heroId);
    // Check first equip achievement
    if (typeof Achievements !== 'undefined') {
      const newAch = Achievements.checkAll();
      if (newAch.length > 0) this.toast('新成就: ' + newAch.map(a => a.name).join(', '));
    }
  },

  unequipItem(heroId, slot) {
    Equipment.unequipFromHero(heroId, slot);
    this.toast('已卸下装备');
    this.renderHeroDetail(heroId);
  },

  showEnhanceDialog(heroId, equipUid) {
    const inv = Storage.getEquipmentInventory();
    const target = inv.find(e => e.uid === equipUid);
    if (!target) return;
    const tmpl = Equipment.TEMPLATES[target.templateId];
    if (!tmpl) return;

    // Find materials (unequipped items, exclude the target itself)
    const allHeroes = Object.keys(Storage.getRoster());
    const equippedUids = new Set();
    for (const hid of allHeroes) {
      const eq = Storage.getEquipped(hid);
      Object.values(eq).forEach(uid => { if (uid) equippedUids.add(uid); });
    }
    const materials = inv.filter(e => e.uid !== equipUid && !equippedUids.has(e.uid));

    if (materials.length === 0) {
      this.toast('没有可用的强化材料（需要未装备的装备）');
      return;
    }

    const maxLevel = (tmpl.rarity || 1) * 3;
    const rarInfo = Equipment.RARITIES[tmpl.rarity];

    // Show inline material selection
    let html = '<div class="card card-glow" style="border-color:var(--gold)">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:8px">强化 ' + tmpl.name + ' +' + target.level + '/' + maxLevel + '</div>' +
      '<div class="text-dim" style="font-size:12px;margin-bottom:12px">选择一件装备作为材料（同类装备100%成功率，不同70%）</div>';

    for (const mat of materials.slice(0, 8)) {
      const matTmpl = Equipment.TEMPLATES[mat.templateId];
      if (!matTmpl) continue;
      const matRar = Equipment.RARITIES[matTmpl.rarity];
      const isSame = mat.templateId === target.templateId;
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--card2);border-radius:8px;margin-bottom:4px;cursor:pointer;border-left:3px solid ' + (matRar?.color || 'var(--border)') + '"' +
        ' onclick="App.doEnhance(\'' + heroId + '\',\'' + equipUid + '\',\'' + mat.uid + '\')">' +
        '<span>' + Visuals.equipItemIcon(mat.templateId, matTmpl.rarity) + '</span>' +
        '<div style="flex:1"><div style="font-size:12px;color:' + (matRar?.color || 'var(--dim)') + '">' + matTmpl.name + ' +' + mat.level + '</div></div>' +
        '<div style="font-size:11px;color:' + (isSame ? 'var(--shu)' : 'var(--dim)') + '">' + (isSame ? '100%' : '70%') + '</div>' +
      '</div>';
    }

    html += '<button class="btn btn-sm btn-block mt-8" onclick="App.renderHeroDetail(\'' + heroId + '\')" style="background:var(--card2);color:var(--text)">取消</button>' +
    '</div>';

    // Replace equipment section temporarily
    const content = document.getElementById('hero-detail-content');
    // Append dialog at end
    const dialog = document.createElement('div');
    dialog.id = 'enhance-dialog';
    dialog.innerHTML = html;
    const existing = document.getElementById('enhance-dialog');
    if (existing) existing.remove();
    content.appendChild(dialog);
    dialog.scrollIntoView({ behavior: 'smooth' });
  },

  doEnhance(heroId, equipUid, materialUid) {
    const result = Equipment.enhance(equipUid, materialUid);
    if (result.error) { this.toast(result.error); return; }
    if (result.success) {
      this.toast('强化成功！+' + result.newLevel);
    } else {
      this.toast(result.message || '强化失败！材料已消耗');
    }
    const dialog = document.getElementById('enhance-dialog');
    if (dialog) dialog.remove();
    this.renderHeroDetail(heroId);
  },

  // ===== EQUIPMENT INVENTORY PAGE =====
  renderEquipmentPage() {
    try { this._renderEquipmentPageInner(); } catch(e) { console.error('[renderEquipmentPage]', e); }
  },

  _renderEquipmentPageInner() {
    const content = document.getElementById('equipment-content');
    if (!content) return;
    const inv = Storage.getEquipmentInventory();
    const roster = Storage.getRoster();

    let html = '';
    if (inv.length === 0) {
      html = '<div class="card text-center text-dim" style="padding:40px">还没有装备，通关关卡获取！</div>';
    } else {
      for (const item of inv) {
        const tmpl = Equipment.TEMPLATES[item.templateId];
        if (!tmpl) continue;
        const rarInfo = Equipment.RARITIES[tmpl.rarity];
        const stats = Equipment.getEquipStats(item);
        const statStr = Object.entries(stats).map(([k,v]) => k.toUpperCase() + '+' + v).join(' ');

        // Check if equipped
        let equippedOn = null;
        for (const hid of Object.keys(roster)) {
          const eq = Storage.getEquipped(hid);
          if (Object.values(eq).includes(item.uid)) { equippedOn = HEROES[hid]; break; }
        }

        const gearScore = Equipment.getGearScore(item);
        const scoreRar = Equipment.getScoreRarity(gearScore);
        const maxLevel = (tmpl.rarity || 1) * 3;

        html += '<div class="card" style="padding:12px;border-left:3px solid ' + (rarInfo?.color || 'var(--border)') + '">' +
          '<div class="flex justify-between items-center">' +
            '<div class="flex items-center gap-8">' +
              '<span>' + Visuals.equipItemIcon(item.templateId, tmpl.rarity) + '</span>' +
              '<div>' +
                '<div style="font-size:14px;font-weight:600;color:' + (rarInfo?.color || 'var(--text)') + '">' + tmpl.name + ' +' + item.level + '/' + maxLevel + ' <span style="font-size:11px;color:' + scoreRar.color + '">' + gearScore + '</span></div>' +
                '<div style="font-size:11px;color:var(--dim)">' + (Equipment.SLOTS[tmpl.slot]?.name || '') + ' · ' + rarInfo.label + '</div>' +
                '<div style="font-size:11px;color:var(--dim)">' + statStr + '</div>' +
                (equippedOn ? '<div style="font-size:11px;color:var(--accent)">装备于: ' + equippedOn.emoji + ' ' + equippedOn.name + '</div>' : '') +
              '</div>' +
            '</div>' +
            '<div>' +
              '<button class="btn btn-sm" onclick="App.sellEquipment(\'' + item.uid + '\')" style="background:var(--card2);color:var(--hp);font-size:11px">出售</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
    }
    content.innerHTML = html;
  },  // end _renderEquipmentPageInner

  sellEquipment(uid) {
    const gold = Equipment.sell(uid);
    if (gold > 0) {
      this.toast('出售获得 ' + gold + ' 金币');
      this.updateHeader();
      this.renderEquipmentPage();
    }
  },

  // ===== ACHIEVEMENTS PAGE =====
  renderAchievementsPage() {
    try { this._renderAchievementsPageInner(); } catch(e) { console.error('[renderAchievementsPage]', e); }
  },

  _renderAchievementsPageInner() {
    const content = document.getElementById('achievements-content');
    if (!content) return;
    const state = Achievements.getState();
    let html = '';

    for (const def of Achievements.DEFS) {
      const entry = state.unlocked[def.id];
      const completed = !!entry;
      const claimed = entry?.claimed;

      html += '<div class="daily-mission' + (claimed ? ' dm-claimed' : completed ? ' dm-complete' : '') + '">' +
        '<div class="dm-icon">' + def.icon + '</div>' +
        '<div class="dm-info">' +
          '<div class="dm-name">' + def.name + '</div>' +
          '<div class="dm-desc">' + def.desc + '</div>' +
        '</div>' +
        '<div class="dm-reward">' +
          (claimed ? '<span class="dm-done" style="color:var(--shu)">完成</span>' :
           completed ? '<button class="btn btn-sm btn-gold" onclick="App.claimAchievement(\'' + def.id + '\')">' +
             (def.reward.gold ? def.reward.gold + '金' : '') + (def.reward.gems ? def.reward.gems + '石' : '') + '</button>' :
           '<span class="text-dim" style="font-size:12px">' + Visuals.secIcon('lock') + '</span>') +
        '</div>' +
      '</div>';
    }
    content.innerHTML = html;
  },  // end _renderAchievementsPageInner

  claimAchievement(id) {
    const success = Achievements.claim(id);
    if (success) {
      const def = Achievements.DEFS.find(d => d.id === id);
      this.toast('领取成就奖励: ' + def.name);
      this.updateHeader();
      this.renderAchievementsPage();
    }
  },

  // ===== HERO ROSTER (updated for coming soon) =====
  renderRosterExtended() {
    const roster = Storage.getRoster();
    const list = document.getElementById('roster-list');

    // After the owned heroes, show "coming soon" section
    let comingSoonHtml = '<div style="font-size:15px;font-weight:600;margin:16px 0 8px"> 即将推出</div>';
    let mysteryHtml = '<div style="font-size:15px;font-weight:600;margin:16px 0 8px">? 神秘武将</div>';

    for (const [id, hero] of Object.entries(HEROES)) {
      if (roster[id]) continue; // Already owned
      if (hero.mystery) {
        mysteryHtml += '<div class="hero-card" style="opacity:.5">' +
          '<div class="hero-emoji" style="opacity:.4">' + Visuals.heroPortrait(id, 'sm') + '</div>' +
          '<div class="hero-info">' +
            '<div class="hero-name">???</div>' +
            '<div class="hero-sub">' + (FACTIONS[hero.faction]?.name || '') + ' · ' + '★'.repeat(hero.rarity) + '</div>' +
            '<div class="text-dim" style="font-size:11px;font-style:italic">' + hero.lore + '</div>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--gold)">' + Visuals.secIcon('lock') + '</div>' +
        '</div>';
      } else if (hero.comingSoon) {
        const csPortrait = (typeof Portraits !== 'undefined' && Portraits.hasPng(id)) ? Portraits.get(id, 50) : '<span>' + hero.emoji + '</span>';
        comingSoonHtml += '<div class="hero-card rarity-' + hero.rarity + '" style="opacity:.65">' +
          '<div class="hero-emoji">' + csPortrait + '</div>' +
          '<div class="hero-info">' +
            '<div class="hero-name">' + hero.name + ' · ' + hero.title + ' <span style="font-size:10px;color:var(--gold)">即将推出</span></div>' +
            '<div class="hero-sub">' + (UNIT_TYPES[hero.unit]?.emoji || '') + ' ' + (UNIT_TYPES[hero.unit]?.name || '') +
              ' · ' + (FACTIONS[hero.faction]?.emoji || '') + ' ' + (FACTIONS[hero.faction]?.name || '') + '</div>' +
            '<div class="hero-stars">' + '★'.repeat(hero.rarity) + '☆'.repeat(5 - hero.rarity) + '</div>' +
          '</div>' +
        '</div>';
      }
    }

    // Use insertAdjacentHTML to PRESERVE onclick handlers on existing cards
    list.insertAdjacentHTML('beforeend', comingSoonHtml + mysteryHtml);
  },
};

// Override startBattle to handle new modes — with full error protection
const _originalStartBattle = App.startBattle;
App.startBattle = async function() {
  const stage = this.currentStage;
  document.getElementById('btn-battle-start').classList.add('hidden');

  // Hide team preview during battle
  try {
    const preview = document.getElementById('battle-team-preview');
    if (preview) preview.style.display = 'none';
  } catch(e) {}

  Battle.onUpdate = (state) => {
    try {
      this.renderBattleField();
      const logEl = document.getElementById('battle-log');
      const recentLogs = Battle.log.slice(-15);
      logEl.innerHTML = recentLogs.map(l => '<div class="log-entry ' + App._logClass(l.msg) + '">' + l.msg + '</div>').join('');
      logEl.scrollTop = logEl.scrollHeight;
      // Render hero dialogue bubbles
      if (typeof HeroPersonality !== 'undefined') {
        const dialogues = Battle.popDialogues();
        if (dialogues.length > 0) {
          // Try BattleUI container first, fall back to canvas
          const buiContainer = document.getElementById('battle-ui-container');
          const canvasContainer = document.getElementById('battle-canvas')?.parentElement;
          const container = buiContainer || canvasContainer;
          if (container) {
            container.style.position = 'relative';
            for (const d of dialogues) {
              const key = d.side + '-' + d.pos;
              // Get position from BattleUI fighter elements
              if (typeof BattleUI !== 'undefined' && BattleUI._active && BattleUI._fighterEls[key]) {
                const fEl = BattleUI._fighterEls[key].el;
                const fRect = fEl.getBoundingClientRect();
                const cRect = container.getBoundingClientRect();
                const x = fRect.left - cRect.left + fRect.width / 2;
                const y = fRect.top - cRect.top;
                HeroPersonality.showDialogueBubble(d.heroId, d.text, d.side, x, y, container);
              } else if (typeof BattleCanvas !== 'undefined' && BattleCanvas.fighters[key]) {
                const sprite = BattleCanvas.fighters[key];
                HeroPersonality.showDialogueBubble(d.heroId, d.text, d.side, sprite.x, sprite.y, canvasContainer || container);
              }
            }
          }
        }
      }
    } catch(e) { console.error('[Battle.onUpdate]', e); }
  };

  let result;
  try {
    result = await Battle.run(1.5);
  } catch(e) {
    console.error('[Battle.run error]', e);
    result = 'victory'; // Fallback: treat errors as victory so player isn't stuck
  }

  const modal = document.getElementById('result-modal');

  try {
    if (result === 'victory') {
      document.getElementById('result-icon').innerHTML = '<span style="font-size:48px;color:var(--gold)">胜</span>';
      document.getElementById('result-title').textContent = '胜利！';

      // Check if stage was already cleared (replay exploit prevention)
      const progress2 = Storage.getCampaignProgress();
      const stageChapterId2 = (stage._chapter || Campaign.getCurrentChapter()).id;
      const alreadyCleared2 = !stage._isMapBattle && !stage._dungeonFloor && !stage._dailyDungeon && !stage._arenaFight && !stage._raidBoss &&
        (stageChapterId2 < progress2.chapter || (stageChapterId2 === progress2.chapter && stage.id < progress2.stage));
      const replayMult2 = alreadyCleared2 ? 0.1 : 1;
      const warMult = (typeof WarDirector !== 'undefined')
        ? WarDirector.getRewardMultiplier(stage._warContext)
        : { gold: 1, exp: 1 };
      const adjGold = Math.floor((stage.reward?.gold || 0) * replayMult2 * (warMult.gold || 1));
      const adjExp = Math.floor((stage.reward?.exp || 0) * replayMult2 * (warMult.exp || 1));

      try { Storage.addGold(adjGold); } catch(e) { console.error('[addGold]', e); }
      try { Storage.addExp(adjExp); } catch(e) { console.error('[addExp]', e); }

      let detailText = '+' + adjGold + '金 +' + adjExp + '经验' + (alreadyCleared2 ? ' (重复通关减少奖励)' : '');

      if (stage.reward?.hero_shard && !alreadyCleared2) {
        try { Storage.addShards(stage.reward.hero_shard, 3); detailText += ' +3碎片'; } catch(e) { console.error('[addShards]', e); }
      }

      // Handle different modes
      try {
        if (stage._isMapBattle) {
          // Kingdom Map battle
          const tId = stage._territoryId;
          if (tId && typeof KingdomMap !== 'undefined') {
            KingdomMap.completeStage(tId);
            const stageType = KingdomMap.getCurrentStageType(tId);
            if (!stageType) {
              detailText += '\n🚩 占领了 ' + (KingdomMap.TERRITORIES[tId]?.name || '') + '！';
              // Check for Destiny Choice trigger after territory fully conquered
              if (typeof Destiny !== 'undefined') {
                try {
                  const destinyChoice = Destiny.checkTrigger(tId);
                  if (destinyChoice) {
                    stage._pendingDestiny = destinyChoice;
                    detailText += '\n⭐ 天命抉择即将来临...';
                  }
                } catch(e) { console.error('[Destiny trigger check]', e); }
              }
            } else {
              detailText += '\n下一阶段: ' + (KingdomMap.STAGE_TEMPLATES[stageType]?.name || '');
            }
          }
          if (typeof Seasonal !== 'undefined') Seasonal.addPassXP(stage.boss ? 100 : 40);
          if (typeof Equipment !== 'undefined') {
            try {
              const lvl = KingdomMap.TERRITORIES[tId]?.level || 1;
              const drop = Equipment.generateDrop(Math.min(lvl, 10), !!stage.boss);
              if (drop) {
                const added = Storage.addEquipment(drop);
                if (added === false) { detailText += '\n装备库已满(上限500)，请先分解旧装备！'; }
                else { const tmpl = Equipment.TEMPLATES[drop.templateId]; const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1]; detailText += '\n获得: ' + (tmpl?.name || '???') + ' (' + (rarInfo?.label || '') + ')'; }
              }
            } catch(e) { console.error('[Equipment drop]', e); }
          }
        } else if (stage._dungeonFloor) {
          Dungeon.advanceFloor();
          detailText += ' · 进入下一层';
        } else if (stage._dailyDungeon) {
          Dungeon.recordDailyAttempt(stage._dailyDungeon);
          if (stage._dailyDungeon === 'material' && typeof Equipment !== 'undefined') {
            const drop = Equipment.generateDrop(3, false);
            if (drop) {
              const added = Storage.addEquipment(drop);
              if (added === false) { detailText += '\n装备库已满(上限500)，请先分解旧装备！'; }
              else { const tmpl = Equipment.TEMPLATES[drop.templateId]; const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1]; detailText += '\n获得: ' + (tmpl?.name || '???') + ' (' + (rarInfo?.label || '') + ')'; }
            }
          }
          if (typeof Seasonal !== 'undefined') Seasonal.addPassXP(50);
        } else if (stage._arenaFight) {
          const opp = stage._arenaOpponent;
          const arenaState = Arena.recordFight(true, opp.rating);
          const ratingGain = arenaState?.history?.[0]?.ratingChange || 0;
          detailText += ' · Rating +' + ratingGain;
          this.arenaOpponents = null;
          if (typeof Seasonal !== 'undefined') Seasonal.addPassXP(30);
        } else if (stage._raidBoss) {
          const totalDmg = Battle.state.enemy.reduce((sum, f) => f ? sum + (f.maxHp - Math.max(0, f.hp)) : sum, 0);
          const raidState = Dungeon.recordRaidAttempt(totalDmg);
          detailText += ' · 造成 ' + totalDmg.toLocaleString() + ' 伤害';
          if (raidState?.defeated) detailText += ' Boss已击败！';
        } else {
          // Normal campaign
          const chapter = stage._chapter || Campaign.getCurrentChapter();
          Campaign.completeStage(stage.id, chapter.id);
          if (typeof Seasonal !== 'undefined') Seasonal.addPassXP(stage.boss ? 100 : 40);
          if (typeof Equipment !== 'undefined') {
            try {
              const drop = Equipment.generateDrop(chapter.id, !!stage.boss);
              if (drop) {
                const added = Storage.addEquipment(drop);
                if (added === false) { detailText += '\n装备库已满(上限500)，请先分解旧装备！'; }
                else { const tmpl = Equipment.TEMPLATES[drop.templateId]; const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1]; detailText += '\n获得: ' + (tmpl?.name || '???') + ' (' + (rarInfo?.label || '') + ')'; }
              }
            } catch(e) { console.error('[Equipment drop]', e); }
          }
        }
      } catch(e) { console.error('[Mode handling]', e); }

      const resultDetailEl = document.getElementById('result-detail');
      if (resultDetailEl) resultDetailEl.innerHTML = detailText.replace(/\n/g, '<br>');

      try { Storage.recordWin(); } catch(e) { console.warn('[recordWin]', e); }
      try {
        if (typeof WarDirector !== 'undefined') {
          const warRes = WarDirector.onBattleComplete('victory', stage._warContext || null);
          if (warRes) detailText += '\n⚔️ 战争演算 +'+ warRes.gainedPoints + '（连胜 ' + warRes.streak + '）';
        }
      } catch (e) { console.error('[WarDirector victory]', e); }
      if (resultDetailEl) resultDetailEl.innerHTML = detailText.replace(/\n/g, '<br>');
      // Hero Personality: post-battle mood/loyalty update
      try {
        if (typeof HeroPersonality !== 'undefined') {
          const team = Storage.getTeam().filter(Boolean);
          const roster = Object.keys(Storage.getRoster());
          const pResult = HeroPersonality.onBattleEnd(team, 'victory', roster);
          if (pResult.defected && pResult.defected.length > 0) {
            setTimeout(() => { App._showDefectionEvent(pResult.defected); }, 2000);
          }
        }
      } catch(e) { console.error('[Personality victory]', e); }
      try { DailyMissions.trackProgress('stages'); } catch(e) { console.warn('[trackProgress stages]', e); }
      if (stage.boss) {
        try { Storage.recordBossWin(); DailyMissions.trackProgress('boss'); } catch(e) { console.warn('[recordBossWin]', e); }
      }
      try {
        if (typeof Achievements !== 'undefined') {
          const newAch = Achievements.checkAll();
          if (newAch.length > 0) setTimeout(() => this.toast('新成就: ' + newAch.map(a => a.name).join(', '), 3000), 1500);
        }
      } catch(e) { console.error('[Achievements]', e); }

    } else {
      document.getElementById('result-icon').innerHTML = '<span style="font-size:48px;color:var(--hp)">败</span>';
      document.getElementById('result-title').textContent = '败北...';

      try {
        if (stage._isMapBattle) {
          const tName = typeof KingdomMap !== 'undefined' && KingdomMap.TERRITORIES[stage._territoryId]
            ? KingdomMap.TERRITORIES[stage._territoryId].name : '';
          document.getElementById('result-detail').textContent = tName + '攻略失败，升级武将再战！';
        } else if (stage._dungeonFloor) {
          Dungeon.endRun();
          document.getElementById('result-detail').textContent = '无尽副本结束';
        } else if (stage._arenaFight) {
          Arena.recordFight(false, stage._arenaOpponent?.rating);
          this.arenaOpponents = null;
          document.getElementById('result-detail').textContent = '竞技场失败';
        } else if (stage._raidBoss) {
          const totalDmg = Battle.state.enemy.reduce((sum, f) => f ? sum + (f.maxHp - Math.max(0, f.hp)) : sum, 0);
          Dungeon.recordRaidAttempt(totalDmg);
          document.getElementById('result-detail').textContent = '造成 ' + totalDmg.toLocaleString() + ' 伤害';
        } else {
          document.getElementById('result-detail').textContent = '升级武将或调整阵容再战！';
        }
      } catch(e) {
        document.getElementById('result-detail').textContent = '再接再厉！';
        console.error('[Defeat handling]', e);
      }

      try { Storage.recordLoss(); } catch(e) { console.warn('[recordLoss]', e); }
      try {
        if (typeof WarDirector !== 'undefined') {
          const warRes = WarDirector.onBattleComplete('defeat', stage._warContext || null);
          const detEl = document.getElementById('result-detail');
          if (warRes && detEl) detEl.textContent += ' · 战争演算 +' + warRes.gainedPoints;
        }
      } catch (e) { console.error('[WarDirector defeat]', e); }
      // Hero Personality: post-battle mood/loyalty update (defeat)
      try {
        if (typeof HeroPersonality !== 'undefined') {
          const team = Storage.getTeam().filter(Boolean);
          const roster = Object.keys(Storage.getRoster());
          const pResult = HeroPersonality.onBattleEnd(team, 'defeat', roster);
          if (pResult.defected && pResult.defected.length > 0) {
            setTimeout(() => { App._showDefectionEvent(pResult.defected); }, 2000);
          }
        }
      } catch(e) { console.error('[Personality defeat]', e); }
    }
  } catch(e) {
    // Absolute fallback — always show result
    console.error('[startBattle result handling]', e);
    document.getElementById('result-icon').innerHTML = '<span style="font-size:48px;color:var(--gold)">胜</span>';
    document.getElementById('result-title').textContent = '战斗结束';
    document.getElementById('result-detail').textContent = '点击继续';
    // Still try to advance
    try {
      if (stage._isMapBattle && typeof KingdomMap !== 'undefined') {
        KingdomMap.completeStage(stage._territoryId);
      } else if (!stage._dungeonFloor && !stage._dailyDungeon && !stage._arenaFight && !stage._raidBoss) {
        const chapter = stage._chapter || Campaign.getCurrentChapter();
        Campaign.completeStage(stage.id, chapter.id);
      }
    } catch(e2) { console.error('[fallback completeStage]', e2); }
  }

  // Show/hide "下一关" button — for campaign and map victories
  try {
    const nextBtn = document.getElementById('btn-next-stage');
    if (nextBtn) {
      const isCampaign = !stage._dungeonFloor && !stage._dailyDungeon && !stage._arenaFight && !stage._raidBoss;
      if (result === 'victory' && stage._isMapBattle) {
        // For map battles: show "continue" button for next stage or return to map
        const stageType = typeof KingdomMap !== 'undefined' ? KingdomMap.getCurrentStageType(stage._territoryId) : null;
        if (stageType) {
          nextBtn.textContent = '继续进攻 ▶';
          nextBtn.style.display = 'block';
          nextBtn.onclick = () => {
            document.getElementById('result-modal').classList.add('hidden');
            try { if (typeof BattleUI !== 'undefined') BattleUI.destroy(); } catch(e) {}
            try { if (typeof BattleCanvas !== 'undefined') BattleCanvas.stop(); } catch(e) {}
            App._startMapBattle(stage._territoryId, stageType);
          };
        } else {
          // Territory fully conquered — check for destiny
          nextBtn.textContent = stage._pendingDestiny ? '⭐ 天命抉择 ▶' : '返回天下 ▶';
          nextBtn.style.display = 'block';
          nextBtn.onclick = () => {
            document.getElementById('result-modal').classList.add('hidden');
            try { if (typeof BattleUI !== 'undefined') BattleUI.destroy(); } catch(e) {}
            try { if (typeof BattleCanvas !== 'undefined') BattleCanvas.stop(); } catch(e) {}
            if (stage._pendingDestiny && typeof Destiny !== 'undefined') {
              try {
                const dc = stage._pendingDestiny;
                stage._pendingDestiny = null;
                Destiny.showChoice(dc, () => {
                  App.switchPage('map');
                  App.toast('天命已定！', 3000);
                });
                return;
              } catch(e2) { console.error('[Destiny next btn]', e2); }
            }
            App.switchPage('map');
          };
        }
      } else {
        nextBtn.style.display = (result === 'victory' && isCampaign) ? 'block' : 'none';
        nextBtn.textContent = '下一关 ▶';
        nextBtn.onclick = () => App.goNextStage();
      }
    }
  } catch(e) {}

  // BattleUI victory/defeat effects (HTML/CSS layer)
  try {
    if (typeof BattleUI !== 'undefined' && BattleUI._active) {
      if (result === 'victory') await BattleUI.playVictory();
      else await BattleUI.playDefeat();
    }
  } catch(e) {}
  // Canvas victory/defeat effects
  try {
    if (typeof BattleCanvas !== 'undefined' && BattleCanvas.running) {
      if (result === 'victory') BattleCanvas.showVictory(Battle.state);
      else BattleCanvas.showDefeat();
    }
  } catch(e) {}
  // SVG victory/defeat overlay
  try {
    if (typeof BattleSVGVFX !== 'undefined') {
      if (result === 'victory') BattleSVGVFX.victoryEffect();
      else BattleSVGVFX.defeatEffect();
    }
  } catch(e) {}

  // Delay modal slightly to let canvas effects play
  await new Promise(r => setTimeout(r, 800));

  // Show post-battle narrative if available (campaign victories only)
  if (result === 'victory' && typeof Narrative !== 'undefined' && stage._chapter &&
      !stage._isMapBattle && !stage._dungeonFloor && !stage._dailyDungeon && !stage._arenaFight && !stage._raidBoss) {
    const ch = stage._chapter;
    if (Narrative.hasStory(ch.id, stage.id, 'post')) {
      await new Promise(resolve => Narrative.show(ch.id, stage.id, 'post', resolve));
    }
  }

  // Apply victory/defeat animation class
  modal.classList.remove('result-victory', 'result-defeat');
  modal.classList.add(result === 'victory' ? 'result-victory' : 'result-defeat');

  // ALWAYS show modal — never leave player stuck
  modal.classList.remove('hidden');
  try { this.updateHeader(); } catch(e) {}
};

// Override closeResult to return to correct page
const _originalCloseResult = App.closeResult;
App.closeResult = function() {
  document.getElementById('result-modal').classList.add('hidden');
  try { if (typeof BattleUI !== 'undefined') BattleUI.destroy(); } catch(e) {}
  try { if (typeof BattleCanvas !== 'undefined') BattleCanvas.stop(); } catch(e) {}
  const stage = this.currentStage;

  // Check for pending destiny choice before returning to map
  if (stage && stage._pendingDestiny && typeof Destiny !== 'undefined') {
    try {
      const destinyChoice = stage._pendingDestiny;
      stage._pendingDestiny = null; // Clear so it doesn't fire again
      Destiny.showChoice(destinyChoice, () => {
        // After destiny choice, return to map
        App.switchPage('map');
        App.toast('天命已定！查看天命录了解详情', 3000);
      });
      return; // Don't navigate yet — destiny overlay is showing
    } catch(e) {
      console.error('[Destiny showChoice]', e);
      // Fall through to normal navigation
    }
  }

  if (stage._isMapBattle) {
    this.switchPage('map');
  } else if (stage._dungeonFloor) {
    this.currentDungeonTab = 'endless';
    this.switchPage('dungeon');
  } else if (stage._dailyDungeon) {
    this.currentDungeonTab = 'daily';
    this.switchPage('dungeon');
  } else if (stage._arenaFight) {
    this.switchPage('arena');
  } else if (stage._raidBoss) {
    this.currentDungeonTab = 'raid';
    this.switchPage('dungeon');
  } else {
    // Reset chapter view to current progress chapter (don't get stuck on old tab)
    this.selectedCampaignChapter = null;
    this.switchPage('campaign');
  }
};

// Extend init to include new features
const _originalInit = App.init;
App.init = function() {
  Storage.trackPlayTime();

  // Wrap renderRoster BEFORE calling original init so first render includes extended content
  const origRenderRoster = App.renderRoster;
  App.renderRoster = function() {
    origRenderRoster.call(this);
    this.renderRosterExtended();
  };

  _originalInit.call(this);

  // Show tutorial for new players
  this.showTutorialIfNew();
};

// Emergency return — if battle gets stuck, player can always go back
App.setBattleSpeed = function(spd) {
  this._battleSpeed = spd;
  // Update button styles
  [1,2,3].forEach(s => {
    const btn = document.getElementById('spd-' + s + 'x');
    if (btn) btn.style.background = s === spd ? 'var(--gold)' : 'var(--card2)';
  });
  // Dynamically adjust Battle's delay if it's running
  if (Battle && Battle.state && Battle.state.phase === 'fighting') {
    Battle._speedOverride = spd;
  }
};

App.emergencyReturn = function() {
  document.getElementById('result-modal').classList.add('hidden');
  try { if (typeof BattleUI !== 'undefined') BattleUI.destroy(); } catch(e) {}
  try { if (typeof BattleCanvas !== 'undefined') BattleCanvas.stop(); } catch(e) {}
  const stage = this.currentStage;
  if (stage && stage._isMapBattle) {
    this.switchPage('map');
  } else {
    this.selectedCampaignChapter = null;
    this.switchPage('campaign');
  }
};

// Direct "next stage" — skip result screen and jump straight into the next campaign stage
App.goNextStage = function() {
  document.getElementById('result-modal').classList.add('hidden');
  this.selectedCampaignChapter = null;
  const progress = Storage.getCampaignProgress();
  const chapter = Campaign.CHAPTERS.find(c => c.id === progress.chapter);
  if (!chapter) { this.switchPage('campaign'); return; }
  const nextStage = chapter.stages.find(s => {
    if (s.id !== progress.stage) return false;
    if (s.branch) {
      const choice = progress.choices[chapter.id];
      return choice === s.branch || (!choice && s.branch === 'A');
    }
    return true;
  });
  if (nextStage) {
    this.enterStage(nextStage, chapter);
  } else {
    this.switchPage('campaign');
  }
};

// Show emergency button 15s after battle starts
const _startBattleBeforeEmergency = App.startBattle;
App.startBattle = async function() {
  // Remove pre-battle fighter overlay
  try {
    const wrap = document.getElementById('battle-canvas-wrap');
    const overlay = wrap?.querySelector('.battle-overlay');
    if (overlay) overlay.remove();
  } catch(e) {}

  // Show emergency return button after 15s in case battle freezes
  const skipBtn = document.getElementById('btn-battle-skip');
  if (skipBtn) {
    skipBtn.style.display = 'none';
    setTimeout(() => { if (skipBtn) skipBtn.style.display = 'block'; }, 15000);
  }
  return _startBattleBeforeEmergency.call(this);
};

// ===== BUTTON RIPPLE EFFECT =====
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn');
  if (!btn || btn.disabled) return;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ===== CITY BUILDER INTEGRATION =====
App.renderCity = function() {
  try {
    if (typeof City === 'undefined') return;
    const state = City.getState();
    const pending = City.getPendingIncome(state);
    const prosperity = City.getProsperity(state);
    const bonuses = City.getCombatBonuses();

    // Prosperity
    const prosEl = document.getElementById('city-prosperity');
    if (prosEl) prosEl.textContent = City.formatNum(prosperity);

    // Income banner
    const pendGold = document.getElementById('city-pending-gold');
    const pendExp = document.getElementById('city-pending-exp');
    const incTime = document.getElementById('city-income-time');
    const banner = document.getElementById('city-income-banner');
    if (pendGold) pendGold.textContent = '+' + City.formatNum(pending.gold) + ' 金币';
    if (pendExp) pendExp.textContent = '+' + City.formatNum(pending.exp) + ' 经验';
    if (incTime) incTime.textContent = City.formatTime(pending.hours) + '前收取';
    // Show/hide banner based on whether there's income
    const hasIncome = pending.gold > 0 || pending.exp > 0;
    if (banner) {
      banner.classList.toggle('city-income-empty', !hasIncome);
      if (!hasIncome && state.buildings.granary === 0 && state.buildings.academy === 0) {
        if (pendGold) pendGold.textContent = '升级粮仓/书院产出资源';
        if (pendExp) pendExp.textContent = '';
      }
    }

    // Daily event
    const evtEl = document.getElementById('city-event');
    const dailyEvent = City.getDailyEvent();
    if (evtEl && dailyEvent) {
      evtEl.style.display = 'block';
      evtEl.innerHTML =
        '<div class="city-event-inner">' +
          '<div class="city-event-icon" style="background:' + dailyEvent.color + '20;color:' + dailyEvent.color + '">' + dailyEvent.icon + '</div>' +
          '<div class="city-event-info">' +
            '<div class="city-event-name" style="color:' + dailyEvent.color + '">' + dailyEvent.name + '</div>' +
            '<div class="city-event-desc">' + dailyEvent.desc + '</div>' +
          '</div>' +
          '<button class="city-event-btn" onclick="App.resolveCityEvent()" style="border-color:' + dailyEvent.color + ';color:' + dailyEvent.color + '">' +
            (dailyEvent.type === 'negative' ? '击退' : '领取') +
          '</button>' +
        '</div>';
    } else if (evtEl) {
      evtEl.style.display = 'none';
    }

    // Combat bonuses bar
    const bonusEl = document.getElementById('city-bonuses');
    if (bonusEl) {
      const bonusList = [];
      if (bonuses.atk_pct > 0) bonusList.push('<span class="city-bonus-tag city-bonus-atk">⚔ ATK +' + bonuses.atk_pct + '%</span>');
      if (bonuses.def_pct > 0) bonusList.push('<span class="city-bonus-tag city-bonus-def">🛡 DEF +' + bonuses.def_pct + '%</span>');
      if (bonuses.equip_pct > 0) bonusList.push('<span class="city-bonus-tag city-bonus-equip">🗡 装备 +' + bonuses.equip_pct + '%</span>');
      if (bonuses.scout_pct > 0) bonusList.push('<span class="city-bonus-tag city-bonus-scout">👁 侦察 +' + bonuses.scout_pct + '%</span>');
      if (bonusList.length > 0) {
        bonusEl.innerHTML = '<div class="city-bonus-label">城池加成</div><div class="city-bonus-list">' + bonusList.join('') + '</div>';
        bonusEl.style.display = '';
      } else {
        bonusEl.style.display = 'none';
      }
    }

    // Buildings grid
    const grid = document.getElementById('city-buildings');
    if (!grid) return;
    const order = City.getBuildingOrder();
    const palaceLvl = state.buildings.palace || 1;

    grid.innerHTML = order.map(id => {
      const def = City.BUILDINGS[id];
      const lvl = state.buildings[id] || 0;
      const tier = City.getLevelTier(lvl);
      const icon = def.icon(lvl);
      const isLocked = lvl === 0 && id !== 'palace' && palaceLvl < def.unlock;
      const isMaxed = lvl >= City.MAX_LEVEL;
      const cost = City.upgradeCost(id, lvl);
      const player = Storage.getPlayer();
      const canAfford = player.gold >= cost;
      const nextLvl = lvl + 1;

      if (isLocked) {
        return '<div class="city-building-card city-building-locked">' +
          '<div class="city-building-lock">🔒</div>' +
          '<div class="city-building-name">' + def.name + '</div>' +
          '<div class="city-building-unlock">主公府 Lv.' + def.unlock + ' 解锁</div>' +
        '</div>';
      }

      const bonusNow = lvl > 0 ? def.bonusDesc(lvl) : '—';
      const bonusNext = !isMaxed ? def.bonusDesc(nextLvl) : '已满级';

      return '<div class="city-building-card city-tier-' + tier + (isMaxed ? ' city-building-maxed' : '') + '" id="city-b-' + id + '">' +
        '<div class="city-building-top">' +
          '<div class="city-building-icon">' + icon + '</div>' +
          (lvl > 0 ? '<div class="city-building-level">Lv.' + lvl + '</div>' : '<div class="city-building-level city-building-new">新</div>') +
        '</div>' +
        '<div class="city-building-name">' + def.name + '</div>' +
        '<div class="city-building-desc">' + def.desc + '</div>' +
        '<div class="city-building-stars">' + City.getLevelStars(lvl) + '</div>' +
        // Bonus comparison
        '<div class="city-building-bonus">' +
          (lvl > 0 ? '<span class="city-bonus-now">' + bonusNow + '</span>' : '') +
          (!isMaxed ? '<span class="city-bonus-arrow">' + (lvl > 0 ? ' → ' : '') + '</span><span class="city-bonus-next">' + bonusNext + '</span>' : '<span class="city-bonus-max">✦ 满级</span>') +
        '</div>' +
        // Upgrade button
        (!isMaxed ?
          '<button class="city-upgrade-btn' + (!canAfford ? ' city-upgrade-disabled' : '') + '" onclick="App.upgradeBuilding(\'' + id + '\')">' +
            '<span class="city-upgrade-cost">' +
              '<svg class="city-gold-icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#d4a843"/><text x="8" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#0a0e1a">¥</text></svg>' +
              City.formatNum(cost) +
            '</span>' +
            '<span>' + (lvl === 0 ? '建造' : '升级') + '</span>' +
          '</button>' :
          '<div class="city-upgrade-maxed">🏆 已达巅峰</div>'
        ) +
      '</div>';
    }).join('');

    this.updateHeader();
  } catch(e) {
    console.error('[renderCity]', e);
  }
};

App.collectCityIncome = function() {
  if (typeof City === 'undefined') return;
  const pending = City.getPendingIncome();
  if (pending.gold <= 0 && pending.exp <= 0) {
    this.toast('暂无可收取的资源');
    return;
  }
  const result = City.collectIncome();

  // Satisfying collection animation
  const banner = document.getElementById('city-income-banner');
  if (banner) {
    banner.classList.add('city-income-collected');
    // Spawn floating numbers
    this._spawnCityFloater(banner, '+' + City.formatNum(result.gold) + ' 金', '#d4a843');
    if (result.exp > 0) {
      setTimeout(() => this._spawnCityFloater(banner, '+' + City.formatNum(result.exp) + ' 经验', '#6366f1'), 200);
    }
    setTimeout(() => {
      banner.classList.remove('city-income-collected');
      this.renderCity();
    }, 1200);
  } else {
    this.renderCity();
  }

  this.updateHeader();
  const parts = [];
  if (result.gold > 0) parts.push(City.formatNum(result.gold) + '金');
  if (result.exp > 0) parts.push(City.formatNum(result.exp) + '经验');
  this.toast('收取 ' + parts.join(', '));
};

App._spawnCityFloater = function(parent, text, color) {
  const floater = document.createElement('div');
  floater.className = 'city-floater';
  floater.style.color = color;
  floater.textContent = text;
  parent.style.position = 'relative';
  parent.appendChild(floater);
  setTimeout(() => floater.remove(), 1500);
};

App.upgradeBuilding = function(buildingId) {
  if (typeof City === 'undefined') return;
  const result = City.upgrade(buildingId);
  if (!result.ok) {
    this.toast(result.reason);
    return;
  }

  // Upgrade animation on the card
  const card = document.getElementById('city-b-' + buildingId);
  if (card) {
    card.classList.add('city-building-upgrading');
    // Sparkle particles
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement('div');
      spark.className = 'city-sparkle';
      spark.style.setProperty('--angle', (i * 45) + 'deg');
      spark.style.setProperty('--delay', (i * 50) + 'ms');
      card.appendChild(spark);
      setTimeout(() => spark.remove(), 1000);
    }
    setTimeout(() => {
      card.classList.remove('city-building-upgrading');
      this.renderCity();
    }, 800);
  } else {
    this.renderCity();
  }

  this.updateHeader();
  const def = City.BUILDINGS[buildingId];
  this.toast(def.name + ' 升至 Lv.' + result.newLevel + '！');
};

App.resolveCityEvent = function() {
  if (typeof City === 'undefined') return;
  const evt = City.resolveDailyEvent();
  if (!evt) return;
  this.updateHeader();
  if (evt.id === 'bandits') {
    this.toast('⚔️ 匪患已平！城池恢复安宁');
  } else if (evt.id === 'scholar') {
    this.toast('📜 名士授学，获得 500 经验');
  } else if (evt.id === 'merchant') {
    this.toast('🐫 商队惠赠，获得 300 金币');
  } else if (evt.id === 'harvest') {
    this.toast('🌾 丰收之喜，获得 200 金币');
  }
  this.renderCity();
};

// Hero Personality: Defection event display
App._showDefectionEvent = function(defectedIds) {
  if (!defectedIds || defectedIds.length === 0) return;
  for (const heroId of defectedIds) {
    const hero = HEROES[heroId];
    if (!hero) continue;

    // Remove from roster
    try {
      const roster = Storage.getRoster();
      delete roster[heroId];
      Storage.saveRoster(roster);
      // Remove from team if present
      const team = Storage.getTeam();
      const idx = team.indexOf(heroId);
      if (idx !== -1) { team[idx] = null; Storage.saveTeam(team); }
    } catch(e) { console.error('[Defection roster]', e); }

    // Show dramatic overlay
    const overlay = document.createElement('div');
    overlay.className = 'defection-overlay';
    overlay.innerHTML =
      '<div class="defection-card">' +
        '<div class="defection-title">⚠️ 武将叛离！</div>' +
        (typeof Visuals !== 'undefined' ? '<div style="margin:12px 0">' + Visuals.heroPortrait(heroId, 'lg') + '</div>' : '') +
        '<div class="defection-hero-name">' + hero.name + '</div>' +
        '<div class="defection-msg">' + hero.name + '忠诚度降至零，心生二意，已离开你的队伍！<br><br><span style="color:var(--dim);font-size:12px">提示：通过出战、配合羁绊伙伴可以提升忠诚度</span></div>' +
        '<button class="defection-btn" onclick="this.closest(\'.defection-overlay\').remove()">知道了</button>' +
      '</div>';
    document.body.appendChild(overlay);
  }
};

// Hero Personality: daily decay check on init
// Note: App.init is already wrapped at line ~3404 for tutorial/playtime.
// Instead of re-wrapping (creating fragile chains), extend the existing wrapper.
App._personalityInitDone = false;
const _initForPersonality = App.init;
App.init = function() {
  _initForPersonality.call(this);
  if (!App._personalityInitDone) {
    App._personalityInitDone = true;
    try {
      if (typeof HeroPersonality !== 'undefined') {
        HeroPersonality.dailyLoyaltyDecay();
      }
    } catch(e) { console.error('[Personality daily]', e); }
  }
};

App.upgradeDoctrine = function(path) {
  try {
    if (typeof WarDirector === 'undefined') return;
    const labels = { aggression: '进攻', resilience: '守御', command: '统御' };
    const res = WarDirector.upgradeDoctrine(path);
    if (!res || !res.ok) {
      this.toast(res?.msg || '无法升级');
      return;
    }
    this.toast(`⚔️ ${labels[path] || path}学派提升至 Lv.${res.level}`);
    this.renderHome();
  } catch (e) {
    console.error('[upgradeDoctrine]', e);
    this.toast('升级失败，请重试');
  }
};

// War Director: inject long-term progression card into home page
App._renderHomeWithWarDirector = App.renderHome;
App.renderHome = function() {
  App._renderHomeWithWarDirector.call(this);
  try {
    if (typeof WarDirector === 'undefined') return;
    const homePage = document.getElementById('page-home');
    if (!homePage) return;
    const summary = WarDirector.getHomeSummary();
    let card = document.getElementById('war-director-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'war-director-card';
      card.className = 'card';
      homePage.appendChild(card);
    }
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<div style="font-size:15px;font-weight:700;color:var(--gold)">⚔️ 战争导演系统</div>' +
      '<div style="font-size:12px;color:var(--dim)">连胜 ' + summary.streak + ' · ' + summary.momentumTitle + '</div>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--dim);margin-bottom:8px">' + summary.bonusText + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;font-size:11px;color:var(--dim)">' +
      '<div class="card" style="padding:6px;background:var(--card2)">魏势 ' + (summary.momentum.wei >= 0 ? '+' : '') + summary.momentum.wei + '</div>' +
      '<div class="card" style="padding:6px;background:var(--card2)">蜀势 ' + (summary.momentum.shu >= 0 ? '+' : '') + summary.momentum.shu + '</div>' +
      '<div class="card" style="padding:6px;background:var(--card2)">吴势 ' + (summary.momentum.wu >= 0 ? '+' : '') + summary.momentum.wu + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:12px">' +
      '<div class="card" style="padding:8px;background:var(--card2)">进攻学派 Lv.' + (summary.doctrines.aggression || 0) + '</div>' +
      '<div class="card" style="padding:8px;background:var(--card2)">守御学派 Lv.' + (summary.doctrines.resilience || 0) + '</div>' +
      '<div class="card" style="padding:8px;background:var(--card2)">统御学派 Lv.' + (summary.doctrines.command || 0) + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px">' +
      '<button class="btn btn-sm" onclick="App.upgradeDoctrine(\'aggression\')">进攻+1</button>' +
      '<button class="btn btn-sm" onclick="App.upgradeDoctrine(\'resilience\')">守御+1</button>' +
      '<button class="btn btn-sm" onclick="App.upgradeDoctrine(\'command\')">统御+1</button>' +
      '</div>' +
      '<div style="margin-top:10px;font-size:12px;color:var(--text)">战争积分: <b style="color:var(--gold)">' + summary.points +
      '</b> · 可分配军略点: <b style="color:#22c55e">' + summary.doctrinePoints + '</b></div>';
  } catch (e) { console.error('[WarDirector home card]', e); }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  
  // UI Sound Integration
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .btn, .hero-card, .card, .page-tab, .dialogue-option');
    if (!target) return;
    
    // Different sounds for different actions
    if (target.classList.contains('btn-primary') || target.classList.contains('btn-gold')) {
      if (typeof UISound !== 'undefined') UISound.playSuccess();
    } else if (target.classList.contains('upgrade-btn')) {
      if (typeof UISound !== 'undefined') UISound.playCoin();
    } else if (target.classList.contains('hero-card')) {
      if (typeof UISound !== 'undefined') UISound.playHover();
    } else {
      if (typeof UISound !== 'undefined') UISound.playClick();
    }
  });
  
  // Initialize BGM
  if (typeof BGM !== 'undefined') {
    BGM.init();
    BGM.playPeaceBgm();
  }
  
  // Play opening cinematic for new players
  setTimeout(() => {
    if (typeof OpeningCinematic !== 'undefined') {
      OpeningCinematic.init();
      OpeningCinematic.play();
    }
  }, 500);
});

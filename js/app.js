// 三国·天命 — App Controller (v2)

// ===== LEADERBOARD ENGINE =====
const Leaderboard = {
  RIVAL_NAMES: ['烈焰军', '苍龙营', '虎豹骑', '飞鱼卫', '赤壁联军', '铁壁营', '青龙军', '白虎卫', '玄武营'],
  RIVAL_LEADERS: ['袁绍', '袁术', '公孙瓒', '陶谦', '刘表', '马腾', '韩遂', '张鲁', '孟获'],
  RIVAL_EMOJIS: ['狮', '龙', '虎', '鱼', '焰', '城', '蛟', '狼', '象'],

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
    this._showSplash();
    this.updateHeader();
    this.renderHome();
    this.renderCampaign();
    this.renderRoster();
    this.renderTeam();
    this.renderGacha();
    this.checkIdleReward();
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

  _logClass(msg) {
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
    let lootMsg = '';
    // Convert idle loot to Equipment system items
    if (result.loot.length > 0 && typeof Equipment !== 'undefined') {
      for (const oldLoot of result.loot) {
        try {
          const progress = Storage.getCampaignProgress();
          const drop = Equipment.generateDrop(progress.chapter || 1, false);
          if (drop) {
            Storage.addEquipment(drop);
            const tmpl = Equipment.TEMPLATES[drop.templateId];
            lootMsg += ' ' + (tmpl?.name || '装备');
          }
        } catch(e) { console.error('[idle loot]', e); }
      }
    }
    this.toast('领取 ' + result.gold + '金币 + ' + result.exp + '经验！' + (lootMsg ? ' 获得:' + lootMsg : ''));
    document.getElementById('idle-card').classList.add('hidden');
    this.renderHome();
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
      div.innerHTML = '<div class="stage-num ' + (stage.boss ? 'stage-boss' : '') + '">' + (stage.boss ? Visuals.bossSkull() : stage.id) + '</div>' +
        '<div class="stage-info"><div class="stage-name">' + stage.name + (isCompleted ? ' <span style="color:var(--shu)">通</span>' : '') + '</div>' +
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
    const chapter = stage._chapter || Campaign.getCurrentChapter();
    const terrain = stage.terrain || stage._terrain || chapter.terrain || 'plains';
    const weather = stage.weather || stage._weather || chapter.weather || 'clear';
    const enemyScale = stage._scaleMult || 1;
    Battle.init(team, stage.enemies, terrain, weather, enemyScale);

    // Initialize canvas renderer
    try {
      const canvasEl = document.getElementById('battle-canvas');
      if (canvasEl && typeof BattleCanvas !== 'undefined') {
        BattleCanvas.init(canvasEl);
        BattleCanvas.setupFighters(Battle.state);
        BattleCanvas.start();
        // Safety re-resize after layout settles (mobile Safari can be slow)
        setTimeout(() => {
          BattleCanvas.resize();
          BattleCanvas.initFighters(Battle.state);
        }, 150);
      }
    } catch(e) { console.error('[BattleCanvas init]', e); }

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

    // Sync canvas fighter state (HP/rage/alive) and process VFX
    try {
      if (typeof BattleCanvas !== 'undefined' && BattleCanvas.running) {
        BattleCanvas.syncState(state);
        if (Battle.vfx && Battle.vfx.length > 0) {
          BattleCanvas.processVFX(Battle.vfx);
        }
      }
    } catch(e) { /* VFX errors should never break gameplay */ }
    if (Battle.vfx) Battle.vfx = [];
  },

  async startBattle() {
    document.getElementById('btn-battle-start').classList.add('hidden');

    Battle.onUpdate = (state) => {
      this.renderBattleField();
      const logEl = document.getElementById('battle-log');
      const recentLogs = Battle.log.slice(-15);
      logEl.innerHTML = recentLogs.map(l => '<div class="log-entry ' + App._logClass(l.msg) + '">' + l.msg + '</div>').join('');
      logEl.scrollTop = logEl.scrollHeight;
    };

    const result = await Battle.run(1.5);
    const modal = document.getElementById('result-modal');
    const stage = this.currentStage;

    if (result === 'victory') {
      document.getElementById('result-icon').innerHTML = '<span style="font-size:48px;color:var(--gold)">胜</span>';
      document.getElementById('result-title').textContent = '胜利！';
      Storage.addGold(stage.reward.gold);
      Storage.addExp(stage.reward.exp);
      if (stage.reward.hero_shard) Storage.addShards(stage.reward.hero_shard, 3);
      Campaign.completeStage(stage.id, (stage._chapter || Campaign.getCurrentChapter()).id);

      let resultText = '+' + stage.reward.gold + '金 +' + stage.reward.exp + '经验' + (stage.reward.hero_shard ? ' +3碎片' : '');

      // v3: Equipment drop
      if (typeof Equipment !== 'undefined') {
        const chapter = Campaign.getCurrentChapter();
        const drop = Equipment.generateDrop(chapter.id, !!stage.boss);
        if (drop) {
          Storage.addEquipment(drop);
          const tmpl = Equipment.TEMPLATES[drop.templateId];
          const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1];
          resultText += '\n获得装备: ' + (tmpl?.emoji || '') + ' ' + (tmpl?.name || '???') + ' (' + rarInfo.label + ')';
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
      div.innerHTML = '<div class="hero-emoji">' + Visuals.heroPortrait(id, 'sm', hero.rarity) + '</div>' +
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
      div.className = 'hero-card' + (hero ? ' rarity-' + hero.rarity : '') + (isSelected ? ' slot-selected' : '');
      if (isSelected) div.style.cssText = 'border:2px solid var(--gold);box-shadow:0 0 12px rgba(212,168,67,.5)';

      if (hero) {
        div.innerHTML = '<div class="hero-emoji">' + Visuals.heroPortrait(heroId, 'sm', hero.rarity) + '</div>' +
          '<div class="hero-info"><div class="hero-name">' + labels[i] + ': ' + hero.name + '</div>' +
          '<div class="hero-sub">' + (UNIT_TYPES[hero.unit]?.name || '') + ' · ' + (FACTIONS[hero.faction]?.name || '') +
          ' <span style="color:var(--dim);font-size:11px">(点击选中换将)</span></div></div>';
      } else {
        div.innerHTML = '<div class="hero-emoji" style="opacity:.5;font-size:28px;color:var(--gold)">+</div>' +
          '<div class="hero-info"><div class="hero-name" style="color:var(--gold)">' + labels[i] + ': ' +
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

    // Hint text
    const hint = document.createElement('div');
    hint.style.cssText = 'text-align:center;font-size:12px;color:var(--dim);margin:8px 0 4px';
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
      div.style.cursor = 'pointer';
      div.innerHTML = '<div class="hero-emoji">' + Visuals.heroPortrait(id, 'sm', hero.rarity) + '</div>' +
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

      const div = document.createElement('div');
      div.className = 'hero-card rarity-' + hero.rarity;
      div.innerHTML = '<div class="hero-emoji">' + Visuals.heroPortrait(id, 'sm', hero.rarity) + '</div>' +
        '<div class="hero-info">' +
          '<div class="hero-name">' + hero.name + ' · ' + hero.title + (owned ? ' <span style="color:var(--shu)">已有</span>' : '') + '</div>' +
          '<div class="hero-sub">' + visit.hint + '</div>' +
          '<div style="margin-top:4px;font-size:11px">' + Visuals.resIcon('gold') + visit.cost + ' · 拜访' + visit.dialogues + '次 · ' + '★'.repeat(hero.rarity) +
          (status.attempts > 0 ? ' · 已访' + status.attempts + '次' : '') + '</div>' +
        '</div>';
      if (!owned) div.onclick = () => this.startVisit(id);
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
    if (d) {
      box.innerHTML = '<div class="dialogue-text">' + d.text + '</div>' +
        '<div class="dialogue-options">' +
        d.options.map((o, i) => '<div class="dialogue-option" onclick="App.makeGachaChoice(' + i + ')">' + o.text + '</div>').join('') +
        '</div>';
    } else {
      box.innerHTML = '<div class="text-center" style="padding:20px">' +
        '<div class="text-dim">本次拜访结束</div>' +
        '<div class="mt-8">诚意度: ' + status.sincerity + '</div>' +
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
      box.innerHTML = '<div class="dialogue-text" style="color:var(--gold);font-size:15px">' + result.response + '</div>' +
        '<div class="recruit-success" style="text-align:center;margin:16px 0">' + Visuals.heroPortrait(this.currentVisitHero, 'xl') + '</div>' +
        '<div class="text-center" style="font-size:16px;font-weight:700;color:var(--gold)">' + hero.name + ' 加入了你的队伍！</div>' +
        '<button class="btn btn-gold btn-block mt-16" onclick="App.switchPage(\'roster\')">查看武将</button>';
      this.toast(hero.name + ' 加入了你的队伍！', 4000);
    } else {
      // Show response first — player must click "继续" to advance
      box.innerHTML = '<div class="dialogue-text">' + result.response + '</div>' +
        '<div class="text-dim text-center mt-8" style="font-size:12px">诚意度 ' + (result.choice.sincerity >= 0 ? '+' : '') + result.choice.sincerity + '</div>' +
        (result.visitComplete
          ? '<div class="text-center mt-16">' +
              '<div style="font-size:14px;font-weight:600;color:var(--hp)">招募失败</div>' +
              '<div class="text-dim mt-8">诚意不足，下次再努力！</div>' +
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
      'raid_yiling': 'luXun',
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
    this.prepareBattle(this.currentStage);
    this.switchPage('battle');
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

    let html = '<div class="card">' +
      '<div class="flex justify-between items-center mb-8">' +
        '<div style="font-size:14px;font-weight:600"> 天赋树</div>' +
        '<div style="font-size:12px;color:var(--gold)">可用点数: ' + available + '</div>' +
      '</div>';

    for (let bi = 0; bi < tree.branches.length; bi++) {
      const branch = tree.branches[bi];
      const unlocked = state[branch.id] || [];
      html += '<div style="margin-bottom:12px">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:6px">' + branch.icon + ' ' + branch.name + ' <span class="text-dim" style="font-size:11px">' + branch.desc + '</span></div>' +
        '<div style="display:flex;gap:4px;overflow-x:auto">';

      for (let ni = 0; ni < branch.nodes.length; ni++) {
        const node = branch.nodes[ni];
        const isUnlocked = unlocked.includes(ni);
        const canUnlock = !isUnlocked && available > 0 && (ni === 0 || unlocked.includes(ni - 1));
        const isUltimate = ni === branch.nodes.length - 1;

        html += '<div style="min-width:62px;text-align:center;padding:6px 4px;border-radius:8px;font-size:10px;' +
          'background:' + (isUnlocked ? 'rgba(212,168,67,.2)' : 'var(--card2)') + ';' +
          'border:1px solid ' + (isUnlocked ? 'var(--gold)' : canUnlock ? 'var(--accent)' : 'var(--border)') + ';' +
          (canUnlock ? 'cursor:pointer' : '') + '"' +
          (canUnlock ? ' onclick="App.unlockSkillNode(\'' + heroId + '\',' + bi + ',' + ni + ')"' : '') + '>' +
          '<div style="font-size:' + (isUltimate ? '11px' : '10px') + ';font-weight:600;' + (isUltimate ? 'color:var(--gold)' : '') + '">' + node.name + '</div>' +
          '<div style="font-size:9px;color:var(--dim);margin-top:2px">' + node.desc + '</div>' +
          (isUnlocked ? '<div style="font-size:9px;color:var(--shu);margin-top:2px">已学</div>' : '') +
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
    this.toast('解锁天赋: ' + result.node.name);
    this.renderHeroDetail(heroId);
  },

  respecSkillTree(heroId) {
    const result = SkillTree.respec(heroId);
    if (result.error) { this.toast(result.error); return; }
    this.toast('天赋已重置，返还 ' + result.refunded + ' 点');
    this.renderHeroDetail(heroId);
    this.updateHeader();
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

      try { Storage.addGold(stage.reward.gold); } catch(e) { console.error('[addGold]', e); }
      try { Storage.addExp(stage.reward.exp); } catch(e) { console.error('[addExp]', e); }

      let detailText = '+' + (stage.reward?.gold || 0) + '金 +' + (stage.reward?.exp || 0) + '经验';

      if (stage.reward?.hero_shard) {
        try { Storage.addShards(stage.reward.hero_shard, 3); detailText += ' +3碎片'; } catch(e) { console.error('[addShards]', e); }
      }

      // Handle different modes
      try {
        if (stage._dungeonFloor) {
          Dungeon.advanceFloor();
          detailText += ' · 进入下一层';
        } else if (stage._dailyDungeon) {
          Dungeon.recordDailyAttempt(stage._dailyDungeon);
          if (stage._dailyDungeon === 'material' && typeof Equipment !== 'undefined') {
            const drop = Equipment.generateDrop(3, false);
            if (drop) {
              Storage.addEquipment(drop);
              const tmpl = Equipment.TEMPLATES[drop.templateId];
              const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1];
              detailText += '\n获得: ' + (tmpl?.name || '???') + ' (' + (rarInfo?.label || '') + ')';
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
                Storage.addEquipment(drop);
                const tmpl = Equipment.TEMPLATES[drop.templateId];
                const rarInfo = Equipment.RARITIES[tmpl?.rarity || 1];
                detailText += '\n获得: ' + (tmpl?.name || '???') + ' (' + (rarInfo?.label || '') + ')';
              }
            } catch(e) { console.error('[Equipment drop]', e); }
          }
        }
      } catch(e) { console.error('[Mode handling]', e); }

      document.getElementById('result-detail').innerHTML = detailText.replace(/\n/g, '<br>');

      try { Storage.recordWin(); } catch(e) {}
      try { DailyMissions.trackProgress('stages'); } catch(e) {}
      if (stage.boss) {
        try { Storage.recordBossWin(); DailyMissions.trackProgress('boss'); } catch(e) {}
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
        if (stage._dungeonFloor) {
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

      try { Storage.recordLoss(); } catch(e) {}
    }
  } catch(e) {
    // Absolute fallback — always show result
    console.error('[startBattle result handling]', e);
    document.getElementById('result-icon').innerHTML = '<span style="font-size:48px;color:var(--gold)">胜</span>';
    document.getElementById('result-title').textContent = '战斗结束';
    document.getElementById('result-detail').textContent = '点击继续';
    // Still try to advance campaign
    try {
      if (!stage._dungeonFloor && !stage._dailyDungeon && !stage._arenaFight && !stage._raidBoss) {
        const chapter = stage._chapter || Campaign.getCurrentChapter();
        Campaign.completeStage(stage.id, chapter.id);
      }
    } catch(e2) { console.error('[fallback completeStage]', e2); }
  }

  // Show/hide "下一关" button — only for campaign victory
  try {
    const nextBtn = document.getElementById('btn-next-stage');
    if (nextBtn) {
      const isCampaign = !stage._dungeonFloor && !stage._dailyDungeon && !stage._arenaFight && !stage._raidBoss;
      nextBtn.style.display = (result === 'victory' && isCampaign) ? 'block' : 'none';
    }
  } catch(e) {}

  // Canvas victory/defeat effects
  try {
    if (typeof BattleCanvas !== 'undefined' && BattleCanvas.running) {
      if (result === 'victory') BattleCanvas.showVictory();
      else BattleCanvas.showDefeat();
    }
  } catch(e) {}

  // Delay modal slightly to let canvas effects play
  await new Promise(r => setTimeout(r, 800));

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
  try { if (typeof BattleCanvas !== 'undefined') BattleCanvas.stop(); } catch(e) {}
  const stage = this.currentStage;
  if (stage._dungeonFloor) {
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
App.emergencyReturn = function() {
  document.getElementById('result-modal').classList.add('hidden');
  try { if (typeof BattleCanvas !== 'undefined') BattleCanvas.stop(); } catch(e) {}
  this.selectedCampaignChapter = null;
  this.switchPage('campaign');
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

// Show emergency button 10s after battle starts
const _origStartBattle2 = App.startBattle;
const _wrappedStart = App.startBattle;
App.startBattle = async function() {
  // Show emergency return button after 15s in case battle freezes
  const skipBtn = document.getElementById('btn-battle-skip');
  if (skipBtn) {
    skipBtn.style.display = 'none';
    setTimeout(() => { if (skipBtn) skipBtn.style.display = 'block'; }, 15000);
  }
  return _wrappedStart.call(this);
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

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());

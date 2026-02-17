// 三国·天命 — App Controller
const App = {
  currentPage: 'home',
  currentStage: null,
  currentVisitHero: null,

  init() {
    this.updateHeader();
    this.renderHome();
    this.renderCampaign();
    this.renderRoster();
    this.renderTeam();
    this.renderGacha();
    this.checkIdleReward();
  },

  // ===== NAVIGATION =====
  switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-item').forEach((n, i) => {
      n.classList.toggle('active', ['home','campaign','gacha','roster','team'][i] === page);
    });
    this.currentPage = page;
    // Refresh page content
    if (page === 'home') this.renderHome();
    if (page === 'campaign') this.renderCampaign();
    if (page === 'roster') this.renderRoster();
    if (page === 'team') this.renderTeam();
    if (page === 'gacha') this.renderGacha();
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
    document.getElementById('chapter-progress').textContent = `第${chapter.id}章 ${progress.stage}/10`;
    document.getElementById('chapter-bar').style.width = (progress.stage / 10 * 100) + '%';
    this.updateHeader();
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
    this.toast(`🎉 领取 ${result.gold}金币 + ${result.exp}经验！${result.loot.length ? ' 获得装备!' : ''}`);
    document.getElementById('idle-card').classList.add('hidden');
    this.renderHome();
  },

  // ===== CAMPAIGN =====
  renderCampaign() {
    const chapter = Campaign.getCurrentChapter();
    const progress = Storage.getCampaignProgress();
    document.getElementById('campaign-title').textContent = chapter.icon + ' ' + chapter.name;
    
    const terrainEmojis = { plains:'🌾 平原', mountain:'⛰️ 山地', water:'🌊 水域', castle:'🏰 城池' };
    const weatherEmojis = { clear:'☀️ 晴天', rain:'🌧️ 雨天', fog:'🌫️ 雾天', fire:'🔥 火烧' };
    document.getElementById('campaign-terrain').textContent = terrainEmojis[chapter.terrain] || '🌾 平原';
    document.getElementById('campaign-weather').textContent = weatherEmojis[chapter.weather] || '☀️ 晴天';

    const list = document.getElementById('stage-list');
    list.innerHTML = '';
    
    for (const stage of chapter.stages) {
      // Check branch visibility
      if (stage.branch) {
        const choice = progress.choices[chapter.id];
        if (choice && choice !== stage.branch) continue;
        if (!choice && stage.branch === 'B') continue;
      }
      
      const isCurrent = stage.id === progress.stage;
      const isLocked = stage.id > progress.stage;
      const isCompleted = stage.id < progress.stage;
      
      const div = document.createElement('div');
      div.className = `stage-item ${stage.boss ? 'boss' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`;
      div.innerHTML = `
        <div class="stage-num ${stage.boss ? 'stage-boss' : ''}">${stage.boss ? '💀' : stage.id}</div>
        <div class="stage-info">
          <div class="stage-name">${stage.name} ${isCompleted ? '✅' : ''}</div>
          <div class="stage-reward">💰${stage.reward.gold} · ⭐${stage.reward.exp}${stage.reward.hero_shard ? ' · 🧩碎片' : ''}</div>
        </div>
        ${stage.elite ? '<span class="text-gold">精英</span>' : ''}
      `;
      if (!isLocked) {
        div.onclick = () => this.enterStage(stage);
      }
      list.appendChild(div);
    }
  },

  enterStage(stage) {
    // Check for destiny choice
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
      div.innerHTML = `<div class="destiny-option-text">${opt.text}</div><div class="destiny-option-desc">${opt.desc}</div>`;
      div.onclick = () => {
        Campaign.makeDestinyChoice(chapterId, opt.id);
        modal.classList.add('hidden');
        // Apply reward
        if (opt.reward.gold) Storage.addGold(opt.reward.gold);
        this.toast(`天命已定：${opt.text}`);
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
        div.className = `fighter-row ${f.alive ? '' : 'dead'}`;
        const hpPct = f.alive ? (f.hp / f.maxHp * 100) : 0;
        const ragePct = f.rage / (f.maxRage || 100) * 100;
        div.innerHTML = `
          <span class="fighter-emoji">${f.emoji}</span>
          <div class="fighter-bars">
            <div class="fighter-name">${f.name}</div>
            <div class="bar"><div class="bar-fill hp-fill" style="width:${hpPct}%"></div></div>
            <div class="bar"><div class="bar-fill rage-fill" style="width:${ragePct}%"></div></div>
          </div>
        `;
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
      // Update log
      const logEl = document.getElementById('battle-log');
      const recentLogs = Battle.log.slice(-15);
      logEl.innerHTML = recentLogs.map(l => `<div class="log-entry">${l.msg}</div>`).join('');
      logEl.scrollTop = logEl.scrollHeight;
    };
    
    const result = await Battle.run(1.5);
    
    // Show result
    const modal = document.getElementById('result-modal');
    if (result === 'victory') {
      document.getElementById('result-icon').textContent = '🎉';
      document.getElementById('result-title').textContent = '胜利！';
      const stage = this.currentStage;
      Storage.addGold(stage.reward.gold);
      Storage.addExp(stage.reward.exp);
      if (stage.reward.hero_shard) Storage.addShards(stage.reward.hero_shard, 3);
      Campaign.completeStage(stage.id);
      document.getElementById('result-detail').textContent = `+${stage.reward.gold}💰 +${stage.reward.exp}⭐${stage.reward.hero_shard ? ' +3🧩' : ''}`;
    } else {
      document.getElementById('result-icon').textContent = '💀';
      document.getElementById('result-title').textContent = '败北...';
      document.getElementById('result-detail').textContent = '升级武将或调整阵容再战！';
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
      const div = document.createElement('div');
      div.className = `hero-card rarity-${hero.rarity}`;
      div.innerHTML = `
        <div class="hero-emoji">${hero.emoji}</div>
        <div class="hero-info">
          <div class="hero-name">${hero.name} ${hero.title ? '· ' + hero.title : ''}</div>
          <div class="hero-sub">Lv.${data.level} · ${UNIT_TYPES[hero.unit]?.emoji || ''} ${UNIT_TYPES[hero.unit]?.name || ''} · ${FACTIONS[hero.faction]?.emoji || ''} ${FACTIONS[hero.faction]?.name || ''}</div>
          <div class="hero-stars">${'★'.repeat(hero.rarity)}${'☆'.repeat(5 - hero.rarity)}</div>
        </div>
      `;
      list.appendChild(div);
    }
    
    if (Object.keys(roster).length === 0) {
      list.innerHTML = '<div class="text-center text-dim" style="padding:40px">还没有武将，去求贤馆招募吧！</div>';
    }
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
      div.className = 'hero-card' + (hero ? ` rarity-${hero.rarity}` : '');
      if (hero) {
        div.innerHTML = `
          <div class="hero-emoji">${hero.emoji}</div>
          <div class="hero-info">
            <div class="hero-name">${labels[i]}: ${hero.name}</div>
            <div class="hero-sub">${UNIT_TYPES[hero.unit]?.name || ''} · ${FACTIONS[hero.faction]?.name || ''}</div>
          </div>
        `;
        div.onclick = () => { team[i] = null; Storage.saveTeam(team); this.renderTeam(); };
      } else {
        div.innerHTML = `<div class="hero-emoji" style="opacity:.3">➕</div><div class="hero-info"><div class="hero-name text-dim">${labels[i]}: 空位</div></div>`;
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
      div.className = `hero-card rarity-${hero.rarity}`;
      div.innerHTML = `
        <div class="hero-emoji">${hero.emoji}</div>
        <div class="hero-info">
          <div class="hero-name">${hero.name}</div>
          <div class="hero-sub">${UNIT_TYPES[hero.unit]?.name || ''}</div>
        </div>
      `;
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
      div.className = `hero-card rarity-${hero.rarity}`;
      div.innerHTML = `
        <div class="hero-emoji">${hero.emoji}</div>
        <div class="hero-info">
          <div class="hero-name">${hero.name} · ${hero.title} ${owned ? '✅' : ''}</div>
          <div class="hero-sub">${visit.hint}</div>
          <div style="margin-top:4px;font-size:11px">
            💰${visit.cost} · 拜访${visit.dialogues}次 · ${'★'.repeat(hero.rarity)}
            ${status.attempts > 0 ? ` · 已访${status.attempts}次` : ''}
          </div>
        </div>
      `;
      if (!owned) {
        div.onclick = () => this.startVisit(id);
      }
      list.appendChild(div);
    }
  },

  startVisit(heroId) {
    const result = Gacha.startVisit(heroId);
    if (!result) return;
    if (result.error) { this.toast(result.error); return; }
    
    this.currentVisitHero = heroId;
    document.getElementById('visit-hero-name').textContent = '拜访 ' + result.hero.name;
    document.getElementById('visit-hero-display').innerHTML = `
      <div class="big-emoji">${result.hero.emoji}</div>
      <div class="hero-title">${result.hero.name} · ${result.hero.title}</div>
      <div class="text-dim mt-8" style="font-size:13px">${result.hero.lore}</div>
    `;
    
    this.updateVisitUI();
    this.switchPage('visit');
    this.updateHeader();
  },

  updateVisitUI() {
    const heroId = this.currentVisitHero;
    const status = Gacha.getVisitStatus(heroId);
    const dialogues = Gacha.DIALOGUES[heroId] || [];
    const visit = Gacha.VISITS[heroId];
    
    // Sincerity
    const maxSincerity = visit.rarity === 5 ? 90 : visit.rarity === 4 ? 60 : 40;
    document.getElementById('visit-sincerity').textContent = status.sincerity;
    document.getElementById('visit-sincerity-bar').style.width = Math.min(100, status.sincerity / maxSincerity * 100) + '%';
    
    // Current dialogue
    const d = dialogues[status.dialogueIdx];
    const box = document.getElementById('visit-dialogue');
    if (d) {
      box.innerHTML = `
        <div class="dialogue-text">${d.text}</div>
        <div class="dialogue-options">
          ${d.options.map((o, i) => `<div class="dialogue-option" onclick="App.makeGachaChoice(${i})">${o.text}</div>`).join('')}
        </div>
      `;
    } else {
      // All dialogues done for this visit — show result
      box.innerHTML = `
        <div class="text-center" style="padding:20px">
          <div class="text-dim">本次拜访结束</div>
          <div class="mt-8">诚意度: ${status.sincerity}</div>
          <button class="btn btn-gold btn-block mt-16" onclick="App.startVisit('${heroId}')">再次拜访 (💰${visit.cost})</button>
          <button class="btn btn-sm btn-block mt-8" onclick="App.switchPage('gacha')" style="background:var(--card2);color:var(--text)">返回求贤馆</button>
        </div>
      `;
    }
  },

  makeGachaChoice(idx) {
    const result = Gacha.makeChoice(this.currentVisitHero, idx);
    if (!result) return;
    
    if (result.recruited) {
      const hero = HEROES[this.currentVisitHero];
      this.toast(`🎉 ${hero.name} 加入了你的队伍！`, 4000);
      setTimeout(() => this.switchPage('roster'), 2000);
    } else {
      // Show response
      const box = document.getElementById('visit-dialogue');
      box.innerHTML = `
        <div class="dialogue-text">${result.response}</div>
        <div class="text-dim text-center mt-8" style="font-size:12px">诚意度 ${result.sincerity >= 0 ? '+' : ''}${result.choice.sincerity}</div>
        <button class="btn btn-primary btn-block mt-16" onclick="App.updateVisitUI()">继续</button>
      `;
      this.updateVisitUI();
    }
    this.updateHeader();
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());

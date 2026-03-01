// ═══════════════════════════════════════════════════════════════
// 三国·天命 — Premium Quality & Depth Upgrade Module
// Competing with AFK Arena / Rise of Kingdoms / Idle Heroes
// Pure JS/CSS — No external dependencies
// ═══════════════════════════════════════════════════════════════

// ============================================================
// 1. BATTLE VISUAL POLISH
// ============================================================
const BattleVFXPremium = {
  _shakeTimer: null,

  // --- Critical Hit Screen Flash + Shake + Large Damage Number ---
  criticalHitEffect(targetKey, damage) {
    // Screen flash
    const flash = document.createElement('div');
    flash.className = 'pvfx-crit-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);

    // Screen shake
    const battlePage = document.getElementById('page-battle');
    if (battlePage) {
      battlePage.classList.add('pvfx-shake');
      clearTimeout(this._shakeTimer);
      this._shakeTimer = setTimeout(() => battlePage.classList.remove('pvfx-shake'), 300);
    }

    // Large damage number
    this.showDamageNumber(targetKey, damage, true);
  },

  // --- Damage Number (normal or crit) ---
  showDamageNumber(targetKey, damage, isCrit) {
    const layer = document.querySelector('.bui-damage-layer') || document.getElementById('battle-canvas-wrap');
    if (!layer) return;

    const num = document.createElement('div');
    num.className = 'pvfx-dmg-num' + (isCrit ? ' pvfx-dmg-crit' : '');
    num.textContent = (isCrit ? 'CRIT! ' : '-') + damage;

    // Position near the target fighter
    const el = document.querySelector(`[data-key="${targetKey}"]`) || document.querySelector(`[data-fighter="${targetKey}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      num.style.left = (rect.left - layerRect.left + rect.width / 2) + 'px';
      num.style.top = (rect.top - layerRect.top + rect.height / 4) + 'px';
    } else {
      num.style.left = '50%';
      num.style.top = '30%';
    }

    layer.appendChild(num);
    setTimeout(() => num.remove(), 1200);
  },

  // --- Elemental Effect Particles ---
  elementalParticles(targetKey, element) {
    const layer = document.querySelector('.bui-damage-layer') || document.getElementById('battle-canvas-wrap');
    if (!layer) return;

    const container = document.createElement('div');
    container.className = 'pvfx-elem-particles pvfx-elem-' + (element || 'fire');

    const el = document.querySelector(`[data-key="${targetKey}"]`) || document.querySelector(`[data-fighter="${targetKey}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      container.style.left = (rect.left - layerRect.left + rect.width / 2 - 40) + 'px';
      container.style.top = (rect.top - layerRect.top + rect.height / 2 - 40) + 'px';
    } else {
      container.style.left = '50%';
      container.style.top = '40%';
    }

    // Generate 6-10 particles
    const count = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'pvfx-particle';
      p.style.setProperty('--px', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--py', (Math.random() * 80 - 40) + 'px');
      p.style.animationDelay = (Math.random() * 0.3) + 's';
      container.appendChild(p);
    }

    layer.appendChild(container);
    setTimeout(() => container.remove(), 1000);
  },

  // --- Defeat Animation ---
  defeatAnimation(targetKey) {
    const el = document.querySelector(`[data-key="${targetKey}"]`) || document.querySelector(`[data-fighter="${targetKey}"]`);
    if (!el) return;
    el.classList.add('pvfx-defeat');

    // Red flash behind the dying unit
    const deathFlash = document.createElement('div');
    deathFlash.className = 'pvfx-death-flash';
    el.appendChild(deathFlash);
    setTimeout(() => deathFlash.remove(), 800);
  },

  // --- Victory Celebration ---
  victoryPose() {
    const overlay = document.createElement('div');
    overlay.className = 'pvfx-victory-overlay';
    overlay.innerHTML = `
      <div class="pvfx-victory-text">胜</div>
      <div class="pvfx-victory-sub">VICTORY</div>
      <div class="pvfx-victory-particles"></div>
    `;

    // Generate victory particles (golden sparks)
    const particleContainer = overlay.querySelector('.pvfx-victory-particles');
    for (let i = 0; i < 30; i++) {
      const spark = document.createElement('div');
      spark.className = 'pvfx-victory-spark';
      spark.style.setProperty('--vx', (Math.random() * 200 - 100) + 'px');
      spark.style.setProperty('--vy', (Math.random() * -200 - 50) + 'px');
      spark.style.animationDelay = (Math.random() * 0.5) + 's';
      spark.style.left = (40 + Math.random() * 20) + '%';
      spark.style.top = (40 + Math.random() * 20) + '%';
      particleContainer.appendChild(spark);
    }

    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.classList.add('pvfx-victory-fade');
      setTimeout(() => overlay.remove(), 600);
    }, 2000);
  },

  // --- Defeat Screen ---
  defeatScreen() {
    const overlay = document.createElement('div');
    overlay.className = 'pvfx-defeat-overlay';
    overlay.innerHTML = `
      <div class="pvfx-defeat-text">败</div>
      <div class="pvfx-defeat-sub">DEFEAT</div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.classList.add('pvfx-victory-fade');
      setTimeout(() => overlay.remove(), 600);
    }, 1800);
  }
};

// ============================================================
// 2. HERO AFFINITY / SYNERGY SYSTEM
// ============================================================
const HeroAffinity = {
  // Affinity bonds — heroes that gain bonuses when paired
  BONDS: [
    { id: 'sworn_brothers', name: '桃园结义', heroes: ['liubei', 'guanyu', 'zhangfei'], bonus: { atk: 15, def: 10, hp: 10 }, desc: '刘关张三兄弟，情深义重', minCount: 2 },
    { id: 'tiger_dragon', name: '龙虎相争', heroes: ['caocao', 'lvbu'], bonus: { atk: 20, spd: 10 }, desc: '乱世枭雄与飞将', minCount: 2 },
    { id: 'beauty_beast', name: '美人计', heroes: ['diaochan', 'lvbu'], bonus: { atk: 15, int: 15 }, desc: '倾城佳人与无双猛将', minCount: 2 },
    { id: 'shu_wisdom', name: '蜀汉智囊', heroes: ['liubei', 'zhugeLiang', 'jiangwei'], bonus: { int: 20, def: 10 }, desc: '蜀汉三代智者', minCount: 2 },
    { id: 'wei_generals', name: '魏五子良将', heroes: ['xuhuang', 'zhanghe', 'xiahouyuan'], bonus: { atk: 12, spd: 8 }, desc: '曹操麾下五员大将', minCount: 2 },
    { id: 'wu_duo', name: '江东双壁', heroes: ['sunce', 'zhouyu'], bonus: { atk: 18, int: 12 }, desc: '小霸王与美周郎', minCount: 2 },
    { id: 'southern_king', name: '南蛮王侣', heroes: ['menghuo', 'zhurong'], bonus: { hp: 20, atk: 15 }, desc: '南蛮王与火神后裔', minCount: 2 },
    { id: 'archery_masters', name: '百步穿杨', heroes: ['huangzhong', 'sunshangxiang', 'taishici'], bonus: { atk: 15, spd: 10 }, desc: '弓道高手聚首', minCount: 2 },
    { id: 'shu_veterans', name: '蜀汉老将', heroes: ['huangzhong', 'yanyan', 'weiyan'], bonus: { atk: 10, def: 15 }, desc: '老而弥坚', minCount: 2 },
    { id: 'cao_strategists', name: '曹魏谋臣', heroes: ['caocao', 'simayi', 'guojia', 'xunyu'], bonus: { int: 20, spd: 8 }, desc: '天下智者汇聚', minCount: 2 },
    { id: 'rival_strategists', name: '瑜亮之争', heroes: ['zhouyu', 'zhugeLiang'], bonus: { int: 25 }, desc: '既生瑜何生亮', minCount: 2 },
    { id: 'medical_arts', name: '杏林高手', heroes: ['huatuo', 'huangyueying'], bonus: { int: 15, hp: 15 }, desc: '医道与巧匠', minCount: 2 },
    { id: 'qun_chaos', name: '乱世群雄', heroes: ['dongzhuo', 'yuanshao', 'lvbu', 'diaochan'], bonus: { atk: 12, hp: 8 }, desc: '乱世豪杰', minCount: 2 },
    { id: 'zhaoyun_liubei', name: '主仆情深', heroes: ['zhaoyun', 'liubei'], bonus: { def: 20, atk: 10 }, desc: '长坂坡七进七出', minCount: 2 },
  ],

  // Get active bonds for a team
  getActiveBonds(teamIds) {
    if (!teamIds || teamIds.length === 0) return [];
    const active = [];
    for (const bond of this.BONDS) {
      const matchCount = bond.heroes.filter(h => teamIds.includes(h)).length;
      if (matchCount >= (bond.minCount || 2)) {
        active.push({ ...bond, matchCount, totalNeeded: bond.heroes.length });
      }
    }
    return active;
  },

  // Get total bonus stats from active bonds
  getBondBonuses(teamIds) {
    const bonds = this.getActiveBonds(teamIds);
    const totals = { atk: 0, def: 0, hp: 0, spd: 0, int: 0 };
    for (const bond of bonds) {
      if (bond.bonus.atk) totals.atk += bond.bonus.atk;
      if (bond.bonus.def) totals.def += bond.bonus.def;
      if (bond.bonus.hp)  totals.hp  += bond.bonus.hp;
      if (bond.bonus.spd) totals.spd += bond.bonus.spd;
      if (bond.bonus.int) totals.int += bond.bonus.int;
    }
    return totals;
  },

  // Render synergy indicators for team selection
  renderTeamSynergies(teamIds) {
    const bonds = this.getActiveBonds(teamIds);
    if (bonds.length === 0) return '';

    let html = '<div class="affinity-panel">';
    html += '<div class="affinity-title">羁绊加成</div>';
    for (const bond of bonds) {
      const bonusText = Object.entries(bond.bonus)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => k.toUpperCase() + '+' + v + '%')
        .join(' ');
      const matchedHeroes = bond.heroes.filter(h => teamIds.includes(h));
      html += `<div class="affinity-bond">
        <div class="affinity-bond-name">${bond.name}</div>
        <div class="affinity-bond-heroes">${matchedHeroes.map(h => {
          const hero = typeof HEROES !== 'undefined' ? HEROES[h] : null;
          return hero ? hero.name : h;
        }).join(' + ')}</div>
        <div class="affinity-bond-bonus">${bonusText}</div>
        <div class="affinity-bond-desc">${bond.desc}</div>
      </div>`;
    }
    html += '</div>';
    return html;
  },

  // Render bond info for hero detail page
  renderHeroBonds(heroId) {
    const relatedBonds = this.BONDS.filter(b => b.heroes.includes(heroId));
    if (relatedBonds.length === 0) return '';

    const roster = typeof Storage !== 'undefined' ? Storage.getRoster() : {};
    let html = '<div class="card"><div style="font-size:14px;font-weight:600;margin-bottom:12px">羁绊关系</div>';
    for (const bond of relatedBonds) {
      const partners = bond.heroes.filter(h => h !== heroId);
      const bonusText = Object.entries(bond.bonus)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => k.toUpperCase() + '+' + v + '%')
        .join(' ');
      html += `<div class="affinity-detail-bond">
        <div class="affinity-detail-name">${bond.name}</div>
        <div class="affinity-detail-partners">${partners.map(h => {
          const hero = typeof HEROES !== 'undefined' ? HEROES[h] : null;
          const owned = !!roster[h];
          return '<span class="affinity-partner ' + (owned ? 'owned' : 'locked') + '">' +
            (hero ? hero.name : h) + (owned ? '' : ' (未获得)') + '</span>';
        }).join(', ')}</div>
        <div class="affinity-detail-bonus">${bonusText}</div>
        <div class="affinity-detail-desc">${bond.desc}</div>
      </div>`;
    }
    html += '</div>';
    return html;
  }
};

// ============================================================
// 2b. HERO BACKSTORY / LORE (Extended)
// ============================================================
const HeroLore = {
  EXTENDED: {
    liubei: '刘备，字玄德，涿郡涿县人。汉景帝子中山靖王刘胜之后裔。少年贫寒，以织席贩履为业，然志存高远。与关羽张飞桃园结义，誓同生死。一生颠沛流离，却始终以仁德立身，终建蜀汉基业。',
    guanyu: '关羽，字云长，河东解良人。身长九尺，髯长二尺，面如重枣，唇若涂脂。温酒斩华雄，千里走单骑过五关斩六将，水淹七军威震华夏。义薄云天，被后世尊为"武圣"。',
    zhangfei: '张飞，字翼德，涿郡人。豹头环眼，燕颔虎须，声若巨雷，势如奔马。当阳桥头一声断喝，吓退曹军百万。性格暴烈但粗中有细，善待士卒，义释严颜。',
    caocao: '曹操，字孟德，沛国谯县人。乱世枭雄，治世能臣。挟天子以令诸侯，官渡之战以少胜多破袁绍。唯才是举，广纳天下英才。文武双全，为建安文学领袖。',
    zhaoyun: '赵云，字子龙，常山真定人。身长八尺，姿颜雄伟。长坂坡七进七出，怀抱幼主阿斗杀出重围。一生征战无败绩，被誉为"常胜将军"。忠义冠绝三国。',
    lvbu: '吕布，字奉先，五原郡九原县人。骑赤兔马，使方天画戟，勇冠三国。然反复无常，先后杀丁原、董卓。虎牢关前一人独战刘关张三英，天下无双。',
    diaochan: '貂蝉，中国古代四大美女之一。以闭月之貌离间吕布与董卓，上演连环计。非花非雾，如梦如幻。柔弱之躯，却改变了汉末天下大势。',
    zhouyu: '周瑜，字公瑾，庐江舒人。江东美周郎，精通音律，雄姿英发。赤壁之战力排众议，火烧曹操八十万大军。谈笑间，樯橹灰飞烟灭。',
    huangzhong: '黄忠，字汉升，南阳人。年近七旬仍能开二石弓，百步穿杨。定军山斩杀夏侯渊，为蜀汉立下赫赫战功。老当益壮，不输后生。',
    zhangjiao: '张角，冀州巨鹿人。创立太平道，以"苍天已死，黄天当立"为号，发动黄巾起义。虽败犹荣，开启了三国乱世的序幕。',
    sunshangxiang: '孙尚香，东吴郡主，孙权之妹。自幼习武，弓马娴熟，侍婢皆披甲执刀。嫁与刘备后仍保持英武本色，巾帼不让须眉。',
    simayi: '司马懿，字仲达，河内温县人。深沉多大略，善忍。空城计前不敢追击诸葛亮，却笑到最后。三代经营，终使司马氏取代曹魏。',
  },

  getExtendedLore(heroId) {
    return this.EXTENDED[heroId] || (typeof HEROES !== 'undefined' && HEROES[heroId] ? HEROES[heroId].lore : '暂无详细背景。');
  }
};

// ============================================================
// 2c. HERO AWAKENING SYSTEM
// ============================================================
const HeroAwakening = {
  // Requirements: Max stars (5), level 40+, awakening materials
  AWAKENING_COST: { shards: 50, gold: 5000 },
  MAX_LEVEL_REQ: 40,

  canAwaken(heroId) {
    if (!heroId) return { can: false, reason: '无效武将' };
    const roster = typeof Storage !== 'undefined' ? Storage.getRoster() : {};
    const data = roster[heroId];
    if (!data) return { can: false, reason: '未拥有' };
    const hero = typeof HEROES !== 'undefined' ? HEROES[heroId] : null;
    if (!hero) return { can: false, reason: '无效' };
    if (data.awakened) return { can: false, reason: '已觉醒' };
    const stars = data.stars || hero.rarity;
    if (stars < 5) return { can: false, reason: '需要5星' };
    const level = data.level || 1;
    if (level < this.MAX_LEVEL_REQ) return { can: false, reason: '需要Lv.' + this.MAX_LEVEL_REQ };
    if ((data.shards || 0) < this.AWAKENING_COST.shards) return { can: false, reason: '碎片不足 (' + (data.shards || 0) + '/' + this.AWAKENING_COST.shards + ')' };
    const player = typeof Storage !== 'undefined' ? Storage.getPlayer() : { gold: 0 };
    if (player.gold < this.AWAKENING_COST.gold) return { can: false, reason: '金币不足' };
    return { can: true };
  },

  doAwaken(heroId) {
    const check = this.canAwaken(heroId);
    if (!check.can) return { error: check.reason };

    const roster = Storage.getRoster();
    const data = roster[heroId];
    data.shards -= this.AWAKENING_COST.shards;
    data.awakened = true;
    data.awakenLevel = 1;
    Storage.saveRoster(roster);

    const player = Storage.getPlayer();
    player.gold -= this.AWAKENING_COST.gold;
    Storage.savePlayer(player);

    return { success: true };
  },

  // Awakening stat multiplier
  getAwakenMult(heroId) {
    const roster = typeof Storage !== 'undefined' ? Storage.getRoster() : {};
    const data = roster[heroId];
    if (!data || !data.awakened) return 1.0;
    return 1.3 + (data.awakenLevel - 1) * 0.05; // 30% base + 5% per awakening level
  },

  renderAwakeningSection(heroId) {
    const check = this.canAwaken(heroId);
    const roster = typeof Storage !== 'undefined' ? Storage.getRoster() : {};
    const data = roster[heroId];
    const isAwakened = data && data.awakened;

    let html = '<div class="card">';
    html += '<div style="font-size:14px;font-weight:600;margin-bottom:8px">觉醒</div>';

    if (isAwakened) {
      const mult = this.getAwakenMult(heroId);
      html += `<div class="awakening-active">
        <div class="awakening-badge">觉</div>
        <div class="awakening-info">
          <div style="color:var(--gold);font-weight:600">已觉醒 Lv.${data.awakenLevel || 1}</div>
          <div class="text-dim" style="font-size:12px">全属性 +${Math.round((mult - 1) * 100)}%</div>
        </div>
      </div>`;
    } else {
      html += `<div class="awakening-requirements">
        <div class="text-dim" style="font-size:12px;margin-bottom:8px">觉醒条件:</div>
        <div style="font-size:12px">
          <div>${(data?.stars || 0) >= 5 ? '<span style="color:var(--shu)">已满足</span>' : '<span style="color:var(--hp)">未满足</span>'} 5星</div>
          <div>${(data?.level || 1) >= this.MAX_LEVEL_REQ ? '<span style="color:var(--shu)">已满足</span>' : '<span style="color:var(--hp)">未满足</span>'} Lv.${this.MAX_LEVEL_REQ}</div>
          <div>碎片: ${data?.shards || 0}/${this.AWAKENING_COST.shards}</div>
          <div>金币: ${this.AWAKENING_COST.gold}</div>
        </div>
        <button class="btn btn-gold btn-block mt-8" onclick="PremiumUpgrade.doAwaken('${heroId}')" ${check.can ? '' : 'disabled'}>
          ${check.can ? '觉醒!' : check.reason}
        </button>
      </div>`;
    }
    html += '</div>';
    return html;
  }
};


// ============================================================
// 3. GACHA ENHANCEMENT
// ============================================================
const GachaEnhanced = {
  // --- Wish List (increase odds for specific heroes) ---
  MAX_WISHLIST: 2,

  getWishList() {
    try {
      return JSON.parse(localStorage.getItem('sg-wishlist')) || [];
    } catch { return []; }
  },

  saveWishList(list) {
    localStorage.setItem('sg-wishlist', JSON.stringify(list || []));
  },

  toggleWishList(heroId) {
    const list = this.getWishList();
    const idx = list.indexOf(heroId);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      if (list.length >= this.MAX_WISHLIST) {
        return { error: '最多选择' + this.MAX_WISHLIST + '个心愿武将' };
      }
      list.push(heroId);
    }
    this.saveWishList(list);
    return { success: true, list };
  },

  // --- Pull History ---
  getPullHistory() {
    try {
      return JSON.parse(localStorage.getItem('sg-pullHistory')) || [];
    } catch { return []; }
  },

  recordPull(results) {
    const history = this.getPullHistory();
    const timestamp = Date.now();
    for (const r of results) {
      history.unshift({
        heroId: r.heroId,
        heroName: r.hero.name,
        rarity: r.rarity,
        isNew: r.isNew,
        time: timestamp
      });
    }
    // Keep last 200 entries
    if (history.length > 200) history.length = 200;
    localStorage.setItem('sg-pullHistory', JSON.stringify(history));
  },

  renderPullHistory() {
    const history = this.getPullHistory();
    if (history.length === 0) return '<div class="text-dim text-center" style="padding:20px">暂无抽卡记录</div>';

    const rarityColors = { 5: '#d4a843', 4: '#a855f7', 3: '#3b82f6' };
    const rarityNames = { 5: 'SSR', 4: 'SR', 3: 'R' };

    let html = '<div class="pull-history">';
    html += '<div class="pull-history-title">抽卡记录 (最近' + Math.min(history.length, 50) + '条)</div>';
    const recent = history.slice(0, 50);
    for (const entry of recent) {
      const timeStr = new Date(entry.time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      html += `<div class="pull-history-entry" style="border-left:3px solid ${rarityColors[entry.rarity] || '#666'}">
        <span class="pull-history-rarity" style="color:${rarityColors[entry.rarity] || '#666'}">${rarityNames[entry.rarity] || '?'}</span>
        <span class="pull-history-name">${entry.heroName}</span>
        ${entry.isNew ? '<span class="pull-history-new">NEW</span>' : ''}
        <span class="pull-history-time">${timeStr}</span>
      </div>`;
    }
    html += '</div>';
    return html;
  },

  // --- Visual celebration for rare pulls ---
  playSSRCelebration(heroId) {
    const overlay = document.createElement('div');
    overlay.className = 'gacha-ssr-celebration';
    overlay.innerHTML = `
      <div class="ssr-light-rays"></div>
      <div class="ssr-hero-reveal">
        ${typeof Visuals !== 'undefined' ? Visuals.heroPortrait(heroId, 'xl', 5) : ''}
      </div>
      <div class="ssr-hero-name">${typeof HEROES !== 'undefined' && HEROES[heroId] ? HEROES[heroId].name : ''}</div>
      <div class="ssr-label">SSR</div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.classList.add('ssr-fade-out');
      setTimeout(() => overlay.remove(), 600);
    }, 2500);
  },

  // Render wishlist + history UI
  renderWishListUI() {
    const wishList = this.getWishList();
    const allSSR = typeof Gacha !== 'undefined' ? Gacha.SSR_POOL : [];
    const allSR = typeof Gacha !== 'undefined' ? Gacha.SR_POOL : [];
    const pool = [...allSSR, ...allSR];

    let html = '<div class="card" style="margin-top:12px"><div style="font-size:14px;font-weight:600;margin-bottom:8px">心愿清单 (最多' + this.MAX_WISHLIST + '个)</div>';
    html += '<div class="text-dim" style="font-size:11px;margin-bottom:8px">心愿武将出现概率提升50%</div>';
    html += '<div class="wishlist-grid">';
    for (const hid of pool) {
      const hero = typeof HEROES !== 'undefined' ? HEROES[hid] : null;
      if (!hero) continue;
      const isWished = wishList.includes(hid);
      html += `<div class="wishlist-hero ${isWished ? 'wished' : ''}" onclick="PremiumUpgrade.toggleWish('${hid}')">
        ${typeof Visuals !== 'undefined' ? Visuals.heroPortrait(hid, 'sm', hero.rarity) : hero.name}
        <div style="font-size:10px;margin-top:2px">${hero.name}</div>
        ${isWished ? '<div class="wishlist-star">心愿</div>' : ''}
      </div>`;
    }
    html += '</div></div>';

    // History button
    html += '<div class="card" style="margin-top:8px">';
    html += '<button class="btn btn-block" style="background:var(--card2);color:var(--text);border:1px solid var(--border)" onclick="PremiumUpgrade.showPullHistory()">查看抽卡记录</button>';
    html += '</div>';

    return html;
  }
};


// ============================================================
// 4. IDLE SYSTEM DEPTH
// ============================================================
const IdleEnhanced = {
  // --- Proactive Offline Return Notification (>1 hour away) ---
  showOfflineReturnNotification(preview) {
    if (!preview || preview.minutes < 60) return;
    // Don't show if already dismissed this session
    if (this._offlineShown) return;
    this._offlineShown = true;

    const hours = Math.floor(preview.minutes / 60);
    const mins = preview.minutes % 60;
    const timeStr = hours > 0 ? hours + '小时' + (mins > 0 ? mins + '分' : '') : mins + '分钟';

    const overlay = document.createElement('div');
    overlay.className = 'offline-return-overlay';
    overlay.innerHTML = `
      <div class="offline-return-card">
        <div class="offline-return-title">将军归来!</div>
        <div class="offline-return-time">离线 ${timeStr}</div>
        <div class="offline-return-divider"></div>
        <div class="offline-return-rewards">
          <div class="offline-return-reward-row">
            <span class="offline-return-icon gold-icon">金</span>
            <span class="offline-return-amount">+${preview.gold}</span>
            <span class="offline-return-label">金币等待领取</span>
          </div>
          <div class="offline-return-reward-row">
            <span class="offline-return-icon exp-icon">经</span>
            <span class="offline-return-amount">+${preview.exp}</span>
            <span class="offline-return-label">经验等待领取</span>
          </div>
        </div>
        <div class="offline-return-hint">返回主页点击离线收益卡片领取</div>
        <button class="btn btn-gold btn-block" onclick="this.closest('.offline-return-overlay').remove();App.switchPage('home');" style="margin-top:8px">前往领取</button>
        <button class="btn btn-block" onclick="this.closest('.offline-return-overlay').remove()" style="background:transparent;color:var(--dim);font-size:11px;margin-top:4px">稍后再说</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // --- Offline Progress Notification (shown after collect click) ---
  showOfflineReport(result) {
    if (!result || result.minutes < 5) return;

    const overlay = document.createElement('div');
    overlay.className = 'idle-report-overlay';

    let lootHtml = '';
    if (result.loot && result.loot.length > 0) {
      lootHtml = '<div class="idle-report-loot">装备掉落: ' + result.loot.length + '件</div>';
    }
    if (result.shardDrops && result.shardDrops.length > 0) {
      lootHtml += '<div class="idle-report-loot">碎片: ' + result.shardDrops.map(s => s.heroName + 'x' + s.amount).join(', ') + '</div>';
    }

    const hours = Math.floor(result.minutes / 60);
    const mins = result.minutes % 60;
    const timeStr = hours > 0 ? hours + '小时' + mins + '分钟' : mins + '分钟';

    overlay.innerHTML = `
      <div class="idle-report-card">
        <div class="idle-report-title">将军归来!</div>
        <div class="idle-report-subtitle">你离开了 ${timeStr}</div>
        <div class="idle-report-divider"></div>
        <div class="idle-report-rewards">
          <div class="idle-report-reward"><span class="idle-report-icon">金</span> +${result.gold}</div>
          <div class="idle-report-reward"><span class="idle-report-icon">经</span> +${result.exp}</div>
          ${lootHtml}
        </div>
        ${result.expeditionHeroes && result.expeditionHeroes.length > 0 ? '<div class="idle-report-expedition">远征加成: ' + result.expeditionHeroes.length + '人</div>' : ''}
        <button class="btn btn-gold btn-block" onclick="this.closest('.idle-report-overlay').remove()">领取</button>
      </div>
    `;

    document.body.appendChild(overlay);
  },

  // --- Milestone Rewards ---
  MILESTONES: [
    { hours: 1,  reward: { gold: 100 },  label: '1小时' },
    { hours: 4,  reward: { gold: 500, gems: 5 }, label: '4小时' },
    { hours: 8,  reward: { gold: 1200, gems: 10 }, label: '8小时' },
    { hours: 12, reward: { gold: 2000, gems: 20 }, label: '12小时' },
    { hours: 24, reward: { gold: 5000, gems: 50 }, label: '24小时' },
  ],

  getMilestoneRewards(minutes) {
    const hours = minutes / 60;
    const claimed = this._getClaimedMilestones();
    return this.MILESTONES.filter(m => hours >= m.hours && !claimed.includes(m.hours));
  },

  _getClaimedMilestones() {
    try { return JSON.parse(localStorage.getItem('sg-idleMilestones')) || []; } catch { return []; }
  },

  claimMilestone(hours) {
    const milestone = this.MILESTONES.find(m => m.hours === hours);
    if (!milestone) return;
    const claimed = this._getClaimedMilestones();
    if (claimed.includes(hours)) return;
    claimed.push(hours);
    localStorage.setItem('sg-idleMilestones', JSON.stringify(claimed));
    if (milestone.reward.gold) Storage.addGold(milestone.reward.gold);
    if (milestone.reward.gems) Storage.addGems(milestone.reward.gems);
  },

  // --- Prestige System ---
  getPrestigeState() {
    try { return JSON.parse(localStorage.getItem('sg-prestige')) || { level: 0, bonusPct: 0 }; } catch { return { level: 0, bonusPct: 0 }; }
  },

  getPrestigeCost() {
    const state = this.getPrestigeState();
    return { gold: 10000 * (state.level + 1), minChapter: 3 + state.level };
  },

  canPrestige() {
    const state = this.getPrestigeState();
    const cost = this.getPrestigeCost();
    const player = typeof Storage !== 'undefined' ? Storage.getPlayer() : { gold: 0 };
    const progress = typeof Storage !== 'undefined' ? Storage.getCampaignProgress() : { chapter: 1 };
    return player.gold >= cost.gold && progress.chapter >= cost.minChapter;
  },

  doPrestige() {
    if (!this.canPrestige()) return { error: '条件不满足' };
    const state = this.getPrestigeState();
    const cost = this.getPrestigeCost();
    Storage.addGold(-cost.gold);
    state.level++;
    state.bonusPct = state.level * 10; // 10% per prestige level
    localStorage.setItem('sg-prestige', JSON.stringify(state));
    return { success: true, level: state.level, bonusPct: state.bonusPct };
  },

  // --- Auto-Farm ---
  getAutoFarmStage() {
    try { return JSON.parse(localStorage.getItem('sg-autoFarm')) || null; } catch { return null; }
  },

  setAutoFarmStage(chapterId, stageId) {
    localStorage.setItem('sg-autoFarm', JSON.stringify({ chapter: chapterId, stage: stageId }));
  },

  clearAutoFarm() {
    localStorage.removeItem('sg-autoFarm');
  }
};


// ============================================================
// 5. CAMPAIGN ENHANCEMENT
// ============================================================
const CampaignEnhanced = {
  // --- Star Rating System (1-3 stars) ---
  getStageStars(chapterId, stageId) {
    try {
      const stars = JSON.parse(localStorage.getItem('sg-stageStars')) || {};
      return stars[chapterId + '-' + stageId] || 0;
    } catch { return 0; }
  },

  setStageStars(chapterId, stageId, starCount) {
    try {
      const stars = JSON.parse(localStorage.getItem('sg-stageStars')) || {};
      const key = chapterId + '-' + stageId;
      stars[key] = Math.max(stars[key] || 0, starCount); // Only save if higher
      localStorage.setItem('sg-stageStars', JSON.stringify(stars));
    } catch(e) { console.error('[stageStars]', e); }
  },

  // Calculate stars based on HP lost (spec):
  // 1 star: complete the stage
  // 2 stars: complete with fewer than 50% hero HP lost (HP retained > 50%)
  // 3 stars: complete with fewer than 20% HP lost OR flawless (all alive, full HP)
  calculateStars(battleState) {
    if (!battleState) return 1;
    const fighters = battleState.player.filter(f => f);
    if (fighters.length === 0) return 1;

    // Calculate total HP retained percentage
    let totalMaxHp = 0;
    let totalCurrentHp = 0;
    for (const f of fighters) {
      totalMaxHp += f.maxHp || 0;
      totalCurrentHp += f.alive ? (f.hp || 0) : 0;
    }
    const hpRetainedPct = totalMaxHp > 0 ? (totalCurrentHp / totalMaxHp) * 100 : 0;
    const hpLostPct = 100 - hpRetainedPct;

    // Flawless: all heroes alive AND retained 100% HP
    const allAlive = fighters.every(f => f.alive);
    if (allAlive && hpLostPct < 1) return 3;
    // 3 stars: lost < 20% total HP
    if (hpLostPct < 20) return 3;
    // 2 stars: lost < 50% total HP
    if (hpLostPct < 50) return 2;
    // 1 star: completed
    return 1;
  },

  // Render star display
  renderStars(count, max) {
    max = max || 3;
    let html = '';
    for (let i = 0; i < max; i++) {
      html += '<span class="campaign-star ' + (i < count ? 'filled' : 'empty') + '"></span>';
    }
    return html;
  },

  // --- Sweep Feature ---
  canSweep(chapterId, stageId) {
    return this.getStageStars(chapterId, stageId) >= 3;
  },

  doSweep(chapterId, stageId) {
    if (!this.canSweep(chapterId, stageId)) return { error: '需要3星通关才能扫荡' };

    const chapter = typeof Campaign !== 'undefined'
      ? Campaign.CHAPTERS.find(c => c.id === chapterId) : null;
    if (!chapter) return { error: '章节不存在' };
    const stage = chapter.stages.find(s => s.id === stageId);
    if (!stage) return { error: '关卡不存在' };

    // Award rewards directly (reduced by 80% since it's instant)
    const goldReward = Math.floor(stage.reward.gold * 0.8);
    const expReward = Math.floor(stage.reward.exp * 0.8);
    Storage.addGold(goldReward);
    Storage.addExp(expReward);
    if (stage.reward.hero_shard) Storage.addShards(stage.reward.hero_shard, 1);

    return { success: true, gold: goldReward, exp: expReward, shards: stage.reward.hero_shard ? 1 : 0 };
  },

  // --- Difficulty Indicator ---
  getDifficultyLabel(chapterId) {
    const scaling = typeof Campaign !== 'undefined' ? Campaign.CHAPTER_SCALING[chapterId] : null;
    if (!scaling) return { label: '普通', color: '#888', icon: '' };
    const scale = scaling.enemyScale;
    if (scale <= 0.6) return { label: '简单', color: '#22c55e', icon: '' };
    if (scale <= 0.9) return { label: '普通', color: '#3b82f6', icon: '' };
    if (scale <= 1.3) return { label: '困难', color: '#f59e0b', icon: '' };
    if (scale <= 1.8) return { label: '极难', color: '#ef4444', icon: '' };
    return { label: '地狱', color: '#dc2626', icon: '' };
  },

  // Render pre-battle reward preview
  renderStagePreview(stage, chapter) {
    if (!stage || !stage.reward) return '';
    const stars = this.getStageStars(chapter?.id || 1, stage.id);
    const diff = this.getDifficultyLabel(chapter?.id || 1);

    let html = `<div class="stage-preview">
      <div class="stage-preview-header">
        <span class="stage-preview-diff" style="color:${diff.color}">${diff.icon} ${diff.label}</span>
        <span class="stage-preview-stars">${this.renderStars(stars)}</span>
      </div>
      <div class="stage-preview-rewards">
        <div class="stage-preview-reward">金 +${stage.reward.gold}</div>
        <div class="stage-preview-reward">经 +${stage.reward.exp}</div>
        ${stage.reward.hero_shard ? '<div class="stage-preview-reward" style="color:var(--gold)">碎片</div>' : ''}
      </div>`;

    if (this.canSweep(chapter?.id || 1, stage.id)) {
      html += `<button class="btn btn-sm" style="background:var(--card2);color:var(--gold);border:1px solid var(--gold);margin-top:8px;width:100%" onclick="PremiumUpgrade.doSweep(${chapter?.id || 1}, ${stage.id})">扫荡</button>`;
    }

    html += '</div>';
    return html;
  }
};


// ============================================================
// 6. SOCIAL / META FEATURES
// ============================================================
const SocialFeatures = {
  // --- Daily Login Rewards Calendar ---
  // Spec: Day1=100g, Day2=200g, Day3=300g+1 rare shard, Day7=1000g+guaranteed hero
  LOGIN_REWARDS: [
    { day: 1, reward: { gold: 100 }, label: '金100' },
    { day: 2, reward: { gold: 200 }, label: '金200' },
    { day: 3, reward: { gold: 300, rare_shard: true }, label: '金300+稀有碎片' },
    { day: 4, reward: { gold: 400 }, label: '金400' },
    { day: 5, reward: { gold: 500, gems: 10 }, label: '金500+石10' },
    { day: 6, reward: { gold: 700 }, label: '金700' },
    { day: 7, reward: { gold: 1000, guaranteed_hero: true }, label: '金1000+武将' },
  ],

  getLoginState() {
    try {
      const state = JSON.parse(localStorage.getItem('sg-loginRewards')) || { claimed: [], lastLogin: null, streak: 0 };
      // Reset if new day
      const today = new Date().toDateString();
      if (state.lastLogin !== today) {
        if (state.lastLogin) {
          const last = new Date(state.lastLogin);
          const diff = Math.floor((new Date() - last) / 86400000);
          state.streak = diff <= 1 ? state.streak + 1 : 1;
        } else {
          state.streak = 1;
        }
        state.lastLogin = today;
        state.todayClaimed = false;
        localStorage.setItem('sg-loginRewards', JSON.stringify(state));
      }
      return state;
    } catch { return { claimed: [], lastLogin: null, streak: 1, todayClaimed: false }; }
  },

  claimDailyLogin() {
    const state = this.getLoginState();
    if (state.todayClaimed) return { error: '今日已领取' };

    const dayIndex = ((state.streak - 1) % 7);
    const reward = this.LOGIN_REWARDS[dayIndex];
    if (!reward) return { error: '奖励数据错误' };

    if (reward.reward.gold) Storage.addGold(reward.reward.gold);
    if (reward.reward.gems) Storage.addGems(reward.reward.gems);

    // Day 3: Give 1 rare (SR/SSR rarity 4+) hero shard
    if (reward.reward.rare_shard && typeof HEROES !== 'undefined') {
      try {
        const rareHeroes = Object.keys(HEROES).filter(id => {
          const h = HEROES[id];
          return h && !h.mystery && !h.locked && h.rarity >= 4;
        });
        if (rareHeroes.length > 0) {
          const heroId = rareHeroes[Math.floor(Math.random() * rareHeroes.length)];
          Storage.addShards(heroId, 1);
          reward._shardHeroName = HEROES[heroId]?.name || '';
        }
      } catch(e) { console.error('[dailyLogin rare_shard]', e); }
    }

    // Day 7: Give a guaranteed random R/SR hero (rarity 3+) the player doesn't own yet
    if (reward.reward.guaranteed_hero && typeof HEROES !== 'undefined') {
      try {
        const roster = Storage.getRoster();
        const unownedHeroes = Object.keys(HEROES).filter(id => {
          const h = HEROES[id];
          return h && !h.mystery && !h.locked && h.rarity >= 3 && !roster[id];
        });
        const pool = unownedHeroes.length > 0 ? unownedHeroes :
          Object.keys(HEROES).filter(id => { const h = HEROES[id]; return h && !h.mystery && !h.locked && h.rarity >= 3; });
        if (pool.length > 0) {
          const heroId = pool[Math.floor(Math.random() * pool.length)];
          Storage.addHero(heroId);
          reward._giftHeroName = HEROES[heroId]?.name || '';
        }
      } catch(e) { console.error('[dailyLogin guaranteed_hero]', e); }
    }

    state.todayClaimed = true;
    localStorage.setItem('sg-loginRewards', JSON.stringify(state));

    return { success: true, reward: reward, day: dayIndex + 1, streak: state.streak };
  },

  renderLoginCalendar() {
    const state = this.getLoginState();
    const dayIndex = ((state.streak - 1) % 7);

    let html = '<div class="login-calendar">';
    html += '<div class="login-calendar-title">每日签到</div>';
    html += '<div class="login-streak-badge">连续 ' + state.streak + ' 天</div>';
    html += '<div class="login-calendar-grid">';

    for (let i = 0; i < 7; i++) {
      const reward = this.LOGIN_REWARDS[i];
      const isCurrent = i === dayIndex;
      const isClaimed = i < dayIndex || (i === dayIndex && state.todayClaimed);
      const isFuture = i > dayIndex;
      const isSevenDay = i === 6;

      html += '<div class="login-day' + (isClaimed ? ' claimed' : '') + (isCurrent && !state.todayClaimed ? ' current' : '') + (isFuture ? ' future' : '') + (isSevenDay ? ' seven-day' : '') + '">';
      html += '<div class="login-day-num">第' + (i + 1) + '天</div>';
      html += '<div class="login-day-icon">' + (isSevenDay ? '英雄' : isClaimed ? '已' : i === 2 ? '碎' : '金') + '</div>';
      html += '<div class="login-day-reward" style="font-size:9px">' + reward.label + '</div>';
      if (isClaimed) html += '<div class="login-day-check">✓</div>';
      html += '</div>';
    }

    html += '</div>';

    if (!state.todayClaimed) {
      html += '<button class="btn btn-gold btn-block mt-8" onclick="PremiumUpgrade.claimLogin()" style="font-weight:700;letter-spacing:2px">领取今日奖励</button>';
    } else {
      html += '<div class="text-dim text-center mt-8" style="font-size:12px">今日已领取，明天再来!</div>';
    }
    html += '</div>';
    return html;
  },

  // --- Weekly Challenges ---
  WEEKLY_CHALLENGES: [
    { id: 'win_20', name: '百战不殆', desc: '本周赢得20场战斗', target: 20, reward: { gold: 2000, gems: 20 }, type: 'wins' },
    { id: 'clear_5', name: '势如破竹', desc: '本周通过5个新关卡', target: 5, reward: { gold: 1500, gems: 15 }, type: 'stages' },
    { id: 'gacha_5', name: '求贤若渴', desc: '本周招募5次', target: 5, reward: { gold: 1000, gems: 10 }, type: 'gacha' },
  ],

  getWeeklyState() {
    try {
      const state = JSON.parse(localStorage.getItem('sg-weeklyChallenges')) || {};
      // Reset on new week
      const weekNum = this._getWeekNum();
      if (state.week !== weekNum) {
        return { week: weekNum, progress: { wins: 0, stages: 0, gacha: 0 }, claimed: {} };
      }
      return state;
    } catch { return { week: 0, progress: { wins: 0, stages: 0, gacha: 0 }, claimed: {} }; }
  },

  _getWeekNum() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  },

  trackWeekly(type) {
    const state = this.getWeeklyState();
    state.progress[type] = (state.progress[type] || 0) + 1;
    localStorage.setItem('sg-weeklyChallenges', JSON.stringify(state));
  },

  claimWeeklyReward(challengeId) {
    const state = this.getWeeklyState();
    const challenge = this.WEEKLY_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return { error: '挑战不存在' };
    if (state.claimed[challengeId]) return { error: '已领取' };
    if ((state.progress[challenge.type] || 0) < challenge.target) return { error: '未完成' };

    if (challenge.reward.gold) Storage.addGold(challenge.reward.gold);
    if (challenge.reward.gems) Storage.addGems(challenge.reward.gems);
    state.claimed[challengeId] = true;
    localStorage.setItem('sg-weeklyChallenges', JSON.stringify(state));
    return { success: true };
  },

  renderWeeklyChallenges() {
    const state = this.getWeeklyState();
    let html = '<div class="weekly-challenges">';
    html += '<div class="weekly-title">本周挑战</div>';

    for (const ch of this.WEEKLY_CHALLENGES) {
      const progress = state.progress[ch.type] || 0;
      const pct = Math.min(100, progress / ch.target * 100);
      const claimed = state.claimed[ch.id];
      const completed = progress >= ch.target;

      html += `<div class="weekly-challenge ${claimed ? 'claimed' : completed ? 'completed' : ''}">
        <div class="weekly-challenge-info">
          <div class="weekly-challenge-name">${ch.name}</div>
          <div class="weekly-challenge-desc">${ch.desc}</div>
          <div class="weekly-challenge-progress">
            <div class="progress" style="height:4px;flex:1"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--gold))"></div></div>
            <span>${progress}/${ch.target}</span>
          </div>
        </div>
        <div class="weekly-challenge-reward">
          <div style="font-size:11px;color:var(--gold)">${ch.reward.gold ? '金' + ch.reward.gold : ''} ${ch.reward.gems ? '石' + ch.reward.gems : ''}</div>
          ${claimed ? '<div class="text-dim" style="font-size:10px">已领</div>' :
            completed ? `<button class="btn btn-sm btn-gold" onclick="PremiumUpgrade.claimWeekly('${ch.id}')" style="font-size:10px;padding:2px 8px">领取</button>` :
            '<div class="text-dim" style="font-size:10px">进行中</div>'}
        </div>
      </div>`;
    }
    html += '</div>';
    return html;
  },

  // --- Formation Presets ---
  // 3 fixed preset slots with specific names per spec
  PRESET_NAMES: ['攻击阵', '防守阵', '速攻阵'],
  MAX_PRESETS: 3,

  getPresets() {
    try {
      const saved = JSON.parse(localStorage.getItem('sg-formationPresets')) || [];
      // Ensure we always have 3 slots (even if empty)
      const slots = [];
      for (let i = 0; i < this.MAX_PRESETS; i++) {
        slots.push(saved[i] || { name: this.PRESET_NAMES[i], team: null, savedAt: null });
      }
      return slots;
    } catch { return this.PRESET_NAMES.map(n => ({ name: n, team: null, savedAt: null })); }
  },

  savePreset(index) {
    const presets = this.getPresets();
    if (index < 0 || index >= this.MAX_PRESETS) return { error: '无效插槽' };
    const team = typeof Storage !== 'undefined' ? Storage.getTeam() : [];
    presets[index] = { name: this.PRESET_NAMES[index], team: [...team], savedAt: Date.now() };
    localStorage.setItem('sg-formationPresets', JSON.stringify(presets));
    return { success: true };
  },

  loadPreset(index) {
    const presets = this.getPresets();
    if (!presets[index] || !presets[index].team) return { error: '该预设为空' };
    Storage.saveTeam(presets[index].team);
    return { success: true, team: presets[index].team };
  },

  deletePreset(index) {
    const presets = this.getPresets();
    presets[index] = { name: this.PRESET_NAMES[index], team: null, savedAt: null };
    localStorage.setItem('sg-formationPresets', JSON.stringify(presets));
  },

  renderFormationPresets(context) {
    // context = 'team' (full UI) or 'battle' (compact battle prep UI)
    const presets = this.getPresets();
    const isBattle = context === 'battle';
    let html = '<div class="formation-presets">';
    html += '<div style="font-size:' + (isBattle ? '12' : '14') + 'px;font-weight:600;margin-bottom:8px;color:var(--gold)">编队预设</div>';

    for (let i = 0; i < this.MAX_PRESETS; i++) {
      const preset = presets[i];
      const hasTeam = preset.team && preset.team.filter(Boolean).length > 0;
      const heroNames = hasTeam ? preset.team.filter(Boolean).map(id => {
        const hero = typeof HEROES !== 'undefined' ? HEROES[id] : null;
        return hero ? hero.name : '?';
      }).join(', ') : '(空)';

      html += '<div class="preset-entry" style="' + (isBattle ? 'padding:6px 8px;' : '') + '">';
      html += '<div class="preset-info">';
      html += '<div class="preset-name" style="font-size:' + (isBattle ? '11' : '13') + 'px;font-weight:600">' + preset.name + '</div>';
      html += '<div class="preset-heroes" style="font-size:10px;color:var(--dim)">' + heroNames + '</div>';
      html += '</div>';
      html += '<div class="preset-actions" style="display:flex;gap:4px;flex-shrink:0">';
      if (hasTeam) {
        html += '<button class="btn btn-sm" style="background:var(--accent);color:#fff;font-size:10px;padding:2px 8px" onclick="PremiumUpgrade.loadFormationPreset(' + i + ')">加载</button>';
        if (!isBattle) {
          html += '<button class="btn btn-sm" style="background:var(--card2);color:var(--dim);font-size:10px;padding:2px 8px;border:1px solid var(--border)" onclick="PremiumUpgrade.saveFormationPreset(' + i + ')">覆盖</button>';
          html += '<button class="btn btn-sm" style="background:var(--hp);color:#fff;font-size:10px;padding:2px 6px" onclick="PremiumUpgrade.deleteFormationPreset(' + i + ')">删</button>';
        }
      } else {
        if (!isBattle) {
          html += '<button class="btn btn-sm" style="background:var(--card2);border:1px dashed var(--border);color:var(--dim);font-size:10px;padding:2px 8px" onclick="PremiumUpgrade.saveFormationPreset(' + i + ')">保存</button>';
        }
      }
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }
};


// ============================================================
// MASTER INTEGRATION — PremiumUpgrade controller
// ============================================================
const PremiumUpgrade = {
  init() {
    // Hook into Battle VFX processing
    this._hookBattleVFX();
    // Hook into battle completion for star ratings
    this._hookBattleCompletion();
    // Hook into gacha for enhanced features
    this._hookGacha();
    // Hook into campaign rendering (stars on stage list)
    this._hookCampaign();
    // Hook into hero detail
    this._hookHeroDetail();
    // Hook into team rendering (formation presets + synergies)
    this._hookTeamRendering();
    // Hook into battle prep screen to show formation presets
    this._hookPrepareBattle();
    // Hook into idle collection for reports
    this._hookIdleCollection();
    // Hook into home page for login calendar + weekly challenges
    this._hookHomePage();
    // Show daily login popup on first load
    this._checkDailyLogin();
    // Check offline progress (show notification if away > 1 hour)
    this._checkOfflineProgress();
    // Track weekly progress
    this._hookWeeklyTracking();
    // Save/restore battle speed preference
    this._hookBattleSpeed();
    // Initialized
  },

  // --- Battle VFX Integration ---
  _hookBattleVFX() {
    if (typeof BattleUI === 'undefined') return;

    const origProcessVFX = BattleUI.processVFX;
    if (!origProcessVFX) return;

    BattleUI.processVFX = function(vfxList) {
      // Call original
      if (origProcessVFX) origProcessVFX.call(this, vfxList);

      // Enhanced VFX
      for (const vfx of vfxList) {
        try {
          if (vfx.type === 'attack' && vfx.isCrit) {
            BattleVFXPremium.criticalHitEffect(vfx.target, vfx.dmg);
          } else if (vfx.type === 'attack' && vfx.dmg > 0) {
            BattleVFXPremium.showDamageNumber(vfx.target, vfx.dmg, false);
          }
          if (vfx.type === 'kill') {
            BattleVFXPremium.defeatAnimation(vfx.target);
          }
          // Element particles
          if (vfx.type === 'element_reaction' || vfx.type === 'hazard') {
            BattleVFXPremium.elementalParticles(vfx.target, vfx.hazardType || vfx.element || 'fire');
          }
        } catch(e) { /* VFX errors must never break gameplay */ }
      }
    };
  },

  _hookBattleCompletion() {
    // Hook into battle result to show victory/defeat effects and star ratings
    const origStartBattle = App.startBattle;
    if (!origStartBattle) return;

    App.startBattle = async function() {
      await origStartBattle.call(this);

      // After battle is complete, show premium effects
      try {
        if (Battle.state) {
          if (Battle.state.phase === 'victory') {
            BattleVFXPremium.victoryPose();
            // Calculate and save stars
            const stars = CampaignEnhanced.calculateStars(Battle.state);
            const stage = App.currentStage;
            if (stage && stage._chapter) {
              CampaignEnhanced.setStageStars(stage._chapter.id, stage.id, stars);
            }
            // Track weekly
            SocialFeatures.trackWeekly('wins');
            SocialFeatures.trackWeekly('stages');
          } else if (Battle.state.phase === 'defeat') {
            BattleVFXPremium.defeatScreen();
          }
        }
      } catch(e) { console.error('[PremiumVFX]', e); }
    };
  },

  _hookGacha() {
    // Hook into gacha pull to record history and show celebrations
    const origDoGachaPull = App.doGachaPull;
    if (!origDoGachaPull) return;

    App.doGachaPull = function(count) {
      // We need to intercept the pull results
      const result = Gacha.pull(count);
      if (result.error) { App.toast(result.error); return; }
      DailyMissions.trackProgress('gacha');
      SocialFeatures.trackWeekly('gacha');

      // Record pull history
      GachaEnhanced.recordPull(result.results);

      // Show SSR celebration if applicable
      const ssrPull = result.results.find(r => r.rarity >= 5 && r.isNew);
      if (ssrPull) {
        GachaEnhanced.playSSRCelebration(ssrPull.heroId);
      }

      // Launch cinematic gacha reveal (original behavior)
      App._gachaReveal(result, count);
      App.updateHeader();

      if (typeof Achievements !== 'undefined') {
        setTimeout(() => {
          const newAch = Achievements.checkAll();
          if (newAch.length > 0) App.toast('新成就: ' + newAch.map(a => a.name).join(', '));
        }, 3000);
      }
    };

    // Hook into gacha rendering to add wishlist/history
    const origRenderGacha = App._renderGachaInner;
    if (!origRenderGacha) return;

    App._renderGachaInner = function() {
      origRenderGacha.call(this);

      const list = document.getElementById('gacha-list');
      if (list) {
        const enhancedDiv = document.createElement('div');
        enhancedDiv.innerHTML = GachaEnhanced.renderWishListUI();
        list.appendChild(enhancedDiv);
      }
    };
  },

  _hookCampaign() {
    // Hook into campaign rendering to add stars to completed stages
    const origRenderCampaign = App._renderCampaignInner;
    if (!origRenderCampaign) return;

    App._renderCampaignInner = function() {
      origRenderCampaign.call(this);

      // After the original renders stage items, inject star ratings into each
      try {
        const progress = typeof Storage !== 'undefined' ? Storage.getCampaignProgress() : { chapter: 1, stage: 1 };
        const viewChapterId = App.selectedCampaignChapter || progress.chapter;
        const chapter = typeof Campaign !== 'undefined'
          ? Campaign.CHAPTERS.find(c => c.id === viewChapterId) || Campaign.CHAPTERS[0]
          : null;
        if (!chapter) return;

        const stageItems = document.querySelectorAll('.stage-item');
        stageItems.forEach((item, index) => {
          // Find stage by matching index order (same order stages are rendered)
          const visibleStages = chapter.stages.filter(s => {
            if (s.branch) {
              const choice = progress.choices && progress.choices[chapter.id];
              if (!choice && s.branch === 'B') return false;
              if (choice && choice !== s.branch) return false;
            }
            return true;
          });
          const stage = visibleStages[index];
          if (!stage) return;

          const isCompleted = chapter.id < progress.chapter ||
            (chapter.id === progress.chapter && stage.id < progress.stage);

          if (isCompleted) {
            const stars = CampaignEnhanced.getStageStars(chapter.id, stage.id);
            if (stars > 0) {
              const nameEl = item.querySelector('.stage-name');
              if (nameEl && !nameEl.querySelector('.stage-stars')) {
                const starsSpan = document.createElement('span');
                starsSpan.className = 'stage-stars';
                starsSpan.style.cssText = 'margin-left:4px;font-size:11px';
                starsSpan.innerHTML = CampaignEnhanced.renderStars(stars);
                nameEl.appendChild(starsSpan);
              }
            }
          }
        });
      } catch(e) { console.error('[hookCampaign stars]', e); }
    };
  },

  _hookHeroDetail() {
    // Hook into hero detail to add affinity, lore, awakening
    const origRenderHeroDetail = App.renderHeroDetail;
    if (!origRenderHeroDetail) return;

    App.renderHeroDetail = function(heroId) {
      origRenderHeroDetail.call(this, heroId);

      const content = document.getElementById('hero-detail-content');
      if (!content) return;

      // Add extended lore
      const loreCard = content.querySelector('.card:nth-child(4)');
      if (loreCard) {
        const extLore = HeroLore.getExtendedLore(heroId);
        if (extLore.length > 50) {
          const loreContent = loreCard.querySelector('.text-dim');
          if (loreContent) {
            loreContent.innerHTML = '"' + extLore + '"';
          }
        }
      }

      // Add affinity bonds section
      const bondsHtml = HeroAffinity.renderHeroBonds(heroId);
      if (bondsHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = bondsHtml;
        content.appendChild(tempDiv.firstElementChild);
      }

      // Add awakening section
      const awakenHtml = HeroAwakening.renderAwakeningSection(heroId);
      const awakenDiv = document.createElement('div');
      awakenDiv.innerHTML = awakenHtml;
      content.appendChild(awakenDiv.firstElementChild);
    };
  },

  _hookPrepareBattle() {
    // Add formation presets to battle preparation screen
    const origPrepareBattle = App.prepareBattle;
    if (!origPrepareBattle) return;

    App.prepareBattle = function(stage) {
      origPrepareBattle.call(this, stage);
      try {
        // Inject formation presets below the team list in battle prep
        const previewEl = document.getElementById('battle-team-preview');
        if (!previewEl) return;
        // Remove old preset section if any
        const old = previewEl.querySelector('.battle-formation-presets');
        if (old) old.remove();
        const presetsHtml = SocialFeatures.renderFormationPresets('battle');
        const presetsDiv = document.createElement('div');
        presetsDiv.className = 'battle-formation-presets';
        presetsDiv.style.cssText = 'margin-top:8px;border-top:1px solid var(--border);padding-top:8px';
        presetsDiv.innerHTML = presetsHtml;
        previewEl.appendChild(presetsDiv);
      } catch(e) { console.error('[hookPrepareBattle presets]', e); }
    };
  },

  _hookTeamRendering() {
    // Hook into team rendering to add synergy display and presets
    const origRenderTeam = App._renderTeamInner;
    if (!origRenderTeam) return;

    App._renderTeamInner = function() {
      origRenderTeam.call(this);

      const teamPage = document.getElementById('page-team');
      if (!teamPage) return;

      // Remove old premium sections to prevent duplicates
      teamPage.querySelectorAll('.premium-team-section').forEach(el => el.remove());

      const team = Storage.getTeam().filter(Boolean);

      // Add synergy display
      const synergyHtml = HeroAffinity.renderTeamSynergies(team);
      if (synergyHtml) {
        const synergyDiv = document.createElement('div');
        synergyDiv.className = 'premium-team-section';
        synergyDiv.innerHTML = synergyHtml;
        const teamSlots = document.getElementById('team-slots');
        if (teamSlots && teamSlots.parentElement) {
          teamSlots.parentElement.insertBefore(synergyDiv, teamSlots.nextSibling);
        }
      }

      // Add formation presets
      const presetsHtml = SocialFeatures.renderFormationPresets('team');
      const presetsDiv = document.createElement('div');
      presetsDiv.className = 'premium-team-section card mt-8';
      presetsDiv.innerHTML = presetsHtml;
      const teamAvail = document.getElementById('team-available');
      if (teamAvail) {
        teamAvail.parentElement.insertBefore(presetsDiv, teamAvail);
      }
    };
  },

  _hookIdleCollection() {
    // Hook into idle collection to show enhanced report modal
    const origCollectIdle = App.collectIdle;
    if (!origCollectIdle) return;

    App.collectIdle = function() {
      const result = Idle.collectRewards();
      if (!result) return;

      // Show offline report modal
      IdleEnhanced.showOfflineReport(result);

      // Process loot (original behavior)
      if (result.loot.length > 0 && typeof Equipment !== 'undefined') {
        for (const oldLoot of result.loot) {
          try {
            const progress = Storage.getCampaignProgress();
            const drop = Equipment.generateDrop(progress.chapter || 1, false);
            if (drop) Storage.addEquipment(drop);
          } catch(e) {}
        }
      }

      document.getElementById('idle-card').classList.add('hidden');
      App.renderHome();
    };
  },

  _checkOfflineProgress() {
    // Proactively show offline notification if player was away > 1 hour
    // This runs once on init; the idle-card click still also shows a report
    try {
      const state = Storage.getIdleState();
      const minutesAway = Math.floor((Date.now() - state.lastCollect) / 60000);
      if (minutesAway >= 60) {
        const preview = Idle.getRewardPreview();
        if (!preview) return;
        // Show beautiful offline return notification (non-blocking, auto-dismissable)
        setTimeout(() => {
          IdleEnhanced.showOfflineReturnNotification(preview);
        }, 3200); // After splash screen fades
      }
    } catch(e) { console.error('[checkOfflineProgress]', e); }
  },

  _hookHomePage() {
    // Hook into home page rendering to add login calendar and weekly challenges
    const origRenderHome = App.renderHome;
    if (!origRenderHome) return;

    App.renderHome = function() {
      origRenderHome.call(this);

      const homePage = document.getElementById('page-home');
      if (!homePage) return;

      // Remove old premium sections
      homePage.querySelectorAll('.premium-home-section').forEach(el => el.remove());

      // Add login calendar before daily missions
      const dailyCard = document.getElementById('daily-missions-card');
      if (dailyCard) {
        const loginDiv = document.createElement('div');
        loginDiv.className = 'card premium-home-section';
        loginDiv.innerHTML = SocialFeatures.renderLoginCalendar();
        dailyCard.parentElement.insertBefore(loginDiv, dailyCard);
      }

      // Add weekly challenges after daily missions
      if (dailyCard) {
        const weeklyDiv = document.createElement('div');
        weeklyDiv.className = 'card premium-home-section';
        weeklyDiv.innerHTML = SocialFeatures.renderWeeklyChallenges();
        dailyCard.parentElement.insertBefore(weeklyDiv, dailyCard.nextSibling);
      }
    };
  },

  _checkDailyLogin() {
    const state = SocialFeatures.getLoginState();
    if (!state.todayClaimed) {
      // Show login reward popup after splash finishes (2.4s delay)
      setTimeout(() => {
        // Don't show if any other modals are visible
        if (document.querySelector('.login-popup-overlay')) return;
        const overlay = document.createElement('div');
        overlay.className = 'login-popup-overlay';
        overlay.innerHTML = `
          <div class="login-popup-card">
            <div class="login-popup-header">
              <div class="login-popup-title">每日签到奖励</div>
              <button class="login-popup-close" onclick="this.closest('.login-popup-overlay').remove()">×</button>
            </div>
            ${SocialFeatures.renderLoginCalendar()}
          </div>`;
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
      }, 2400);
    }
  },

  _hookWeeklyTracking() {
    // Track battle wins for weekly challenges
    const origRecordWin = Storage.recordWin;
    if (origRecordWin) {
      Storage.recordWin = function() {
        const result = origRecordWin.call(this);
        SocialFeatures.trackWeekly('wins');
        return result;
      };
    }
  },

  _hookBattleSpeed() {
    // Restore saved battle speed preference on init
    try {
      const savedSpeed = parseInt(localStorage.getItem('sg-battleSpeed') || '1', 10);
      if (savedSpeed >= 1 && savedSpeed <= 3) {
        App._battleSpeed = savedSpeed;
        // Update button visual
        if (typeof App.setBattleSpeed === 'function') {
          App.setBattleSpeed(savedSpeed);
        }
      }
    } catch(e) {}

    // Wrap setBattleSpeed to persist preference
    const origSetSpeed = App.setBattleSpeed;
    if (origSetSpeed) {
      App.setBattleSpeed = function(spd) {
        origSetSpeed.call(this, spd);
        try { localStorage.setItem('sg-battleSpeed', String(spd)); } catch(e) {}
      };
    }
  },

  // --- Public API methods called from HTML onclick ---
  doAwaken(heroId) {
    const result = HeroAwakening.doAwaken(heroId);
    if (result.error) { App.toast(result.error); return; }
    App.toast('觉醒成功!');
    App.renderHeroDetail(heroId);
    App.updateHeader();
  },

  toggleWish(heroId) {
    const result = GachaEnhanced.toggleWishList(heroId);
    if (result.error) { App.toast(result.error); return; }
    App.renderGacha();
  },

  showPullHistory() {
    const overlay = document.createElement('div');
    overlay.className = 'pull-history-overlay';
    overlay.innerHTML = `<div class="pull-history-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:16px;font-weight:700">抽卡记录</div>
        <button class="btn btn-sm" style="background:var(--card2);color:var(--text)" onclick="this.closest('.pull-history-overlay').remove()">关闭</button>
      </div>
      ${GachaEnhanced.renderPullHistory()}
    </div>`;
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  },

  doSweep(chapterId, stageId) {
    const result = CampaignEnhanced.doSweep(chapterId, stageId);
    if (result.error) { App.toast(result.error); return; }
    App.toast('扫荡完成! +' + result.gold + '金 +' + result.exp + '经验' + (result.shards ? ' +碎片' : ''));
    App.updateHeader();
  },

  claimLogin() {
    const result = SocialFeatures.claimDailyLogin();
    if (result.error) { App.toast(result.error); return; }
    let msg = '签到成功! ' + result.reward.label;
    if (result.reward._shardHeroName) msg += ' (' + result.reward._shardHeroName + '碎片)';
    if (result.reward._giftHeroName) msg += ' 获得武将: ' + result.reward._giftHeroName + '!';
    App.toast(msg, 4000);
    App.updateHeader();
    App.renderHome();
    // Close any open login popup
    document.querySelectorAll('.login-popup-overlay').forEach(el => el.remove());
  },

  claimWeekly(challengeId) {
    const result = SocialFeatures.claimWeeklyReward(challengeId);
    if (result.error) { App.toast(result.error); return; }
    App.toast('挑战奖励已领取!');
    App.updateHeader();
    App.renderHome();
  },

  saveFormationPreset(index) {
    const result = SocialFeatures.savePreset(index);
    if (result.error) { App.toast(result.error); return; }
    App.toast(SocialFeatures.PRESET_NAMES[index] + ' 已保存!');
    App.renderTeam();
  },

  loadFormationPreset(index) {
    const result = SocialFeatures.loadPreset(index);
    if (result.error) { App.toast(result.error); return; }
    App.toast(SocialFeatures.PRESET_NAMES[index] + ' 已加载!');
    App.renderTeam();
    // If on battle page, refresh the battle team preview
    if (typeof App.currentPage !== 'undefined' && App.currentPage === 'battle' && App.currentStage) {
      try { App.prepareBattle(App.currentStage); } catch(e) {}
    }
  },

  deleteFormationPreset(index) {
    SocialFeatures.deletePreset(index);
    App.toast('预设已清空');
    App.renderTeam();
  }
};

// ============================================================
// Auto-initialize when DOM is ready
// ============================================================
if (typeof window !== 'undefined') {
  window.BattleVFXPremium = BattleVFXPremium;
  window.HeroAffinity = HeroAffinity;
  window.HeroLore = HeroLore;
  window.HeroAwakening = HeroAwakening;
  window.GachaEnhanced = GachaEnhanced;
  window.IdleEnhanced = IdleEnhanced;
  window.CampaignEnhanced = CampaignEnhanced;
  window.SocialFeatures = SocialFeatures;
  window.PremiumUpgrade = PremiumUpgrade;

  // Initialize after app init
  const _origAppInit = App.init;
  App.init = async function() {
    await _origAppInit.call(this);
    try { PremiumUpgrade.init(); } catch(e) { console.error('[PremiumUpgrade init]', e); }
  };
}

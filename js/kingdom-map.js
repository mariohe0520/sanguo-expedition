// 三国·天命 — Kingdom Map (Open World Territory Conquest)
const KingdomMap = {

  // ===== TERRITORY DATA =====
  TERRITORIES: {
    luoyang:  { name: '洛阳', desc: '天子所在，中原之心', x: 50, y: 35, connections: ['changan','xuchang','hulao'], faction: 'neutral', level: 1, icon: '🏯' },
    changan:  { name: '长安', desc: '西都长安，关中沃野', x: 25, y: 30, connections: ['luoyang','hanzhong','xiliang','wuzhang'], faction: 'neutral', level: 2, icon: '🏰' },
    xuchang:  { name: '许昌', desc: '曹操根据地', x: 60, y: 40, connections: ['luoyang','guandu','xiapi','hefei'], faction: 'wei', level: 3, icon: '🏰' },
    hulao:    { name: '虎牢关', desc: '天下第一雄关', x: 48, y: 26, connections: ['luoyang','yecheng'], faction: 'neutral', level: 2, icon: '⛩️' },
    guandu:   { name: '官渡', desc: '曹袁决战之地', x: 65, y: 28, connections: ['xuchang','yecheng'], faction: 'wei', level: 4, icon: '⚔️' },
    yecheng:  { name: '邺城', desc: '袁绍都城', x: 58, y: 17, connections: ['hulao','guandu'], faction: 'qun', level: 5, icon: '🏰' },
    xiapi:    { name: '下邳', desc: '吕布末路之地', x: 72, y: 42, connections: ['xuchang','jianye'], faction: 'qun', level: 3, icon: '🏰' },
    jianye:   { name: '建业', desc: '东吴都城', x: 78, y: 55, connections: ['xiapi','chaisang','hefei'], faction: 'wu', level: 5, icon: '🏯' },
    chaisang: { name: '柴桑', desc: '周瑜大都督府', x: 70, y: 62, connections: ['jianye','chibi'], faction: 'wu', level: 4, icon: '🏰' },
    chibi:    { name: '赤壁', desc: '火烧连环船', x: 60, y: 64, connections: ['chaisang','jingzhou'], faction: 'neutral', level: 6, icon: '🔥' },
    jingzhou: { name: '荆州', desc: '兵家必争之地', x: 52, y: 58, connections: ['chibi','changsha','yiling'], faction: 'neutral', level: 4, icon: '🏰' },
    changsha: { name: '长沙', desc: '黄忠老将之地', x: 56, y: 72, connections: ['jingzhou'], faction: 'neutral', level: 3, icon: '🏰' },
    yiling:   { name: '夷陵', desc: '刘备惨败之地', x: 44, y: 62, connections: ['jingzhou','chengdu'], faction: 'shu', level: 5, icon: '⚔️' },
    hanzhong: { name: '汉中', desc: '蜀魏争夺要地', x: 33, y: 50, connections: ['changan','chengdu','dingjun','wuzhang'], faction: 'shu', level: 5, icon: '🏰' },
    dingjun:  { name: '定军山', desc: '黄忠斩夏侯渊', x: 36, y: 58, connections: ['hanzhong'], faction: 'shu', level: 6, icon: '⛰️' },
    chengdu:  { name: '成都', desc: '蜀汉都城，天府之国', x: 26, y: 64, connections: ['hanzhong','yiling','nanzhong'], faction: 'shu', level: 7, icon: '🏯' },
    nanzhong: { name: '南中', desc: '孟获七擒之地', x: 24, y: 78, connections: ['chengdu'], faction: 'qun', level: 4, icon: '🌴' },
    xiliang:  { name: '西凉', desc: '马超铁骑故乡', x: 10, y: 25, connections: ['changan'], faction: 'qun', level: 5, icon: '🐴' },
    hefei:    { name: '合肥', desc: '张辽威震逍遥津', x: 75, y: 44, connections: ['jianye','xuchang'], faction: 'wei', level: 6, icon: '🏰' },
    wuzhang:  { name: '五丈原', desc: '诸葛亮星落之地', x: 30, y: 40, connections: ['changan','hanzhong'], faction: 'neutral', level: 8, icon: '⭐' },
  },

  // Faction colors & names
  FACTIONS: {
    neutral: { name: '中立', color: '#b0a490', fill: 'rgba(176,164,144,.3)', glow: 'rgba(176,164,144,.5)' },
    wei:     { name: '魏', color: '#6ea8e6', fill: 'rgba(110,168,230,.3)', glow: 'rgba(110,168,230,.6)' },
    shu:     { name: '蜀', color: '#5cb88a', fill: 'rgba(92,184,138,.3)', glow: 'rgba(92,184,138,.6)' },
    wu:      { name: '吴', color: '#e05050', fill: 'rgba(224,80,80,.3)', glow: 'rgba(224,80,80,.6)' },
    qun:     { name: '群', color: '#b88ae8', fill: 'rgba(184,138,232,.3)', glow: 'rgba(184,138,232,.6)' },
    player:  { name: '我军', color: '#e8c050', fill: 'rgba(232,192,80,.35)', glow: 'rgba(232,192,80,.7)' },
  },

  // Territory stages (3 per territory)
  STAGE_TEMPLATES: {
    approach: { name: '前哨接敌', icon: '🏃', rewardMult: 0.6 },
    siege:    { name: '攻城之战', icon: '🏰', rewardMult: 1.0 },
    boss:     { name: '守将决战', icon: '💀', rewardMult: 1.8 },
  },

  // Passive income per conquered territory per hour
  INCOME_PER_HOUR: { gold: 50, exp: 20 },

  // ===== RANDOM EVENTS =====
  EVENTS: [
    {
      id: 'refugees', name: '流民求援', icon: '👨‍👩‍👧‍👦',
      desc: '一群流民跪地求救："将军！我们已三日未食..."',
      options: [
        { text: '施粥救济 (-200金)', effect: { gold: -200, reputation: 30 }, result: '流民感恩戴德，你的名声传遍四方。' },
        { text: '无暇顾及', effect: {}, result: '流民默默离去，有人在背后叹息。' },
      ]
    },
    {
      id: 'merchant', name: '商队经过', icon: '🐪',
      desc: '一支来自西域的商队路过此地，带着珍稀货物。',
      options: [
        { text: '购买宝物 (-500金)', effect: { gold: -500, randomEquip: true }, result: '你从商队手中获得了一件珍贵装备！' },
        { text: '友好交谈', effect: { gold: 100 }, result: '商队送上薄礼以表感谢。+100金' },
      ]
    },
    {
      id: 'assassin', name: '刺客埋伏', icon: '🗡️',
      desc: '暗处忽然飞出数支毒箭！是敌军派来的刺客！',
      options: [
        { text: '迎战！', effect: { ambushBattle: true }, result: '你击退了刺客，缴获了不少好东西。' },
        { text: '紧急撤退', effect: { gold: -100 }, result: '匆忙撤退中遗失了部分物资。-100金' },
      ]
    },
    {
      id: 'scholar', name: '名士来投', icon: '📜',
      desc: '一位白衣文士拦住去路："将军气度不凡，愿效犬马之劳！"',
      options: [
        { text: '欣然接纳', effect: { heroShard: true }, result: '名士加入军中，你获得了一位英雄的碎片！' },
        { text: '婉言谢绝', effect: { exp: 200 }, result: '文士赠上兵书一卷。+200经验' },
      ]
    },
    {
      id: 'disaster', name: '天灾降临', icon: '🌊',
      desc: '天降暴雨，洪水泛滥，附近的城池受灾严重。',
      options: [
        { text: '组织救灾 (-300金)', effect: { gold: -300, reputation: 50 }, result: '你的义举赢得民心，声望大增。' },
        { text: '绕道而行', effect: { incomeDebuff: true }, result: '沿途城池经济受损，收入暂时减少。' },
      ]
    },
  ],

  // ===== ENEMY GENERATION =====
  // Enemies by faction and level
  ENEMY_POOLS: {
    neutral: {
      weak:   ['soldier', 'soldier', 'archer_recruit'],
      mid:    ['soldier', 'archer_recruit', 'shield_militia', 'elite_spear'],
      strong: ['elite_spear', 'elite_cavalry', 'mage_acolyte', 'shield_militia'],
      boss:   ['zhangjiao', 'lvbu'],
    },
    wei: {
      weak:   ['soldier', 'crossbow_corps', 'elite_spear'],
      mid:    ['crossbow_corps', 'elite_spear', 'strategist', 'shield_militia'],
      strong: ['crossbow_corps', 'strategist', 'elite_cavalry', 'elite_spear'],
      boss:   ['caocao', 'simayi', 'xiahouyuan'],
    },
    shu: {
      weak:   ['soldier', 'elite_spear', 'archer_recruit'],
      mid:    ['elite_spear', 'elite_cavalry', 'strategist', 'shield_militia'],
      strong: ['elite_cavalry', 'strategist', 'crossbow_corps', 'fire_archer'],
      boss:   ['jiangwei'],
    },
    wu: {
      weak:   ['navy_soldier', 'soldier', 'archer_recruit'],
      mid:    ['navy_soldier', 'fire_archer', 'elite_spear', 'shield_militia'],
      strong: ['navy_soldier', 'fire_archer', 'strategist', 'crossbow_corps'],
      boss:   ['sunquan', 'zhouyu'],
    },
    qun: {
      weak:   ['soldier', 'archer_recruit', 'soldier'],
      mid:    ['elite_spear', 'mage_acolyte', 'shield_militia', 'elite_cavalry'],
      strong: ['elite_cavalry', 'mage_acolyte', 'crossbow_corps', 'strategist'],
      boss:   ['yuanshao', 'lvbu'],
    },
  },

  // Generate enemies for a territory stage
  generateEnemies(territoryId, stageType) {
    const t = this.TERRITORIES[territoryId];
    if (!t) return ['soldier', 'soldier', 'soldier'];
    const pool = this.ENEMY_POOLS[t.faction] || this.ENEMY_POOLS.neutral;
    const level = t.level;
    const count = stageType === 'approach' ? 3 : stageType === 'siege' ? 4 : 5;

    const enemies = [];
    const tier = level <= 2 ? 'weak' : level <= 5 ? 'mid' : 'strong';
    const src = pool[tier] || pool.weak;

    for (let i = 0; i < count; i++) {
      enemies.push(src[Math.floor(Math.random() * src.length)]);
    }

    // Boss stage: replace last enemy with a boss
    if (stageType === 'boss' && pool.boss && pool.boss.length > 0) {
      const bossId = pool.boss[Math.floor(Math.random() * pool.boss.length)];
      // Only use boss if it exists in HEROES
      if (typeof HEROES !== 'undefined' && HEROES[bossId]) {
        enemies[Math.floor(count / 2)] = bossId;
      }
    }

    return enemies;
  },

  // Get enemy scale multiplier for a territory
  getEnemyScale(territoryId) {
    const t = this.TERRITORIES[territoryId];
    if (!t) return 0.3;
    // Scale: level 1 → 0.3, level 8 → 2.5
    return 0.3 + (t.level - 1) * 0.31;
  },

  // Calculate reward for a territory stage
  getStageReward(territoryId, stageType) {
    const t = this.TERRITORIES[territoryId];
    if (!t) return { gold: 100, exp: 50 };
    const template = this.STAGE_TEMPLATES[stageType];
    const mult = template ? template.rewardMult : 1;
    const levelMult = 1 + (t.level - 1) * 0.5;
    return {
      gold: Math.floor(150 * levelMult * mult),
      exp: Math.floor(80 * levelMult * mult),
      hero_shard: stageType === 'boss' ? this._getBossShardDrop(territoryId) : null,
    };
  },

  _getBossShardDrop(territoryId) {
    const shardMap = {
      luoyang: null, changan: null, hulao: 'lvbu', xuchang: 'caocao',
      guandu: 'yuanshao', yecheng: 'yuanshao', xiapi: 'lvbu',
      jianye: 'sunquan', chaisang: 'zhouyu', chibi: 'zhouyu',
      jingzhou: null, changsha: 'huangzhong', yiling: 'luXun',
      hanzhong: null, dingjun: 'huangzhong', chengdu: null,
      nanzhong: null, xiliang: null, hefei: 'pangde',
      wuzhang: 'simayi',
    };
    const id = shardMap[territoryId];
    return (id && typeof HEROES !== 'undefined' && HEROES[id]) ? id : null;
  },

  // ===== STATE MANAGEMENT =====
  getState() {
    return Storage.getMapState();
  },

  saveState(state) {
    Storage.saveMapState(state);
  },

  initState() {
    const existing = this.getState();
    if (existing && existing.territories) return existing;

    const state = {
      currentTerritory: 'luoyang',
      territories: {},
      reputation: 0,
      lastIncomeCollect: Date.now(),
      activeDebuffs: [], // { territoryId, type, expiresAt }
      conqueredCount: 0,
    };

    // Initialize all territories
    for (const [id, t] of Object.entries(this.TERRITORIES)) {
      state.territories[id] = {
        status: id === 'luoyang' ? 'available' : 'locked', // locked | available | in_battle | conquered
        stagesCleared: 0, // 0, 1, 2, 3 (approach, siege, boss)
      };
    }

    this.saveState(state);
    return state;
  },

  // Get current stage type for a territory
  getCurrentStageType(territoryId) {
    const state = this.getState();
    const tState = state.territories[territoryId];
    if (!tState) return null;
    const cleared = tState.stagesCleared || 0;
    if (cleared >= 3) return null; // All cleared
    return ['approach', 'siege', 'boss'][cleared];
  },

  // Conquer a territory stage
  completeStage(territoryId) {
    const state = this.getState();
    const tState = state.territories[territoryId];
    if (!tState) return;

    tState.stagesCleared = (tState.stagesCleared || 0) + 1;

    // Territory fully conquered
    if (tState.stagesCleared >= 3) {
      tState.status = 'conquered';
      state.conqueredCount = (state.conqueredCount || 0) + 1;

      // Unlock connected territories
      const t = this.TERRITORIES[territoryId];
      if (t) {
        for (const connId of t.connections) {
          if (state.territories[connId] && state.territories[connId].status === 'locked') {
            state.territories[connId].status = 'available';
          }
        }
      }
    } else {
      tState.status = 'in_battle';
    }

    this.saveState(state);
    return state;
  },

  // Move player to a territory
  moveTo(territoryId) {
    const state = this.getState();
    state.currentTerritory = territoryId;
    this.saveState(state);
    return state;
  },

  // Collect passive income from conquered territories
  collectIncome() {
    const state = this.getState();
    const now = Date.now();
    const elapsed = now - (state.lastIncomeCollect || now);
    const hours = elapsed / 3600000;
    if (hours < 0.01) return { gold: 0, exp: 0 }; // Minimum 36 seconds

    let conqueredCount = 0;
    for (const [id, tState] of Object.entries(state.territories)) {
      if (tState.status === 'conquered') conqueredCount++;
    }

    // Check for debuffs reducing income
    let debuffReduction = 0;
    const activeDebuffs = (state.activeDebuffs || []).filter(d => d.expiresAt > now);
    debuffReduction = activeDebuffs.length * 0.1; // 10% per debuff
    state.activeDebuffs = activeDebuffs;

    const goldPerHour = this.INCOME_PER_HOUR.gold * conqueredCount * (1 - debuffReduction);
    const expPerHour = this.INCOME_PER_HOUR.exp * conqueredCount * (1 - debuffReduction);

    const gold = Math.floor(goldPerHour * hours);
    const exp = Math.floor(expPerHour * hours);

    if (gold > 0) Storage.addGold(gold);
    if (exp > 0) Storage.addExp(exp);

    state.lastIncomeCollect = now;
    this.saveState(state);

    return { gold, exp, conqueredCount, hours: Math.floor(hours * 10) / 10 };
  },

  // Roll for a random event (30% chance)
  rollEvent() {
    if (Math.random() > 0.3) return null;
    return this.EVENTS[Math.floor(Math.random() * this.EVENTS.length)];
  },

  // Apply event option effect
  applyEventEffect(effect) {
    // Check if player can afford negative gold effects
    if (effect.gold && effect.gold < 0) {
      const player = Storage.getPlayer();
      if ((player.gold || 0) < Math.abs(effect.gold)) {
        return { error: '金币不足', shortfall: Math.abs(effect.gold) - (player.gold || 0) };
      }
    }
    if (effect.gold) Storage.addGold(effect.gold);
    if (effect.exp) Storage.addExp(effect.exp);
    if (effect.reputation) {
      const state = this.getState();
      state.reputation = (state.reputation || 0) + effect.reputation;
      this.saveState(state);
    }
    if (effect.heroShard) {
      // Give a random hero shard
      const shardHeroes = ['guanyu', 'zhouyu', 'huangzhong', 'zhangjiao', 'lvbu', 'caocao'];
      const pick = shardHeroes[Math.floor(Math.random() * shardHeroes.length)];
      if (typeof HEROES !== 'undefined' && HEROES[pick]) {
        Storage.addShards(pick, 2);
        return { shardHero: pick, shardCount: 2 };
      }
    }
    if (effect.randomEquip && typeof Equipment !== 'undefined') {
      const drop = Equipment.generateDrop(3, false);
      if (drop) {
        Storage.addEquipment(drop);
        return { equipment: drop };
      }
    }
    if (effect.incomeDebuff) {
      const state = this.getState();
      if (!state.activeDebuffs) state.activeDebuffs = [];
      state.activeDebuffs.push({
        type: 'disaster',
        expiresAt: Date.now() + 3 * 24 * 3600000, // 3 days
      });
      this.saveState(state);
    }
    return null;
  },

  // ===== SVG MAP RENDERING =====
  renderMap(svgEl, onTerritoryClick) {
    if (!svgEl) return;
    const state = this.getState() || this.initState();
    svgEl.innerHTML = '';

    // Defs for gradients and filters
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="map-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="map-shadow">
        <feDropShadow dx="0" dy="0.6" stdDeviation="1.0" flood-color="#000" flood-opacity="0.5"/>
      </filter>
      <filter id="map-node-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(212,168,67,0.06)" stroke-width="0.15"/>
      </pattern>
      <radialGradient id="territory-pulse" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e8c050" stop-opacity="0.5">
          <animate attributeName="stop-opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite"/>
        </stop>
        <stop offset="100%" stop-color="#e8c050" stop-opacity="0"/>
      </radialGradient>
    `;
    svgEl.appendChild(defs);

    // Background grid
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100');
    bgRect.setAttribute('height', '100');
    bgRect.setAttribute('fill', 'url(#map-grid)');
    svgEl.appendChild(bgRect);

    // Map border decorations
    const mapBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    mapBorder.setAttribute('x', '1');
    mapBorder.setAttribute('y', '1');
    mapBorder.setAttribute('width', '98');
    mapBorder.setAttribute('height', '98');
    mapBorder.setAttribute('rx', '2');
    mapBorder.setAttribute('fill', 'none');
    mapBorder.setAttribute('stroke', 'rgba(212,168,67,0.15)');
    mapBorder.setAttribute('stroke-width', '0.4');
    svgEl.appendChild(mapBorder);

    // Title text
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '50');
    titleText.setAttribute('y', '6');
    titleText.setAttribute('text-anchor', 'middle');
    titleText.setAttribute('fill', 'rgba(212,168,67,0.35)');
    titleText.setAttribute('font-size', '3');
    titleText.setAttribute('font-weight', '700');
    titleText.textContent = '三 国 疆 域 图';
    svgEl.appendChild(titleText);

    // --- Connection lines ---
    const drawnConnections = new Set();
    for (const [id, t] of Object.entries(this.TERRITORIES)) {
      for (const connId of t.connections) {
        const key = [id, connId].sort().join('-');
        if (drawnConnections.has(key)) continue;
        drawnConnections.add(key);

        const other = this.TERRITORIES[connId];
        if (!other) continue;

        const tState = state.territories[id];
        const cState = state.territories[connId];
        const bothConquered = tState?.status === 'conquered' && cState?.status === 'conquered';
        const anyAvailable = (tState?.status === 'available' || tState?.status === 'in_battle' || tState?.status === 'conquered') &&
                            (cState?.status === 'available' || cState?.status === 'in_battle' || cState?.status === 'conquered');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', t.x);
        line.setAttribute('y1', t.y);
        line.setAttribute('x2', other.x);
        line.setAttribute('y2', other.y);
        line.setAttribute('stroke', bothConquered ? 'rgba(232,192,80,0.45)' : anyAvailable ? 'rgba(212,168,67,0.3)' : 'rgba(176,164,144,0.25)');
        line.setAttribute('stroke-width', bothConquered ? '0.5' : '0.35');
        if (!anyAvailable) {
          line.setAttribute('stroke-dasharray', '1,1');
        }
        svgEl.appendChild(line);
      }
    }

    // --- Territory nodes ---
    for (const [id, t] of Object.entries(this.TERRITORIES)) {
      const tState = state.territories[id] || { status: 'locked', stagesCleared: 0 };
      const faction = this.FACTIONS[tState.status === 'conquered' ? 'player' : t.faction] || this.FACTIONS.neutral;
      const isLocked = tState.status === 'locked';
      const isConquered = tState.status === 'conquered';
      const isCurrent = state.currentTerritory === id;
      const isAvailable = tState.status === 'available' || tState.status === 'in_battle';

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-territory', id);
      g.style.cursor = isLocked ? 'default' : 'pointer';
      g.setAttribute('pointer-events', isLocked ? 'none' : 'all');

      // Pulse for available territories — LARGER
      if (isAvailable) {
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('cx', t.x);
        pulse.setAttribute('cy', t.y);
        pulse.setAttribute('r', '9');
        pulse.setAttribute('fill', 'url(#territory-pulse)');
        g.appendChild(pulse);
      }

      // Outer glow for current territory — LARGER & BRIGHTER
      if (isCurrent) {
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', t.x);
        glow.setAttribute('cy', t.y);
        glow.setAttribute('r', '9.5');
        glow.setAttribute('fill', 'none');
        glow.setAttribute('stroke', '#e8c050');
        glow.setAttribute('stroke-width', '0.5');
        glow.setAttribute('opacity', '0.8');
        const animR = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animR.setAttribute('attributeName', 'r');
        animR.setAttribute('values', '9.5;11.5;9.5');
        animR.setAttribute('dur', '2s');
        animR.setAttribute('repeatCount', 'indefinite');
        glow.appendChild(animR);
        g.appendChild(glow);
      }

      // Invisible larger hit area for mobile tap (minimum 44px equivalent) — BIGGER
      const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hitArea.setAttribute('cx', t.x);
      hitArea.setAttribute('cy', t.y);
      hitArea.setAttribute('r', '10');
      hitArea.setAttribute('fill', 'rgba(0,0,0,0.001)');
      hitArea.setAttribute('stroke', 'none');
      hitArea.setAttribute('pointer-events', 'all');
      g.appendChild(hitArea);

      // Territory circle background — 40% LARGER for visibility
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', t.x);
      circle.setAttribute('cy', t.y);
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', isLocked ? 'rgba(60,55,48,0.9)' : faction.fill);
      circle.setAttribute('stroke', isLocked ? 'rgba(176,164,144,0.5)' : isConquered ? '#e8c050' : faction.color);
      circle.setAttribute('stroke-width', isCurrent ? '0.8' : isLocked ? '0.4' : '0.5');
      if (!isLocked) circle.setAttribute('filter', 'url(#map-node-glow)');
      g.appendChild(circle);

      // Territory icon — BIGGER
      const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      iconText.setAttribute('x', t.x);
      iconText.setAttribute('y', t.y + 0.8);
      iconText.setAttribute('text-anchor', 'middle');
      iconText.setAttribute('dominant-baseline', 'middle');
      iconText.setAttribute('font-size', '5.5');
      iconText.setAttribute('opacity', isLocked ? '0.45' : '1');
      iconText.textContent = isConquered ? '🚩' : t.icon;
      g.appendChild(iconText);

      // Territory name label — BIGGER & BRIGHTER
      const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      nameText.setAttribute('x', t.x);
      nameText.setAttribute('y', t.y + 9.5);
      nameText.setAttribute('text-anchor', 'middle');
      nameText.setAttribute('fill', isLocked ? 'rgba(176,164,144,0.55)' : isConquered ? '#e8c050' : '#f5ece0');
      nameText.setAttribute('font-size', '3.2');
      nameText.setAttribute('font-weight', '700');
      nameText.setAttribute('filter', isLocked ? '' : 'url(#map-shadow)');
      nameText.textContent = t.name;
      g.appendChild(nameText);

      // Level indicator — BIGGER
      if (!isLocked) {
        const lvlText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lvlText.setAttribute('x', t.x);
        lvlText.setAttribute('y', t.y + 12);
        lvlText.setAttribute('text-anchor', 'middle');
        lvlText.setAttribute('fill', isConquered ? 'rgba(232,192,80,0.6)' : 'rgba(176,164,144,0.65)');
        lvlText.setAttribute('font-size', '2');
        lvlText.setAttribute('font-weight', '600');
        lvlText.textContent = isConquered ? '已占领' : 'Lv.' + t.level;
        g.appendChild(lvlText);
      }

      // Faction label for unlocked non-player territories
      if (!isLocked && !isConquered && t.faction !== 'neutral') {
        const facText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        facText.setAttribute('x', t.x);
        facText.setAttribute('y', t.y - 8.5);
        facText.setAttribute('text-anchor', 'middle');
        facText.setAttribute('fill', faction.color);
        facText.setAttribute('font-size', '1.8');
        facText.setAttribute('font-weight', '700');
        facText.setAttribute('opacity', '0.7');
        facText.textContent = this.FACTIONS[t.faction]?.name || '';
        g.appendChild(facText);
      }

      // Stage progress dots (for in-battle territories) — BIGGER
      if (tState.status === 'in_battle' || isAvailable) {
        const cleared = tState.stagesCleared || 0;
        for (let i = 0; i < 3; i++) {
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('cx', t.x - 2.5 + i * 2.5);
          dot.setAttribute('cy', t.y - 8.5);
          dot.setAttribute('r', '1');
          dot.setAttribute('fill', i < cleared ? '#e8c050' : 'rgba(176,164,144,0.35)');
          if (i < cleared) dot.setAttribute('filter', 'url(#map-glow)');
          g.appendChild(dot);
        }
      }

      // Click handler
      if (!isLocked) {
        g.addEventListener('click', () => onTerritoryClick(id));
      }

      svgEl.appendChild(g);
    }

    // Player position marker — BIGGER & MORE VISIBLE
    if (state.currentTerritory && this.TERRITORIES[state.currentTerritory]) {
      const ct = this.TERRITORIES[state.currentTerritory];
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      marker.setAttribute('x', ct.x + 5);
      marker.setAttribute('y', ct.y - 3);
      marker.setAttribute('font-size', '4');
      marker.setAttribute('filter', 'url(#map-glow)');
      marker.textContent = '⚔️';
      const animY = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animY.setAttribute('attributeName', 'y');
      const baseY = ct.y - 3;
      animY.setAttribute('values', (baseY) + ';' + (baseY - 1.5) + ';' + (baseY));
      animY.setAttribute('dur', '1.5s');
      animY.setAttribute('repeatCount', 'indefinite');
      marker.appendChild(animY);
      svgEl.appendChild(marker);
    }
  },

  // Get territory info summary for the info panel
  getTerritoryInfo(territoryId) {
    const t = this.TERRITORIES[territoryId];
    if (!t) return null;
    const state = this.getState() || this.initState();
    const tState = state.territories[territoryId] || { status: 'locked', stagesCleared: 0 };
    const faction = this.FACTIONS[t.faction];
    const stageType = this.getCurrentStageType(territoryId);
    const stageTemplate = stageType ? this.STAGE_TEMPLATES[stageType] : null;
    const reward = stageType ? this.getStageReward(territoryId, stageType) : null;

    return {
      id: territoryId,
      ...t,
      status: tState.status,
      stagesCleared: tState.stagesCleared || 0,
      factionName: faction ? faction.name : '中立',
      factionColor: faction ? faction.color : '#8a7e6d',
      currentStage: stageTemplate,
      stageType,
      reward,
      isCurrent: state.currentTerritory === territoryId,
    };
  },

  // Get conquest statistics
  getStats() {
    const state = this.getState() || this.initState();
    let conquered = 0, available = 0, locked = 0;
    for (const [id, tState] of Object.entries(state.territories)) {
      if (tState.status === 'conquered') conquered++;
      else if (tState.status === 'available' || tState.status === 'in_battle') available++;
      else locked++;
    }
    const total = Object.keys(this.TERRITORIES).length;
    return { conquered, available, locked, total, pct: Math.floor(conquered / total * 100) };
  },
};

if (typeof window !== 'undefined') window.KingdomMap = KingdomMap;

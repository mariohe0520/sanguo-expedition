// 三国·天命 — Visual Rendering System
// Replaces ALL emoji with CSS-rendered portraits, SVG icons, and styled elements

const Visuals = {
  // ═══════════════════════════════════════
  // HERO VISUAL DATA — Chinese character + color scheme
  // ═══════════════════════════════════════
  HERO_DATA: {
    liubei:        { ch:'刘', c1:'#2d6a4f', c2:'#52b788', pat:'crown' },
    guanyu:        { ch:'关', c1:'#8b1a1a', c2:'#d4443c', pat:'blade' },
    zhangfei:      { ch:'张', c1:'#1b4332', c2:'#40916c', pat:'spear' },
    caocao:        { ch:'曹', c1:'#1a2744', c2:'#3a6ea5', pat:'crown' },
    sunshangxiang: { ch:'孙', c1:'#a01c28', c2:'#e06040', pat:'bow' },
    zhaoyun:       { ch:'赵', c1:'#1a5276', c2:'#52b788', pat:'lance' },
    zhangjiao:     { ch:'角', c1:'#5a189a', c2:'#c77dff', pat:'magic' },
    lvbu:          { ch:'吕', c1:'#5c0a0a', c2:'#c0392b', pat:'halberd' },
    diaochan:      { ch:'蝉', c1:'#6c2d82', c2:'#d4a0e0', pat:'moon' },
    huangzhong:    { ch:'黄', c1:'#5c6d38', c2:'#a3b18a', pat:'bow' },
    soldier:       { ch:'兵', c1:'#3a3f47', c2:'#6c757d', pat:'none' },
    archer_recruit:{ ch:'弓', c1:'#3a3f47', c2:'#6c757d', pat:'bow' },
    shield_militia:{ ch:'盾', c1:'#3a3f47', c2:'#6c757d', pat:'shield' },
    mage_acolyte:  { ch:'术', c1:'#4a1a7a', c2:'#7b3cbf', pat:'magic' },
    elite_cavalry: { ch:'骑', c1:'#404850', c2:'#788090', pat:'lance' },
    elite_spear:   { ch:'枪', c1:'#404850', c2:'#788090', pat:'spear' },
    navy_soldier:  { ch:'水', c1:'#1a3a5c', c2:'#3a7ca5', pat:'wave' },
    fire_archer:   { ch:'火', c1:'#8b1a10', c2:'#e06020', pat:'bow' },
    caoren:        { ch:'仁', c1:'#1a3050', c2:'#5a90b8', pat:'shield' },
    zhouyu:        { ch:'瑜', c1:'#8b2020', c2:'#e08040', pat:'flame' },
    strategist:    { ch:'谋', c1:'#4a2080', c2:'#8a50c0', pat:'scroll' },
    crossbow_corps:{ ch:'弩', c1:'#404850', c2:'#788090', pat:'bow' },
    simayi:        { ch:'司', c1:'#0f1a2e', c2:'#2a4060', pat:'eye' },
    luXun:         { ch:'逊', c1:'#9b2010', c2:'#e07030', pat:'flame' },
    fire_soldier:  { ch:'焰', c1:'#8b1a10', c2:'#e06020', pat:'flame' },
    jiangwei:      { ch:'维', c1:'#2d6a4f', c2:'#52b788', pat:'lance' },
    supply_guard:  { ch:'辎', c1:'#404850', c2:'#788090', pat:'shield' },
    zhugeLiang:    { ch:'葛', c1:'#1a5a3f', c2:'#6ac090', pat:'fan' },
    pangtong:      { ch:'统', c1:'#1b4332', c2:'#52b788', pat:'scroll' },
    machao:        { ch:'马', c1:'#2d6a4f', c2:'#74c69d', pat:'lance' },
    huangyueying:  { ch:'英', c1:'#3a7a5a', c2:'#8ad0a8', pat:'gear' },
    ganningwu:     { ch:'甘', c1:'#8b2020', c2:'#d04040', pat:'blade' },
    taishici:      { ch:'慈', c1:'#9b3020', c2:'#d06040', pat:'bow' },
    xuhuang:       { ch:'晃', c1:'#1a3050', c2:'#4a80a8', pat:'axe' },
    zhanghe:       { ch:'郃', c1:'#142040', c2:'#3a6090', pat:'blade' },
    xiahouyuan:    { ch:'渊', c1:'#1a3050', c2:'#5aa0c8', pat:'lance' },
    zhangzhao:     { ch:'昭', c1:'#9b3020', c2:'#d06040', pat:'scroll' },
    menghuo:       { ch:'获', c1:'#5a2090', c2:'#8a40c0', pat:'beast' },
    zhurong:       { ch:'融', c1:'#7a2090', c2:'#c070e0', pat:'flame' },
    guojia:        { ch:'嘉', c1:'#0f1a30', c2:'#2a4868', pat:'scroll' },
    sunce:         { ch:'策', c1:'#8b2020', c2:'#d04040', pat:'blade' },
    xunyu:         { ch:'彧', c1:'#1a3050', c2:'#4a80a8', pat:'scroll' },
    pangde:        { ch:'德', c1:'#142040', c2:'#1a3050', pat:'blade' },
    yanyan:        { ch:'严', c1:'#2d6a4f', c2:'#40916c', pat:'shield' },
    weiyan:        { ch:'延', c1:'#1b4332', c2:'#52b788', pat:'blade' },
    lusu:          { ch:'肃', c1:'#9b3020', c2:'#d06040', pat:'scroll' },
    huatuo:        { ch:'佗', c1:'#4a2090', c2:'#8a50c0', pat:'herb' },
    yuanshao:      { ch:'绍', c1:'#5a2090', c2:'#8a40b0', pat:'crown' },
    dongzhuo:      { ch:'卓', c1:'#4a1040', c2:'#7a1020', pat:'beast' },
    zhenji:        { ch:'甄', c1:'#1a3050', c2:'#80b8d8', pat:'moon' },
    mystery_1:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_2:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_3:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_4:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_5:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_6:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_7:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_8:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_9:     { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
    mystery_10:    { ch:'？', c1:'#2a2a3a', c2:'#3a3a4a', pat:'none' },
  },

  // ═══════════════════════════════════════
  // HERO PORTRAIT — CSS-rendered with Chinese character
  // sizes: 'xs'(24px) 'sm'(36px) 'md'(50px) 'lg'(72px) 'xl'(100px)
  // ═══════════════════════════════════════
  heroPortrait(heroId, size='md', rarity) {
    const vd = this.HERO_DATA[heroId] || { ch:'?', c1:'#3a3a4a', c2:'#5a5a6a', pat:'none' };
    const hero = (typeof HEROES !== 'undefined') ? HEROES[heroId] : null;
    const r = rarity || hero?.rarity || 1;
    const faction = hero?.faction || 'qun';
    const sizes = { xs: 24, sm: 36, md: 50, lg: 72, xl: 100 };
    const px = sizes[size] || 50;

    // Use portrait (PNG or SVG) if available
    if (typeof Portraits !== 'undefined' && (Portraits.hasPng(heroId) || Portraits.DATA[heroId])) {
      const portrait = Portraits.get(heroId, px);
      return '<div class="hp hp-' + size + ' hp-r' + r + ' hp-f-' + faction + '" style="--hc1:' + vd.c1 + ';--hc2:' + vd.c2 + ';overflow:hidden">' +
        portrait +
      '</div>';
    }

    // Fallback: CSS-rendered portrait
    return '<div class="hp hp-' + size + ' hp-r' + r + ' hp-f-' + faction + '" style="--hc1:' + vd.c1 + ';--hc2:' + vd.c2 + '">' +
      '<div class="hp-bg"></div>' +
      '<div class="hp-pat hp-pat-' + vd.pat + '"></div>' +
      '<span class="hp-ch">' + vd.ch + '</span>' +
      '<div class="hp-frame"></div>' +
    '</div>';
  },

  // Short portrait for battle log inline
  heroTag(heroId) {
    const vd = this.HERO_DATA[heroId] || { ch:'?', c1:'#5a5a6a' };
    return '<span class="hero-tag" style="color:' + vd.c2 + '">【' + vd.ch + '】</span>';
  },

  // ═══════════════════════════════════════
  // ELEMENT ICONS — CSS shapes
  // ═══════════════════════════════════════
  ELEM_CLASSES: {
    fire: 'ei-fire', water: 'ei-water', wind: 'ei-wind',
    earth: 'ei-earth', lightning: 'ei-lightning', ice: 'ei-ice',
  },
  ELEM_NAMES: {
    fire: '火', water: '水', wind: '风', earth: '地', lightning: '雷', ice: '冰',
  },

  elemIcon(element, withName) {
    const cls = this.ELEM_CLASSES[element] || '';
    const name = this.ELEM_NAMES[element] || '';
    return '<span class="ei ' + cls + '"></span>' + (withName ? '<span class="ei-name">' + name + '</span>' : '');
  },

  elemBadge(element) {
    if (!element) return '';
    const info = (typeof ELEMENT_INFO !== 'undefined') ? ELEMENT_INFO[element] : null;
    const color = info?.color || '#888';
    return '<span class="elem-badge" style="--ec:' + color + '">' + this.elemIcon(element) + '</span>';
  },

  // ═══════════════════════════════════════
  // UNIT TYPE ICONS — SVG
  // ═══════════════════════════════════════
  unitIcon(unitType) {
    const icons = {
      cavalry: '<svg class="ui-icon" viewBox="0 0 24 24"><path d="M17 4l-2 4h-1l-2-3-3 3 1 4-3 3v2l2 1h5l3-2 2-4v-3l1-3z" fill="currentColor"/></svg>',
      archer:  '<svg class="ui-icon" viewBox="0 0 24 24"><path d="M2 21l7-3-4-4zm11.48-9.16L22 3l-9.12 8.52M15 11c0 4.42-3.58 8-8 8l4-4c2.21 0 4-1.79 4-4z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
      spear:   '<svg class="ui-icon" viewBox="0 0 24 24"><path d="M18.36 2.64l-2.83 2.83 2.83 2.83 2.83-2.83zM5 16l3 3 10-10-3-3z" fill="currentColor"/></svg>',
      shield:  '<svg class="ui-icon" viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5z" fill="currentColor" opacity=".85"/></svg>',
      mage:    '<svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="1.2"/></svg>',
    };
    return icons[unitType] || '<svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor" opacity=".5"/></svg>';
  },

  // ═══════════════════════════════════════
  // FACTION ICONS — colored badge
  // ═══════════════════════════════════════
  factionIcon(faction) {
    const data = {
      shu: { ch:'蜀', color:'var(--shu)' },
      wei: { ch:'魏', color:'var(--wei)' },
      wu:  { ch:'吴', color:'var(--wu)' },
      qun: { ch:'群', color:'var(--qun)' },
    };
    const f = data[faction] || { ch:'?', color:'var(--dim)' };
    return '<span class="faction-badge" style="--fc:' + f.color + '">' + f.ch + '</span>';
  },

  // ═══════════════════════════════════════
  // EQUIPMENT ICONS — SVG by slot
  // ═══════════════════════════════════════
  equipSlotIcon(slot) {
    const icons = {
      weapon:    '<svg class="eq-icon" viewBox="0 0 24 24"><path d="M6.92 5L5 7.92 16.08 19l1.92-2.08L6.92 5zm8 0l-1.42 1.42L15.92 8.84l1.42-1.42-2.42-2.42zM3.5 21.5l2-2L3.5 17.5l-2 2 2 2z" fill="currentColor"/></svg>',
      armor:     '<svg class="eq-icon" viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5z" fill="currentColor"/></svg>',
      accessory: '<svg class="eq-icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 11v6m-2 0h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>',
      mount:     '<svg class="eq-icon" viewBox="0 0 24 24"><path d="M18 6l-4 4H8l-2 3v3h2v-2l2-2h4l2 2v2h2v-3l2-3V8z" fill="currentColor"/><circle cx="6" cy="18" r="2" fill="currentColor"/><circle cx="18" cy="18" r="2" fill="currentColor"/></svg>',
    };
    return icons[slot] || '';
  },

  equipItemIcon(templateId, rarity) {
    const tmpl = (typeof Equipment !== 'undefined') ? Equipment.TEMPLATES[templateId] : null;
    const slot = tmpl?.slot || 'weapon';
    const r = rarity || tmpl?.rarity || 1;
    return '<span class="eq-item-icon eq-r' + r + '">' + this.equipSlotIcon(slot) + '</span>';
  },

  // ═══════════════════════════════════════
  // RESOURCE ICONS — styled SVG
  // ═══════════════════════════════════════
  RES: {
    gold: '<svg class="res-icon ri-gold" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#d4a843"/><circle cx="8" cy="8" r="5" fill="none" stroke="#b8922e" stroke-width="1"/><text x="8" y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#0a0e1a">¥</text></svg>',
    gem: '<svg class="res-icon ri-gem" viewBox="0 0 16 16"><polygon points="8,1 14,6 8,15 2,6" fill="#6366f1"/><polygon points="8,1 11,6 8,10 5,6" fill="#818cf8"/><line x1="2" y1="6" x2="14" y2="6" stroke="#4f46e5" stroke-width=".5"/></svg>',
    exp: '<svg class="res-icon ri-exp" viewBox="0 0 16 16"><polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 1,6 6,6" fill="#eab308"/></svg>',
    shard: '<svg class="res-icon ri-shard" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="2" fill="none" stroke="#a855f7" stroke-width="1.5"/><rect x="1" y="6" width="6" height="6" rx="1" fill="#a855f7" opacity=".6"/><rect x="9" y="1" width="6" height="6" rx="1" fill="#a855f7" opacity=".4"/></svg>',
  },

  resIcon(type) {
    return this.RES[type] || '';
  },

  // ═══════════════════════════════════════
  // NAV & UI ICONS — SVG
  // ═══════════════════════════════════════
  NAV: {
    home:     '<svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    campaign: '<svg viewBox="0 0 24 24"><path d="M6 2l6 6 6-6M5 8v12l7-4 7 4V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dungeon:  '<svg viewBox="0 0 24 24"><path d="M2 20l5-8 4 4 4-6 5 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    arena:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v4m0 10v4M3 12h4m10 0h4" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity=".6"/></svg>',
    roster:   '<svg viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gacha:    '<svg viewBox="0 0 24 24"><path d="M4 4h16v4l-3 3 3 3v6H4v-6l3-3-3-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 8h16" stroke="currentColor" stroke-width="1.5"/></svg>',
  },

  navIcon(name) {
    return '<span class="nav-svg">' + (this.NAV[name] || '') + '</span>';
  },

  // Section heading icons
  SEC: {
    stats:    '<svg class="sec-icon" viewBox="0 0 20 20"><rect x="2" y="10" width="3" height="8" rx="1" fill="currentColor"/><rect x="7" y="6" width="3" height="12" rx="1" fill="currentColor"/><rect x="12" y="2" width="3" height="16" rx="1" fill="currentColor"/></svg>',
    skill:    '<svg class="sec-icon" viewBox="0 0 20 20"><polygon points="10,1 12,7 18,7 13,11 15,17 10,13 5,17 7,11 2,7 8,7" fill="currentColor"/></svg>',
    passive:  '<svg class="sec-icon" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/></svg>',
    lore:     '<svg class="sec-icon" viewBox="0 0 20 20"><path d="M4 2h12v16H4zM7 6h6M7 9h6M7 12h4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    upgrade:  '<svg class="sec-icon" viewBox="0 0 20 20"><path d="M10 16V4m-4 4l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    equip:    '<svg class="sec-icon" viewBox="0 0 20 20"><rect x="3" y="6" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 6V4a3 3 0 016 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    tree:     '<svg class="sec-icon" viewBox="0 0 20 20"><path d="M10 2v16M6 6l4 4 4-4M4 12l6 4 6-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    missions: '<svg class="sec-icon" viewBox="0 0 20 20"><rect x="3" y="2" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    trophy:   '<svg class="sec-icon" viewBox="0 0 20 20"><path d="M5 2h10v6a5 5 0 01-10 0zM10 13v3M7 16h6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 4H3v3a2 2 0 002 2M15 4h2v3a2 2 0 01-2 2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    battle:   '<svg class="sec-icon" viewBox="0 0 20 20"><path d="M4 4l5 5M16 4l-5 5M7 16l3-3 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    scroll:   '<svg class="sec-icon" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2zM8 7h4M8 10h4M8 13h2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    gift:     '<svg class="sec-icon" viewBox="0 0 20 20"><rect x="2" y="8" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 8v10M2 12h16" stroke="currentColor" stroke-width="1.2"/><path d="M10 8C10 5 7 3 5.5 5S8 8 10 8m0 0c0-3 3-5 4.5-3S12 8 10 8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    lock:     '<svg class="sec-icon" viewBox="0 0 20 20"><rect x="4" y="9" width="12" height="9" rx="2" fill="currentColor" opacity=".7"/><path d="M7 9V6a3 3 0 016 0v3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
  },

  secIcon(name) {
    return this.SEC[name] || '';
  },

  // ═══════════════════════════════════════
  // MISC ICONS
  // ═══════════════════════════════════════
  bossSkull() {
    return '<svg class="boss-skull" viewBox="0 0 24 24"><circle cx="12" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="9" r="2" fill="currentColor"/><circle cx="15" cy="9" r="2" fill="currentColor"/><path d="M9 15h6M10 15v3M12 15v3M14 15v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  },

  vsIcon() {
    return '<div class="vs-badge"><svg viewBox="0 0 32 32"><path d="M6 4l6 12-6 12M26 4l-6 12 6 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><text x="16" y="19" text-anchor="middle" font-size="10" font-weight="900" fill="currentColor">VS</text></svg></div>';
  },

  // Terrain & Weather labels (replacing emoji)
  terrainLabel(terrain) {
    const data = {
      plains:'平原', mountain:'山地', water:'水域', river:'水域',
      forest:'森林', castle:'城池'
    };
    return '<span class="terrain-label tl-' + terrain + '">' + (data[terrain] || terrain) + '</span>';
  },

  weatherLabel(weather) {
    const data = {
      clear:'晴天', rain:'雨天', fog:'雾天', fire:'火烧', wind:'大风'
    };
    return '<span class="weather-label wl-' + weather + '">' + (data[weather] || weather) + '</span>';
  },

  // Affinity emoji replacement
  affinityIcon(affinityId) {
    const icons = {
      taoyuan: '桃', wolong_fengchu: '龙', tiger_wall: '虎',
      fire_duo: '火', wu_tiger: '将', wei_advisors: '谋',
      wu_pillars: '柱', beauty: '美', nanman: '蛮',
      heir: '继',
    };
    const ch = icons[affinityId] || '羁';
    return '<span class="aff-icon">' + ch + '</span>';
  },

  // Reaction label (replacing emoji in reaction names)
  reactionLabel(reactionName) {
    // Strip emoji from reaction names
    return reactionName.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]/gu, '').trim();
  },
};

if (typeof window !== 'undefined') window.Visuals = Visuals;

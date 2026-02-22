// 三国·天命 — AI-Generated Character Portraits (Flux/SDXL)
// Uses PNG portraits with SVG fallback for unknown heroes

const Portraits = {
  // PNG portrait path prefix
  PNG_PATH: 'img/heroes/',
  
  // Track which PNGs exist (populated on init)
  _pngAvailable: new Set(),
  _cache: {},
  _initialized: false,

  // Initialize: check which PNG portraits exist
  async init() {
    if (this._initialized) return;
    const heroIds = ['liubei','guanyu','zhangfei','zhugeliang','zhaoyun','huangzhong','machao','weiyan',
      'jiangwei','pangtong','huangyueying','guanping','zhangbao','fazheng','mayunlu','yanyan','masu','liushan',
      'caocao','simayi','xiahouyuan','xuchu','zhangliao','dianwei','xiahoudun','caoren','guojia','xunyu',
      'zhanghe','yujin','caopi','zhenji','pangde','jiachu','xuhuang','caozhang',
      'sunquan','zhouyu','lumeng','ganning','huanggai','sunce','taishici','luxun',
      'daqiao','xiaoqiao','sunshangxiang','zhoutai','lvsuzong','zhugejin',
      'lvbu','diaochan','dongzhuo','yuanshao','gongsunzan','yangliang','wenchou','huatuo','zuoci','yuji'];
    heroIds.forEach(id => this._pngAvailable.add(id));
    this._initialized = true;
  },

  // Check if PNG exists for hero
  hasPng(heroId) {
    // Normalize heroId (handle case variations)
    const normalized = heroId.toLowerCase().replace(/[^a-z]/g, '');
    return this._pngAvailable.has(normalized);
  },

  // Get PNG URL
  getPngUrl(heroId) {
    const normalized = heroId.toLowerCase().replace(/[^a-z]/g, '');
    return `${this.PNG_PATH}${normalized}.png`;
  },

  get(heroId, size = 80) {
    const key = heroId + '-' + size;
    if (this._cache[key]) return this._cache[key];
    
    // Try PNG first
    const normalized = heroId.toLowerCase().replace(/[^a-z]/g, '');
    if (this._pngAvailable.has(normalized)) {
      const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,215,0,0.6);box-shadow:0 0 8px rgba(255,215,0,0.3)">
        <img src="${this.PNG_PATH}${normalized}.png" width="${size}" height="${size}" style="object-fit:cover;display:block" loading="lazy" alt="${heroId}">
      </div>`;
      this._cache[key] = html;
      return html;
    }
    
    // Fallback to SVG
    const data = this.DATA[heroId];
    if (!data) return this._fallback(heroId, size);
    const svg = this._render(data, size);
    this._cache[key] = svg;
    return svg;
  },

  // Render portrait as rounded rectangle (for BattleUI cards)
  getRect(heroId, size = 120) {
    const key = heroId + '-rect-' + size;
    if (this._cache[key]) return this._cache[key];
    
    // Try PNG first
    const normalized = heroId.toLowerCase().replace(/[^a-z]/g, '');
    if (this._pngAvailable.has(normalized)) {
      const w = size;
      const h = Math.round(size * 1.3);
      const html = `<div style="width:${w}px;height:${h}px;border-radius:8px;overflow:hidden;border:2px solid rgba(255,215,0,0.6);box-shadow:0 2px 12px rgba(0,0,0,0.4)">
        <img src="${this.PNG_PATH}${normalized}.png" width="${w}" height="${h}" style="object-fit:cover;display:block" loading="lazy" alt="${heroId}">
      </div>`;
      this._cache[key] = html;
      return html;
    }
    
    // Fallback to SVG
    const data = this.DATA[heroId];
    if (!data) return this._fallbackRect(heroId, size);
    const svg = this._renderRect(data, size);
    this._cache[key] = svg;
    return svg;
  },

  _render(d, size) {
    const s = size;
    const h = s; // square
    const cx = s / 2;
    const cy = s / 2;
    const r = s * 0.42;

    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-${d.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${d.bg1}"/>
          <stop offset="100%" stop-color="${d.bg2}"/>
        </linearGradient>
        <radialGradient id="face-${d.id}" cx="0.4" cy="0.35">
          <stop offset="0%" stop-color="${d.skin1}"/>
          <stop offset="100%" stop-color="${d.skin2}"/>
        </radialGradient>
        <clipPath id="clip-${d.id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
      </defs>
      <!-- Background -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bg-${d.id})"/>
      <!-- Character (clipped) -->
      <g clip-path="url(#clip-${d.id})">
        <!-- Body/Armor -->
        <ellipse cx="${cx}" cy="${s*0.85}" rx="${s*0.35}" ry="${s*0.3}" fill="${d.armor}"/>
        ${d.armorDetail || ''}
        <!-- Neck -->
        <rect x="${cx-s*0.06}" y="${s*0.48}" width="${s*0.12}" height="${s*0.12}" fill="${d.skin1}" rx="2"/>
        <!-- Face -->
        <ellipse cx="${cx}" cy="${s*0.38}" rx="${s*0.16}" ry="${s*0.19}" fill="url(#face-${d.id})"/>
        <!-- Eyes -->
        <ellipse cx="${cx-s*0.06}" cy="${s*0.36}" rx="${s*0.028}" ry="${s*0.018}" fill="${d.eyeColor || '#1a1a1a'}"/>
        <ellipse cx="${cx+s*0.06}" cy="${s*0.36}" rx="${s*0.028}" ry="${s*0.018}" fill="${d.eyeColor || '#1a1a1a'}"/>
        <!-- Eyebrows -->
        <line x1="${cx-s*0.09}" y1="${s*0.32}" x2="${cx-s*0.03}" y2="${s*0.31}" stroke="${d.hairColor || '#1a1a1a'}" stroke-width="${s*0.018}" stroke-linecap="round"/>
        <line x1="${cx+s*0.03}" y1="${s*0.31}" x2="${cx+s*0.09}" y2="${s*0.32}" stroke="${d.hairColor || '#1a1a1a'}" stroke-width="${s*0.018}" stroke-linecap="round"/>
        <!-- Nose -->
        <line x1="${cx}" y1="${s*0.37}" x2="${cx}" y2="${s*0.41}" stroke="${d.skin2}" stroke-width="${s*0.012}" stroke-linecap="round"/>
        <!-- Mouth -->
        <path d="M${cx-s*0.04} ${s*0.44} Q${cx} ${s*0.46} ${cx+s*0.04} ${s*0.44}" stroke="${d.lipColor || '#8b4040'}" stroke-width="${s*0.01}" fill="none"/>
        <!-- Hair -->
        ${d.hair}
        <!-- Beard -->
        ${d.beard || ''}
        <!-- Headpiece / Accessories -->
        ${d.headpiece || ''}
        <!-- Weapon hint -->
        ${d.weapon || ''}
      </g>
      <!-- Frame border -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.frameBorder}" stroke-width="${s*0.03}"/>
      ${d.frameGlow || ''}
    </svg>`;
  },

  // Render portrait as rounded rectangle — full-body view, not clipped to circle
  // Uses viewBox="0 0 80 80" to match portrait DATA coordinates, scales via SVG width/height
  _renderRect(d, size) {
    const s = 80; // keep original coordinate space
    const cx = s / 2;
    const r = 6; // corner radius in viewBox coords

    return `<svg viewBox="0 0 ${s} ${s}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rbg-${d.id}" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stop-color="${d.bg1}"/>
          <stop offset="100%" stop-color="${d.bg2}"/>
        </linearGradient>
        <radialGradient id="rface-${d.id}" cx="0.4" cy="0.35">
          <stop offset="0%" stop-color="${d.skin1}"/>
          <stop offset="100%" stop-color="${d.skin2}"/>
        </radialGradient>
        <clipPath id="rclip-${d.id}"><rect width="${s}" height="${s}" rx="${r}"/></clipPath>
      </defs>
      <!-- Background fills entire rect -->
      <rect width="${s}" height="${s}" rx="${r}" fill="url(#rbg-${d.id})"/>
      <!-- Character (clipped to rounded rect) -->
      <g clip-path="url(#rclip-${d.id})">
        <!-- Body/Armor -->
        <ellipse cx="${cx}" cy="${s*0.85}" rx="${s*0.35}" ry="${s*0.3}" fill="${d.armor}"/>
        ${d.armorDetail || ''}
        <!-- Neck -->
        <rect x="${cx-s*0.06}" y="${s*0.48}" width="${s*0.12}" height="${s*0.12}" fill="${d.skin1}" rx="2"/>
        <!-- Face -->
        <ellipse cx="${cx}" cy="${s*0.38}" rx="${s*0.16}" ry="${s*0.19}" fill="url(#rface-${d.id})"/>
        <!-- Eyes -->
        <ellipse cx="${cx-s*0.06}" cy="${s*0.36}" rx="${s*0.028}" ry="${s*0.018}" fill="${d.eyeColor || '#1a1a1a'}"/>
        <ellipse cx="${cx+s*0.06}" cy="${s*0.36}" rx="${s*0.028}" ry="${s*0.018}" fill="${d.eyeColor || '#1a1a1a'}"/>
        <!-- Eye highlights -->
        <circle cx="${cx-s*0.05}" cy="${s*0.355}" r="${s*0.007}" fill="rgba(255,255,255,0.6)"/>
        <circle cx="${cx+s*0.07}" cy="${s*0.355}" r="${s*0.007}" fill="rgba(255,255,255,0.6)"/>
        <!-- Eyebrows -->
        <line x1="${cx-s*0.09}" y1="${s*0.32}" x2="${cx-s*0.03}" y2="${s*0.31}" stroke="${d.hairColor || '#1a1a1a'}" stroke-width="${s*0.018}" stroke-linecap="round"/>
        <line x1="${cx+s*0.03}" y1="${s*0.31}" x2="${cx+s*0.09}" y2="${s*0.32}" stroke="${d.hairColor || '#1a1a1a'}" stroke-width="${s*0.018}" stroke-linecap="round"/>
        <!-- Nose -->
        <line x1="${cx}" y1="${s*0.37}" x2="${cx}" y2="${s*0.41}" stroke="${d.skin2}" stroke-width="${s*0.012}" stroke-linecap="round"/>
        <!-- Mouth -->
        <path d="M${cx-s*0.04} ${s*0.44} Q${cx} ${s*0.46} ${cx+s*0.04} ${s*0.44}" stroke="${d.lipColor || '#8b4040'}" stroke-width="${s*0.01}" fill="none"/>
        <!-- Hair -->
        ${d.hair || ''}
        <!-- Beard -->
        ${d.beard || ''}
        <!-- Headpiece / Accessories -->
        ${d.headpiece || ''}
        <!-- Weapon hint -->
        ${d.weapon || ''}
      </g>
    </svg>`;
  },

  _fallbackRect(heroId, size) {
    const vd = (typeof Visuals !== 'undefined' && Visuals.HERO_DATA[heroId]) || { ch: '?', c1: '#3a3f47', c2: '#6c757d' };
    const r = size * 0.08;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="rfb-${heroId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${vd.c1}"/><stop offset="100%" stop-color="${vd.c2}"/></linearGradient></defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="url(#rfb-${heroId})"/>
      <text x="${size/2}" y="${size/2+size*0.12}" text-anchor="middle" font-size="${size*0.4}" font-weight="900" fill="rgba(255,255,255,0.9)" font-family="'Noto Serif SC',serif">${vd.ch}</text>
      <rect width="${size}" height="${size}" rx="${r}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="${size*0.02}"/>
    </svg>`;
  },

  _fallback(heroId, size) {
    const vd = (typeof Visuals !== 'undefined' && Visuals.HERO_DATA[heroId]) || { ch: '?', c1: '#3a3f47', c2: '#6c757d' };
    const cx = size / 2, r = size * 0.42;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="fb-${heroId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${vd.c1}"/><stop offset="100%" stop-color="${vd.c2}"/></linearGradient></defs>
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="url(#fb-${heroId})"/>
      <text x="${cx}" y="${cx+size*0.1}" text-anchor="middle" font-size="${size*0.4}" font-weight="900" fill="rgba(255,255,255,0.9)" font-family="'Noto Serif SC',serif">${vd.ch}</text>
      <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="${size*0.025}"/>
    </svg>`;
  },

  // ═══ CHARACTER DATA ═══
  DATA: {
    guanyu: {
      id: 'guanyu',
      bg1: '#1a3a2a', bg2: '#0a1a10',
      skin1: '#e8c8a0', skin2: '#c8a878',
      armor: '#2d6a4f',
      armorDetail: `<path d="M25 72 L40 65 L55 72" stroke="#4a8c6f" stroke-width="2" fill="none"/>`,
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="16" ry="12" fill="#1a1a1a"/>
             <rect x="24" y="22" width="32" height="8" fill="#1a1a1a" rx="2"/>`,
      beard: `<path d="M34 44 Q40 62 46 44" stroke="#1a1a1a" stroke-width="2.5" fill="none"/>
              <path d="M32 44 Q40 58 48 44" stroke="#222" stroke-width="1.5" fill="none"/>
              <path d="M36 46 Q40 56 44 46" stroke="#333" stroke-width="1" fill="none"/>`,
      headpiece: `<rect x="28" y="18" width="24" height="6" fill="#d4a843" rx="1"/>
                  <circle cx="40" cy="21" r="3" fill="#ef4444"/>`,
      weapon: `<line x1="62" y1="15" x2="70" y2="70" stroke="#94a3b8" stroke-width="2.5"/>
               <path d="M68 10 Q72 15 70 20 Q66 18 68 10Z" fill="#c0c8d4"/>`,
      frameBorder: 'rgba(212,168,67,0.6)',
      frameGlow: `<circle cx="40" cy="40" r="34.5" fill="none" stroke="rgba(212,168,67,0.2)" stroke-width="2"/>`,
      eyeColor: '#1a1a1a',
      lipColor: '#8b5050',
    },

    zhangfei: {
      id: 'zhangfei',
      bg1: '#1a2a1a', bg2: '#0a1510',
      skin1: '#d8b888', skin2: '#b89868',
      armor: '#1b4332',
      hairColor: '#0a0a0a',
      hair: `<ellipse cx="40" cy="24" rx="17" ry="13" fill="#0a0a0a"/>
             <rect x="23" y="20" width="34" height="10" fill="#0a0a0a" rx="3"/>`,
      beard: `<path d="M28 42 Q40 68 52 42" stroke="#0a0a0a" stroke-width="3" fill="none"/>
              <path d="M30 44 Q40 64 50 44" stroke="#1a1a1a" stroke-width="2" fill="none"/>
              <path d="M32 42 Q40 60 48 42" stroke="#222" stroke-width="1.5" fill="none"/>`,
      headpiece: `<rect x="26" y="17" width="28" height="5" fill="#5a7a5a" rx="1"/>`,
      weapon: `<line x1="14" y1="12" x2="10" y2="72" stroke="#8a7a6a" stroke-width="3"/>
               <ellipse cx="12" cy="10" rx="4" ry="6" fill="#4a4a4a" stroke="#666" stroke-width="0.5"/>`,
      frameBorder: 'rgba(168,85,247,0.5)',
      eyeColor: '#1a1a1a',
    },

    zhaoyun: {
      id: 'zhaoyun',
      bg1: '#1a3050', bg2: '#0a1828',
      skin1: '#f0d8b8', skin2: '#d8c098',
      armor: '#64748b',
      armorDetail: `<ellipse cx="40" cy="72" rx="12" ry="8" fill="#94a3b8" opacity="0.5"/>`,
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="25" rx="15" ry="11" fill="#1a1a1a"/>
             <path d="M25 26 Q30 18 40 16 Q50 18 55 26" fill="#1a1a1a"/>`,
      headpiece: `<path d="M28 20 L40 14 L52 20" stroke="#94a3b8" stroke-width="2" fill="none"/>
                  <circle cx="40" cy="15" r="2.5" fill="#3b82f6"/>`,
      weapon: `<line x1="60" y1="18" x2="68" y2="68" stroke="#c8d0d8" stroke-width="2"/>
               <path d="M66 14 L70 18 L68 22 L64 18Z" fill="#d4d8e0"/>`,
      frameBorder: 'rgba(212,168,67,0.6)',
      frameGlow: `<circle cx="40" cy="40" r="34.5" fill="none" stroke="rgba(212,168,67,0.15)" stroke-width="2"/>`,
      eyeColor: '#1a2a3a',
    },

    caocao: {
      id: 'caocao',
      bg1: '#1a2a4a', bg2: '#0a1428',
      skin1: '#e8c8a0', skin2: '#c8a878',
      armor: '#1a3a6a',
      armorDetail: `<path d="M28 68 L40 62 L52 68" stroke="#3a6aa0" stroke-width="1.5" fill="none"/>`,
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="15" ry="11" fill="#1a1a1a"/>
             <rect x="26" y="22" width="28" height="6" fill="#1a1a1a" rx="2"/>`,
      beard: `<path d="M36 44 Q40 50 44 44" stroke="#2a2a2a" stroke-width="1.5" fill="none"/>`,
      headpiece: `<rect x="26" y="17" width="28" height="7" fill="#d4a843" rx="2"/>
                  <rect x="30" y="13" width="20" height="5" fill="#b8922e" rx="1"/>
                  <circle cx="40" cy="16" r="2" fill="#ef4444"/>`,
      frameBorder: 'rgba(212,168,67,0.6)',
      frameGlow: `<circle cx="40" cy="40" r="34.5" fill="none" stroke="rgba(212,168,67,0.2)" stroke-width="2"/>`,
      eyeColor: '#1a1a2a',
    },

    lvbu: {
      id: 'lvbu',
      bg1: '#3a1a1a', bg2: '#1a0a0a',
      skin1: '#e0c098', skin2: '#c0a070',
      armor: '#8b1a1a',
      armorDetail: `<path d="M25 70 L40 62 L55 70" stroke="#c04040" stroke-width="2" fill="none"/>
                    <circle cx="40" cy="66" r="3" fill="#d4a843"/>`,
      hairColor: '#0a0a0a',
      hair: `<ellipse cx="40" cy="23" rx="16" ry="12" fill="#0a0a0a"/>
             <path d="M24 24 Q32 14 40 12 Q48 14 56 24" fill="#0a0a0a"/>`,
      headpiece: `<path d="M30 16 L40 6 L50 16" stroke="#d4a843" stroke-width="2" fill="none"/>
                  <path d="M36 10 L40 4 L44 10" fill="#ef4444"/>
                  <circle cx="40" cy="14" r="2.5" fill="#ffd700"/>`,
      weapon: `<line x1="62" y1="10" x2="70" y2="72" stroke="#8a7a6a" stroke-width="3"/>
               <path d="M60 6 L72 6 L70 14 L62 14Z" fill="#94a3b8"/>`,
      frameBorder: 'rgba(212,168,67,0.7)',
      frameGlow: `<circle cx="40" cy="40" r="35" fill="none" stroke="rgba(239,68,68,0.15)" stroke-width="3"/>`,
      eyeColor: '#3a1a1a',
    },

    diaochan: {
      id: 'diaochan',
      bg1: '#3a1a3a', bg2: '#1a0a1a',
      skin1: '#f8e0c8', skin2: '#e8c8a8',
      armor: '#6c2d82',
      armorDetail: `<path d="M30 66 Q40 60 50 66" stroke="#a855f7" stroke-width="1" fill="none"/>`,
      hairColor: '#1a1a2a',
      hair: `<ellipse cx="40" cy="22" rx="17" ry="13" fill="#1a1a2a"/>
             <path d="M23 28 Q20 40 24 50" stroke="#1a1a2a" stroke-width="4" fill="none"/>
             <path d="M57 28 Q60 40 56 50" stroke="#1a1a2a" stroke-width="4" fill="none"/>`,
      headpiece: `<circle cx="34" cy="18" r="3" fill="#d4a843"/>
                  <circle cx="46" cy="18" r="3" fill="#d4a843"/>
                  <path d="M34 18 Q40 12 46 18" stroke="#d4a843" stroke-width="1" fill="none"/>`,
      frameBorder: 'rgba(168,85,247,0.5)',
      frameGlow: `<circle cx="40" cy="40" r="34.5" fill="none" stroke="rgba(168,85,247,0.15)" stroke-width="2"/>`,
      eyeColor: '#2a1a2a',
      lipColor: '#c04060',
    },

    liubei: {
      id: 'liubei',
      bg1: '#1a3a28', bg2: '#0a1a10',
      skin1: '#e8d0b0', skin2: '#c8b090',
      armor: '#2d6a4f',
      armorDetail: `<path d="M28 68 L40 62 L52 68" stroke="#4a8c6f" stroke-width="1.5" fill="none"/>`,
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="15" ry="11" fill="#1a1a1a"/>
             <rect x="26" y="22" width="28" height="6" fill="#1a1a1a" rx="2"/>`,
      beard: `<path d="M36 44 Q40 48 44 44" stroke="#2a2a2a" stroke-width="1" fill="none"/>`,
      headpiece: `<rect x="28" y="18" width="24" height="5" fill="#2d6a4f" rx="1"/>
                  <circle cx="40" cy="20" r="2" fill="#d4a843"/>`,
      frameBorder: 'rgba(74,140,111,0.5)',
      eyeColor: '#1a2a1a',
    },

    sunshangxiang: {
      id: 'sunshangxiang',
      bg1: '#3a1a1a', bg2: '#1a0a08',
      skin1: '#f0d8b8', skin2: '#d8c098',
      armor: '#a01c28',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="23" rx="16" ry="12" fill="#1a1a1a"/>
             <path d="M24 26 Q22 38 26 48" stroke="#1a1a1a" stroke-width="3" fill="none"/>
             <path d="M56 26 Q58 38 54 48" stroke="#1a1a1a" stroke-width="3" fill="none"/>`,
      headpiece: `<circle cx="40" cy="16" r="3" fill="#ef4444"/>
                  <path d="M37 16 L40 12 L43 16" fill="#d4a843"/>`,
      weapon: `<path d="M60 20 Q64 18 68 24 Q62 22 60 20Z" fill="#c8a040"/>`,
      frameBorder: 'rgba(168,85,247,0.5)',
      eyeColor: '#1a1a2a',
    },

    huangzhong: {
      id: 'huangzhong',
      bg1: '#2a3a20', bg2: '#1a2010',
      skin1: '#d8b890', skin2: '#b89870',
      armor: '#5c6d38',
      hairColor: '#888888',
      hair: `<ellipse cx="40" cy="24" rx="15" ry="11" fill="#999"/>
             <rect x="26" y="22" width="28" height="6" fill="#888" rx="2"/>`,
      beard: `<path d="M34 44 Q40 54 46 44" stroke="#999" stroke-width="2" fill="none"/>
              <path d="M36 46 Q40 52 44 46" stroke="#aaa" stroke-width="1" fill="none"/>`,
      headpiece: `<rect x="28" y="18" width="24" height="5" fill="#5c6d38" rx="1"/>`,
      weapon: `<path d="M58 16 Q64 14 68 22 Q60 20 58 16Z" fill="#b8922e"/>
               <line x1="60" y1="18" x2="66" y2="60" stroke="#8a7a6a" stroke-width="2"/>`,
      frameBorder: 'rgba(59,130,246,0.4)',
      eyeColor: '#2a2a1a',
    },

    zhangjiao: {
      id: 'zhangjiao',
      bg1: '#2a1a3a', bg2: '#1a0a2a',
      skin1: '#d8c0a0', skin2: '#b8a080',
      armor: '#5a189a',
      hairColor: '#888',
      hair: `<ellipse cx="40" cy="22" rx="16" ry="13" fill="#777"/>
             <path d="M24 26 Q22 36 28 44" stroke="#888" stroke-width="3" fill="none"/>
             <path d="M56 26 Q58 36 52 44" stroke="#888" stroke-width="3" fill="none"/>`,
      beard: `<path d="M34 44 Q40 58 46 44" stroke="#999" stroke-width="2" fill="none"/>`,
      headpiece: `<path d="M28 18 L40 10 L52 18" stroke="#c77dff" stroke-width="2" fill="none"/>
                  <circle cx="40" cy="12" r="3" fill="#8b5cf6"/>`,
      frameBorder: 'rgba(168,85,247,0.5)',
      eyeColor: '#3a1a4a',
    },

    zhugeLiang: {
      id: 'zhugeLiang',
      bg1: '#1a3a2a', bg2: '#0a2018',
      skin1: '#f0d8b8', skin2: '#d0b890',
      armor: '#2d6a4f',
      armorDetail: `<path d="M26 68 Q40 58 54 68" stroke="#4a8c6f" stroke-width="1.5" fill="none"/>`,
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="14" ry="10" fill="#1a1a1a"/>
             <rect x="27" y="22" width="26" height="5" fill="#1a1a1a" rx="2"/>`,
      headpiece: `<rect x="26" y="17" width="28" height="6" fill="#5a9a6f" rx="2"/>
                  <path d="M38 12 L40 8 L42 12" fill="#d4a843"/>`,
      weapon: `<line x1="12" y1="14" x2="8" y2="68" stroke="#8a7a5a" stroke-width="2"/>
               <path d="M6 10 Q12 6 18 10 Q12 14 6 10Z" fill="#e8d8b0" opacity="0.8"/>`,
      beard: `<path d="M36 44 Q40 52 44 44" stroke="#2a2a2a" stroke-width="1.5" fill="none"/>`,
      frameBorder: 'rgba(212,168,67,0.7)',
      frameGlow: `<circle cx="40" cy="40" r="35" fill="none" stroke="rgba(212,168,67,0.2)" stroke-width="2"/>`,
      eyeColor: '#1a2a1a',
    },

    zhouyu: {
      id: 'zhouyu',
      bg1: '#3a1a18', bg2: '#1a0a08',
      skin1: '#f0d8b8', skin2: '#d8c098',
      armor: '#8b1a1a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="14" ry="11" fill="#1a1a1a"/>
             <rect x="27" y="22" width="26" height="5" fill="#1a1a1a" rx="2"/>`,
      headpiece: `<rect x="28" y="18" width="24" height="5" fill="#c04040" rx="1"/>
                  <circle cx="40" cy="20" r="2" fill="#d4a843"/>`,
      frameBorder: 'rgba(239,68,68,0.5)',
      eyeColor: '#1a1a2a',
    },

    simayi: {
      id: 'simayi',
      bg1: '#1a2040', bg2: '#0a1028',
      skin1: '#e0c8a0', skin2: '#c0a880',
      armor: '#1a3a6a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="14" ry="10" fill="#1a1a1a"/>
             <rect x="28" y="22" width="24" height="5" fill="#1a1a1a" rx="2"/>`,
      headpiece: `<rect x="26" y="17" width="28" height="6" fill="#2a4a7a" rx="2"/>
                  <circle cx="40" cy="20" r="2.5" fill="#94a3b8"/>`,
      beard: `<path d="M36 44 Q40 50 44 44" stroke="#333" stroke-width="1.5" fill="none"/>`,
      frameBorder: 'rgba(59,130,246,0.5)',
      eyeColor: '#1a1a3a',
    },

    machao: {
      id: 'machao',
      bg1: '#2a3a1a', bg2: '#1a2a0a',
      skin1: '#e8c8a0', skin2: '#c8a878',
      armor: '#4a6a2a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="15" ry="11" fill="#1a1a1a"/>
             <path d="M25 26 Q35 16 40 14 Q45 16 55 26" fill="#1a1a1a"/>`,
      headpiece: `<path d="M30 18 L40 12 L50 18" stroke="#d4a843" stroke-width="2" fill="none"/>`,
      weapon: `<line x1="60" y1="14" x2="68" y2="66" stroke="#c0c8d4" stroke-width="2.5"/>`,
      frameBorder: 'rgba(168,85,247,0.5)',
      eyeColor: '#1a2a1a',
    },

    guojia: {
      id: 'guojia',
      bg1: '#1a2a4a', bg2: '#0a1428',
      skin1: '#f0d8b8', skin2: '#d8c098',
      armor: '#1a3a6a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="14" ry="10" fill="#1a1a1a"/>
             <rect x="28" y="22" width="24" height="5" fill="#1a1a1a" rx="2"/>`,
      headpiece: `<rect x="28" y="18" width="24" height="5" fill="#3a5a8a" rx="1"/>`,
      frameBorder: 'rgba(59,130,246,0.4)',
      eyeColor: '#1a1a3a',
    },

    dongzhuo: {
      id: 'dongzhuo',
      bg1: '#3a1a0a', bg2: '#1a0a00',
      skin1: '#d8b890', skin2: '#b89868',
      armor: '#5a1a0a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="16" ry="12" fill="#1a1a1a"/>`,
      beard: `<path d="M32 44 Q40 56 48 44" stroke="#2a2a2a" stroke-width="2.5" fill="none"/>`,
      headpiece: `<rect x="26" y="16" width="28" height="8" fill="#8a6a2a" rx="2"/>
                  <circle cx="40" cy="20" r="3" fill="#d4a843"/>`,
      frameBorder: 'rgba(168,85,247,0.5)',
      eyeColor: '#2a1a0a',
    },

    sunce: {
      id: 'sunce',
      bg1: '#3a1a18', bg2: '#1a0a08',
      skin1: '#e8c8a0', skin2: '#c8a878',
      armor: '#8b1a1a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="15" ry="11" fill="#1a1a1a"/>
             <path d="M25 26 Q35 16 40 14 Q45 16 55 26" fill="#1a1a1a"/>`,
      headpiece: `<rect x="30" y="18" width="20" height="4" fill="#c04040" rx="1"/>`,
      frameBorder: 'rgba(239,68,68,0.4)',
      eyeColor: '#1a1a2a',
    },

    pangtong: {
      id: 'pangtong',
      bg1: '#2a2a1a', bg2: '#1a1a0a',
      skin1: '#d8c0a0', skin2: '#b8a080',
      armor: '#4a5a3a',
      hairColor: '#2a2a1a',
      hair: `<ellipse cx="40" cy="22" rx="16" ry="13" fill="#2a2a1a"/>
             <path d="M24 26 Q22 36 28 44" stroke="#2a2a1a" stroke-width="3" fill="none"/>`,
      headpiece: `<ellipse cx="40" cy="16" rx="14" ry="6" fill="#6a5a3a" opacity="0.7"/>`,
      beard: `<path d="M36 44 Q40 50 44 44" stroke="#3a3a2a" stroke-width="1.5" fill="none"/>`,
      frameBorder: 'rgba(168,85,247,0.4)',
      eyeColor: '#2a2a1a',
    },

    huangyueying: {
      id: 'huangyueying',
      bg1: '#2a3a2a', bg2: '#1a2a1a',
      skin1: '#f0d8c0', skin2: '#d8c0a0',
      armor: '#3a6a4a',
      hairColor: '#2a1a1a',
      hair: `<ellipse cx="40" cy="22" rx="16" ry="12" fill="#2a1a1a"/>
             <path d="M24 26 Q22 38 26 48" stroke="#2a1a1a" stroke-width="3.5" fill="none"/>
             <path d="M56 26 Q58 38 54 48" stroke="#2a1a1a" stroke-width="3.5" fill="none"/>`,
      headpiece: `<circle cx="40" cy="16" r="3" fill="#d4a843"/>`,
      frameBorder: 'rgba(74,140,111,0.5)',
      eyeColor: '#1a2a1a',
      lipColor: '#b04050',
    },

    huatuo: {
      id: 'huatuo',
      bg1: '#1a3a2a', bg2: '#0a2018',
      skin1: '#e0c8a0', skin2: '#c0a880',
      armor: '#2d5a3f',
      hairColor: '#888',
      hair: `<ellipse cx="40" cy="23" rx="15" ry="11" fill="#888"/>
             <rect x="26" y="22" width="28" height="5" fill="#777" rx="2"/>`,
      beard: `<path d="M34 44 Q40 56 46 44" stroke="#999" stroke-width="2" fill="none"/>`,
      headpiece: `<rect x="30" y="18" width="20" height="4" fill="#4a8a5a" rx="1"/>`,
      frameBorder: 'rgba(34,197,94,0.4)',
      eyeColor: '#2a3a2a',
    },

    yuanshao: {
      id: 'yuanshao',
      bg1: '#3a2a1a', bg2: '#1a1408',
      skin1: '#e8c8a0', skin2: '#c8a878',
      armor: '#6a4a1a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="24" rx="15" ry="11" fill="#1a1a1a"/>`,
      headpiece: `<rect x="26" y="16" width="28" height="8" fill="#b8922e" rx="2"/>
                  <rect x="30" y="12" width="20" height="5" fill="#d4a843" rx="1"/>`,
      beard: `<path d="M36 44 Q40 50 44 44" stroke="#2a2a2a" stroke-width="1.5" fill="none"/>`,
      frameBorder: 'rgba(168,85,247,0.5)',
      eyeColor: '#1a1a1a',
    },

    weiyan: {
      id: 'weiyan',
      bg1: '#2a1a1a', bg2: '#1a0a0a',
      skin1: '#d8b888', skin2: '#b89868',
      armor: '#4a3a2a',
      hairColor: '#0a0a0a',
      hair: `<ellipse cx="40" cy="24" rx="16" ry="12" fill="#0a0a0a"/>`,
      headpiece: `<path d="M28 18 L34 12 L40 16 L46 12 L52 18" stroke="#6a5a4a" stroke-width="2" fill="none"/>`,
      weapon: `<line x1="60" y1="16" x2="66" y2="64" stroke="#8a8a8a" stroke-width="2.5"/>`,
      frameBorder: 'rgba(168,85,247,0.4)',
      eyeColor: '#2a1a1a',
    },

    zhurong: {
      id: 'zhurong',
      bg1: '#3a2a1a', bg2: '#1a1408',
      skin1: '#d8b890', skin2: '#b89870',
      armor: '#8a3a1a',
      hairColor: '#1a1a1a',
      hair: `<ellipse cx="40" cy="22" rx="16" ry="12" fill="#1a1a1a"/>
             <path d="M24 26 Q20 40 26 50" stroke="#1a1a1a" stroke-width="3" fill="none"/>
             <path d="M56 26 Q60 40 54 50" stroke="#1a1a1a" stroke-width="3" fill="none"/>`,
      headpiece: `<path d="M30 16 L40 8 L50 16" fill="#c04020"/>
                  <circle cx="40" cy="12" r="2" fill="#ffd700"/>`,
      weapon: `<line x1="62" y1="20" x2="68" y2="60" stroke="#8a6a4a" stroke-width="2"/>`,
      frameBorder: 'rgba(239,68,68,0.4)',
      eyeColor: '#2a1a0a',
      lipColor: '#c04050',
    },

    menghuo: {
      id: 'menghuo',
      bg1: '#3a2a10', bg2: '#1a1408',
      skin1: '#c8a878', skin2: '#a88858',
      armor: '#5a4a2a',
      hairColor: '#0a0a0a',
      hair: `<ellipse cx="40" cy="22" rx="17" ry="14" fill="#0a0a0a"/>`,
      beard: `<path d="M30 44 Q40 62 50 44" stroke="#0a0a0a" stroke-width="3" fill="none"/>`,
      headpiece: `<path d="M26 18 L40 10 L54 18" stroke="#8a6a2a" stroke-width="2.5" fill="none"/>
                  <circle cx="40" cy="14" r="3" fill="#c04020"/>`,
      frameBorder: 'rgba(168,85,247,0.4)',
      eyeColor: '#2a1a0a',
    },

    zhenji: {
      id: 'zhenji',
      bg1: '#1a2040', bg2: '#0a1028',
      skin1: '#f8e0c8', skin2: '#e8c8a8',
      armor: '#2a4a8a',
      hairColor: '#1a1a2a',
      hair: `<ellipse cx="40" cy="22" rx="16" ry="12" fill="#1a1a2a"/>
             <path d="M24 26 Q22 38 26 48" stroke="#1a1a2a" stroke-width="3.5" fill="none"/>
             <path d="M56 26 Q58 38 54 48" stroke="#1a1a2a" stroke-width="3.5" fill="none"/>`,
      headpiece: `<circle cx="36" cy="17" r="2.5" fill="#d4a843"/>
                  <circle cx="44" cy="17" r="2.5" fill="#d4a843"/>
                  <path d="M36 17 Q40 12 44 17" stroke="#d4a843" stroke-width="1" fill="none"/>`,
      frameBorder: 'rgba(59,130,246,0.5)',
      eyeColor: '#1a1a3a',
      lipColor: '#c04060',
    },
  },
};

if (typeof window !== 'undefined') window.Portraits = Portraits;

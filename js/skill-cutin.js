// ═══════════════════════════════════════════════════════════════
// 三国·天命 — Hero Skill Cut-In Animation System
// Dynasty Warriors (三国无双) style character VFX for 13 heroes
// Full-screen SVG overlay with per-hero cinematic animations
// ═══════════════════════════════════════════════════════════════

const SkillCutIn = {
  overlay: null,
  _svgNS: 'http://www.w3.org/2000/svg',
  _active: false,

  // Hero-specific color palettes
  _palettes: {
    guanyu:       { primary: '#22c55e', secondary: '#d4a843', accent: '#0f5132', bg: 'rgba(15,81,50,0.6)' },
    zhangfei:     { primary: '#ef4444', secondary: '#ff6b00', accent: '#7f1d1d', bg: 'rgba(127,29,29,0.6)' },
    zhaoyun:      { primary: '#60a5fa', secondary: '#c0c0c0', accent: '#1e3a5f', bg: 'rgba(30,58,95,0.6)' },
    zhugeLiang:   { primary: '#a855f7', secondary: '#d4a843', accent: '#4c1d95', bg: 'rgba(76,29,149,0.6)' },
    lvbu:         { primary: '#dc2626', secondary: '#1a1a1a', accent: '#450a0a', bg: 'rgba(69,10,10,0.8)' },
    caocao:       { primary: '#d4a843', secondary: '#3b82f6', accent: '#92400e', bg: 'rgba(146,64,14,0.6)' },
    huangzhong:   { primary: '#f59e0b', secondary: '#ffffff', accent: '#78350f', bg: 'rgba(120,53,15,0.5)' },
    machao:       { primary: '#c0c0c0', secondary: '#f59e0b', accent: '#44403c', bg: 'rgba(68,64,60,0.6)' },
    diaochan:     { primary: '#ec4899', secondary: '#c084fc', accent: '#831843', bg: 'rgba(131,24,67,0.5)' },
    zhouyu:       { primary: '#ff6b00', secondary: '#dc2626', accent: '#7c2d12', bg: 'rgba(124,45,18,0.7)' },
    simayi:       { primary: '#38bdf8', secondary: '#1e293b', accent: '#0c4a6e', bg: 'rgba(12,74,110,0.6)' },
    liubei:       { primary: '#d4a843', secondary: '#22c55e', accent: '#854d0e', bg: 'rgba(133,77,14,0.5)' },
    sunshangxiang:{ primary: '#ef4444', secondary: '#f59e0b', accent: '#7f1d1d', bg: 'rgba(127,29,29,0.5)' },
  },

  // Supported hero IDs for cut-in animations
  _heroes: ['guanyu','zhangfei','zhaoyun','zhugeLiang','lvbu','caocao',
            'huangzhong','machao','diaochan','zhouyu','simayi','liubei','sunshangxiang'],

  // ═══ INIT ═══
  init() {
    const wrap = document.getElementById('battle-canvas-wrap');
    if (!wrap) return;
    let ov = document.getElementById('skill-cutin-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'skill-cutin-overlay';
      ov.style.cssText = 'position:absolute;inset:0;z-index:100;pointer-events:none;overflow:hidden;border-radius:16px;display:none;';
      wrap.appendChild(ov);
    }
    this.overlay = ov;
  },

  // ═══ CHECK IF HERO HAS CUT-IN ═══
  has(heroId) {
    return this._heroes.indexOf(heroId) !== -1;
  },

  // ═══ PLAY CUT-IN ═══
  play(heroId, skillName, onComplete) {
    if (this._active) { if (onComplete) onComplete(); return; }
    if (!this.overlay) this.init();
    if (!this.overlay) { if (onComplete) onComplete(); return; }

    this._active = true;
    const ov = this.overlay;
    ov.innerHTML = '';
    ov.style.display = 'block';

    const w = ov.clientWidth || 360;
    const h = ov.clientHeight || 300;
    const pal = this._palettes[heroId] || { primary:'#d4a843', secondary:'#fff', accent:'#333', bg:'rgba(0,0,0,0.6)' };

    // Create main SVG
    const svg = document.createElementNS(this._svgNS, 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';

    // Inject CSS animations as <style>
    const style = document.createElementNS(this._svgNS, 'style');
    style.textContent = this._buildCSS(heroId, w, h, pal);
    svg.appendChild(style);

    // Defs (gradients, filters, clip paths)
    const defs = this._buildDefs(heroId, w, h, pal);
    svg.appendChild(defs);

    // Background dim
    const bgRect = document.createElementNS(this._svgNS, 'rect');
    bgRect.setAttribute('width', w);
    bgRect.setAttribute('height', h);
    bgRect.setAttribute('fill', pal.bg);
    bgRect.classList.add('ci-bg');
    svg.appendChild(bgRect);

    // Build hero-specific animation
    const builder = this['_' + heroId];
    if (builder) {
      builder.call(this, svg, w, h, pal);
    }

    // Skill name text
    this._addSkillName(svg, w, h, skillName, pal);

    // Portrait
    this._addPortrait(svg, w, h, heroId, pal);

    ov.appendChild(svg);

    // Screen shake for powerful skills
    if (['lvbu','zhangfei','guanyu','zhaoyun'].indexOf(heroId) !== -1) {
      this._shakeScreen();
    }

    // Auto-cleanup
    const duration = heroId === 'lvbu' ? 2200 : 1800;
    setTimeout(() => {
      ov.style.display = 'none';
      ov.innerHTML = '';
      this._active = false;
      if (onComplete) onComplete();
    }, duration);
  },

  // ═══ SCREEN SHAKE ═══
  _shakeScreen() {
    const wrap = document.getElementById('battle-canvas-wrap');
    if (!wrap) return;
    wrap.style.animation = 'none';
    wrap.offsetHeight;
    wrap.style.animation = 'vfx-shake-heavy 0.4s ease-out';
    setTimeout(() => { wrap.style.animation = ''; }, 450);
  },

  // ═══ ADD PORTRAIT ═══
  _addPortrait(svg, w, h, heroId, pal) {
    const size = Math.min(180, Math.min(w, h) * 0.5);
    let portraitSVG = '';
    if (typeof Portraits !== 'undefined' && Portraits.get) {
      portraitSVG = Portraits.get(heroId, size);
    }
    if (!portraitSVG) {
      // Fallback: colored circle with name character
      const hero = (typeof HEROES !== 'undefined') ? HEROES[heroId] : null;
      const ch = hero ? (hero.name || '?').charAt(0) : '?';
      portraitSVG = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size*0.42}" fill="${pal.primary}"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" font-size="${size*0.35}" font-weight="900" fill="#fff" font-family="'STKaiti','KaiTi','楷体',serif">${ch}</text>
      </svg>`;
    }

    const fo = document.createElementNS(this._svgNS, 'foreignObject');
    // Position based on hero animation style
    const posMap = {
      guanyu: { x: -size, y: h/2 - size/2, cls: 'ci-portrait-left' },
      zhangfei: { x: w/2 - size/2, y: h + size, cls: 'ci-portrait-bottom' },
      zhaoyun: { x: -size*2, y: h/2 - size/2, cls: 'ci-portrait-charge' },
      zhugeLiang: { x: w/2 - size/2, y: h/2 - size/2, cls: 'ci-portrait-center' },
      lvbu: { x: w/2 - size/2, y: -size*2, cls: 'ci-portrait-slam' },
      caocao: { x: w + size, y: h/2 - size/2, cls: 'ci-portrait-right' },
      huangzhong: { x: -size, y: h/2 - size/2, cls: 'ci-portrait-left' },
      machao: { x: -size*2, y: h/2 - size/2, cls: 'ci-portrait-charge' },
      diaochan: { x: w/2 - size/2, y: h/2 - size/2, cls: 'ci-portrait-center' },
      zhouyu: { x: -size, y: h/2 - size/2, cls: 'ci-portrait-left' },
      simayi: { x: w/2 - size/2, y: h/2 - size/2, cls: 'ci-portrait-center' },
      liubei: { x: w/2 - size/2, y: h/2 - size/2, cls: 'ci-portrait-center' },
      sunshangxiang: { x: -size, y: h/2 - size/2, cls: 'ci-portrait-left' },
    };
    const pos = posMap[heroId] || { x: 0, y: h/2 - size/2, cls: 'ci-portrait-left' };
    fo.setAttribute('x', pos.x);
    fo.setAttribute('y', pos.y);
    fo.setAttribute('width', size);
    fo.setAttribute('height', size);
    fo.classList.add(pos.cls);
    const div = document.createElement('div');
    div.innerHTML = portraitSVG;
    div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 20px ' + pal.primary + ');';
    fo.appendChild(div);
    svg.appendChild(fo);
  },

  // ═══ ADD SKILL NAME ═══
  _addSkillName(svg, w, h, skillName, pal) {
    const g = document.createElementNS(this._svgNS, 'g');
    g.classList.add('ci-skill-name');

    // Background slash bar
    const bar = document.createElementNS(this._svgNS, 'polygon');
    const barY = h * 0.15;
    const barH = 36;
    bar.setAttribute('points',
      `${w*0.1},${barY} ${w*0.95},${barY-4} ${w*0.93},${barY+barH} ${w*0.08},${barY+barH+4}`);
    bar.setAttribute('fill', 'rgba(0,0,0,0.7)');
    bar.setAttribute('stroke', pal.primary);
    bar.setAttribute('stroke-width', '1.5');
    g.appendChild(bar);

    // Skill name text
    const t = document.createElementNS(this._svgNS, 'text');
    t.setAttribute('x', w * 0.5);
    t.setAttribute('y', barY + barH/2 + 2);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('font-size', Math.min(28, w * 0.07));
    t.setAttribute('font-weight', '900');
    t.setAttribute('fill', pal.primary);
    t.setAttribute('stroke', '#000');
    t.setAttribute('stroke-width', '1');
    t.setAttribute('font-family', '"STKaiti","KaiTi","楷体",serif');
    t.setAttribute('letter-spacing', '6');
    t.textContent = '【' + (skillName || '天命') + '】';
    g.appendChild(t);

    svg.appendChild(g);
  },

  // ═══ SHARED DEFS ═══
  _buildDefs(heroId, w, h, pal) {
    const defs = document.createElementNS(this._svgNS, 'defs');

    // Glow filter
    const glow = document.createElementNS(this._svgNS, 'filter');
    glow.id = 'ci-glow';
    glow.setAttribute('x', '-50%'); glow.setAttribute('y', '-50%');
    glow.setAttribute('width', '200%'); glow.setAttribute('height', '200%');
    const blur = document.createElementNS(this._svgNS, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '6'); blur.setAttribute('result', 'g');
    glow.appendChild(blur);
    const merge = document.createElementNS(this._svgNS, 'feMerge');
    ['g', 'SourceGraphic'].forEach(inp => {
      const mn = document.createElementNS(this._svgNS, 'feMergeNode');
      mn.setAttribute('in', inp); merge.appendChild(mn);
    });
    glow.appendChild(merge);
    defs.appendChild(glow);

    // Soft glow filter
    const softGlow = document.createElementNS(this._svgNS, 'filter');
    softGlow.id = 'ci-soft-glow';
    softGlow.setAttribute('x', '-100%'); softGlow.setAttribute('y', '-100%');
    softGlow.setAttribute('width', '300%'); softGlow.setAttribute('height', '300%');
    const sblur = document.createElementNS(this._svgNS, 'feGaussianBlur');
    sblur.setAttribute('stdDeviation', '12'); sblur.setAttribute('result', 'g');
    softGlow.appendChild(sblur);
    const smerge = document.createElementNS(this._svgNS, 'feMerge');
    ['g', 'SourceGraphic'].forEach(inp => {
      const mn = document.createElementNS(this._svgNS, 'feMergeNode');
      mn.setAttribute('in', inp); smerge.appendChild(mn);
    });
    softGlow.appendChild(smerge);
    defs.appendChild(softGlow);

    // Primary gradient
    const grad = document.createElementNS(this._svgNS, 'linearGradient');
    grad.id = 'ci-grad-primary';
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '1'); grad.setAttribute('y2', '1');
    const s1 = document.createElementNS(this._svgNS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', pal.primary);
    const s2 = document.createElementNS(this._svgNS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', pal.secondary);
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);

    return defs;
  },

  // ═══ CSS KEYFRAMES BUILDER ═══
  _buildCSS(heroId, w, h, pal) {
    const size = Math.min(180, Math.min(w, h) * 0.5);
    return `
      /* ── Background ── */
      .ci-bg {
        animation: ci-bg-fade ${heroId === 'lvbu' ? '2.2s' : '1.8s'} ease-out forwards;
      }
      @keyframes ci-bg-fade {
        0% { opacity:0; }
        8% { opacity:1; }
        75% { opacity:1; }
        100% { opacity:0; }
      }

      /* ── Skill name bar ── */
      .ci-skill-name {
        animation: ci-name-anim 1.8s ease-out forwards;
      }
      @keyframes ci-name-anim {
        0% { opacity:0; transform:translateX(-40px); }
        15% { opacity:1; transform:translateX(0); }
        70% { opacity:1; }
        100% { opacity:0; }
      }

      /* ── Portrait positions ── */
      .ci-portrait-left {
        animation: ci-slide-left 1.8s cubic-bezier(0.22,1,0.36,1) forwards;
      }
      @keyframes ci-slide-left {
        0% { transform:translateX(0); opacity:0.5; }
        12% { transform:translateX(${size + w*0.08}px); opacity:1; }
        70% { transform:translateX(${size + w*0.08}px); opacity:1; }
        100% { transform:translateX(${size + w*0.08}px); opacity:0; }
      }

      .ci-portrait-right {
        animation: ci-slide-right 1.8s cubic-bezier(0.22,1,0.36,1) forwards;
      }
      @keyframes ci-slide-right {
        0% { transform:translateX(0); opacity:0.5; }
        12% { transform:translateX(${-(size + w*0.08)}px); opacity:1; }
        70% { transform:translateX(${-(size + w*0.08)}px); opacity:1; }
        100% { transform:translateX(${-(size + w*0.08)}px); opacity:0; }
      }

      .ci-portrait-bottom {
        animation: ci-slam-up 1.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
      }
      @keyframes ci-slam-up {
        0% { transform:translateY(0) scale(0.3); opacity:0; }
        15% { transform:translateY(${-(h*0.5 + size)}px) scale(1.1); opacity:1; }
        25% { transform:translateY(${-(h*0.5 + size)}px) scale(1); }
        70% { transform:translateY(${-(h*0.5 + size)}px) scale(1); opacity:1; }
        100% { transform:translateY(${-(h*0.5 + size)}px) scale(1); opacity:0; }
      }

      .ci-portrait-charge {
        animation: ci-charge 1.8s cubic-bezier(0.16,1,0.3,1) forwards;
      }
      @keyframes ci-charge {
        0% { transform:translateX(0); opacity:0; }
        5% { opacity:1; }
        50% { transform:translateX(${w + size*2}px); opacity:1; }
        51% { opacity:0; }
        100% { opacity:0; }
      }

      .ci-portrait-center {
        animation: ci-center-pop 1.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
      }
      @keyframes ci-center-pop {
        0% { transform:scale(0); opacity:0; }
        15% { transform:scale(1.15); opacity:1; }
        25% { transform:scale(1); }
        70% { opacity:1; }
        100% { opacity:0; }
      }

      .ci-portrait-slam {
        animation: ci-slam-down 1.8s cubic-bezier(0.22,1,0.36,1) forwards;
      }
      @keyframes ci-slam-down {
        0% { transform:translateY(0); opacity:0; }
        10% { transform:translateY(${h*0.5 + size}px); opacity:1; }
        12% { transform:translateY(${h*0.5 + size - 6}px); }
        15% { transform:translateY(${h*0.5 + size}px); }
        70% { transform:translateY(${h*0.5 + size}px); opacity:1; }
        100% { transform:translateY(${h*0.5 + size}px); opacity:0; }
      }

      /* ── Blade sweep (stroke-dashoffset animation) ── */
      .ci-blade-arc {
        stroke-dasharray: 1200;
        stroke-dashoffset: 1200;
        animation: ci-blade-draw 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s forwards;
      }
      @keyframes ci-blade-draw {
        0% { stroke-dashoffset:1200; opacity:1; }
        70% { stroke-dashoffset:0; opacity:1; }
        100% { stroke-dashoffset:0; opacity:0.3; }
      }

      /* ── Shockwave rings ── */
      .ci-ring { animation: ci-ring-expand 0.7s ease-out forwards; }
      .ci-ring-d1 { animation-delay: 0.1s; }
      .ci-ring-d2 { animation-delay: 0.25s; }
      .ci-ring-d3 { animation-delay: 0.4s; }
      @keyframes ci-ring-expand {
        0% { r:5; opacity:0.9; stroke-width:5; }
        100% { r:${Math.max(w,h)*0.5}; opacity:0; stroke-width:0.5; }
      }

      /* ── Speed lines ── */
      .ci-speed-line {
        stroke-dasharray: 300;
        stroke-dashoffset: 300;
        animation: ci-speed-draw 0.4s ease-out forwards;
      }
      @keyframes ci-speed-draw {
        0% { stroke-dashoffset:300; opacity:0.8; }
        60% { stroke-dashoffset:0; opacity:0.6; }
        100% { stroke-dashoffset:0; opacity:0; }
      }

      /* ── Afterimage ── */
      .ci-afterimage {
        animation: ci-afterfade 1.2s ease-out forwards;
      }
      @keyframes ci-afterfade {
        0% { opacity: var(--ai-opacity, 0.5); }
        100% { opacity: 0; }
      }

      /* ── Flash overlay ── */
      .ci-flash {
        animation: ci-flash-anim 0.3s ease-out forwards;
      }
      @keyframes ci-flash-anim {
        0% { opacity:0.7; }
        100% { opacity:0; }
      }

      /* ── Trigram rotate ── */
      .ci-trigram-ring {
        animation: ci-trigram-spin 2s linear forwards;
        transform-origin: ${w/2}px ${h/2}px;
      }
      @keyframes ci-trigram-spin {
        0% { transform:rotate(0deg) scale(0.5); opacity:0; }
        20% { transform:rotate(90deg) scale(1); opacity:1; }
        80% { transform:rotate(630deg) scale(1); opacity:1; }
        100% { transform:rotate(720deg) scale(1.2); opacity:0; }
      }

      /* ── Fire wave ── */
      .ci-fire-wave {
        animation: ci-fire-sweep 1s ease-out forwards;
      }
      @keyframes ci-fire-sweep {
        0% { transform:translateX(${-w}px); opacity:1; }
        60% { transform:translateX(0); opacity:1; }
        100% { transform:translateX(${w*0.2}px); opacity:0; }
      }

      /* ── Petal float ── */
      .ci-petal {
        animation: ci-petal-drift var(--petal-dur, 2s) ease-in-out forwards;
      }
      @keyframes ci-petal-drift {
        0% { transform:translate(0,0) rotate(0deg) scale(0.5); opacity:0; }
        20% { opacity:0.8; transform:translate(var(--px1,20px), var(--py1,-15px)) rotate(90deg) scale(1); }
        60% { opacity:0.6; transform:translate(var(--px2,50px), var(--py2,20px)) rotate(200deg) scale(0.9); }
        100% { opacity:0; transform:translate(var(--px3,80px), var(--py3,60px)) rotate(360deg) scale(0.3); }
      }

      /* ── Arrow fly ── */
      .ci-arrow-path {
        stroke-dasharray: ${w + 100};
        stroke-dashoffset: ${w + 100};
        animation: ci-arrow-fly 0.5s ease-in forwards;
      }
      @keyframes ci-arrow-fly {
        0% { stroke-dashoffset:${w+100}; opacity:1; }
        80% { stroke-dashoffset:0; opacity:1; }
        100% { stroke-dashoffset:0; opacity:0.6; }
      }

      /* ── Impact spark ── */
      .ci-spark {
        animation: ci-spark-pop 0.5s ease-out forwards;
      }
      @keyframes ci-spark-pop {
        0% { transform:scale(0); opacity:1; }
        40% { transform:scale(1.5); opacity:0.8; }
        100% { transform:scale(2); opacity:0; }
      }

      /* ── Lightning crack ── */
      .ci-lightning {
        stroke-dasharray: 500;
        stroke-dashoffset: 500;
        animation: ci-lightning-draw 0.25s ease-out forwards;
      }
      @keyframes ci-lightning-draw {
        0% { stroke-dashoffset:500; opacity:1; }
        60% { stroke-dashoffset:0; opacity:1; }
        100% { stroke-dashoffset:0; opacity:0.2; }
      }

      /* ── Dragon silhouette ── */
      .ci-dragon {
        stroke-dasharray: 2000;
        stroke-dashoffset: 2000;
        animation: ci-dragon-draw 1s ease-out 0.3s forwards;
      }
      @keyframes ci-dragon-draw {
        0% { stroke-dashoffset:2000; opacity:0.6; }
        60% { stroke-dashoffset:0; opacity:0.8; }
        100% { stroke-dashoffset:0; opacity:0; }
      }

      /* ── Ground crack ── */
      .ci-crack {
        stroke-dasharray: 400;
        stroke-dashoffset: 400;
        animation: ci-crack-spread 0.3s ease-out forwards;
      }
      @keyframes ci-crack-spread {
        0% { stroke-dashoffset:400; }
        100% { stroke-dashoffset:0; }
      }

      /* ── Halberd X sweep ── */
      .ci-halberd {
        stroke-dasharray: 1500;
        stroke-dashoffset: 1500;
        animation: ci-halberd-sweep 0.5s cubic-bezier(0.22,1,0.36,1) 0.12s forwards;
      }
      @keyframes ci-halberd-sweep {
        0% { stroke-dashoffset:1500; opacity:1; }
        70% { stroke-dashoffset:0; opacity:1; }
        100% { stroke-dashoffset:0; opacity:0.4; }
      }

      /* ── Ice crystal ── */
      .ci-ice {
        animation: ci-ice-form 0.8s ease-out forwards;
      }
      @keyframes ci-ice-form {
        0% { transform:scale(0) rotate(-30deg); opacity:0; }
        40% { transform:scale(1.1) rotate(5deg); opacity:0.9; }
        60% { transform:scale(1) rotate(0deg); opacity:0.8; }
        100% { transform:scale(1) rotate(0deg); opacity:0; }
      }

      /* ── Eyes glow ── */
      .ci-eyes {
        animation: ci-eyes-glow 1.8s ease-in-out forwards;
      }
      @keyframes ci-eyes-glow {
        0% { opacity:0; }
        20% { opacity:0; }
        35% { opacity:1; }
        70% { opacity:1; }
        100% { opacity:0; }
      }

      /* ── Gold ring buff ── */
      .ci-gold-ring {
        animation: ci-gold-expand 0.8s ease-out forwards;
      }
      @keyframes ci-gold-expand {
        0% { r:10; opacity:0.8; stroke-width:4; }
        100% { r:${Math.max(w,h)*0.45}; opacity:0; stroke-width:0.5; }
      }

      /* ── Horse gallop ── */
      .ci-horse {
        animation: ci-horse-run 1.2s linear forwards;
      }
      @keyframes ci-horse-run {
        0% { transform:translateX(${-w*0.3}px) translateY(0); }
        25% { transform:translateX(${w*0.05}px) translateY(-8px); }
        50% { transform:translateX(${w*0.4}px) translateY(0); }
        75% { transform:translateX(${w*0.7}px) translateY(-8px); }
        100% { transform:translateX(${w*1.2}px) translateY(0); opacity:0; }
      }

      /* ── Ember rise ── */
      .ci-ember {
        animation: ci-ember-rise var(--ember-dur, 1.2s) ease-out forwards;
      }
      @keyframes ci-ember-rise {
        0% { transform:translateY(0) scale(1); opacity:0.9; }
        100% { transform:translateY(${-h*0.8}px) scale(0); opacity:0; }
      }

      /* ── Moon glow ── */
      .ci-moon {
        animation: ci-moon-appear 1.8s ease-out forwards;
      }
      @keyframes ci-moon-appear {
        0% { opacity:0; transform:scale(0.5); }
        20% { opacity:1; transform:scale(1); }
        80% { opacity:0.9; }
        100% { opacity:0; transform:scale(1.1); }
      }

      /* ── Spiral pulse ── */
      .ci-spiral {
        animation: ci-spiral-pulse 1.8s ease-in-out forwards;
        transform-origin: ${w/2}px ${h/2}px;
      }
      @keyframes ci-spiral-pulse {
        0% { transform:rotate(0deg) scale(0.3); opacity:0; }
        25% { transform:rotate(180deg) scale(1); opacity:0.7; }
        75% { transform:rotate(540deg) scale(1); opacity:0.5; }
        100% { transform:rotate(720deg) scale(1.3); opacity:0; }
      }

      /* ── Red screen (Lu Bu) ── */
      .ci-red-screen {
        animation: ci-red-flash 0.6s ease-out 0.15s forwards;
      }
      @keyframes ci-red-flash {
        0% { opacity:0; }
        30% { opacity:0.6; }
        60% { opacity:0.3; fill:#000; }
        100% { opacity:0; }
      }

      /* ── Healing wave ── */
      .ci-heal-wave {
        animation: ci-heal-expand 1.2s ease-out forwards;
      }
      @keyframes ci-heal-expand {
        0% { r:10; opacity:0.6; stroke-width:6; }
        100% { r:${Math.max(w,h)*0.5}; opacity:0; stroke-width:1; }
      }

      /* ── Ship silhouette ── */
      .ci-ship {
        animation: ci-ship-burn 1.5s ease-out forwards;
      }
      @keyframes ci-ship-burn {
        0% { opacity:0; transform:translateY(0); }
        20% { opacity:0.7; }
        60% { opacity:0.6; transform:translateY(-10px); }
        100% { opacity:0; transform:translateY(-30px); }
      }

      /* ── Crossbow bolt ── */
      .ci-bolt {
        animation: ci-bolt-fly var(--bolt-dur, 0.3s) ease-in var(--bolt-delay, 0s) forwards;
      }
      @keyframes ci-bolt-fly {
        0% { transform:translateX(0); opacity:1; }
        80% { opacity:1; }
        100% { transform:translateX(${w*0.85}px); opacity:0.3; }
      }

      /* ── Golden dragon coil ── */
      .ci-dragon-coil {
        stroke-dasharray: 3000;
        stroke-dashoffset: 3000;
        animation: ci-dragon-coil-draw 1.4s ease-out 0.15s forwards;
      }
      @keyframes ci-dragon-coil-draw {
        0% { stroke-dashoffset:3000; opacity:0.7; }
        60% { stroke-dashoffset:0; opacity:0.9; }
        100% { stroke-dashoffset:0; opacity:0; }
      }

      /* ── Crown symbol ── */
      .ci-crown {
        animation: ci-crown-appear 1.5s ease-out 0.3s forwards;
      }
      @keyframes ci-crown-appear {
        0% { transform:scale(0); opacity:0; }
        30% { transform:scale(1.2); opacity:1; }
        50% { transform:scale(1); }
        80% { opacity:1; }
        100% { opacity:0; transform:scale(1.1); }
      }

      /* ── Target bullseye ── */
      .ci-target {
        animation: ci-target-appear 0.6s ease-out 0.5s forwards;
      }
      @keyframes ci-target-appear {
        0% { transform:scale(2); opacity:0; }
        40% { transform:scale(1); opacity:0.8; }
        100% { transform:scale(0.8); opacity:0; }
      }

      /* ── Frost border ── */
      .ci-frost-border {
        animation: ci-frost-form 1.5s ease-out forwards;
      }
      @keyframes ci-frost-form {
        0% { opacity:0; stroke-dashoffset:${(w+h)*2}; }
        40% { opacity:0.7; stroke-dashoffset:0; }
        80% { opacity:0.5; }
        100% { opacity:0; }
      }

      /* ── Shadow tendril ── */
      .ci-tendril {
        stroke-dasharray: 600;
        stroke-dashoffset: 600;
        animation: ci-tendril-spread 1s ease-out forwards;
      }
      @keyframes ci-tendril-spread {
        0% { stroke-dashoffset:600; opacity:0.6; }
        50% { stroke-dashoffset:0; opacity:0.5; }
        100% { stroke-dashoffset:0; opacity:0; }
      }
    `;
  },

  // ══════════════════════════════════════════
  //  HERO ANIMATION BUILDERS
  // ══════════════════════════════════════════

  // ── 关羽: 青龙偃月 (Green Dragon Blade) ──
  _guanyu(svg, w, h, pal) {
    // Huge crescent blade sweep arc
    const arc = document.createElementNS(this._svgNS, 'path');
    const cy = h * 0.55;
    arc.setAttribute('d',
      `M ${w*0.05},${cy+30} Q ${w*0.25},${cy-h*0.4} ${w*0.5},${cy-h*0.3} T ${w*0.95},${cy+20}`);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', 'url(#ci-grad-primary)');
    arc.setAttribute('stroke-width', '8');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('filter', 'url(#ci-glow)');
    arc.classList.add('ci-blade-arc');
    svg.appendChild(arc);

    // Second thinner arc (echo)
    const arc2 = document.createElementNS(this._svgNS, 'path');
    arc2.setAttribute('d',
      `M ${w*0.08},${cy+45} Q ${w*0.3},${cy-h*0.35} ${w*0.55},${cy-h*0.25} T ${w*0.92},${cy+35}`);
    arc2.setAttribute('fill', 'none');
    arc2.setAttribute('stroke', pal.primary);
    arc2.setAttribute('stroke-width', '3');
    arc2.setAttribute('opacity', '0.5');
    arc2.setAttribute('stroke-linecap', 'round');
    arc2.classList.add('ci-blade-arc');
    arc2.style.animationDelay = '0.1s';
    svg.appendChild(arc2);

    // Green dragon energy silhouette (simplified SVG dragon path)
    const dragon = document.createElementNS(this._svgNS, 'path');
    dragon.setAttribute('d',
      `M ${w*0.15},${h*0.7} C ${w*0.25},${h*0.3} ${w*0.35},${h*0.2} ${w*0.45},${h*0.25} ` +
      `S ${w*0.55},${h*0.15} ${w*0.6},${h*0.2} ` +
      `C ${w*0.65},${h*0.25} ${w*0.7},${h*0.18} ${w*0.75},${h*0.22} ` +
      `Q ${w*0.82},${h*0.28} ${w*0.88},${h*0.2} ` +
      `L ${w*0.92},${h*0.15}`);
    dragon.setAttribute('fill', 'none');
    dragon.setAttribute('stroke', '#22c55e');
    dragon.setAttribute('stroke-width', '4');
    dragon.setAttribute('opacity', '0.6');
    dragon.setAttribute('filter', 'url(#ci-soft-glow)');
    dragon.classList.add('ci-dragon');
    svg.appendChild(dragon);

    // Screen flash green
    const flash = document.createElementNS(this._svgNS, 'rect');
    flash.setAttribute('width', w); flash.setAttribute('height', h);
    flash.setAttribute('fill', '#22c55e');
    flash.classList.add('ci-flash');
    svg.appendChild(flash);
  },

  // ── 张飞: 怒吼 (Thunderous Roar) ──
  _zhangfei(svg, w, h, pal) {
    const cx = w / 2, cy = h / 2;

    // Shockwave rings (3 staggered)
    for (let i = 0; i < 3; i++) {
      const ring = document.createElementNS(this._svgNS, 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', '5');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', pal.primary);
      ring.setAttribute('stroke-width', '4');
      ring.classList.add('ci-ring', 'ci-ring-d' + (i + 1));
      svg.appendChild(ring);
    }

    // Lightning/crack lines radiating outward
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const line = document.createElementNS(this._svgNS, 'path');
      let d = `M ${cx} ${cy}`;
      let px = cx, py = cy;
      for (let j = 0; j < 5; j++) {
        const dist = (j + 1) * (Math.max(w, h) * 0.1);
        px = cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 20;
        py = cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 20;
        d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      line.setAttribute('d', d);
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', '#fff44f');
      line.setAttribute('stroke-width', '2.5');
      line.setAttribute('stroke-linecap', 'round');
      line.classList.add('ci-lightning');
      line.style.animationDelay = (i * 0.04) + 's';
      svg.appendChild(line);
    }

    // Red energy aura (large circle behind portrait)
    const aura = document.createElementNS(this._svgNS, 'circle');
    aura.setAttribute('cx', cx);
    aura.setAttribute('cy', cy);
    aura.setAttribute('r', '60');
    aura.setAttribute('fill', pal.primary);
    aura.setAttribute('opacity', '0.3');
    aura.setAttribute('filter', 'url(#ci-soft-glow)');
    aura.classList.add('ci-ring');
    svg.appendChild(aura);

    // Red screen flash
    const flash = document.createElementNS(this._svgNS, 'rect');
    flash.setAttribute('width', w); flash.setAttribute('height', h);
    flash.setAttribute('fill', '#ff4444');
    flash.classList.add('ci-flash');
    svg.appendChild(flash);
  },

  // ── 赵云: 七进七出 (Seven In Seven Out) ──
  _zhaoyun(svg, w, h, pal) {
    // Speed lines (diagonal background)
    for (let i = 0; i < 15; i++) {
      const line = document.createElementNS(this._svgNS, 'line');
      const y = Math.random() * h;
      line.setAttribute('x1', w + 20);
      line.setAttribute('y1', y - 30);
      line.setAttribute('x2', -20);
      line.setAttribute('y2', y + 30);
      line.setAttribute('stroke', 'rgba(255,255,255,0.3)');
      line.setAttribute('stroke-width', 1 + Math.random() * 2);
      line.classList.add('ci-speed-line');
      line.style.animationDelay = (Math.random() * 0.3) + 's';
      svg.appendChild(line);
    }

    // 7 afterimage trail copies
    for (let i = 6; i >= 0; i--) {
      const ghost = document.createElementNS(this._svgNS, 'circle');
      const x = -50 + i * (w / 8);
      ghost.setAttribute('cx', x);
      ghost.setAttribute('cy', h / 2);
      ghost.setAttribute('r', '30');
      ghost.setAttribute('fill', pal.primary);
      ghost.setAttribute('opacity', '0');
      ghost.style.setProperty('--ai-opacity', (0.15 + i * 0.05).toString());
      ghost.classList.add('ci-afterimage');
      ghost.style.animationDelay = (0.05 + i * 0.06) + 's';
      ghost.setAttribute('filter', 'url(#ci-soft-glow)');
      svg.appendChild(ghost);
    }

    // Silver spear thrust line
    const spear = document.createElementNS(this._svgNS, 'line');
    spear.setAttribute('x1', -20);
    spear.setAttribute('y1', h * 0.5);
    spear.setAttribute('x2', w + 20);
    spear.setAttribute('y2', h * 0.48);
    spear.setAttribute('stroke', '#c0c0c0');
    spear.setAttribute('stroke-width', '4');
    spear.setAttribute('stroke-linecap', 'round');
    spear.setAttribute('filter', 'url(#ci-glow)');
    spear.classList.add('ci-speed-line');
    spear.style.animationDelay = '0.15s';
    svg.appendChild(spear);

    // Blue energy burst at right endpoint
    const burst = document.createElementNS(this._svgNS, 'circle');
    burst.setAttribute('cx', w * 0.85);
    burst.setAttribute('cy', h * 0.49);
    burst.setAttribute('r', '5');
    burst.setAttribute('fill', 'none');
    burst.setAttribute('stroke', pal.primary);
    burst.setAttribute('stroke-width', '3');
    burst.classList.add('ci-ring', 'ci-ring-d2');
    svg.appendChild(burst);
  },

  // ── 诸葛亮: 八阵图 (Eight Trigrams Formation) ──
  _zhugeLiang(svg, w, h, pal) {
    const cx = w / 2, cy = h / 2;
    const trigrams = ['☰','☱','☲','☳','☴','☵','☶','☷'];

    // Rotating trigram ring
    const g = document.createElementNS(this._svgNS, 'g');
    g.classList.add('ci-trigram-ring');
    const radius = Math.min(w, h) * 0.35;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const tx = cx + Math.cos(angle) * radius;
      const ty = cy + Math.sin(angle) * radius;

      const text = document.createElementNS(this._svgNS, 'text');
      text.setAttribute('x', tx);
      text.setAttribute('y', ty);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', Math.min(24, w * 0.06));
      text.setAttribute('fill', pal.primary);
      text.setAttribute('filter', 'url(#ci-glow)');
      text.textContent = trigrams[i];
      g.appendChild(text);
    }
    svg.appendChild(g);

    // Fire flames from bottom
    for (let i = 0; i < 8; i++) {
      const fx = w * 0.1 + (i / 7) * w * 0.8;
      const flame = document.createElementNS(this._svgNS, 'path');
      const fh = 30 + Math.random() * 40;
      flame.setAttribute('d',
        `M ${fx-8},${h} Q ${fx-4},${h-fh*0.6} ${fx},${h-fh} Q ${fx+4},${h-fh*0.6} ${fx+8},${h} Z`);
      flame.setAttribute('fill', '#ff6b00');
      flame.setAttribute('opacity', '0.6');
      flame.classList.add('ci-ember');
      flame.style.setProperty('--ember-dur', (0.8 + Math.random() * 0.6) + 's');
      flame.style.animationDelay = (Math.random() * 0.3) + 's';
      svg.appendChild(flame);
    }

    // Purple-gold energy dome
    const dome = document.createElementNS(this._svgNS, 'circle');
    dome.setAttribute('cx', cx);
    dome.setAttribute('cy', cy);
    dome.setAttribute('r', '10');
    dome.setAttribute('fill', 'none');
    dome.setAttribute('stroke', pal.primary);
    dome.setAttribute('stroke-width', '3');
    dome.setAttribute('filter', 'url(#ci-soft-glow)');
    dome.classList.add('ci-ring');
    svg.appendChild(dome);

    // Scrolling ancient text
    const ancientChars = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏';
    for (let i = 0; i < 12; i++) {
      const at = document.createElementNS(this._svgNS, 'text');
      at.setAttribute('x', Math.random() * w);
      at.setAttribute('y', Math.random() * h);
      at.setAttribute('font-size', 10 + Math.random() * 8);
      at.setAttribute('fill', pal.secondary);
      at.setAttribute('opacity', '0');
      at.setAttribute('font-family', '"STKaiti","KaiTi","楷体",serif');
      at.textContent = ancientChars.charAt(Math.floor(Math.random() * ancientChars.length));
      at.classList.add('ci-afterimage');
      at.style.setProperty('--ai-opacity', '0.3');
      at.style.animationDelay = (Math.random() * 0.8) + 's';
      svg.appendChild(at);
    }
  },

  // ── 吕布: 无双 (Unrivaled) ──
  _lvbu(svg, w, h, pal) {
    const cx = w / 2, cy = h * 0.55;

    // Ground crack lines spreading from landing point
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const crack = document.createElementNS(this._svgNS, 'path');
      let d = `M ${cx} ${cy}`;
      let px = cx, py = cy;
      for (let j = 0; j < 4; j++) {
        const dist = (j + 1) * 35;
        px = cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 25;
        py = cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 15;
        d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      crack.setAttribute('d', d);
      crack.setAttribute('fill', 'none');
      crack.setAttribute('stroke', '#dc2626');
      crack.setAttribute('stroke-width', '2');
      crack.classList.add('ci-crack');
      crack.style.animationDelay = (0.1 + i * 0.03) + 's';
      svg.appendChild(crack);
    }

    // Halberd X pattern (two crossing arcs)
    const arc1 = document.createElementNS(this._svgNS, 'path');
    arc1.setAttribute('d', `M ${w*0.05},${h*0.1} L ${w*0.95},${h*0.9}`);
    arc1.setAttribute('fill', 'none');
    arc1.setAttribute('stroke', '#dc2626');
    arc1.setAttribute('stroke-width', '6');
    arc1.setAttribute('stroke-linecap', 'round');
    arc1.setAttribute('filter', 'url(#ci-glow)');
    arc1.classList.add('ci-halberd');
    svg.appendChild(arc1);

    const arc2 = document.createElementNS(this._svgNS, 'path');
    arc2.setAttribute('d', `M ${w*0.95},${h*0.1} L ${w*0.05},${h*0.9}`);
    arc2.setAttribute('fill', 'none');
    arc2.setAttribute('stroke', '#dc2626');
    arc2.setAttribute('stroke-width', '6');
    arc2.setAttribute('stroke-linecap', 'round');
    arc2.setAttribute('filter', 'url(#ci-glow)');
    arc2.classList.add('ci-halberd');
    arc2.style.animationDelay = '0.08s';
    svg.appendChild(arc2);

    // Red-black energy explosion (large radial)
    const explosion = document.createElementNS(this._svgNS, 'circle');
    explosion.setAttribute('cx', cx);
    explosion.setAttribute('cy', cy);
    explosion.setAttribute('r', '5');
    explosion.setAttribute('fill', 'none');
    explosion.setAttribute('stroke', '#ff0000');
    explosion.setAttribute('stroke-width', '6');
    explosion.classList.add('ci-ring', 'ci-ring-d1');
    svg.appendChild(explosion);

    // Dark explosion ring
    const darkRing = document.createElementNS(this._svgNS, 'circle');
    darkRing.setAttribute('cx', cx);
    darkRing.setAttribute('cy', cy);
    darkRing.setAttribute('r', '5');
    darkRing.setAttribute('fill', 'none');
    darkRing.setAttribute('stroke', '#1a1a1a');
    darkRing.setAttribute('stroke-width', '8');
    darkRing.setAttribute('opacity', '0.7');
    darkRing.classList.add('ci-ring', 'ci-ring-d2');
    svg.appendChild(darkRing);

    // RED screen flash then dark
    const redFlash = document.createElementNS(this._svgNS, 'rect');
    redFlash.setAttribute('width', w); redFlash.setAttribute('height', h);
    redFlash.setAttribute('fill', '#dc2626');
    redFlash.classList.add('ci-red-screen');
    svg.appendChild(redFlash);
  },

  // ── 曹操: 挟天子 (Command the Emperor) ──
  _caocao(svg, w, h, pal) {
    const cx = w / 2, cy = h / 2;

    // Golden dragon silhouette coiling around screen
    const dragon = document.createElementNS(this._svgNS, 'path');
    dragon.setAttribute('d',
      `M ${w*0.8},${h*0.15} ` +
      `C ${w*0.95},${h*0.3} ${w*0.9},${h*0.5} ${w*0.75},${h*0.45} ` +
      `S ${w*0.5},${h*0.6} ${w*0.35},${h*0.5} ` +
      `C ${w*0.2},${h*0.4} ${w*0.1},${h*0.6} ${w*0.2},${h*0.75} ` +
      `S ${w*0.45},${h*0.85} ${w*0.6},${h*0.8} ` +
      `C ${w*0.75},${h*0.75} ${w*0.85},${h*0.85} ${w*0.8},${h*0.95}`);
    dragon.setAttribute('fill', 'none');
    dragon.setAttribute('stroke', '#d4a843');
    dragon.setAttribute('stroke-width', '5');
    dragon.setAttribute('filter', 'url(#ci-glow)');
    dragon.classList.add('ci-dragon-coil');
    svg.appendChild(dragon);

    // Crown/seal SVG symbol at center
    const crown = document.createElementNS(this._svgNS, 'g');
    crown.classList.add('ci-crown');
    crown.setAttribute('transform', `translate(${cx},${cy})`);

    // Imperial seal (simplified: square with character)
    const seal = document.createElementNS(this._svgNS, 'rect');
    seal.setAttribute('x', '-25'); seal.setAttribute('y', '-25');
    seal.setAttribute('width', '50'); seal.setAttribute('height', '50');
    seal.setAttribute('rx', '4');
    seal.setAttribute('fill', 'none');
    seal.setAttribute('stroke', '#d4a843');
    seal.setAttribute('stroke-width', '3');
    seal.setAttribute('filter', 'url(#ci-glow)');
    crown.appendChild(seal);

    const sealText = document.createElementNS(this._svgNS, 'text');
    sealText.setAttribute('text-anchor', 'middle');
    sealText.setAttribute('dominant-baseline', 'central');
    sealText.setAttribute('font-size', '28');
    sealText.setAttribute('font-weight', '900');
    sealText.setAttribute('fill', '#d4a843');
    sealText.setAttribute('font-family', '"STKaiti","KaiTi","楷体",serif');
    sealText.textContent = '帝';
    crown.appendChild(sealText);
    svg.appendChild(crown);

    // Golden buff rings radiating outward
    for (let i = 0; i < 4; i++) {
      const ring = document.createElementNS(this._svgNS, 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', '10');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#d4a843');
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('filter', 'url(#ci-glow)');
      ring.classList.add('ci-gold-ring');
      ring.style.animationDelay = (0.15 + i * 0.2) + 's';
      svg.appendChild(ring);
    }
  },

  // ── 黄忠: 百步穿杨 (Arrow Through Willow) ──
  _huangzhong(svg, w, h, pal) {
    const arrowY = h * 0.5;

    // Arrow SVG: line with arrowhead
    const arrow = document.createElementNS(this._svgNS, 'line');
    arrow.setAttribute('x1', -20);
    arrow.setAttribute('y1', arrowY);
    arrow.setAttribute('x2', w + 20);
    arrow.setAttribute('y2', arrowY - 5);
    arrow.setAttribute('stroke', '#f59e0b');
    arrow.setAttribute('stroke-width', '3');
    arrow.setAttribute('stroke-linecap', 'round');
    arrow.setAttribute('filter', 'url(#ci-glow)');
    arrow.classList.add('ci-arrow-path');
    svg.appendChild(arrow);

    // Arrow trail (slightly behind, wider)
    const trail = document.createElementNS(this._svgNS, 'line');
    trail.setAttribute('x1', -20);
    trail.setAttribute('y1', arrowY + 1);
    trail.setAttribute('x2', w + 20);
    trail.setAttribute('y2', arrowY - 4);
    trail.setAttribute('stroke', 'rgba(245,158,11,0.3)');
    trail.setAttribute('stroke-width', '8');
    trail.classList.add('ci-arrow-path');
    trail.style.animationDelay = '0.03s';
    svg.appendChild(trail);

    // Impact explosion at right side
    const impactX = w * 0.88;
    const spark = document.createElementNS(this._svgNS, 'g');
    spark.setAttribute('transform', `translate(${impactX},${arrowY - 3})`);
    spark.classList.add('ci-spark');
    spark.style.animationDelay = '0.5s';

    // Spark lines radiating from impact
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sl = document.createElementNS(this._svgNS, 'line');
      sl.setAttribute('x1', 0); sl.setAttribute('y1', 0);
      sl.setAttribute('x2', Math.cos(angle) * 20);
      sl.setAttribute('y2', Math.sin(angle) * 20);
      sl.setAttribute('stroke', '#fff');
      sl.setAttribute('stroke-width', '2');
      spark.appendChild(sl);
    }
    svg.appendChild(spark);

    // Bullseye target at impact point
    const target = document.createElementNS(this._svgNS, 'g');
    target.setAttribute('transform', `translate(${impactX},${arrowY - 3})`);
    target.classList.add('ci-target');

    [25, 18, 10].forEach((r, i) => {
      const c = document.createElementNS(this._svgNS, 'circle');
      c.setAttribute('cx', 0); c.setAttribute('cy', 0);
      c.setAttribute('r', r);
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', i === 1 ? '#fff' : '#f59e0b');
      c.setAttribute('stroke-width', '1.5');
      target.appendChild(c);
    });
    // Center dot
    const dot = document.createElementNS(this._svgNS, 'circle');
    dot.setAttribute('cx', 0); dot.setAttribute('cy', 0);
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', '#f59e0b');
    target.appendChild(dot);
    svg.appendChild(target);
  },

  // ── 马超: 西凉铁骑 (Xiliang Iron Cavalry) ──
  _machao(svg, w, h, pal) {
    // Speed lines fill screen
    for (let i = 0; i < 20; i++) {
      const line = document.createElementNS(this._svgNS, 'line');
      const y = Math.random() * h;
      line.setAttribute('x1', w + 30);
      line.setAttribute('y1', y);
      line.setAttribute('x2', -30);
      line.setAttribute('y2', y + (Math.random() - 0.5) * 20);
      line.setAttribute('stroke', 'rgba(255,255,255,' + (0.15 + Math.random() * 0.2) + ')');
      line.setAttribute('stroke-width', 1 + Math.random() * 2.5);
      line.classList.add('ci-speed-line');
      line.style.animationDelay = (Math.random() * 0.4) + 's';
      svg.appendChild(line);
    }

    // Horse galloping silhouette (simplified SVG shape)
    const horse = document.createElementNS(this._svgNS, 'g');
    horse.classList.add('ci-horse');
    const hy = h * 0.65;

    const horseBody = document.createElementNS(this._svgNS, 'path');
    horseBody.setAttribute('d',
      `M 0,${hy} ` +
      `C 5,${hy-25} 15,${hy-35} 30,${hy-30} ` + // head
      `L 35,${hy-40} L 40,${hy-30} ` + // ear
      `C 45,${hy-28} 55,${hy-25} 65,${hy-22} ` + // neck
      `C 75,${hy-20} 85,${hy-18} 90,${hy-15} ` + // body top
      `L 95,${hy+5} L 85,${hy+15} ` + // back leg
      `L 80,${hy+5} L 50,${hy+5} ` + // belly
      `L 45,${hy+15} L 35,${hy+5} ` + // front leg
      `L 20,${hy-5} Z`);
    horseBody.setAttribute('fill', '#44403c');
    horseBody.setAttribute('opacity', '0.6');
    horse.appendChild(horseBody);
    svg.appendChild(horse);

    // Dust cloud particles
    for (let i = 0; i < 10; i++) {
      const dust = document.createElementNS(this._svgNS, 'circle');
      dust.setAttribute('cx', w * 0.2 + Math.random() * w * 0.3);
      dust.setAttribute('cy', h * 0.7 + Math.random() * 20);
      dust.setAttribute('r', 5 + Math.random() * 12);
      dust.setAttribute('fill', 'rgba(168,162,158,0.3)');
      dust.classList.add('ci-afterimage');
      dust.style.setProperty('--ai-opacity', '0.4');
      dust.style.animationDelay = (0.2 + Math.random() * 0.5) + 's';
      svg.appendChild(dust);
    }

    // Spear thrust line
    const spear = document.createElementNS(this._svgNS, 'line');
    spear.setAttribute('x1', w * 0.3);
    spear.setAttribute('y1', h * 0.45);
    spear.setAttribute('x2', w * 1.1);
    spear.setAttribute('y2', h * 0.43);
    spear.setAttribute('stroke', '#c0c0c0');
    spear.setAttribute('stroke-width', '3');
    spear.setAttribute('filter', 'url(#ci-glow)');
    spear.classList.add('ci-speed-line');
    spear.style.animationDelay = '0.1s';
    svg.appendChild(spear);
  },

  // ── 貂蝉: 闭月 (Moon Eclipse) ──
  _diaochan(svg, w, h, pal) {
    const cx = w / 2, cy = h / 2;

    // Crescent moon above
    const moonG = document.createElementNS(this._svgNS, 'g');
    moonG.classList.add('ci-moon');
    moonG.setAttribute('transform', `translate(${cx},${h*0.18})`);

    const moon = document.createElementNS(this._svgNS, 'path');
    moon.setAttribute('d',
      'M 0,-20 A 20,20 0 1,1 0,20 A 14,14 0 1,0 0,-20 Z');
    moon.setAttribute('fill', '#e2e8f0');
    moon.setAttribute('filter', 'url(#ci-soft-glow)');
    moonG.appendChild(moon);
    svg.appendChild(moonG);

    // Flower petals floating across screen
    for (let i = 0; i < 15; i++) {
      const petal = document.createElementNS(this._svgNS, 'ellipse');
      const px = Math.random() * w;
      const py = Math.random() * h;
      petal.setAttribute('cx', px);
      petal.setAttribute('cy', py);
      petal.setAttribute('rx', 4 + Math.random() * 5);
      petal.setAttribute('ry', 2 + Math.random() * 3);
      petal.setAttribute('fill', Math.random() > 0.5 ? '#ec4899' : '#f9a8d4');
      petal.setAttribute('opacity', '0');
      petal.classList.add('ci-petal');
      petal.style.setProperty('--petal-dur', (1.5 + Math.random()) + 's');
      petal.style.setProperty('--px1', (20 + Math.random() * 30) + 'px');
      petal.style.setProperty('--py1', (-15 + Math.random() * 30) + 'px');
      petal.style.setProperty('--px2', (50 + Math.random() * 40) + 'px');
      petal.style.setProperty('--py2', (20 + Math.random() * 40) + 'px');
      petal.style.setProperty('--px3', (80 + Math.random() * 50) + 'px');
      petal.style.setProperty('--py3', (60 + Math.random() * 40) + 'px');
      petal.style.animationDelay = (Math.random() * 0.5) + 's';
      svg.appendChild(petal);
    }

    // Hypnotic spiral rings
    const spiral = document.createElementNS(this._svgNS, 'g');
    spiral.classList.add('ci-spiral');
    for (let i = 0; i < 4; i++) {
      const ring = document.createElementNS(this._svgNS, 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', 30 + i * 25);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', i % 2 === 0 ? '#ec4899' : '#c084fc');
      ring.setAttribute('stroke-width', '1.5');
      ring.setAttribute('opacity', '0.4');
      spiral.appendChild(ring);
    }
    svg.appendChild(spiral);
  },

  // ── 周瑜: 火攻 (Fire Attack) ──
  _zhouyu(svg, w, h, pal) {
    // Fire wave sweeping across screen
    const fireG = document.createElementNS(this._svgNS, 'g');
    fireG.classList.add('ci-fire-wave');

    // Build fire wave shape
    for (let i = 0; i < 12; i++) {
      const flame = document.createElementNS(this._svgNS, 'path');
      const fx = i * (w / 10) - w * 0.1;
      const fh = 40 + Math.random() * (h * 0.5);
      const baseY = h * 0.3 + Math.random() * h * 0.4;
      flame.setAttribute('d',
        `M ${fx-15},${h} L ${fx-8},${baseY} Q ${fx},${baseY-fh} ${fx+8},${baseY} L ${fx+15},${h} Z`);
      flame.setAttribute('fill', Math.random() > 0.5 ? '#ff6b00' : '#dc2626');
      flame.setAttribute('opacity', 0.6 + Math.random() * 0.3);
      fireG.appendChild(flame);
    }
    svg.appendChild(fireG);

    // Ember particles rising
    for (let i = 0; i < 20; i++) {
      const ember = document.createElementNS(this._svgNS, 'circle');
      ember.setAttribute('cx', Math.random() * w);
      ember.setAttribute('cy', h * 0.5 + Math.random() * h * 0.5);
      ember.setAttribute('r', 1 + Math.random() * 3);
      ember.setAttribute('fill', Math.random() > 0.5 ? '#ff6b00' : '#fbbf24');
      ember.classList.add('ci-ember');
      ember.style.setProperty('--ember-dur', (0.8 + Math.random() * 0.8) + 's');
      ember.style.animationDelay = (Math.random() * 0.6) + 's';
      svg.appendChild(ember);
    }

    // Ship silhouettes in flames (3 boats)
    for (let i = 0; i < 3; i++) {
      const shipG = document.createElementNS(this._svgNS, 'g');
      const sx = w * 0.2 + i * w * 0.25;
      const sy = h * 0.65;
      shipG.setAttribute('transform', `translate(${sx},${sy})`);
      shipG.classList.add('ci-ship');
      shipG.style.animationDelay = (0.1 + i * 0.15) + 's';

      // Hull
      const hull = document.createElementNS(this._svgNS, 'path');
      hull.setAttribute('d', 'M -20,0 L -15,-8 L 15,-8 L 20,0 Z');
      hull.setAttribute('fill', '#78350f');
      hull.setAttribute('opacity', '0.7');
      shipG.appendChild(hull);

      // Mast
      const mast = document.createElementNS(this._svgNS, 'line');
      mast.setAttribute('x1', 0); mast.setAttribute('y1', -8);
      mast.setAttribute('x2', 0); mast.setAttribute('y2', -25);
      mast.setAttribute('stroke', '#78350f');
      mast.setAttribute('stroke-width', '2');
      shipG.appendChild(mast);

      // Sail (on fire)
      const sail = document.createElementNS(this._svgNS, 'path');
      sail.setAttribute('d', 'M 0,-25 L 12,-15 L 0,-8 Z');
      sail.setAttribute('fill', '#dc2626');
      sail.setAttribute('opacity', '0.6');
      shipG.appendChild(sail);

      svg.appendChild(shipG);
    }

    // Red-orange gradient flash
    const flash = document.createElementNS(this._svgNS, 'rect');
    flash.setAttribute('width', w); flash.setAttribute('height', h);
    flash.setAttribute('fill', '#ff6b00');
    flash.classList.add('ci-flash');
    svg.appendChild(flash);
  },

  // ── 司马懿: 鹰视狼顾 (Eagle Eye Wolf Glance) ──
  _simayi(svg, w, h, pal) {
    const cx = w / 2, cy = h / 2;

    // Ice crystals from edges inward
    const crystalPositions = [
      { x: 0, y: 0 }, { x: w, y: 0 },
      { x: 0, y: h }, { x: w, y: h },
      { x: w/2, y: 0 }, { x: w/2, y: h },
      { x: 0, y: h/2 }, { x: w, y: h/2 },
    ];
    crystalPositions.forEach((pos, i) => {
      const crystal = document.createElementNS(this._svgNS, 'polygon');
      const s = 12 + Math.random() * 15;
      crystal.setAttribute('points',
        `${pos.x},${pos.y-s} ${pos.x+s*0.5},${pos.y-s*0.3} ${pos.x+s*0.5},${pos.y+s*0.3} ` +
        `${pos.x},${pos.y+s} ${pos.x-s*0.5},${pos.y+s*0.3} ${pos.x-s*0.5},${pos.y-s*0.3}`);
      crystal.setAttribute('fill', '#38bdf8');
      crystal.setAttribute('opacity', '0');
      crystal.setAttribute('filter', 'url(#ci-glow)');
      crystal.classList.add('ci-ice');
      crystal.style.animationDelay = (i * 0.08) + 's';
      crystal.style.transformOrigin = `${pos.x}px ${pos.y}px`;
      svg.appendChild(crystal);
    });

    // Dark shadow tendrils
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI + Math.PI / 6;
      const tendril = document.createElementNS(this._svgNS, 'path');
      const ex = cx + Math.cos(angle) * w * 0.6;
      const ey = cy + Math.sin(angle) * h * 0.6;
      tendril.setAttribute('d',
        `M ${cx},${cy} Q ${(cx+ex)/2 + (Math.random()-0.5)*40},${(cy+ey)/2 + (Math.random()-0.5)*40} ${ex},${ey}`);
      tendril.setAttribute('fill', 'none');
      tendril.setAttribute('stroke', '#1e293b');
      tendril.setAttribute('stroke-width', '4');
      tendril.setAttribute('opacity', '0');
      tendril.classList.add('ci-tendril');
      tendril.style.animationDelay = (0.2 + i * 0.1) + 's';
      svg.appendChild(tendril);
    }

    // Two glowing eyes above portrait (intimidation)
    const eyeG = document.createElementNS(this._svgNS, 'g');
    eyeG.classList.add('ci-eyes');

    const eyeSpacing = 40;
    [cx - eyeSpacing/2, cx + eyeSpacing/2].forEach(ex => {
      const eye = document.createElementNS(this._svgNS, 'ellipse');
      eye.setAttribute('cx', ex);
      eye.setAttribute('cy', h * 0.25);
      eye.setAttribute('rx', '14');
      eye.setAttribute('ry', '7');
      eye.setAttribute('fill', '#38bdf8');
      eye.setAttribute('filter', 'url(#ci-soft-glow)');
      eyeG.appendChild(eye);

      // Pupil
      const pupil = document.createElementNS(this._svgNS, 'ellipse');
      pupil.setAttribute('cx', ex);
      pupil.setAttribute('cy', h * 0.25);
      pupil.setAttribute('rx', '5');
      pupil.setAttribute('ry', '6');
      pupil.setAttribute('fill', '#0c4a6e');
      eyeG.appendChild(pupil);
    });
    svg.appendChild(eyeG);

    // Frost border effect
    const frostRect = document.createElementNS(this._svgNS, 'rect');
    frostRect.setAttribute('x', '3'); frostRect.setAttribute('y', '3');
    frostRect.setAttribute('width', w - 6); frostRect.setAttribute('height', h - 6);
    frostRect.setAttribute('rx', '14');
    frostRect.setAttribute('fill', 'none');
    frostRect.setAttribute('stroke', '#38bdf8');
    frostRect.setAttribute('stroke-width', '3');
    frostRect.setAttribute('stroke-dasharray', (w + h) * 2);
    frostRect.setAttribute('stroke-dashoffset', (w + h) * 2);
    frostRect.classList.add('ci-frost-border');
    svg.appendChild(frostRect);
  },

  // ── 刘备: 仁德 (Benevolence) ──
  _liubei(svg, w, h, pal) {
    const cx = w / 2, cy = h / 2;

    // Warm golden light radial
    const glow = document.createElementNS(this._svgNS, 'circle');
    glow.setAttribute('cx', cx);
    glow.setAttribute('cy', cy);
    glow.setAttribute('r', '40');
    glow.setAttribute('fill', '#d4a843');
    glow.setAttribute('opacity', '0.15');
    glow.setAttribute('filter', 'url(#ci-soft-glow)');
    glow.classList.add('ci-ring');
    svg.appendChild(glow);

    // Healing green/gold energy waves
    for (let i = 0; i < 5; i++) {
      const wave = document.createElementNS(this._svgNS, 'circle');
      wave.setAttribute('cx', cx);
      wave.setAttribute('cy', cy);
      wave.setAttribute('r', '10');
      wave.setAttribute('fill', 'none');
      wave.setAttribute('stroke', i % 2 === 0 ? '#22c55e' : '#d4a843');
      wave.setAttribute('stroke-width', '3');
      wave.classList.add('ci-heal-wave');
      wave.style.animationDelay = (i * 0.18) + 's';
      svg.appendChild(wave);
    }

    // Peach blossom petals (pink SVG circles)
    for (let i = 0; i < 18; i++) {
      const petal = document.createElementNS(this._svgNS, 'circle');
      petal.setAttribute('cx', Math.random() * w);
      petal.setAttribute('cy', Math.random() * h);
      petal.setAttribute('r', 3 + Math.random() * 4);
      petal.setAttribute('fill', Math.random() > 0.4 ? '#f9a8d4' : '#fda4af');
      petal.setAttribute('opacity', '0');
      petal.classList.add('ci-petal');
      petal.style.setProperty('--petal-dur', (1.5 + Math.random()) + 's');
      petal.style.setProperty('--px1', (15 + Math.random() * 25) + 'px');
      petal.style.setProperty('--py1', (-10 - Math.random() * 20) + 'px');
      petal.style.setProperty('--px2', (30 + Math.random() * 40) + 'px');
      petal.style.setProperty('--py2', (10 + Math.random() * 30) + 'px');
      petal.style.setProperty('--px3', (50 + Math.random() * 50) + 'px');
      petal.style.setProperty('--py3', (40 + Math.random() * 40) + 'px');
      petal.style.animationDelay = (Math.random() * 0.6) + 's';
      svg.appendChild(petal);
    }

    // Warm golden overlay
    const warmOverlay = document.createElementNS(this._svgNS, 'rect');
    warmOverlay.setAttribute('width', w); warmOverlay.setAttribute('height', h);
    warmOverlay.setAttribute('fill', 'rgba(212,168,67,0.15)');
    warmOverlay.classList.add('ci-flash');
    warmOverlay.style.animationDuration = '1.5s';
    svg.appendChild(warmOverlay);
  },

  // ── 孙尚香: 连弩 (Repeating Crossbow) ──
  _sunshangxiang(svg, w, h, pal) {
    // 3 arrow bolts in rapid succession
    for (let i = 0; i < 3; i++) {
      const boltG = document.createElementNS(this._svgNS, 'g');
      const y = h * 0.35 + i * (h * 0.15);
      boltG.classList.add('ci-bolt');
      boltG.style.setProperty('--bolt-delay', (0.15 + i * 0.18) + 's');
      boltG.style.setProperty('--bolt-dur', '0.35s');

      // Arrow shaft
      const shaft = document.createElementNS(this._svgNS, 'line');
      shaft.setAttribute('x1', w * 0.08);
      shaft.setAttribute('y1', y);
      shaft.setAttribute('x2', w * 0.08 + 35);
      shaft.setAttribute('y2', y);
      shaft.setAttribute('stroke', '#ef4444');
      shaft.setAttribute('stroke-width', '2.5');
      shaft.setAttribute('stroke-linecap', 'round');
      boltG.appendChild(shaft);

      // Arrowhead
      const head = document.createElementNS(this._svgNS, 'polygon');
      head.setAttribute('points',
        `${w*0.08-2},${y} ${w*0.08-8},${y-4} ${w*0.08-8},${y+4}`);
      head.setAttribute('fill', '#ef4444');
      boltG.appendChild(head);

      // Red trail
      const trail = document.createElementNS(this._svgNS, 'line');
      trail.setAttribute('x1', w * 0.08 + 35);
      trail.setAttribute('y1', y);
      trail.setAttribute('x2', w * 0.08 + 80);
      trail.setAttribute('y2', y);
      trail.setAttribute('stroke', 'rgba(239,68,68,0.3)');
      trail.setAttribute('stroke-width', '6');
      boltG.appendChild(trail);

      svg.appendChild(boltG);
    }

    // Impact sparks at right side
    for (let i = 0; i < 3; i++) {
      const sparkG = document.createElementNS(this._svgNS, 'g');
      const sy = h * 0.35 + i * (h * 0.15);
      sparkG.setAttribute('transform', `translate(${w*0.92},${sy})`);
      sparkG.classList.add('ci-spark');
      sparkG.style.animationDelay = (0.45 + i * 0.18) + 's';

      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        const sl = document.createElementNS(this._svgNS, 'line');
        sl.setAttribute('x1', 0); sl.setAttribute('y1', 0);
        sl.setAttribute('x2', Math.cos(angle) * 12);
        sl.setAttribute('y2', Math.sin(angle) * 12);
        sl.setAttribute('stroke', '#fbbf24');
        sl.setAttribute('stroke-width', '1.5');
        sparkG.appendChild(sl);
      }
      svg.appendChild(sparkG);
    }
  },
};

// Auto-init when DOM is ready
if (typeof window !== 'undefined') {
  window.SkillCutIn = SkillCutIn;
}

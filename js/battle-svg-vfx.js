// ═══ SVG Battle VFX System ═══
// Premium SVG overlay effects for kills, skills, crits
// Sits ON TOP of the PixiJS/Canvas battle renderer

const BattleSVGVFX = {
  overlay: null,
  wrap: null,
  active: [],
  _id: 0,

  // ═══ INIT ═══
  init() {
    this.wrap = document.getElementById('battle-canvas-wrap');
    if (!this.wrap) return;
    // Create overlay container
    let ov = document.getElementById('battle-svg-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'battle-svg-overlay';
      this.wrap.appendChild(ov);
    }
    this.overlay = ov;
    this.active = [];
  },

  destroy() {
    if (this.overlay) this.overlay.innerHTML = '';
    this.active = [];
  },

  _nextId() { return 'svfx-' + (++this._id); },

  _rect() {
    if (!this.overlay) return { w: 360, h: 300 };
    return { w: this.overlay.clientWidth || 360, h: this.overlay.clientHeight || 300 };
  },

  // Get fighter screen position (percentage-based)
  _fighterPos(key) {
    // key = 'player-0', 'enemy-2', etc.
    const parts = key.split('-');
    const side = parts[0];
    const pos = parseInt(parts[1]) || 0;
    const r = this._rect();
    const x = side === 'player' ? r.w * 0.22 : r.w * 0.78;
    const yStart = r.h * 0.2;
    const yGap = Math.min(56, (r.h * 0.6) / 4);
    const y = yStart + pos * yGap;
    return { x, y };
  },

  // ═══ SVG HELPERS ═══
  _svgNS: 'http://www.w3.org/2000/svg',

  _createSVG(w, h, cls) {
    const svg = document.createElementNS(this._svgNS, 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    if (cls) svg.classList.add(cls);
    return svg;
  },

  _addToOverlay(el, duration) {
    if (!this.overlay) return;
    this.overlay.appendChild(el);
    const id = this._nextId();
    this.active.push({ id, el, removeAt: Date.now() + duration });
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      this.active = this.active.filter(a => a.id !== id);
    }, duration + 50);
  },

  // ═══ SLASH EFFECTS ═══
  slashAttack(targetKey, isCrit, element) {
    const r = this._rect();
    const pos = this._fighterPos(targetKey);
    const svg = this._createSVG(r.w, r.h, 'svg-slash');
    if (!isCrit) svg.classList.add('fast');

    // SVG filter for glow
    const defs = document.createElementNS(this._svgNS, 'defs');
    const filter = document.createElementNS(this._svgNS, 'filter');
    filter.setAttribute('id', 'slash-glow');
    filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
    const blur = document.createElementNS(this._svgNS, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '4');
    blur.setAttribute('result', 'glow');
    filter.appendChild(blur);
    const merge = document.createElementNS(this._svgNS, 'feMerge');
    const mn1 = document.createElementNS(this._svgNS, 'feMergeNode');
    mn1.setAttribute('in', 'glow');
    const mn2 = document.createElementNS(this._svgNS, 'feMergeNode');
    mn2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mn1); merge.appendChild(mn2);
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const colors = {
      fire: '#ff6b00', water: '#00aaff', lightning: '#fff44f',
      ice: '#88eeff', wind: '#66ff88', earth: '#cc8844', dark: '#aa44ff'
    };
    const color = isCrit ? '#ffd700' : (colors[element] || '#ffffff');

    // Generate slash paths
    const slashes = isCrit ? 2 : 1;
    const directions = [
      // Top-left to bottom-right
      (x,y) => `M ${x-40} ${y-35} Q ${x} ${y-10} ${x+40} ${y+35}`,
      // Top-right to bottom-left
      (x,y) => `M ${x+40} ${y-35} Q ${x} ${y-10} ${x-40} ${y+35}`,
      // Left to right
      (x,y) => `M ${x-45} ${y-5} Q ${x} ${y-20} ${x+45} ${y+5}`,
      // Right to left arc
      (x,y) => `M ${x+45} ${y-5} Q ${x} ${y+20} ${x-45} ${y+5}`,
    ];

    for (let i = 0; i < slashes; i++) {
      const dirFn = directions[(Math.floor(Math.random() * 4) + i * 2) % 4];
      const path = document.createElementNS(this._svgNS, 'path');
      path.setAttribute('d', dirFn(pos.x, pos.y));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', isCrit ? '5' : '3');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('filter', 'url(#slash-glow)');
      if (i > 0) path.style.animationDelay = '0.08s';
      svg.appendChild(path);
    }

    this._addToOverlay(svg, isCrit ? 600 : 400);
  },

  // ═══ IMPACT RING ═══
  impactRing(targetKey, color, size) {
    const r = this._rect();
    const pos = this._fighterPos(targetKey);
    const svg = this._createSVG(r.w, r.h);

    // Glow filter
    const defs = document.createElementNS(this._svgNS, 'defs');
    const filter = document.createElementNS(this._svgNS, 'filter');
    filter.id = 'ring-glow-' + this._id;
    const blur = document.createElementNS(this._svgNS, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '3');
    blur.setAttribute('result', 'g');
    filter.appendChild(blur);
    const merge = document.createElementNS(this._svgNS, 'feMerge');
    ['g', 'SourceGraphic'].forEach(inp => {
      const mn = document.createElementNS(this._svgNS, 'feMergeNode');
      mn.setAttribute('in', inp); merge.appendChild(mn);
    });
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Multiple rings with staggered timing
    const rings = size === 'large' ? 3 : 2;
    for (let i = 0; i < rings; i++) {
      const circle = document.createElementNS(this._svgNS, 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color || '#ffffff');
      circle.setAttribute('stroke-width', size === 'large' ? '4' : '2.5');
      circle.setAttribute('filter', `url(#ring-glow-${this._id})`);
      circle.style.animation = `${size === 'large' ? 'ring-expand-large' : 'ring-expand'} ${0.5 + i * 0.1}s ease-out ${i * 0.08}s forwards`;
      circle.style.transformOrigin = `${pos.x}px ${pos.y}px`;
      svg.appendChild(circle);
    }

    this._addToOverlay(svg, 800);
  },

  // ═══ INK SPLASH (Kill) ═══
  inkSplash(targetKey, color) {
    const r = this._rect();
    const pos = this._fighterPos(targetKey);
    const svg = this._createSVG(r.w, r.h);

    // Turbulence filter for organic ink look
    const defs = document.createElementNS(this._svgNS, 'defs');
    const filter = document.createElementNS(this._svgNS, 'filter');
    filter.id = 'ink-turb-' + this._id;
    filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');

    const turb = document.createElementNS(this._svgNS, 'feTurbulence');
    turb.setAttribute('type', 'fractalNoise');
    turb.setAttribute('baseFrequency', '0.04');
    turb.setAttribute('numOctaves', '4');
    turb.setAttribute('result', 'noise');
    filter.appendChild(turb);

    const disp = document.createElementNS(this._svgNS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'noise');
    disp.setAttribute('scale', '25');
    filter.appendChild(disp);

    defs.appendChild(filter);
    svg.appendChild(defs);

    // Multiple ink blobs
    for (let i = 0; i < 5; i++) {
      const blob = document.createElementNS(this._svgNS, 'circle');
      const ox = (Math.random() - 0.5) * 40;
      const oy = (Math.random() - 0.5) * 40;
      blob.setAttribute('cx', pos.x + ox);
      blob.setAttribute('cy', pos.y + oy);
      blob.setAttribute('r', 8 + Math.random() * 15);
      blob.setAttribute('fill', color || '#cc2200');
      blob.setAttribute('filter', `url(#ink-turb-${this._id})`);
      blob.setAttribute('opacity', '0.8');
      blob.classList.add('ink-splash');
      blob.style.animationDelay = (i * 0.05) + 's';
      blob.style.transformOrigin = `${pos.x + ox}px ${pos.y + oy}px`;
      svg.appendChild(blob);
    }

    this._addToOverlay(svg, 700);
  },

  // ═══ DISSOLVE PARTICLES (Kill) ═══
  dissolveTarget(targetKey) {
    const r = this._rect();
    const pos = this._fighterPos(targetKey);
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';

    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 60;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 20; // bias upward
      const size = 3 + Math.random() * 6;
      p.classList.add('dissolve-p');
      p.style.cssText = `position:absolute;left:${pos.x - size/2}px;top:${pos.y - size/2}px;` +
        `width:${size}px;height:${size}px;background:#fff;border-radius:50%;opacity:0.8;` +
        `--dx:${dx}px;--dy:${dy}px;--dur:${0.4 + Math.random() * 0.4}s;` +
        `animation-delay:${Math.random() * 0.15}s;`;
      container.appendChild(p);
    }

    this._addToOverlay(container, 1000);
  },

  // ═══ KANJI SLAM (Kill) ═══
  kanjiSlam(text, color) {
    const r = this._rect();
    const svg = this._createSVG(r.w, r.h);

    // Glow filter
    const defs = document.createElementNS(this._svgNS, 'defs');
    const filter = document.createElementNS(this._svgNS, 'filter');
    filter.id = 'kanji-glow-' + this._id;
    const blur = document.createElementNS(this._svgNS, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '6');
    blur.setAttribute('result', 'g');
    filter.appendChild(blur);
    const merge = document.createElementNS(this._svgNS, 'feMerge');
    ['g', 'SourceGraphic'].forEach(inp => {
      const mn = document.createElementNS(this._svgNS, 'feMergeNode');
      mn.setAttribute('in', inp); merge.appendChild(mn);
    });
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const g = document.createElementNS(this._svgNS, 'g');
    g.classList.add('kill-kanji');
    g.style.transformOrigin = `${r.w/2}px ${r.h/2}px`;

    const t = document.createElementNS(this._svgNS, 'text');
    t.setAttribute('x', r.w / 2);
    t.setAttribute('y', r.h / 2);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('font-size', '48');
    t.setAttribute('font-weight', '900');
    t.setAttribute('fill', color || '#ff3333');
    t.setAttribute('stroke', '#000');
    t.setAttribute('stroke-width', '2');
    t.setAttribute('filter', `url(#kanji-glow-${this._id})`);
    t.setAttribute('font-family', '"STKaiti", "KaiTi", "楷体", serif');
    t.textContent = text;
    g.appendChild(t);
    svg.appendChild(g);

    this._addToOverlay(svg, 900);
  },

  // ═══ SCREEN FLASH ═══
  screenFlash(color, duration) {
    const flash = document.createElement('div');
    flash.className = 'vfx-flash';
    flash.style.cssText = `position:absolute;inset:0;background:${color || '#fff'};pointer-events:none;border-radius:16px;`;
    flash.style.animationDuration = (duration || 200) + 'ms';
    this._addToOverlay(flash, (duration || 200) + 50);
  },

  // ═══ SCREEN SHAKE ═══
  screenShake(intensity) {
    if (!this.wrap) return;
    const anim = intensity === 'heavy' ? 'vfx-shake-heavy 0.4s ease-out' : 'vfx-shake-light 0.25s ease-out';
    this.wrap.style.animation = 'none';
    this.wrap.offsetHeight; // reflow
    this.wrap.style.animation = anim;
    setTimeout(() => { this.wrap.style.animation = ''; }, intensity === 'heavy' ? 400 : 250);
  },

  // ═══ SKILL CINEMATIC ═══
  skillCinematic(casterKey, skillName, element) {
    const r = this._rect();
    const pos = this._fighterPos(casterKey);
    const colors = {
      fire: '#ff6b00', water: '#00aaff', lightning: '#fff44f',
      ice: '#88eeff', wind: '#66ff88', earth: '#cc8844', dark: '#aa44ff'
    };
    const color = colors[element] || '#d4a843';

    // Phase 1: Dim overlay
    const dim = document.createElement('div');
    dim.style.cssText = `position:absolute;inset:0;background:rgba(0,0,0,0);pointer-events:none;border-radius:16px;transition:background 0.3s;`;
    this._addToOverlay(dim, 2000);
    requestAnimationFrame(() => { dim.style.background = 'rgba(0,0,0,0.5)'; });

    // Phase 2: Skill name (after 300ms)
    setTimeout(() => {
      const svg = this._createSVG(r.w, r.h);
      const g = document.createElementNS(this._svgNS, 'g');
      g.classList.add('brush-text');
      g.style.transformOrigin = `${r.w/2}px ${r.h/2}px`;

      // Glow filter
      const defs = document.createElementNS(this._svgNS, 'defs');
      const filter = document.createElementNS(this._svgNS, 'filter');
      filter.id = 'skill-glow-' + this._id;
      const blur = document.createElementNS(this._svgNS, 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '5');
      blur.setAttribute('result', 'g');
      filter.appendChild(blur);
      const merge = document.createElementNS(this._svgNS, 'feMerge');
      ['g', 'SourceGraphic'].forEach(inp => {
        const mn = document.createElementNS(this._svgNS, 'feMergeNode');
        mn.setAttribute('in', inp); merge.appendChild(mn);
      });
      filter.appendChild(merge);
      defs.appendChild(filter);
      svg.appendChild(defs);

      const t = document.createElementNS(this._svgNS, 'text');
      t.setAttribute('x', r.w / 2);
      t.setAttribute('y', r.h / 2);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('font-size', '32');
      t.setAttribute('font-weight', '900');
      t.setAttribute('fill', color);
      t.setAttribute('stroke', '#fff');
      t.setAttribute('stroke-width', '1.5');
      t.setAttribute('filter', `url(#skill-glow-${this._id})`);
      t.setAttribute('font-family', '"STKaiti", "KaiTi", "楷体", serif');
      t.textContent = '【' + skillName + '】';
      g.appendChild(t);
      svg.appendChild(g);
      this._addToOverlay(svg, 1200);
    }, 300);

    // Phase 3: Energy burst (after 500ms)
    setTimeout(() => {
      this._energyBurst(pos.x, pos.y, color, element);
      this.screenShake('heavy');
    }, 500);

    // Phase 4: Dim fades out (after 1200ms)
    setTimeout(() => {
      if (dim.parentNode) dim.style.background = 'rgba(0,0,0,0)';
    }, 1200);
  },

  // ═══ ENERGY BURST ═══
  _energyBurst(cx, cy, color, element) {
    const r = this._rect();
    const svg = this._createSVG(r.w, r.h);

    // Multiple energy rings
    for (let i = 0; i < 4; i++) {
      const circle = document.createElementNS(this._svgNS, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('opacity', '0.8');
      circle.style.animation = `ring-expand-large ${0.6 + i * 0.15}s ease-out ${i * 0.1}s forwards`;
      circle.style.transformOrigin = `${cx}px ${cy}px`;
      svg.appendChild(circle);
    }

    // Element-specific rays
    if (element === 'fire' || element === 'lightning') {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const line = document.createElementNS(this._svgNS, 'line');
        line.setAttribute('x1', cx);
        line.setAttribute('y1', cy);
        line.setAttribute('x2', cx + Math.cos(angle) * 120);
        line.setAttribute('y2', cy + Math.sin(angle) * 120);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.6');
        line.setAttribute('stroke-dasharray', '400');
        line.setAttribute('stroke-dashoffset', '400');
        line.style.animation = `beam-fire 0.5s ease-out ${i * 0.03}s forwards`;
        svg.appendChild(line);
      }
    }

    if (element === 'lightning') {
      // Forked lightning from top
      for (let i = 0; i < 3; i++) {
        const path = document.createElementNS(this._svgNS, 'path');
        const sx = cx - 30 + i * 30;
        let d = `M ${sx} 0`;
        let px = sx, py = 0;
        for (let j = 0; j < 6; j++) {
          px += (Math.random() - 0.5) * 30;
          py += r.h / 6;
          d += ` L ${px} ${py}`;
        }
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('opacity', '0.9');
        path.setAttribute('stroke-dasharray', '600');
        path.setAttribute('stroke-dashoffset', '600');
        path.style.animation = `slash-draw 0.4s ease-out ${i * 0.05}s forwards`;
        svg.appendChild(path);
      }
      this.screenFlash('#fff', 100);
    }

    if (element === 'ice') {
      // Frost border
      const rect = document.createElementNS(this._svgNS, 'rect');
      rect.setAttribute('x', '2'); rect.setAttribute('y', '2');
      rect.setAttribute('width', r.w - 4); rect.setAttribute('height', r.h - 4);
      rect.setAttribute('rx', '14');
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#88eeff');
      rect.setAttribute('stroke-width', '4');
      rect.setAttribute('opacity', '0');
      rect.style.animation = 'defeat-fade 0.3s ease-out forwards';
      rect.style.filter = 'blur(3px)';
      svg.appendChild(rect);
      setTimeout(() => { if (rect.parentNode) rect.style.opacity = '0'; rect.style.transition = 'opacity 0.5s'; }, 600);
    }

    this._addToOverlay(svg, 1000);
  },

  // ═══ VICTORY EFFECT ═══
  victoryEffect() {
    const r = this._rect();

    // Golden overlay
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, rgba(212,168,67,0.15), transparent 70%);pointer-events:none;border-radius:16px;`;
    this._addToOverlay(glow, 3000);

    // Victory text SVG
    const svg = this._createSVG(r.w, r.h);
    const defs = document.createElementNS(this._svgNS, 'defs');
    const filter = document.createElementNS(this._svgNS, 'filter');
    filter.id = 'victory-glow';
    const blur = document.createElementNS(this._svgNS, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '8'); blur.setAttribute('result', 'g');
    filter.appendChild(blur);
    const merge = document.createElementNS(this._svgNS, 'feMerge');
    ['g', 'SourceGraphic'].forEach(inp => {
      const mn = document.createElementNS(this._svgNS, 'feMergeNode');
      mn.setAttribute('in', inp); merge.appendChild(mn);
    });
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const g = document.createElementNS(this._svgNS, 'g');
    g.classList.add('victory-text');
    g.style.transformOrigin = `${r.w/2}px ${r.h/2}px`;
    const t = document.createElementNS(this._svgNS, 'text');
    t.setAttribute('x', r.w/2); t.setAttribute('y', r.h/2 - 10);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('font-size', '52');
    t.setAttribute('font-weight', '900');
    t.setAttribute('fill', '#ffd700');
    t.setAttribute('stroke', '#b8860b');
    t.setAttribute('stroke-width', '2');
    t.setAttribute('filter', 'url(#victory-glow)');
    t.setAttribute('font-family', '"STKaiti", "KaiTi", "楷体", serif');
    t.textContent = '大 胜';
    g.appendChild(t);
    svg.appendChild(g);
    this._addToOverlay(svg, 3000);

    // Light rays
    const raysSvg = this._createSVG(r.w, r.h);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const line = document.createElementNS(this._svgNS, 'line');
      line.setAttribute('x1', r.w/2);
      line.setAttribute('y1', r.h/2);
      line.setAttribute('x2', r.w/2 + Math.cos(angle) * r.w * 0.6);
      line.setAttribute('y2', r.h/2 + Math.sin(angle) * r.h * 0.6);
      line.setAttribute('stroke', '#ffd700');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('opacity', '0.4');
      line.setAttribute('stroke-dasharray', '400');
      line.setAttribute('stroke-dashoffset', '400');
      line.style.animation = `beam-fire 0.8s ease-out ${i * 0.05}s forwards`;
      raysSvg.appendChild(line);
    }
    this._addToOverlay(raysSvg, 2500);

    this.screenFlash('#ffd700', 300);
  },

  // ═══ DEFEAT EFFECT ═══
  defeatEffect() {
    const r = this._rect();

    // Dark vignette
    const vignette = document.createElement('div');
    vignette.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%);pointer-events:none;border-radius:16px;opacity:0;transition:opacity 1s;`;
    this._addToOverlay(vignette, 4000);
    requestAnimationFrame(() => { vignette.style.opacity = '1'; });

    // Defeat text
    setTimeout(() => {
      const svg = this._createSVG(r.w, r.h);
      const g = document.createElementNS(this._svgNS, 'g');
      g.classList.add('defeat-text');
      g.style.transformOrigin = `${r.w/2}px ${r.h/2}px`;
      const t = document.createElementNS(this._svgNS, 'text');
      t.setAttribute('x', r.w/2); t.setAttribute('y', r.h/2);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('font-size', '44');
      t.setAttribute('font-weight', '900');
      t.setAttribute('fill', '#cc2222');
      t.setAttribute('stroke', '#000');
      t.setAttribute('stroke-width', '2');
      t.setAttribute('font-family', '"STKaiti", "KaiTi", "楷体", serif');
      t.textContent = '败 北';
      g.appendChild(t);
      svg.appendChild(g);
      this._addToOverlay(svg, 3000);
    }, 500);
  },

  // ═══ MAIN PROCESS VFX HOOK ═══
  processVFX(vfxList) {
    if (!this.overlay) this.init();
    for (const fx of vfxList) {
      if (fx.type === 'attack') {
        const hero = (typeof HEROES !== 'undefined') ? HEROES[fx.attacker?.split('-')[0] === 'player' ? this._getHeroId(fx.attacker) : null] : null;
        const element = hero?.element;
        this.slashAttack(fx.target, fx.isCrit, element);
        this.impactRing(fx.target, fx.isCrit ? '#ffd700' : '#ffffff', fx.isCrit ? 'large' : 'normal');
        if (fx.isCrit) {
          this.screenFlash('#ffd700', 150);
          this.screenShake('heavy');
        } else {
          this.screenShake('light');
        }
      }

      if (fx.type === 'skill') {
        const hero = (typeof HEROES !== 'undefined' && fx.caster) ? HEROES[this._getHeroId(fx.caster)] : null;
        this.skillCinematic(fx.caster, fx.skillName || '天命', hero?.element);
      }

      if (fx.type === 'kill') {
        this.slashAttack(fx.target, true, 'fire');
        this.inkSplash(fx.target, '#cc0000');
        this.dissolveTarget(fx.target);
        this.impactRing(fx.target, '#ff4444', 'large');
        setTimeout(() => this.kanjiSlam('斩', '#ff3333'), 150);
        this.screenFlash('#ff0000', 200);
        this.screenShake('heavy');
      }
    }
  },

  // Get hero ID from battle state by fighter key
  _getHeroId(key) {
    if (!key) return null;
    try {
      const parts = key.split('-');
      const side = parts[0];
      const pos = parseInt(parts[1]);
      if (typeof Battle !== 'undefined' && Battle.state) {
        const f = Battle.state[side]?.[pos];
        return f?.id || null;
      }
    } catch(e) {}
    return null;
  },
};

if (typeof window !== 'undefined') window.BattleSVGVFX = BattleSVGVFX;

// roundRect polyfill for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    r = Math.min(r, Math.min(w, h) / 2);
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arcTo(x + w, y, x + w, y + r, r);
    this.lineTo(x + w, y + h - r);
    this.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.lineTo(x + r, y + h);
    this.arcTo(x, y + h, x, y + h - r, r);
    this.lineTo(x, y + r);
    this.arcTo(x, y, x + r, y, r);
    return this;
  };
}

// 三国·天命 — Canvas Battle Renderer (VFX Overhaul)
// Premium battle animations: slash trails, element VFX, impact waves,
// kill cinematics, skill cinematics, victory/defeat polish

const BattleCanvas = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  animFrame: null,
  particles: [],
  floatingTexts: [],
  screenShake: { x: 0, y: 0, intensity: 0, decay: 0.82 },
  flashAlpha: 0,
  flashColor: '#fff',
  fighters: {},

  running: false,

  // ── VFX Overhaul state ──
  slashTrails: [],
  impactWaves: [],
  shockwaves: [],        // circular shockwave rings for skill activation
  cinematicActive: null,
  timeScale: 1,
  timeSlowFrames: 0,
  zoomPulse: 0,
  chromaticFrames: 0,
  lastFrameTime: 0,
  victoryAnim: null,
  defeatAnim: null,

  // ── Performance caps ──
  MAX_PARTICLES: 300,
  MAX_SLASH_TRAILS: 10,
  MAX_IMPACT_WAVES: 8,
  MAX_SHOCKWAVES: 6,

  // ── Element color palettes ──
  ELEMENT_COLORS: {
    fire:      { primary: '#ff4500', secondary: '#ffd700', glow: 'rgba(255,69,0,0.3)' },
    water:     { primary: '#00bfff', secondary: '#4169e1', glow: 'rgba(0,191,255,0.3)' },
    lightning: { primary: '#fff44f', secondary: '#7b68ee', glow: 'rgba(255,244,79,0.4)' },
    ice:       { primary: '#00ffff', secondary: '#e0f0ff', glow: 'rgba(0,255,255,0.3)' },
    wind:      { primary: '#98fb98', secondary: '#ffffff', glow: 'rgba(152,251,152,0.3)' },
    earth:     { primary: '#8B4513', secondary: '#DAA520', glow: 'rgba(139,69,19,0.3)' },
    dark:      { primary: '#4a0080', secondary: '#800080', glow: 'rgba(74,0,128,0.4)' },
  },

  // ═══ INIT ═══
  init(canvasOrId) {
    this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    // Paint an immediate visible background so canvas is never blank while RAF loop starts
    try {
      const bg = this.ctx.createLinearGradient(0, 0, 0, this.height);
      bg.addColorStop(0, '#1a3050');
      bg.addColorStop(1, '#0e2030');
      this.ctx.fillStyle = bg;
      this.ctx.fillRect(0, 0, this.width, this.height);
    } catch(e) {}
    // Store handler reference so we can remove it in stop()
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);
  },

  resize() {
    const parent = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    let w = parent ? parent.clientWidth : 0;
    // Defensive minimum: if parent has no width yet (page not laid out), use fallback
    if (w < 10) w = Math.max(320, window.innerWidth || 320);
    this.width = w;
    this.height = Math.min(380, Math.floor(this.width * 0.85));
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  // ═══ HELPER: Get hero element ═══
  getHeroElement(heroId) {
    if (typeof HERO_ELEMENTS !== 'undefined' && HERO_ELEMENTS[heroId]) {
      return HERO_ELEMENTS[heroId];
    }
    return null;
  },

  // ═══ FIGHTER SPRITES ═══
  initFighters(battleState) {
    this.fighters = {};
    if (!battleState) return;
    const leftX = this.width * 0.22;
    const rightX = this.width * 0.78;
    const playerCount = battleState.player.filter(f => f).length;
    const enemyCount = battleState.enemy.filter(f => f).length;
    const maxCount = Math.max(playerCount, enemyCount, 3);
    const availH = this.height - 60;
    const gapY = Math.min(56, Math.floor(availH / maxCount));
    const totalH = (maxCount - 1) * gapY;
    const startY = Math.floor((this.height - totalH) / 2);

    for (const f of battleState.player) {
      if (!f) continue;
      const key = f.side + '-' + f.pos;
      this.fighters[key] = {
        f,
        x: leftX, baseX: leftX,
        y: startY + f.pos * gapY, baseY: startY + f.pos * gapY,
        scale: 1, alpha: 1,
        shakeX: 0, shakeY: 0,
        attackAnim: 0,
        hitFlash: 0,
        skillGlow: 0,
        facing: 1,
      };
    }
    for (const f of battleState.enemy) {
      if (!f) continue;
      const key = f.side + '-' + f.pos;
      this.fighters[key] = {
        f,
        x: rightX, baseX: rightX,
        y: startY + f.pos * gapY, baseY: startY + f.pos * gapY,
        scale: 1, alpha: 1,
        shakeX: 0, shakeY: 0,
        attackAnim: 0,
        hitFlash: 0,
        skillGlow: 0,
        facing: -1,
      };
    }
  },

  // ═══ DRAW SINGLE FIGHTER ═══
  drawFighter(sprite) {
    const ctx = this.ctx;
    const f = sprite.f;
    if (!f) return;

    const x = sprite.x + sprite.shakeX;
    const y = sprite.y + sprite.shakeY;
    const size = 48 * sprite.scale;
    const halfSize = size / 2;

    ctx.save();
    ctx.globalAlpha = sprite.alpha * (f.alive ? 1 : 0.3);

    const vd = (typeof Visuals !== 'undefined' && Visuals.HERO_DATA[f.id]) || { ch: '?', c1: '#3a3f47', c2: '#6c757d' };
    const hero = (typeof HEROES !== 'undefined') ? HEROES[f.id] : null;
    const factionColors = { shu: '#4a8c6f', wei: '#5a8fc7', wu: '#c04040', qun: '#9a6dd7' };
    const factionColor = factionColors[hero?.faction] || '#6c757d';

    if (!this._portraitImages) this._portraitImages = {};
    if (typeof Portraits !== 'undefined' && !this._portraitImages[f.id]) {
      try {
        if (Portraits.hasPng(f.id)) {
          // Use PNG portrait directly
          const img = new Image();
          img.src = Portraits.getPngUrl(f.id);
          this._portraitImages[f.id] = img;
        } else if (Portraits.DATA[f.id]) {
          // Fallback to SVG
          const svgStr = Portraits._render(Portraits.DATA[f.id], 80);
          const img = new Image();
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
          this._portraitImages[f.id] = img;
        }
      } catch(e) {}
    }
    const portraitImg = this._portraitImages[f.id];

    // Skill glow aura
    if (sprite.skillGlow > 0) {
      const glowRadius = halfSize + 12 + Math.sin(Date.now() * 0.01) * 4;
      const glow = ctx.createRadialGradient(x, y, halfSize, x, y, glowRadius);
      glow.addColorStop(0, 'rgba(168,85,247,' + (sprite.skillGlow * 0.6) + ')');
      glow.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hit flash overlay
    if (sprite.hitFlash > 0) {
      const flashGlow = ctx.createRadialGradient(x, y, 0, x, y, halfSize + 8);
      flashGlow.addColorStop(0, 'rgba(255,80,60,' + (sprite.hitFlash * 0.5) + ')');
      flashGlow.addColorStop(1, 'rgba(255,80,60,0)');
      ctx.fillStyle = flashGlow;
      ctx.beginPath();
      ctx.arc(x, y, halfSize + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + halfSize + 4, halfSize * 0.7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Character portrait
    const rarityColors = { 1: '#6c757d', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#d4a843' };
    const r = hero?.rarity || 1;

    // ── SOLDIER UNIT EMOJI CARDS ──
    // Unit types without hero portraits get a premium emoji-styled card
    const SOLDIER_CARDS = {
      // key: heroId → { emoji, grad1, grad2, borderColor }
      // Soldier units (no portrait URL)
      soldier:        { emoji: '⚔️', g1: '#4a3520', g2: '#2a1e10', border: '#8b6d3a' },
      archer_recruit: { emoji: '🏹', g1: '#1a3a20', g2: '#0e2210', border: '#3a8b4a' },
      shield_militia: { emoji: '🛡️', g1: '#2a2a3a', g2: '#1a1a28', border: '#7a6a5a' },
      mage_acolyte:   { emoji: '🔮', g1: '#2a1040', g2: '#180a28', border: '#8a4acd' },
      elite_cavalry:  { emoji: '🐴', g1: '#3a1010', g2: '#220808', border: '#cd3030' },
      elite_spear:    { emoji: '🗡️', g1: '#1a2a3a', g2: '#0e1a26', border: '#4a7acd' },
      navy_soldier:   { emoji: '⚓', g1: '#0a1e3a', g2: '#061228', border: '#2a6acd' },
      fire_archer:    { emoji: '🔥', g1: '#3a1808', g2: '#220e04', border: '#cd5a1a' },
      fire_soldier:   { emoji: '🔥', g1: '#3a1808', g2: '#220e04', border: '#cd5a1a' },
      strategist:     { emoji: '📜', g1: '#3a2a10', g2: '#221808', border: '#cd9a2a' },
      crossbow_corps: { emoji: '🏹', g1: '#1a3a20', g2: '#0e2210', border: '#3a8b4a' },
      supply_guard:   { emoji: '🛒', g1: '#2a2a1a', g2: '#1a1a10', border: '#7a7a3a' },
    };
    const soldierCard = SOLDIER_CARDS[f.id];

    if (portraitImg && portraitImg.complete && portraitImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, halfSize, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(portraitImg, x - halfSize, y - halfSize, size, size);
      ctx.restore();
    } else if (soldierCard) {
      // Premium emoji card for soldier units
      ctx.save();
      // Clipping circle
      ctx.beginPath();
      ctx.arc(x, y, halfSize, 0, Math.PI * 2);
      ctx.clip();
      // Gradient background
      const cardGrad = ctx.createRadialGradient(x, y - halfSize * 0.3, 0, x, y, halfSize);
      cardGrad.addColorStop(0, soldierCard.g1);
      cardGrad.addColorStop(1, soldierCard.g2);
      ctx.fillStyle = cardGrad;
      ctx.fillRect(x - halfSize, y - halfSize, size, size);
      // Inner highlight
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.ellipse(x, y - halfSize * 0.2, halfSize * 0.7, halfSize * 0.4, 0, 0, Math.PI);
      ctx.fill();
      ctx.restore();
      // Large emoji as portrait
      ctx.font = Math.floor(size * 0.52) + 'px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fillText(soldierCard.emoji, x, y + 2);
      ctx.shadowBlur = 0;
    } else {
      const grad = ctx.createLinearGradient(x - halfSize, y - halfSize, x + halfSize, y + halfSize);
      grad.addColorStop(0, vd.c1);
      grad.addColorStop(1, vd.c2);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, halfSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + Math.floor(size * 0.45) + 'px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(vd.ch, x, y + 1);
      ctx.shadowBlur = 0;
    }

    // Rarity border — use soldierCard border color when available
    const borderColor = (soldierCard && r <= 2) ? soldierCard.border : (rarityColors[r] || '#6c757d');
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = r >= 4 ? 3 : 2;
    ctx.beginPath();
    ctx.arc(x, y, halfSize, 0, Math.PI * 2);
    ctx.stroke();

    // R5 animated border
    if (r === 5 && f.alive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(212,168,67,' + (0.3 + Math.sin(Date.now() * 0.003) * 0.2) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, halfSize + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Name below
    ctx.font = '600 10px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = f.alive ? '#f0e6d3' : '#555';
    ctx.fillText(f.name, x, y + halfSize + 16);

    // HP bar
    if (f.alive) {
      const barW = size + 4;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = y - halfSize - 10;
      const hpPct = Math.max(0, f.hp / f.maxHp);

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 2.5);
      ctx.fill();

      const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW * hpPct, barY);
      if (hpPct > 0.5) {
        hpGrad.addColorStop(0, '#22c55e');
        hpGrad.addColorStop(1, '#4ade80');
      } else if (hpPct > 0.25) {
        hpGrad.addColorStop(0, '#f59e0b');
        hpGrad.addColorStop(1, '#fbbf24');
      } else {
        hpGrad.addColorStop(0, '#ef4444');
        hpGrad.addColorStop(1, '#f97316');
      }
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * hpPct, barH, 2.5);
      ctx.fill();

      ctx.font = '600 8px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(f.hp) + '/' + f.maxHp, x, barY + barH + 9);

      const rageW = barW;
      const rageH = 3;
      const rageY = barY + barH + 2;
      const ragePct = Math.min(1, f.rage / (f.maxRage || 100));
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.roundRect(barX, rageY, rageW, rageH, 1.5);
      ctx.fill();
      if (ragePct > 0) {
        const rageGrad = ctx.createLinearGradient(barX, rageY, barX + rageW * ragePct, rageY);
        rageGrad.addColorStop(0, '#d4a843');
        rageGrad.addColorStop(1, '#f5d98a');
        ctx.fillStyle = rageGrad;
        ctx.beginPath();
        ctx.roundRect(barX, rageY, rageW * ragePct, rageH, 1.5);
        ctx.fill();
        if (ragePct >= 1) {
          ctx.fillStyle = 'rgba(212,168,67,' + (0.3 + Math.sin(Date.now() * 0.005) * 0.15) + ')';
          ctx.beginPath();
          ctx.roundRect(barX - 1, rageY - 1, rageW + 2, rageH + 2, 2);
          ctx.fill();
        }
      }
    }

    // Dead X
    if (!f.alive) {
      ctx.strokeStyle = '#c04040';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 12);
      ctx.lineTo(x + 12, y + 12);
      ctx.moveTo(x + 12, y - 12);
      ctx.lineTo(x - 12, y + 12);
      ctx.stroke();
    }

    ctx.restore();
  },

  // ═══════════════════════════════════════════
  //  1. SLASH TRAIL SYSTEM
  // ═══════════════════════════════════════════

  spawnSlashTrail(x, y, isCrit, color) {
    // Enforce cap
    while (this.slashTrails.length >= this.MAX_SLASH_TRAILS) this.slashTrails.shift();

    // Four slash arc directions with bezier control offsets
    const dirs = [
      { sx: -45, sy: 28, ex: 45, ey: -28, cx: 8, cy: -40 },   // ↗
      { sx: 45, sy: 28, ex: -45, ey: -28, cx: -8, cy: -40 },   // ↖
      { sx: -40, sy: -32, ex: 40, ey: 32, cx: 12, cy: 38 },    // ↘
      { sx: 40, sy: -32, ex: -40, ey: 32, cx: -12, cy: 38 },   // ↙
    ];

    if (isCrit) {
      // X-pattern: two crossing slashes in gold
      const d1 = dirs[0];
      const d2 = dirs[1];
      this.slashTrails.push({
        x, y, ...d1, color: '#ffd700', frame: 0, maxFrames: 18, lineWidth: 5
      });
      this.slashTrails.push({
        x, y, ...d2, color: '#ffd700', frame: 0, maxFrames: 18, lineWidth: 5
      });
    } else {
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      this.slashTrails.push({
        x, y, ...d, color: color || '#ffffff', frame: 0, maxFrames: 15, lineWidth: 3
      });
    }
  },

  updateSlashTrails() {
    const ts = this.timeScale;
    for (let i = this.slashTrails.length - 1; i >= 0; i--) {
      this.slashTrails[i].frame += ts;
      if (this.slashTrails[i].frame >= this.slashTrails[i].maxFrames) {
        this.slashTrails.splice(i, 1);
      }
    }
  },

  drawSlashTrails() {
    const ctx = this.ctx;
    for (const s of this.slashTrails) {
      const progress = s.frame / s.maxFrames;
      const alpha = 1 - progress;
      if (alpha <= 0) continue;

      // Draw the reveal: only show the portion of the curve that's been "drawn"
      const drawProgress = Math.min(1, s.frame / (s.maxFrames * 0.35)); // full curve drawn in first 35% of lifetime

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth * (1 - progress * 0.5);
      ctx.lineCap = 'round';
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12 * alpha;

      // Draw bezier arc as segmented path for trail fade
      const segments = 20;
      const endSeg = Math.floor(segments * drawProgress);
      if (endSeg < 1) { ctx.restore(); continue; }

      const startSeg = Math.max(0, endSeg - Math.floor(segments * (1 - progress * 0.6)));

      for (let j = Math.max(0, startSeg); j < endSeg; j++) {
        const t0 = j / segments;
        const t1 = (j + 1) / segments;
        const segAlpha = ((j - startSeg) / (endSeg - startSeg)) * alpha;

        // Quadratic bezier point
        const p0x = s.x + s.sx;
        const p0y = s.y + s.sy;
        const p1x = s.x + s.cx;
        const p1y = s.y + s.cy;
        const p2x = s.x + s.ex;
        const p2y = s.y + s.ey;

        const x0 = (1-t0)*(1-t0)*p0x + 2*(1-t0)*t0*p1x + t0*t0*p2x;
        const y0 = (1-t0)*(1-t0)*p0y + 2*(1-t0)*t0*p1y + t0*t0*p2y;
        const x1 = (1-t1)*(1-t1)*p0x + 2*(1-t1)*t1*p1x + t1*t1*p2x;
        const y1 = (1-t1)*(1-t1)*p0y + 2*(1-t1)*t1*p1y + t1*t1*p2y;

        ctx.globalAlpha = segAlpha;
        ctx.lineWidth = s.lineWidth * (1 - progress * 0.5) * (0.3 + 0.7 * (j / segments));
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════
  //  2. ELEMENT-SPECIFIC VFX
  // ═══════════════════════════════════════════

  spawnElementVFX(x, y, element, intensity) {
    if (!element) return;
    const palette = this.ELEMENT_COLORS[element];
    if (!palette) return;

    const isSkill = intensity === 'skill';
    const count = isSkill ? 22 : 10;

    switch (element) {
      case 'fire':
        this.spawnParticles(x, y, palette.primary, count, {
          type: 'ember', spread: isSkill ? 7 : 4, size: 3, upward: true
        });
        this.spawnParticles(x, y, palette.secondary, Math.floor(count / 2), {
          type: 'ember', spread: 3, size: 2, upward: true
        });
        break;

      case 'water':
        this.spawnImpactWave(x, y, palette.primary, isSkill ? 80 : 40);
        this.spawnParticles(x, y, palette.primary, count, {
          type: 'droplet', spread: isSkill ? 6 : 4, size: 3
        });
        this.spawnParticles(x, y, palette.secondary, Math.floor(count / 3), {
          type: 'droplet', spread: 3, size: 2
        });
        break;

      case 'lightning':
        this.spawnParticles(x, y, palette.primary, Math.floor(count * 0.6), {
          type: 'lightning', spread: isSkill ? 8 : 5, size: 4
        });
        this.spawnParticles(x, y, palette.secondary, Math.floor(count * 0.4), {
          type: 'spark', spread: 4, size: 2
        });
        this.triggerFlash(palette.primary, isSkill ? 0.3 : 0.15);
        break;

      case 'ice':
        this.spawnParticles(x, y, palette.primary, count, {
          type: 'crystal', spread: isSkill ? 6 : 4, size: 4
        });
        this.spawnImpactWave(x, y, palette.secondary, isSkill ? 70 : 35);
        break;

      case 'wind':
        this.spawnParticles(x, y, palette.primary, count, {
          type: 'spark', spread: isSkill ? 8 : 5, size: 3, upward: true
        });
        this.spawnParticles(x, y, palette.secondary, Math.floor(count / 3), {
          type: 'spark', spread: 6, size: 2, upward: true
        });
        break;

      case 'earth':
        this.spawnParticles(x, y, palette.primary, count, {
          type: 'fragment', spread: isSkill ? 7 : 4, size: 4
        });
        this.spawnParticles(x, y, palette.secondary, Math.floor(count / 3), {
          type: 'fragment', spread: 3, size: 3
        });
        break;

      case 'dark':
        // Void particles that collapse inward
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 40;
          this.particles.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * (1.5 + Math.random()),
            vy: -Math.sin(angle) * (1.5 + Math.random()),
            life: 1,
            decay: 0.02 + Math.random() * 0.01,
            size: 3 + Math.random() * 3,
            color: Math.random() > 0.5 ? palette.primary : palette.secondary,
            type: 'circle',
          });
        }
        break;
    }
  },

  // Draw full-screen element effect during skill cinematic
  drawElementFullscreen(element, frame) {
    if (!element) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const palette = this.ELEMENT_COLORS[element];
    if (!palette) return;

    const progress = Math.min(1, frame / 15);

    ctx.save();
    switch (element) {
      case 'fire': {
        // Orange tint + flame columns
        ctx.fillStyle = 'rgba(255,69,0,' + (0.12 * (1 - progress)) + ')';
        ctx.fillRect(0, 0, w, h);
        // Flame columns from bottom
        const cols = 8;
        for (let i = 0; i < cols; i++) {
          const cx = (i + 0.5) * (w / cols);
          const colH = (0.3 + Math.sin(frame * 0.5 + i * 1.3) * 0.15) * h * (1 - progress * 0.5);
          const grad = ctx.createLinearGradient(cx, h, cx, h - colH);
          grad.addColorStop(0, 'rgba(255,69,0,' + (0.25 * (1 - progress)) + ')');
          grad.addColorStop(0.6, 'rgba(255,165,0,' + (0.12 * (1 - progress)) + ')');
          grad.addColorStop(1, 'rgba(255,215,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(cx - 20, h - colH, 40, colH);
        }
        break;
      }
      case 'water': {
        // Blue wave sweep
        ctx.fillStyle = 'rgba(0,100,200,' + (0.1 * (1 - progress)) + ')';
        ctx.fillRect(0, 0, w, h);
        const waveY = h * 0.6 + Math.sin(frame * 0.3) * 20;
        ctx.beginPath();
        ctx.moveTo(0, waveY);
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, waveY + Math.sin(x * 0.03 + frame * 0.4) * 15);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,191,255,' + (0.1 * (1 - progress)) + ')';
        ctx.fill();
        break;
      }
      case 'lightning': {
        // Flash + lightning bolts
        if (frame < 3) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.3 * (1 - frame / 3)) + ')';
          ctx.fillRect(0, 0, w, h);
        }
        // Random jagged bolts
        if (frame < 10) {
          ctx.strokeStyle = 'rgba(255,244,79,' + (0.6 * (1 - progress)) + ')';
          ctx.lineWidth = 2 + Math.random() * 2;
          ctx.shadowColor = '#fff44f';
          ctx.shadowBlur = 15;
          for (let b = 0; b < 3; b++) {
            ctx.beginPath();
            let bx = Math.random() * w;
            let by = 0;
            ctx.moveTo(bx, by);
            while (by < h) {
              bx += (Math.random() - 0.5) * 60;
              by += 15 + Math.random() * 30;
              ctx.lineTo(bx, by);
            }
            ctx.stroke();
          }
        }
        break;
      }
      case 'ice': {
        // Frost overlay + crystal patterns
        ctx.fillStyle = 'rgba(0,255,255,' + (0.06 * (1 - progress)) + ')';
        ctx.fillRect(0, 0, w, h);
        // Frost border
        const borderW = 30 * (1 - progress);
        const frostGrad = ctx.createLinearGradient(0, 0, borderW, 0);
        frostGrad.addColorStop(0, 'rgba(224,240,255,' + (0.3 * (1 - progress)) + ')');
        frostGrad.addColorStop(1, 'rgba(224,240,255,0)');
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, 0, borderW, h);
        const frostGrad2 = ctx.createLinearGradient(w, 0, w - borderW, 0);
        frostGrad2.addColorStop(0, 'rgba(224,240,255,' + (0.3 * (1 - progress)) + ')');
        frostGrad2.addColorStop(1, 'rgba(224,240,255,0)');
        ctx.fillStyle = frostGrad2;
        ctx.fillRect(w - borderW, 0, borderW, h);
        break;
      }
      case 'wind': {
        // Swirling wind streaks
        ctx.globalAlpha = 0.15 * (1 - progress);
        ctx.strokeStyle = palette.primary;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const cy = (i / 8) * h;
          const offset = frame * 8 + i * 40;
          ctx.beginPath();
          ctx.moveTo(-20 + (offset % (w + 80)), cy + Math.sin(frame * 0.2 + i) * 20);
          ctx.quadraticCurveTo(
            w * 0.5, cy + Math.sin(frame * 0.3 + i * 2) * 40,
            w + 20, cy + Math.sin(frame * 0.2 + i + 2) * 20
          );
          ctx.stroke();
        }
        break;
      }
      case 'earth': {
        // Ground crack + dust
        ctx.fillStyle = 'rgba(139,69,19,' + (0.08 * (1 - progress)) + ')';
        ctx.fillRect(0, 0, w, h);
        // Cracks from center bottom
        if (frame < 10) {
          ctx.strokeStyle = 'rgba(218,165,32,' + (0.3 * (1 - progress)) + ')';
          ctx.lineWidth = 2;
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(w / 2, h);
            let cx = w / 2;
            let cy = h;
            const angle = -Math.PI / 2 + (i - 2) * 0.5;
            for (let s = 0; s < 6; s++) {
              cx += Math.cos(angle + (Math.random() - 0.5) * 0.8) * (15 + Math.random() * 10);
              cy += Math.sin(angle + (Math.random() - 0.5) * 0.8) * (15 + Math.random() * 10);
              ctx.lineTo(cx, cy);
            }
            ctx.stroke();
          }
        }
        break;
      }
      case 'dark': {
        // Dark vortex
        const vortexAlpha = 0.2 * (1 - progress);
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.5);
        grad.addColorStop(0, 'rgba(74,0,128,' + vortexAlpha + ')');
        grad.addColorStop(0.5, 'rgba(128,0,128,' + (vortexAlpha * 0.5) + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
    }
    ctx.restore();
  },

  // ═══════════════════════════════════════════
  //  3. IMPACT WAVE SYSTEM
  // ═══════════════════════════════════════════

  spawnImpactWave(x, y, color, maxRadius) {
    while (this.impactWaves.length >= this.MAX_IMPACT_WAVES) this.impactWaves.shift();
    this.impactWaves.push({
      x, y, color, maxRadius: maxRadius || 50,
      radius: 0, alpha: 1, lineWidth: 3,
    });
  },

  // Skill activation shockwave: large expanding ring from caster with thick leading edge
  spawnShockwave(x, y, color, maxRadius, lineWidth) {
    if (!this.shockwaves) this.shockwaves = [];
    while (this.shockwaves.length >= this.MAX_SHOCKWAVES) this.shockwaves.shift();
    this.shockwaves.push({
      x, y,
      color: color || '#c084fc',
      maxRadius: maxRadius || 120,
      radius: 0,
      alpha: 1,
      lineWidth: lineWidth || 8,
    });
  },

  updateShockwaves() {
    if (!this.shockwaves) { this.shockwaves = []; return; }
    const ts = this.timeScale;
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius / 18) * ts;
      sw.alpha = Math.pow(1 - sw.radius / sw.maxRadius, 0.5);
      sw.lineWidth = Math.max(0.5, sw.lineWidth * (1 - sw.radius / sw.maxRadius * 0.6));
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }
  },

  drawShockwaves() {
    if (!this.shockwaves || !this.shockwaves.length) return;
    const ctx = this.ctx;
    for (const sw of this.shockwaves) {
      if (sw.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 20 * sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      // Inner bright ring
      ctx.globalAlpha = sw.alpha * 0.4;
      ctx.lineWidth = sw.lineWidth * 0.4;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },

  updateImpactWaves() {
    const ts = this.timeScale;
    for (let i = this.impactWaves.length - 1; i >= 0; i--) {
      const w = this.impactWaves[i];
      w.radius += (w.maxRadius / 20) * ts;
      w.alpha = 1 - (w.radius / w.maxRadius);
      w.lineWidth = Math.max(0.5, 3 * w.alpha);
      if (w.alpha <= 0 || w.radius >= w.maxRadius) {
        this.impactWaves.splice(i, 1);
      }
    }
  },

  drawImpactWaves() {
    const ctx = this.ctx;
    for (const w of this.impactWaves) {
      if (w.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = w.alpha;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = w.lineWidth;
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 8 * w.alpha;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════
  //  4. KILL EFFECT SYSTEM
  // ═══════════════════════════════════════════

  spawnKillEffect(targetSprite) {
    const x = targetSprite.x;
    const y = targetSprite.y;

    // Dramatic death: sprite collapses — scale shrinks to 0.5, opacity fades to 0 over 400ms
    targetSprite._deathAnim = {
      startTime: Date.now(),
      durationMs: 400,
    };

    // Massive shatter burst — 35 fragments in all directions
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 8;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        life: 1,
        decay: 0.008 + Math.random() * 0.007,
        size: 3 + Math.random() * 7,
        color: ['#ff4444', '#ff6b6b', '#cc2222', '#ff8844', '#ffaa44', '#ffffff'][Math.floor(Math.random() * 6)],
        type: 'fragment',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.5,
      });
    }
    // Extra ember sparks for impact energy
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.018 + Math.random() * 0.012,
        size: 2 + Math.random() * 3,
        color: '#ffaa33',
        type: 'ember',
        flickerPhase: Math.random() * Math.PI * 2,
      });
    }

    // Ghost/soul particles floating upward (Three Kingdoms: the hero's spirit ascending)
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.6 - Math.random() * 1.2,
        life: 1,
        decay: 0.004 + Math.random() * 0.004,
        size: 3 + Math.random() * 5,
        color: '#ffffff',
        type: 'circle',
        ghost: true,
      });
    }

    // Blood red cloud burst
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * (1 + Math.random() * 2),
        vy: Math.sin(angle) * (1 + Math.random() * 2) - 1,
        life: 1,
        decay: 0.014,
        size: 6 + Math.random() * 8,
        color: 'rgba(180,20,20,0.6)',
        type: 'circle',
        ghost: false,
      });
    }

    // Zoom pulse (scale 1.02 → 1 over 10 frames)
    this.zoomPulse = 12;

    // Chromatic aberration flash (5 frames — more dramatic for a kill)
    this.chromaticFrames = 5;

    // Double impact wave — inner red, outer white
    this.spawnImpactWave(x, y, '#ff2222', 80);
    this.spawnImpactWave(x, y, 'rgba(255,100,100,0.4)', 120);

    // Large floating kill text
    this.addFloatingText(x, y - 30, '击 杀', '#ff4444', {
      size: 26, bold: true, outline: true, decay: 0.007, vy: -1.2, isCrit: true
    });
  },

  // ═══════════════════════════════════════════
  //  5. SKILL CINEMATIC SYSTEM
  // ═══════════════════════════════════════════

  startCinematic(skillName, element, x, y) {
    this.cinematicActive = {
      phase: 0,       // 0=dim-in, 1=text, 2=element-fx, 3=fade-out
      frame: 0,
      totalFrame: 0,
      skillName: skillName || '技能',
      element: element || null,
      x, y,
      dimAlpha: 0,
      textScale: 2.8,
      textAlpha: 0,
      effectFrame: 0,
    };
  },

  updateCinematic() {
    const c = this.cinematicActive;
    if (!c) return;

    c.frame += this.timeScale;
    c.totalFrame++;

    switch (c.phase) {
      case 0: // Dim in (5 frames)
        c.dimAlpha = Math.min(0.3, c.dimAlpha + 0.06 * this.timeScale);
        if (c.frame >= 5) { c.phase = 1; c.frame = 0; }
        break;
      case 1: // Skill name text appears (20 frames)
        c.textAlpha = Math.min(1, c.textAlpha + 0.07 * this.timeScale);
        c.textScale = Math.max(1, c.textScale - 0.1 * this.timeScale);
        if (c.frame >= 20) { c.phase = 2; c.frame = 0; c.effectFrame = 0; }
        break;
      case 2: // Element effect plays (18 frames)
        c.effectFrame += this.timeScale;
        if (c.frame >= 18) {
          // Spawn impact wave at end of effect
          this.spawnImpactWave(this.width / 2, this.height / 2, '#ffffff', this.width * 0.6);
          c.phase = 3;
          c.frame = 0;
        }
        break;
      case 3: // Fade out (12 frames)
        c.dimAlpha = Math.max(0, c.dimAlpha - 0.025 * this.timeScale);
        c.textAlpha = Math.max(0, c.textAlpha - 0.1 * this.timeScale);
        if (c.frame >= 12) { this.cinematicActive = null; }
        break;
    }
  },

  drawCinematic() {
    const c = this.cinematicActive;
    if (!c) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Dim overlay
    if (c.dimAlpha > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,' + c.dimAlpha + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Element-specific full-screen effect (phase 2)
    if (c.phase === 2 || (c.phase === 3 && c.effectFrame > 0)) {
      this.drawElementFullscreen(c.element, c.effectFrame);
    }

    // Skill name text
    if (c.textAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = c.textAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fontSize = Math.floor(32 * c.textScale);
      ctx.font = 'bold ' + fontSize + 'px "STKaiti", "KaiTi", "楷体", serif';

      // Gold outline
      ctx.strokeStyle = '#d4a843';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(212,168,67,0.9)';
      ctx.shadowBlur = 25;
      ctx.strokeText(c.skillName, w / 2, h / 2);

      // White fill
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 15;
      ctx.fillText(c.skillName, w / 2, h / 2);

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════
  //  PARTICLES (enhanced with new types)
  // ═══════════════════════════════════════════

  spawnParticles(x, y, color, count, opts = {}) {
    // Enforce particle cap
    const available = this.MAX_PARTICLES - this.particles.length;
    const toSpawn = Math.min(count, Math.max(0, available));

    for (let i = 0; i < toSpawn; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (opts.spread || 4),
        vy: (Math.random() - 0.5) * (opts.spread || 4) - (opts.upward ? 2 : 0),
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: (opts.size || 3) + Math.random() * 2,
        color,
        type: opts.type || 'circle',
        // Extra fields for special types
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        ghost: false,
        flickerPhase: Math.random() * Math.PI * 2,
      });
    }
  },

  drawParticles() {
    const ctx = this.ctx;
    const ts = this.timeScale;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * ts;
      p.y += p.vy * ts;
      p.life -= p.decay * ts;

      // Gravity varies by type
      if (p.type === 'fragment') {
        p.vy += 0.15 * ts; // heavier gravity
        if (p.rotation !== undefined) p.rotation += (p.rotSpeed || 0) * ts;
      } else if (p.type === 'crystal') {
        p.vy += 0.02 * ts; // very light, drifts down
      } else if (p.type === 'ember') {
        p.vy -= 0.03 * ts; // embers float up
        p.vx += (Math.random() - 0.5) * 0.3 * ts; // flicker sideways
      } else if (p.type === 'droplet') {
        p.vy += 0.12 * ts; // falls like water
      } else {
        p.vy += 0.05 * ts; // default gravity
      }

      if (p.life <= 0) { this.particles.splice(i, 1); continue; }

      ctx.save();

      // Ghost particles get extra ethereal glow
      if (p.ghost) {
        ctx.globalAlpha = p.life * (0.3 + Math.sin(Date.now() * 0.005 + i) * 0.2);
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 8;
      } else {
        ctx.globalAlpha = p.life;
      }

      ctx.fillStyle = p.color;

      // ── Type-specific rendering ──
      if (p.type === 'spark') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size * 0.3, p.y);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineTo(p.x - p.size * 0.3, p.y);
        ctx.closePath();
        ctx.fill();

      } else if (p.type === 'star') {
        const s = p.size;
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const angle = (j * 4 * Math.PI / 5) - Math.PI / 2;
          const r = j % 2 === 0 ? s : s * 0.4;
          ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();

      } else if (p.type === 'ember') {
        // Flickering flame particle
        const flicker = 0.5 + Math.sin(Date.now() * 0.015 + (p.flickerPhase || 0)) * 0.5;
        ctx.globalAlpha = p.life * flicker;
        const eSize = p.size * p.life * (0.7 + flicker * 0.3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, eSize, 0, Math.PI * 2);
        ctx.fill();
        // Tiny ember trail
        ctx.globalAlpha = p.life * flicker * 0.3;
        ctx.beginPath();
        ctx.arc(p.x - p.vx * 2, p.y - p.vy * 2, eSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'crystal') {
        // Hexagonal crystal
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        const cs = p.size * p.life;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2 - Math.PI / 6;
          const hx = Math.cos(angle) * cs;
          const hy = Math.sin(angle) * cs;
          j === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.7;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = p.life * 0.4;
        ctx.stroke();
        ctx.restore();

      } else if (p.type === 'lightning') {
        // Jagged line segment near origin
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        let lx = p.x;
        let ly = p.y;
        ctx.moveTo(lx, ly);
        const segs = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < segs; j++) {
          lx += (Math.random() - 0.5) * p.size * 4;
          ly += (Math.random() - 0.5) * p.size * 4;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();

      } else if (p.type === 'droplet') {
        // Teardrop water particle
        ctx.beginPath();
        const ds = p.size * p.life;
        ctx.moveTo(p.x, p.y - ds * 1.5);
        ctx.quadraticCurveTo(p.x + ds, p.y, p.x, p.y + ds * 0.5);
        ctx.quadraticCurveTo(p.x - ds, p.y, p.x, p.y - ds * 1.5);
        ctx.closePath();
        ctx.fill();

      } else if (p.type === 'fragment') {
        // Rectangular fragment chunk with rotation
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        const fw = p.size * 1.2;
        const fh = p.size * 0.7;
        ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
        // Highlight edge
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(-fw / 2, -fh / 2, fw, fh * 0.3);
        ctx.restore();

      } else {
        // Default circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  },

  // ═══ FLOATING TEXT — cinematic bounce + scale pop + fade ═══
  addFloatingText(x, y, text, color, opts = {}) {
    this.floatingTexts.push({
      x, y, text, color,
      life: 1,
      decay: opts.decay || 0.014,
      vy: opts.vy || -2.2,
      vx: opts.vx !== undefined ? opts.vx : (Math.random() - 0.5) * 0.8,
      gy: 0.06,
      size: opts.size || 16,
      bold: opts.bold !== undefined ? opts.bold : true,
      outline: opts.outline !== undefined ? opts.outline : true,
      isCrit: opts.isCrit || false,
      // Scale pop: starts at 1.5, settles to 1.0 in first 20% of lifetime
      scalePop: 1.5,
      bounced: false,
    });
  },

  drawFloatingTexts() {
    const ctx = this.ctx;
    const ts = this.timeScale;
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      // Physics: decelerate upward then gently fall back
      t.vy += t.gy * ts;
      t.y += t.vy * ts;
      t.x += (t.vx || 0) * ts;
      t.life -= t.decay * ts;
      if (t.life <= 0) { this.floatingTexts.splice(i, 1); continue; }

      // ── Scale pop: 1.5 → 1.0 in first 20% of life, then stays at 1.0 and fades ──
      const lifeProgress = 1 - t.life; // 0→1 as text ages

      let scaleMult;
      if (lifeProgress < 0.20) {
        // Pop phase: 1.5 → 1.0 with ease-out
        const popT = lifeProgress / 0.20; // 0→1 within pop phase
        const eased = 1 - Math.pow(1 - popT, 2); // ease-out
        scaleMult = 1.5 - 0.5 * eased; // 1.5 → 1.0
      } else if (t.isCrit) {
        // Crit: stays large a bit then gradually shrinks
        scaleMult = 1.0 + (1 - lifeProgress) * 0.15;
      } else {
        scaleMult = 1.0;
      }

      // Alpha: fully opaque for first 60% of life, then fades
      const alpha = lifeProgress < 0.6 ? 1.0 : Math.max(0, (1 - lifeProgress) / 0.4);

      ctx.save();
      ctx.globalAlpha = alpha;
      const fontSize = Math.floor(t.size * Math.max(0.7, scaleMult));
      ctx.font = (t.bold ? 'bold ' : '') + fontSize + 'px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (t.outline) {
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = t.isCrit ? 6 : 3.5;
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 10;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
      }

      // Glow effect for crits — stronger glow
      if (t.isCrit) {
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 20;
      }
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  },

  // ═══ SCREEN EFFECTS ═══
  triggerShake(intensity) {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
  },

  triggerFlash(color, alpha) {
    this.flashColor = color || '#fff';
    this.flashAlpha = alpha || 0.4;
  },

  // ═══ ATTACK LINE — pulsing animated battle line ═══
  drawAttackLine(fromKey, toKey) {
    const from = this.fighters[fromKey];
    const to = this.fighters[toKey];
    if (!from || !to) return;

    const ctx = this.ctx;
    const progress = from.attackAnim;
    if (progress <= 0) return;

    const now = Date.now();
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.015); // 0–1 pulsing factor
    const alpha = Math.max(0, (1 - progress) * (0.6 + pulse * 0.4));

    const midX = from.x + (to.x - from.x) * Math.min(progress * 2, 1);
    const midY = from.y + (to.y - from.y) * Math.min(progress * 2, 1);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow line
    ctx.strokeStyle = 'rgba(212,168,67,' + (0.3 + pulse * 0.3) + ')';
    ctx.lineWidth = 8 + pulse * 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#d4a843';
    ctx.shadowBlur = 12 + pulse * 8;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(midX, midY);
    ctx.stroke();

    // Core bright line
    ctx.strokeStyle = '#f5d98a';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(midX, midY);
    ctx.stroke();

    ctx.restore();
  },

  // ═══ BATTLE DIVIDER LINE — persistent pulsing line between armies ═══
  drawBattleDivider() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const midX = w / 2;
    const now = Date.now();
    const pulse = 0.4 + 0.3 * Math.sin(now * 0.002);

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = 'rgba(212,168,67,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.lineDashOffset = -(now * 0.02 % 12);
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, h - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  },

  // ═══════════════════════════════════════════
  //  VFX PROCESSING (enhanced)
  // ═══════════════════════════════════════════

  processVFX(vfxList) {
    for (const fx of vfxList) {
      const target = this.fighters[fx.target];
      const attacker = this.fighters[fx.attacker];

      if (fx.type === 'attack') {
        // ── WIND-UP: Attacker scales up briefly before lunging ──
        if (attacker && attacker.f.alive) {
          // Brief wind-up scale pulse (feel of gathering power)
          attacker.scale = 1.2;
          setTimeout(() => { if (attacker && attacker.f.alive) attacker.scale = 1; }, 60);
        }

        // ── ATTACKER LUNGE ANIMATION (delayed slightly for wind-up) ──
        const LUNGE_DELAY = 50; // 50ms wind-up before lunge
        const doLunge = () => {
          if (attacker && target && attacker.f.alive) {
            const origX = attacker.baseX !== undefined ? attacker.baseX : attacker.x;
            const origY = attacker.baseY !== undefined ? attacker.baseY : attacker.y;
            if (attacker.baseX === undefined) { attacker.baseX = attacker.x; attacker.baseY = attacker.y; }

            const dx = target.x - origX;
            const dy = target.y - origY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            // Lunge 30-40px toward target — feels aggressive without teleporting
            const lungeAmount = Math.min(40, dist * 0.38);
            const lungeRatio = lungeAmount / (dist || 1);
            const lungeX = origX + dx * lungeRatio;
            const lungeY = origY + dy * lungeRatio;

            attacker._lungeAnim = {
              phase: 'forward',
              startX: origX, startY: origY,
              targetX: lungeX, targetY: lungeY,
              progress: 0,
              startTime: Date.now(),
              forwardMs: 90,   // 90ms aggressive rush
              holdMs: 50,      // 50ms contact hold
              returnMs: 240,   // 240ms ease back (weightier recovery)
            };
          }
        };
        setTimeout(doLunge, LUNGE_DELAY);

        if (target) {
          // ── IMPACT moment: delayed to match lunge contact ──
          const IMPACT_DELAY = LUNGE_DELAY + 90; // matches forwardMs

          setTimeout(() => {
            if (!target) return;
            // Guard stale delayed impact: attacker might have died before contact frame.
            if (!attacker || !attacker.f || !attacker.f.alive || attacker.f.hp <= 0) return;

            // Strong hit shake — more displacement for real game feel
            const shakeStrength = fx.isCrit ? 18 : 10;
            target.shakeX = (Math.random() - 0.5) * shakeStrength;
            target.shakeY = (Math.random() - 0.5) * (shakeStrength * 0.7);
            target.hitFlash = 1;

            // Slash trail at impact point
            const slashColor = fx.isCrit ? '#ffd700' : '#ffffff';
            this.spawnSlashTrail(target.x, target.y, fx.isCrit, slashColor);

            // ── Screen flash: brief white/red on EVERY hit, stronger on crits ──
            if (fx.isCrit) {
              this.triggerFlash('#ff3300', 0.28);   // red-orange flash on crit
              this.chromaticFrames = 4;
            } else {
              this.triggerFlash('#ffffff', 0.10);   // subtle white flash on normal hit
            }

            // ── Camera shake: crits get heavy shake, normal hits get light shake ──
            if (fx.isCrit) {
              this.triggerShake(9);
              this.timeSlowFrames = 7;
              this.timeScale = 0.25;
              this.zoomPulse = 10;
            } else {
              this.triggerShake(4);
            }

            // ── Hit particles — 10-15 burst outward ──
            const attackerElement = attacker ? this.getHeroElement(attacker.f.id) : null;
            if (attackerElement) {
              this.spawnElementVFX(target.x, target.y, attackerElement, 'attack');
            }

            // Base burst particles (always spawn, heavier on crit)
            const comboBonus = fx.combo && fx.combo > 1 ? Math.min(8, fx.combo) : 0;
            const particleCount = (fx.isCrit ? 15 : 10) + comboBonus;
            this.spawnParticles(target.x, target.y, fx.isCrit ? '#ffd700' : '#ff6b6b', particleCount, {
              spread: fx.isCrit ? 7 : 5,
              type: fx.isCrit ? 'star' : 'spark',
              size: fx.isCrit ? 4 : 3,
            });
            // White hot core sparks
            this.spawnParticles(target.x, target.y, '#ffffff', fx.isCrit ? 8 : 4, {
              spread: fx.isCrit ? 5 : 3,
              type: 'spark',
              size: fx.isCrit ? 3 : 2,
            });

            // ── Impact wave ──
            if (fx.isCrit) {
              this.spawnImpactWave(target.x, target.y, '#ffd700', 80);
              this.spawnImpactWave(target.x, target.y, 'rgba(255,150,0,0.4)', 120);
            } else {
              this.spawnImpactWave(target.x, target.y, 'rgba(255,120,80,0.6)', 45);
            }

            // ── Damage number: scale 1.5 → 1.0 pop then fade ──
            this.addFloatingText(
              target.x + (Math.random() - 0.5) * 18,
              target.y - 24,
              (fx.isCrit ? '暴击! ' : '-') + fx.dmg,
              fx.isCrit ? '#ffd700' : '#ff7070',
              {
                size: fx.isCrit ? 26 : 18,
                bold: true,
                outline: true,
                isCrit: fx.isCrit,  // triggers 1.5→1.0 scale pop in drawFloatingTexts
                vy: fx.isCrit ? -3.8 : -2.4,
                decay: fx.isCrit ? 0.010 : 0.013,
              }
            );

            // Combo feedback (small but high-contrast): makes burst cadence readable.
            if (fx.combo && fx.combo > 1) {
              this.addFloatingText(
                target.x + 4,
                target.y - 46,
                `x${fx.combo} 连击`,
                '#ffe7a3',
                { size: 14, bold: true, outline: true, vy: -1.6, decay: 0.018 }
              );
              this.triggerShake(Math.min(11, 4 + Math.floor(fx.combo / 2)));
            }
          }, IMPACT_DELAY);
        }

        if (attacker) {
          attacker.attackAnim = 1;
        }
      }

      if (fx.type === 'skill') {
        const caster = this.fighters[fx.caster];
        if (caster) {
          caster.skillGlow = 1;

          // ── Skill cinematic ──
          const casterElement = this.getHeroElement(caster.f.id);
          this.startCinematic(fx.skillName || '技能', casterElement, caster.x, caster.y);

          // Skill name floating text on caster
          this.addFloatingText(
            caster.x, caster.y - 35,
            '【' + fx.skillName + '】',
            '#c084fc',
            { size: 15, bold: true, decay: 0.009, vy: -1.0, outline: true }
          );

          // ── CIRCULAR SHOCKWAVE RING expanding from caster (the new signature skill feel) ──
          const skillColor = casterElement
            ? (this.ELEMENT_COLORS[casterElement]?.primary || '#c084fc')
            : '#c084fc';
          this.spawnShockwave(caster.x, caster.y, skillColor, this.width * 0.55, 10);
          // Second smaller inner ring for depth
          setTimeout(() => {
            this.spawnShockwave(caster.x, caster.y, '#ffffff', this.width * 0.3, 5);
          }, 80);

          // ── Element-specific VFX at skill intensity ──
          if (casterElement) {
            this.spawnElementVFX(caster.x, caster.y, casterElement, 'skill');
          } else {
            // Fallback: heavy purple particle burst
            this.spawnParticles(caster.x, caster.y, '#c084fc', 28, {
              spread: 7, type: 'star', size: 4, upward: true
            });
            this.spawnParticles(caster.x, caster.y, '#ffffff', 10, {
              spread: 4, type: 'spark', size: 2, upward: true
            });
          }

          // Full-width impact wave
          this.spawnImpactWave(caster.x, caster.y, '#c084fc', this.width * 0.45);

          // Strong shake + flash on skill activation
          this.triggerShake(7);
          this.triggerFlash(skillColor, 0.22);
          this.chromaticFrames = 3;
          this.zoomPulse = 8;
        }
      }

      if (fx.type === 'kill') {
        if (target) {
          // ── Premium kill effect: screen flash + heavy shake + full particle burst ──
          this.spawnKillEffect(target);
          this.triggerShake(14);
          this.triggerFlash('#ff2200', 0.35);   // intense red flash on death
          this.chromaticFrames = 6;
          this.zoomPulse = 14;
          this.timeSlowFrames = 10;
          this.timeScale = 0.2;  // dramatic slow-mo on kill
        }
      }

      // ── DynamicBattlefield: environmental hazard ──
      if (fx.type === 'hazard') {
        if (target) {
          target.hitFlash = 1;
          target.shakeX = (Math.random() - 0.5) * 12;
          target.shakeY = (Math.random() - 0.5) * 8;
          // Hazard-specific colors
          const hazardColors = {
            water: '#4682B4', physical: '#8B7355', poison: '#228B22', lightning: '#FFD700'
          };
          const hColor = hazardColors[fx.hazardType] || '#ff6b6b';
          this.spawnParticles(target.x, target.y, hColor, 15, { spread: 6, type: 'spark', size: 3 });
          this.spawnImpactWave(target.x, target.y, hColor, 50);
          this.addFloatingText(target.x, target.y - 25, '-' + fx.dmg + ' 天灾', hColor, { size: 16, bold: true, outline: true });
          this.triggerShake(5);
          // Lightning gets a flash
          if (fx.hazardType === 'lightning') {
            this.triggerFlash('#FFD700', 0.25);
          }
        }
      }

      // ── DynamicBattlefield: weather change announcement ──
      if (fx.type === 'weather_change') {
        // Clear old weather particles
        if (typeof BattlefieldParticles !== 'undefined') {
          BattlefieldParticles.clearAll();
        }
        // Screen-wide announcement effect
        this.triggerFlash('#87CEEB', 0.1);
        this.triggerShake(2);
        // Show weather name as floating text
        const wData = (typeof DynamicBattlefield !== 'undefined') ? DynamicBattlefield.WEATHER[fx.weather] : null;
        if (wData) {
          this.addFloatingText(this.width / 2, this.height / 2 - 20,
            wData.icon + ' ' + wData.name,
            '#87CEEB', { size: 24, bold: true, outline: true, decay: 0.008, vy: -0.5 });
        }
      }

      // ── Battle Cry: general's opening quote shown on canvas ──
      if (fx.type === 'battleCry') {
        const hero = this.fighters[fx.hero];
        const cx = hero ? hero.x : this.width / 2;
        const cy = hero ? hero.y - 40 : this.height / 2 - 60;
        // Show quote as large floating text with golden color
        this.addFloatingText(cx, cy, '「' + fx.text + '」', '#f5d98a', {
          size: 13, bold: true, outline: true, decay: 0.004, vy: -0.5, vx: 0
        });
        // Hero name label
        this.addFloatingText(cx, cy + 20, '— ' + fx.heroName, '#d4a843', {
          size: 10, bold: false, outline: true, decay: 0.004, vy: -0.4, vx: 0
        });
        this.triggerShake(1);
        this.spawnParticles(cx, cy, '#d4a843', 8, { spread: 3, type: 'star', size: 2, upward: true });
      }

      // ── Bond Activate: show bond name + bonus when bond partners fight together ──
      if (fx.type === 'bondActivate') {
        // Show centered bond activation banner
        this.addFloatingText(this.width / 2, this.height * 0.35, fx.bondIcon + ' 羁绊觉醒: ' + fx.bondName, '#c084fc', {
          size: 16, bold: true, outline: true, decay: 0.005, vy: -0.6, vx: 0
        });
        this.addFloatingText(this.width / 2, this.height * 0.35 + 22, fx.bonusDesc, '#a855f7', {
          size: 11, bold: false, outline: true, decay: 0.005, vy: -0.5, vx: 0
        });
        // Purple glow particles from center
        this.spawnParticles(this.width / 2, this.height * 0.35, '#c084fc', 20, {
          spread: 8, type: 'star', size: 3, upward: true
        });
        this.spawnImpactWave(this.width / 2, this.height * 0.35, '#c084fc', this.width * 0.4);
        this.triggerFlash('#7c3aed', 0.12);
      }

      // ── Combo: multi-hit combo counter display ──
      if (fx.type === 'attack' && fx.combo >= 2 && target) {
        const comboColors = ['', '', '#ff9f43', '#ff6b6b', '#ee5a24', '#e84393', '#9b59b6'];
        const color = comboColors[Math.min(fx.combo, comboColors.length - 1)] || '#e84393';
        this.addFloatingText(
          target.x + 20, target.y - 40,
          'COMBO x' + fx.combo,
          color,
          { size: 18, bold: true, outline: true, isCrit: true, decay: 0.009, vy: -1.5 }
        );
      }
    }
  },

  // ═══ BACKGROUND (enhanced with DynamicBattlefield) ═══
  drawBackground(terrain, weather) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Get visual state from DynamicBattlefield if available
    let bfVisual = null;
    try {
      if (typeof DynamicBattlefield !== 'undefined' && DynamicBattlefield.state) {
        bfVisual = DynamicBattlefield.getVisualState();
      }
    } catch(e) { /* safe: fall back to basic terrain rendering */ }

    const terrainGrads = {
      plains:   ['#1a3a6a', '#2a5090', '#1e6632'],   // vibrant blue sky → green ground
      mountain: ['#1e2a40', '#2e4060', '#3a3a44'],   // slate dusk sky
      river:    ['#0e2040', '#1a3a60', '#0e4858'],   // blue water at dusk
      water:    ['#0e2040', '#1a3a60', '#0e4858'],
      forest:   ['#0c2010', '#163a18', '#204412'],   // dense green forest
      castle:   ['#180c28', '#2a1848', '#3c2440'],   // purple-tinted citadel night
      desert:   ['#3a2210', '#503018', '#381808'],   // scorched orange dusk
      swamp:    ['#0c1e0c', '#163016', '#102410'],   // murky swamp
      charred:  ['#1a0808', '#2e1810', '#321810'],   // ash and embers
    };
    // Use DynamicBattlefield terrain if available
    const effectiveTerrain = bfVisual ? bfVisual.terrainKey : terrain;
    const colors = terrainGrads[effectiveTerrain] || terrainGrads.plains;

    // Sky → ground gradient — vivid cinematic backgrounds
    if (bfVisual && bfVisual.skyColor) {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, bfVisual.skyColor);
      bgGrad.addColorStop(0.6, colors[1] || colors[0]);
      bgGrad.addColorStop(1, colors[2] || colors[1] || colors[0]);
      ctx.fillStyle = bgGrad;
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, colors[0]);
      bgGrad.addColorStop(0.55, colors[1]);
      bgGrad.addColorStop(1, colors[2] || colors[1]);
      ctx.fillStyle = bgGrad;
    }
    ctx.fillRect(0, 0, w, h);

    // Subtle ambient glow at horizon mid-point for depth
    const horizonY = h * 0.55;
    const horizonGrad = ctx.createRadialGradient(w * 0.5, horizonY, 0, w * 0.5, horizonY, w * 0.6);
    horizonGrad.addColorStop(0, 'rgba(212,168,67,0.04)');
    horizonGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = horizonGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground with terrain-specific color
    const groundY = h - 30;
    const groundColor = bfVisual ? bfVisual.groundColor : null;
    if (groundColor) {
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
      groundGrad.addColorStop(0, groundColor + '33');
      groundGrad.addColorStop(1, groundColor + '11');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, w, 30);
    } else {
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
      groundGrad.addColorStop(0, 'rgba(255,255,255,0.03)');
      groundGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, w, 30);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Terrain-specific decorations
    if (effectiveTerrain === 'mountain' || effectiveTerrain === 'castle') {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      for (let i = 0; i < 8; i++) {
        const mx = (i * w / 7) + Math.sin(i * 2.1) * 15;
        const mh = 8 + Math.sin(i * 1.7) * 5;
        ctx.beginPath();
        ctx.moveTo(mx - 20, groundY);
        ctx.lineTo(mx, groundY - mh);
        ctx.lineTo(mx + 20, groundY);
        ctx.fill();
      }
    }
    if (effectiveTerrain === 'forest') {
      ctx.fillStyle = 'rgba(34,100,34,0.06)';
      for (let i = 0; i < 6; i++) {
        const tx = 15 + i * (w / 5);
        ctx.beginPath();
        ctx.moveTo(tx - 8, groundY);
        ctx.lineTo(tx, groundY - 12 - Math.sin(i) * 4);
        ctx.lineTo(tx + 8, groundY);
        ctx.fill();
      }
    }
    if (effectiveTerrain === 'desert') {
      // Sand dunes
      ctx.fillStyle = 'rgba(210,180,100,0.04)';
      for (let i = 0; i < 5; i++) {
        const dx = (i * w / 4) + Math.sin(i * 1.5) * 20;
        const dh = 5 + Math.sin(i * 2.3) * 3;
        ctx.beginPath();
        ctx.ellipse(dx, groundY, 30, dh, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    }
    if (effectiveTerrain === 'swamp') {
      // Swamp bubbles
      ctx.fillStyle = 'rgba(50,100,50,0.05)';
      const t = Date.now() * 0.001;
      for (let i = 0; i < 4; i++) {
        const bx = w * (0.1 + i * 0.25);
        const by = groundY + Math.sin(t + i * 2) * 3;
        ctx.beginPath();
        ctx.arc(bx, by, 3 + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (effectiveTerrain === 'river') {
      // Water ripples
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#4682B4';
      ctx.lineWidth = 1;
      const t = Date.now() * 0.001;
      for (let i = 0; i < 5; i++) {
        const ry = groundY + 5 + i * 5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = ry + Math.sin(x * 0.03 + t + i * 0.8) * 2;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    if (effectiveTerrain === 'charred') {
      // Smoke wisps
      ctx.fillStyle = 'rgba(80,60,40,0.03)';
      const t = Date.now() * 0.0005;
      for (let i = 0; i < 4; i++) {
        const sx = w * (0.15 + i * 0.25);
        const sy = groundY - 5 - Math.sin(t + i * 1.3) * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 6 + Math.sin(t * 2 + i) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Animated battle divider line — drawn separately for pulse effect
    this.drawBattleDivider();

    // Weather effects (legacy + enhanced visual particles)
    if (!bfVisual) {
      if (weather === 'fog') {
        ctx.fillStyle = 'rgba(200,200,220,' + (0.03 + Math.sin(Date.now() * 0.001) * 0.02) + ')';
        ctx.fillRect(0, 0, w, h);
        // Use BattlefieldParticles for richer fog if available
        if (typeof BattlefieldParticles !== 'undefined') {
          BattlefieldParticles.update('fog', w, h, 1);
          BattlefieldParticles.draw(ctx, 'fog');
        }
      }
      if (weather === 'rain' || weather === 'storm') {
        // Dark rainy overlay
        ctx.fillStyle = 'rgba(30,50,80,' + (weather === 'storm' ? 0.12 : 0.07) + ')';
        ctx.fillRect(0, 0, w, h);
        // Use BattlefieldParticles for rain drops
        if (typeof BattlefieldParticles !== 'undefined') {
          BattlefieldParticles.update('rain', w, h, 1);
          BattlefieldParticles.draw(ctx, 'rain');
          // Storm: add occasional lightning flash
          if (weather === 'storm' && Math.random() < 0.015) {
            this.triggerFlash('#fff', 0.12);
          }
        } else {
          // Canvas-only rain fallback
          const t = Date.now() * 0.001;
          ctx.save();
          ctx.globalAlpha = 0.25;
          ctx.strokeStyle = 'rgba(180,210,255,0.6)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 40; i++) {
            const rx = ((i * 73 + t * 150) % (w + 40)) - 20;
            const ry = ((i * 47 + t * 400) % (h + 20));
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 5, ry + 14);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      if (weather === 'snow') {
        if (typeof BattlefieldParticles !== 'undefined') {
          BattlefieldParticles.update('snow', w, h, 1);
          BattlefieldParticles.draw(ctx, 'snow');
        } else {
          // Simple snow fallback
          const t = Date.now() * 0.001;
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          for (let i = 0; i < 25; i++) {
            const sx = ((i * 61 + t * 30) % (w + 10));
            const sy = ((i * 43 + t * 60) % (h + 10));
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      if (weather === 'wind') {
        const t = Date.now() * 0.002;
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const y = 30 + i * 55 + Math.sin(t + i) * 10;
          ctx.beginPath();
          ctx.moveTo((t * 50 + i * 100) % (w + 100) - 50, y);
          ctx.lineTo((t * 50 + i * 100) % (w + 100) + 40, y - 3);
          ctx.stroke();
        }
        ctx.restore();
        // Add wind leaves from BattlefieldParticles
        if (typeof BattlefieldParticles !== 'undefined') {
          BattlefieldParticles.update('wind_leaves', w, h, 1);
          BattlefieldParticles.draw(ctx, 'wind_leaves');
        }
      }
      if (weather === 'fire') {
        const fireGrad = ctx.createLinearGradient(0, h, 0, h - 50);
        fireGrad.addColorStop(0, 'rgba(200,50,20,' + (0.08 + Math.sin(Date.now() * 0.003) * 0.04) + ')');
        fireGrad.addColorStop(1, 'rgba(200,50,20,0)');
        ctx.fillStyle = fireGrad;
        ctx.fillRect(0, h - 50, w, 50);
      }
    }

    // ═══ DynamicBattlefield weather particles ═══
    if (bfVisual && typeof BattlefieldParticles !== 'undefined') {
      const particleType = bfVisual.particles;
      if (particleType) {
        BattlefieldParticles.update(particleType, w, h, 1);
        BattlefieldParticles.draw(ctx, particleType);
      }
      // Fog overlay
      if (bfVisual.overlay === 'fog') {
        BattlefieldParticles.update('fog', w, h, 1);
        BattlefieldParticles.draw(ctx, 'fog');
      }
      // Storm lightning flash
      if (bfVisual.flash && Math.random() < 0.02) {
        this.triggerFlash('#fff', 0.15);
      }
    }

    // ═══ Day/night brightness overlay ═══
    if (bfVisual && bfVisual.brightness < 1.0) {
      const darkAlpha = 1.0 - bfVisual.brightness;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,10,' + (darkAlpha * 0.6) + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Ambient floating particles
    if (!this._ambientParticles) {
      this._ambientParticles = [];
      for (let i = 0; i < 12; i++) {
        this._ambientParticles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.2 - Math.random() * 0.3,
          size: 1 + Math.random() * 1.5,
          alpha: 0.1 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    ctx.save();
    for (const ap of this._ambientParticles) {
      ap.x += ap.vx + Math.sin(Date.now() * 0.001 + ap.phase) * 0.2;
      ap.y += ap.vy;
      if (ap.y < -5) { ap.y = h + 5; ap.x = Math.random() * w; }
      if (ap.x < -5) ap.x = w + 5;
      if (ap.x > w + 5) ap.x = -5;
      ctx.globalAlpha = ap.alpha * (0.5 + Math.sin(Date.now() * 0.002 + ap.phase) * 0.5);
      ctx.fillStyle = weather === 'fire' ? '#ff8844' : '#d4a843';
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Turn counter + battlefield conditions
    if (Battle.state) {
      ctx.textAlign = 'center';
      if (bfVisual) {
        // Show weather + terrain + time + turn
        const wData = (typeof DynamicBattlefield !== 'undefined') ? DynamicBattlefield.WEATHER[bfVisual.weatherKey] : null;
        const tData = (typeof DynamicBattlefield !== 'undefined') ? DynamicBattlefield.TERRAIN[bfVisual.terrainKey] : null;
        const todData = (typeof DynamicBattlefield !== 'undefined') ? DynamicBattlefield.TIME_OF_DAY[bfVisual.timeKey] : null;
        if (wData && tData && todData) {
          ctx.font = '600 10px -apple-system, system-ui, sans-serif';
          ctx.fillStyle = 'rgba(212,168,67,0.5)';
          const statusText = wData.icon + wData.name + ' | ' + tData.icon + tData.name + ' | ' + todData.icon + todData.name + ' | 回合' + Battle.state.turn;
          ctx.fillText(statusText, w / 2, h - 8);
        }
      } else {
        ctx.font = '600 11px -apple-system, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(212,168,67,0.4)';
        ctx.fillText('回合 ' + Battle.state.turn, w / 2, h - 8);
      }
    }
  },

  // ═══════════════════════════════════════════
  //  6. VICTORY / DEFEAT ANIMATIONS (enhanced)
  // ═══════════════════════════════════════════

  drawVictoryAnim() {
    const v = this.victoryAnim;
    if (!v) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    v.frame++;

    // Golden light rays from center
    if (v.frame < 120) {
      ctx.save();
      const rayAlpha = Math.min(0.15, v.frame * 0.003);
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + v.frame * 0.01;
        const len = w * 0.8;
        const grad = ctx.createLinearGradient(
          w/2, h/2,
          w/2 + Math.cos(angle) * len, h/2 + Math.sin(angle) * len
        );
        grad.addColorStop(0, 'rgba(255,215,0,' + rayAlpha + ')');
        grad.addColorStop(0.5, 'rgba(255,215,0,' + (rayAlpha * 0.3) + ')');
        grad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(w/2, h/2);
        const spread = 0.08;
        ctx.lineTo(
          w/2 + Math.cos(angle - spread) * len,
          h/2 + Math.sin(angle - spread) * len
        );
        ctx.lineTo(
          w/2 + Math.cos(angle + spread) * len,
          h/2 + Math.sin(angle + spread) * len
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Confetti particles (spawn in bursts)
    if (v.frame % 6 === 0 && v.frame < 80) {
      const confettiColors = ['#ffd700', '#ff4444', '#22c55e', '#3b82f6', '#a855f7', '#ff8c00'];
      for (let i = 0; i < 5; i++) {
        const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.spawnParticles(
          w * 0.3 + Math.random() * w * 0.4,
          -10,
          color, 1,
          { type: 'fragment', spread: 4, size: 3 }
        );
      }
    }

    // "胜利" text with scale bounce
    const textFrame = Math.max(0, v.frame - 10);
    if (textFrame > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Bounce: overshoot then settle
      let scale;
      if (textFrame < 8) {
        scale = 1.8 - (textFrame / 8) * 0.6; // 1.8 → 1.2
      } else if (textFrame < 16) {
        scale = 1.2 - ((textFrame - 8) / 8) * 0.3; // 1.2 → 0.9
      } else if (textFrame < 22) {
        scale = 0.9 + ((textFrame - 16) / 6) * 0.1; // 0.9 → 1.0
      } else {
        scale = 1;
      }

      const alpha = Math.min(1, textFrame / 10);
      ctx.globalAlpha = alpha;

      const fontSize = Math.floor(40 * scale);
      ctx.font = 'bold ' + fontSize + 'px "STKaiti", "KaiTi", "楷体", -apple-system, sans-serif';

      // Gold glow
      ctx.shadowColor = 'rgba(255,215,0,0.8)';
      ctx.shadowBlur = 30;
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText('胜 利', w / 2, h / 2 - 15);

      ctx.fillStyle = '#ffd700';
      ctx.fillText('胜 利', w / 2, h / 2 - 15);

      ctx.restore();
    }
  },

  drawDefeatAnim() {
    const d = this.defeatAnim;
    if (!d) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    d.frame++;

    // Desaturation overlay (slowly increasing)
    const desatAlpha = Math.min(0.4, d.frame * 0.005);
    ctx.save();
    ctx.fillStyle = 'rgba(40,40,50,' + desatAlpha + ')';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Crack overlay
    if (d.frame > 15 && d.frame < 80) {
      ctx.save();
      ctx.strokeStyle = 'rgba(200,200,200,' + Math.min(0.25, (d.frame - 15) * 0.005) + ')';
      ctx.lineWidth = 1.5;
      // Draw cracks from center
      if (!d.cracks) {
        d.cracks = [];
        for (let i = 0; i < 7; i++) {
          const crack = [];
          let cx = w / 2 + (Math.random() - 0.5) * 40;
          let cy = h / 2 + (Math.random() - 0.5) * 30;
          crack.push({ x: cx, y: cy });
          const angle = Math.random() * Math.PI * 2;
          for (let j = 0; j < 5 + Math.floor(Math.random() * 4); j++) {
            cx += Math.cos(angle + (Math.random() - 0.5) * 1.2) * (10 + Math.random() * 15);
            cy += Math.sin(angle + (Math.random() - 0.5) * 1.2) * (10 + Math.random() * 15);
            crack.push({ x: cx, y: cy });
          }
          d.cracks.push(crack);
        }
      }
      for (const crack of d.cracks) {
        ctx.beginPath();
        for (let i = 0; i < crack.length; i++) {
          i === 0 ? ctx.moveTo(crack[i].x, crack[i].y) : ctx.lineTo(crack[i].x, crack[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // "败北" text with fade
    if (d.frame > 20) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const alpha = Math.min(1, (d.frame - 20) / 30);
      ctx.globalAlpha = alpha;

      const fontSize = 38;
      ctx.font = 'bold ' + fontSize + 'px "STKaiti", "KaiTi", "楷体", -apple-system, sans-serif';

      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeText('败 北', w / 2, h / 2 - 15);

      ctx.fillStyle = '#c04040';
      ctx.fillText('败 北', w / 2, h / 2 - 15);

      ctx.restore();
    }
  },

  // ═══════════════════════════════════════════
  //  MAIN RENDER LOOP (enhanced)
  // ═══════════════════════════════════════════

  render() {
    // CRITICAL: Always schedule the next frame FIRST, so exceptions can never kill the loop
    if (this.running) {
      this.animFrame = requestAnimationFrame(() => this.render());
    }
    if (!this.ctx || !this.canvas) return;

    // Self-healing: if fighters are empty but Battle.state exists, re-init them
    if (Object.keys(this.fighters).length === 0 && typeof Battle !== 'undefined' && Battle.state) {
      try {
        if (this.width < 10) this.resize();
        this.initFighters(Battle.state);
      } catch(e) { /* safe */ }
    }

    try {
    const ctx = this.ctx;
    const now = performance.now();

    // ── Time-slow management ──
    if (this.timeSlowFrames > 0) {
      this.timeSlowFrames--;
      if (this.timeSlowFrames <= 0) {
        this.timeScale = 1;
      }
    }

    // ── Zoom pulse management ──
    let zoomScale = 1;
    if (this.zoomPulse > 0) {
      zoomScale = 1 + 0.02 * (this.zoomPulse / 10);
      this.zoomPulse = Math.max(0, this.zoomPulse - 1);
    }

    ctx.save();

    // ── Chromatic aberration: render offset layers ──
    if (this.chromaticFrames > 0) {
      this.chromaticFrames--;
      // We'll draw after the main scene for the aberration effect
    }

    // ── Zoom pulse transform ──
    if (zoomScale > 1) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      ctx.translate(cx, cy);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-cx, -cy);
    }

    // Screen shake
    if (this.screenShake.intensity > 0.5) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= Math.pow(this.screenShake.decay, this.timeScale);
      ctx.translate(this.screenShake.x, this.screenShake.y);
    }

    // Background
    const terrain = Battle.state?.terrain || 'plains';
    const weather = Battle.state?.weather || 'clear';
    this.drawBackground(terrain, weather);

    // Update & draw fighters
    const ts = this.timeScale;
    for (const key in this.fighters) {
      const s = this.fighters[key];
      s.shakeX *= Math.pow(0.85, ts);
      s.shakeY *= Math.pow(0.85, ts);
      s.hitFlash *= Math.pow(0.92, ts);
      s.skillGlow *= Math.pow(0.97, ts);

      // Death animation: dramatic collapse — scale shrinks to 0.5, opacity fades to 0 over 400ms
      if (s._deathAnim) {
        const elapsed = Date.now() - s._deathAnim.startTime;
        const t = Math.min(1, elapsed / s._deathAnim.durationMs);
        // Ease-in: starts slow, accelerates toward end (dramatic collapse feel)
        const eased = t * t;
        s.shakeY = eased * 28;          // sinks rapidly downward
        s.alpha = Math.max(0, 1 - eased);   // fades fully to 0
        s.scale = Math.max(0.5, 1 - eased * 0.5); // shrinks to 0.5
        if (t >= 1) {
          s._deathAnim = null;
          s.alpha = 0;
          s.scale = 0.5;
        }
      }

      // Skip fully-dead fighters (death anim finished): alpha is 0, no need to render
      if (!s.f.alive && !s._deathAnim) {
        s.alpha = 0;
        continue;
      }

      // ── Lunge animation (attacker charges toward target) ──
      if (s._lungeAnim) {
        // Cancel lunge if unit is dead
        if (!s.f.alive) {
          s._lungeAnim = null;
          s.x = s.baseX;
          s.y = s.baseY;
        } else {
          const la = s._lungeAnim;
          const elapsed = Date.now() - la.startTime;
          if (la.phase === 'forward') {
            const t = Math.min(1, elapsed / la.forwardMs);
            // Ease-out for aggressive rush
            const eased = 1 - Math.pow(1 - t, 3);
            s.x = la.startX + (la.targetX - la.startX) * eased;
            s.y = la.startY + (la.targetY - la.startY) * eased;
            s.scale = 1 + 0.15 * eased; // Scale up during charge
            if (t >= 1) { la.phase = 'hold'; la.startTime = Date.now(); }
          } else if (la.phase === 'hold') {
            s.x = la.targetX;
            s.y = la.targetY;
            s.scale = 1.15;
            if (elapsed >= la.holdMs) { la.phase = 'return'; la.startTime = Date.now(); }
          } else if (la.phase === 'return') {
            const t = Math.min(1, elapsed / la.returnMs);
            // Ease-in-out for smooth return
            const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
            s.x = la.targetX + (la.startX - la.targetX) * eased;
            s.y = la.targetY + (la.startY - la.targetY) * eased;
            s.scale = 1.15 - 0.15 * eased;
            if (t >= 1) {
              s.x = la.startX; s.y = la.startY; s.scale = 1;
              s._lungeAnim = null;
            }
          }
        }
      } else if (s.attackAnim > 0) {
        // Legacy lunge (fallback) — skip if dead
        if (s.f.alive) {
          s.attackAnim -= 0.04 * ts;
          const lungeDir = s.facing;
          const lungeAmount = Math.sin(s.attackAnim * Math.PI) * 25;
          s.x = s.baseX + lungeDir * lungeAmount;
        } else {
          s.attackAnim = 0;
          s.x = s.baseX;
        }
      } else {
        s.y = s.baseY + Math.sin(Date.now() * 0.002 + s.f.pos * 1.5) * 1.5;
        s.x = s.baseX;
      }
      this.drawFighter(s);
    }

    // ── Slash trails (after fighters, before floating texts) ──
    this.updateSlashTrails();
    this.drawSlashTrails();

    // ── Shockwaves (skill activation rings) ──
    this.updateShockwaves();
    this.drawShockwaves();

    // ── Impact waves ──
    this.updateImpactWaves();
    this.drawImpactWaves();

    // Particles
    this.drawParticles();

    // Floating texts
    this.drawFloatingTexts();

    // ── Cinematic overlay ──
    this.updateCinematic();
    this.drawCinematic();

    // ── Victory / Defeat animations ──
    this.drawVictoryAnim();
    this.drawDefeatAnim();

    // Screen flash — decay at 0.82 per frame (matches shake, more visible)
    if (this.flashAlpha > 0.005) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(-10, -10, this.width + 20, this.height + 20);
      this.flashAlpha *= Math.pow(0.82, ts);
    }

    ctx.restore();

    // ── Chromatic aberration post-effect ──
    if (this.chromaticFrames > 0 || this._chromaticFading) {
      this._drawChromaticAberration();
    }

    this.lastFrameTime = now;
    } catch(e) {
      // NEVER let a render error kill the animation loop
      console.error('[BattleCanvas render]', e);
      try { this.ctx.restore(); } catch(e2) { /* safe */ }
    }
  },

  // Chromatic aberration: overlay shifted red/blue copies
  _drawChromaticAberration() {
    if (this.chromaticFrames <= 0 && !this._chromaticFading) return;

    const ctx = this.ctx;
    const offset = 2;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.12;

    // Red shift right
    ctx.drawImage(this.canvas, offset, 0);
    // Blue shift left (tint with overlay)
    ctx.drawImage(this.canvas, -offset, 0);

    ctx.restore();
  },

  // Alias for app.js compatibility
  setupFighters(battleState) {
    this.initFighters(battleState);
  },

  // Sync fighter state from battle engine
  syncState(battleState) {
    if (!battleState) return;
    // If fighters dict is empty but battle state has fighters, re-init
    if (Object.keys(this.fighters).length === 0) {
      if (this.width < 10) this.resize();
      this.initFighters(battleState);
      return;
    }
    const all = [...(battleState.player || []), ...(battleState.enemy || [])];
    for (const f of all) {
      if (!f) continue;
      const key = f.side + '-' + f.pos;
      const sprite = this.fighters[key];
      if (sprite) {
        sprite.f = f;
      }
    }
  },

  // ═══ DOM DAMAGE NUMBER (supplementary overlay) ═══
  showDamageNumber(targetPos, damage, isCrit, isHeal) {
    const overlay = document.getElementById('battle-canvas-wrap');
    if (!overlay) return;
    const el = document.createElement('div');
    el.className = 'damage-number' + (isCrit ? ' crit' : '') + (isHeal ? ' heal' : '');
    el.textContent = (isHeal ? '+' : '-') + damage.toLocaleString();
    // Position based on target index
    const isEnemy = targetPos >= 5;
    el.style.left = (isEnemy ? 55 + Math.random() * 30 : 15 + Math.random() * 30) + '%';
    el.style.top = (20 + (targetPos % 3) * 20 + Math.random() * 10) + '%';
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  // ═══ LIFECYCLE ═══
  start(battleState) {
    this.particles = [];
    this.floatingTexts = [];
    this.slashTrails = [];
    this.impactWaves = [];
    this.shockwaves = [];
    this.cinematicActive = null;
    this.victoryAnim = null;
    this.defeatAnim = null;
    this.timeScale = 1;
    this.timeSlowFrames = 0;
    this.zoomPulse = 0;
    this.chromaticFrames = 0;
    this.lastFrameTime = performance.now();
    this.screenShake = { x: 0, y: 0, intensity: 0, decay: 0.82 };
    this.flashAlpha = 0;
    this.running = true;
    // Always try to init fighters: use explicit arg or fall back to current Battle.state
    const bs = battleState || (typeof Battle !== 'undefined' ? Battle.state : null);
    if (bs) this.initFighters(bs);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.render();
  },

  stop() {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    // Clean up resize listener to prevent leak
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    // Clear portrait image cache to free memory
    this._portraitImages = {};
  },

  // ═══ VICTORY / DEFEAT SCENE ═══
  showVictory(battleState) {
    this.triggerFlash('#ffd700', 0.35);

    // Pick a triumphant Chinese phrase based on surviving generals
    const VICTORY_PHRASES = [
      '万胜！天命归汉！',
      '吾军威武！所向披靡！',
      '扬我国威，定鼎天下！',
      '青史留名，英雄归来！',
      '义之所在，无往不胜！',
    ];

    // Bond-specific victory phrases
    let victoryPhrase = VICTORY_PHRASES[Math.floor(Math.random() * VICTORY_PHRASES.length)];
    if (battleState) {
      const survivors = battleState.player.filter(f => f?.alive);
      const survivorIds = survivors.map(f => f.id);
      if (survivorIds.includes('liubei') && survivorIds.includes('guanyu') && survivorIds.includes('zhangfei')) {
        victoryPhrase = '桃园兄弟，义薄云天！天下大定！';
      } else if (survivorIds.includes('zhaoyun')) {
        victoryPhrase = '常山赵子龙，万夫莫敌！';
      } else if (survivorIds.includes('guanyu')) {
        victoryPhrase = '武圣关羽，义不容辞！大胜！';
      } else if (survivorIds.includes('zhugeLiang')) {
        victoryPhrase = '运筹帷幄，决胜千里！丞相神算！';
      } else if (survivorIds.includes('lvbu')) {
        victoryPhrase = '天下无敌！人中吕布！';
      } else if (survivorIds.includes('caocao')) {
        victoryPhrase = '宁教我负天下人！曹公大胜！';
      }
    }

    // Show triumph phrase as large floating text
    this.addFloatingText(this.width / 2, this.height / 2 + 35, victoryPhrase, '#ffd700', {
      size: 15, bold: true, outline: true, decay: 0.004, vy: -0.5, vx: 0
    });

    // Start victory animation state
    this.victoryAnim = { frame: 0 };

    // Golden burst particles
    this.spawnParticles(this.width / 2, this.height / 2, '#ffd700', 35, {
      spread: 10, type: 'star', size: 5, upward: true
    });
    this.spawnParticles(this.width / 2, this.height / 2, '#f5d98a', 25, {
      spread: 8, type: 'spark', size: 3
    });
    // Impact wave
    this.spawnImpactWave(this.width / 2, this.height / 2, '#ffd700', this.width * 0.5);
  },

  showDefeat() {
    this.triggerFlash('#c04040', 0.2);

    // Show a final defeat phrase
    const DEFEAT_PHRASES = [
      '天意如此，再图后举...',
      '胜败乃兵家常事，来日方长。',
      '此战虽败，志未消也。',
      '留得青山在，不怕没柴烧。',
    ];
    const phrase = DEFEAT_PHRASES[Math.floor(Math.random() * DEFEAT_PHRASES.length)];
    this.addFloatingText(this.width / 2, this.height / 2 + 35, phrase, '#c04040', {
      size: 13, bold: true, outline: true, decay: 0.004, vy: -0.4, vx: 0
    });

    // Start defeat animation state
    this.defeatAnim = { frame: 0, cracks: null };
  },
};

if (typeof window !== 'undefined') window.BattleCanvas = BattleCanvas;

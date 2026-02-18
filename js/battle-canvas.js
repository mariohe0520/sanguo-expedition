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

// 三国·天命 — Canvas Battle Renderer
// Replaces text-log combat with animated 2D battle scene

const BattleCanvas = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  animFrame: null,
  particles: [],
  floatingTexts: [],
  screenShake: { x: 0, y: 0, intensity: 0, decay: 0.9 },
  flashAlpha: 0,
  flashColor: '#fff',
  fighters: {}, // keyed by side-pos

  running: false,

  // ═══ INIT ═══
  init(canvasOrId) {
    this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const parent = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    this.width = parent.clientWidth;
    this.height = Math.min(320, Math.floor(this.width * 0.75));
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(dpr, dpr);
  },

  // ═══ FIGHTER SPRITES ═══
  initFighters(battleState) {
    this.fighters = {};
    if (!battleState) return;
    const leftX = this.width * 0.18;
    const rightX = this.width * 0.82;
    const startY = 35;
    const gapY = 52;

    for (const f of battleState.player) {
      if (!f) continue;
      const key = f.side + '-' + f.pos;
      this.fighters[key] = {
        f,
        x: leftX, baseX: leftX,
        y: startY + f.pos * gapY, baseY: startY + f.pos * gapY,
        scale: 1, alpha: 1,
        shakeX: 0, shakeY: 0,
        attackAnim: 0, // 0-1 animation progress
        hitFlash: 0,
        skillGlow: 0,
        facing: 1, // 1=right
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
        facing: -1, // -1=left
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
    const size = 40 * sprite.scale;
    const halfSize = size / 2;

    ctx.save();
    ctx.globalAlpha = sprite.alpha * (f.alive ? 1 : 0.3);

    // Portrait circle with faction color
    const vd = Visuals.HERO_DATA[f.id] || { ch: '?', c1: '#3a3f47', c2: '#6c757d' };
    const hero = HEROES[f.id];
    const factionColors = { shu: '#4a8c6f', wei: '#5a8fc7', wu: '#c04040', qun: '#9a6dd7' };
    const factionColor = factionColors[hero?.faction] || '#6c757d';

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

    // Character circle — gradient bg
    const grad = ctx.createLinearGradient(x - halfSize, y - halfSize, x + halfSize, y + halfSize);
    grad.addColorStop(0, vd.c1);
    grad.addColorStop(1, vd.c2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, halfSize, 0, Math.PI * 2);
    ctx.fill();

    // Rarity border
    const rarityColors = { 1: '#6c757d', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#d4a843' };
    const r = hero?.rarity || 1;
    ctx.strokeStyle = rarityColors[r] || '#6c757d';
    ctx.lineWidth = r >= 4 ? 3 : 2;
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

    // Chinese character
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.floor(size * 0.45) + 'px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(vd.ch, x, y + 1);
    ctx.shadowBlur = 0;

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

      // BG
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 2.5);
      ctx.fill();

      // Fill
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

      // Rage bar (thin, below HP)
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
        // Full rage glow
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

  // ═══ PARTICLES ═══
  spawnParticles(x, y, color, count, opts = {}) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (opts.spread || 4),
        vy: (Math.random() - 0.5) * (opts.spread || 4) - (opts.upward ? 2 : 0),
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: (opts.size || 3) + Math.random() * 2,
        color,
        type: opts.type || 'circle', // circle, spark, star
      });
    }
  },

  drawParticles() {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life -= p.decay;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;

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
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  },

  // ═══ FLOATING TEXT ═══
  addFloatingText(x, y, text, color, opts = {}) {
    this.floatingTexts.push({
      x, y, text, color,
      life: 1,
      decay: opts.decay || 0.015,
      vy: opts.vy || -1.5,
      size: opts.size || 16,
      bold: opts.bold || false,
      outline: opts.outline || false,
    });
  },

  drawFloatingTexts() {
    const ctx = this.ctx;
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life -= t.decay;
      if (t.life <= 0) { this.floatingTexts.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = t.life;
      ctx.font = (t.bold ? 'bold ' : '') + Math.floor(t.size * (1 + (1 - t.life) * 0.3)) + 'px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (t.outline) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(t.text, t.x, t.y);
      }
      ctx.fillStyle = t.color;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
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

  // ═══ ATTACK LINE ═══
  drawAttackLine(fromKey, toKey) {
    const from = this.fighters[fromKey];
    const to = this.fighters[toKey];
    if (!from || !to) return;

    const ctx = this.ctx;
    const progress = from.attackAnim;
    if (progress <= 0) return;

    // Slash line
    const midX = from.x + (to.x - from.x) * Math.min(progress * 2, 1);
    const midY = from.y + (to.y - from.y) * Math.min(progress * 2, 1);

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.strokeStyle = '#f5d98a';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#d4a843';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(midX, midY);
    ctx.stroke();
    ctx.restore();
  },

  // ═══ VFX PROCESSING ═══
  processVFX(vfxList) {
    for (const fx of vfxList) {
      const target = this.fighters[fx.target];
      const attacker = this.fighters[fx.attacker];

      if (fx.type === 'attack') {
        if (target) {
          // Hit shake
          target.shakeX = (Math.random() - 0.5) * 10;
          target.shakeY = (Math.random() - 0.5) * 6;
          target.hitFlash = 1;
          // Damage particles
          this.spawnParticles(target.x, target.y, fx.isCrit ? '#ffd700' : '#ff6b6b', fx.isCrit ? 15 : 8, {
            spread: fx.isCrit ? 6 : 3,
            type: fx.isCrit ? 'star' : 'spark',
            size: fx.isCrit ? 4 : 2,
          });
          // Floating damage
          this.addFloatingText(
            target.x + (Math.random() - 0.5) * 20,
            target.y - 25,
            (fx.isCrit ? '暴击! ' : '-') + fx.dmg,
            fx.isCrit ? '#ffd700' : '#ff6b6b',
            { size: fx.isCrit ? 22 : 16, bold: true, outline: true }
          );
          // Screen shake on big hits
          if (fx.isCrit) this.triggerShake(6);
          else this.triggerShake(2);
        }
        if (attacker) {
          // Attack lunge
          attacker.attackAnim = 1;
        }
      }

      if (fx.type === 'skill') {
        const caster = this.fighters[fx.caster];
        if (caster) {
          caster.skillGlow = 1;
          // Skill name floating text
          this.addFloatingText(
            caster.x, caster.y - 35,
            '【' + fx.skillName + '】',
            '#c084fc',
            { size: 14, bold: true, decay: 0.01, vy: -0.8, outline: true }
          );
          // Skill particles
          this.spawnParticles(caster.x, caster.y, '#c084fc', 20, {
            spread: 5, type: 'star', size: 3, upward: true
          });
          this.triggerShake(4);
          this.triggerFlash('#7c3aed', 0.15);
        }
      }

      if (fx.type === 'kill') {
        if (target) {
          // Death explosion
          this.spawnParticles(target.x, target.y, '#ff4444', 25, {
            spread: 8, type: 'spark', size: 4
          });
          this.spawnParticles(target.x, target.y, '#333', 15, {
            spread: 5, size: 3
          });
          this.addFloatingText(target.x, target.y - 30, '击杀!', '#ff4444', {
            size: 20, bold: true, outline: true
          });
          this.triggerShake(8);
          this.triggerFlash('#c04040', 0.2);
        }
      }
    }
  },

  // ═══ BACKGROUND ═══
  drawBackground(terrain, weather) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Base gradient per terrain
    const terrainGrads = {
      plains:   ['#0a1628', '#142840'],
      mountain: ['#0f1520', '#1a2535'],
      river:    ['#081828', '#0f2840'],
      water:    ['#081828', '#0f2840'],
      forest:   ['#081a10', '#102818'],
      castle:   ['#100c18', '#1a1428'],
    };
    const colors = terrainGrads[terrain] || terrainGrads.plains;
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, colors[0]);
    bgGrad.addColorStop(1, colors[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - 20);
    ctx.lineTo(w, h - 20);
    ctx.stroke();

    // VS divider
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#d4a843';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 10);
    ctx.lineTo(w / 2, h - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Weather effects
    if (weather === 'fog') {
      ctx.fillStyle = 'rgba(200,200,220,' + (0.03 + Math.sin(Date.now() * 0.001) * 0.02) + ')';
      ctx.fillRect(0, 0, w, h);
    }
    if (weather === 'wind') {
      // Animated wind lines
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
    }
    if (weather === 'fire') {
      // Subtle fire glow at bottom
      const fireGrad = ctx.createLinearGradient(0, h, 0, h - 50);
      fireGrad.addColorStop(0, 'rgba(200,50,20,' + (0.08 + Math.sin(Date.now() * 0.003) * 0.04) + ')');
      fireGrad.addColorStop(1, 'rgba(200,50,20,0)');
      ctx.fillStyle = fireGrad;
      ctx.fillRect(0, h - 50, w, 50);
    }

    // Turn counter
    if (Battle.state) {
      ctx.font = '600 11px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(212,168,67,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('回合 ' + Battle.state.turn, w / 2, h - 6);
    }
  },

  // ═══ MAIN RENDER LOOP ═══
  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;

    ctx.save();

    // Screen shake
    if (this.screenShake.intensity > 0.5) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= this.screenShake.decay;
      ctx.translate(this.screenShake.x, this.screenShake.y);
    }

    // Background
    const terrain = Battle.state?.terrain || 'plains';
    const weather = Battle.state?.weather || 'clear';
    this.drawBackground(terrain, weather);

    // Update & draw fighters
    for (const key in this.fighters) {
      const s = this.fighters[key];
      // Decay animations
      s.shakeX *= 0.85;
      s.shakeY *= 0.85;
      s.hitFlash *= 0.92;
      s.skillGlow *= 0.97;
      if (s.attackAnim > 0) {
        s.attackAnim -= 0.04;
        // Lunge toward target
        const lungeDir = s.facing;
        const lungeAmount = Math.sin(s.attackAnim * Math.PI) * 25;
        s.x = s.baseX + lungeDir * lungeAmount;
      } else {
        // Idle breathing
        s.y = s.baseY + Math.sin(Date.now() * 0.002 + s.f.pos * 1.5) * 1.5;
        s.x = s.baseX;
      }
      this.drawFighter(s);
    }

    // Particles
    this.drawParticles();

    // Floating texts
    this.drawFloatingTexts();

    // Screen flash
    if (this.flashAlpha > 0.01) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(-10, -10, this.width + 20, this.height + 20);
      this.flashAlpha *= 0.9;
    }

    ctx.restore();

    this.animFrame = requestAnimationFrame(() => this.render());
  },

  // Alias for app.js compatibility
  setupFighters(battleState) {
    this.initFighters(battleState);
  },

  // ═══ LIFECYCLE ═══
  start(battleState) {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
    this.flashAlpha = 0;
    this.running = true;
    if (battleState) this.initFighters(battleState);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.render();
  },

  stop() {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  },

  // ═══ VICTORY / DEFEAT SCENE ═══
  showVictory() {
    this.triggerFlash('#ffd700', 0.3);
    this.spawnParticles(this.width / 2, this.height / 2, '#ffd700', 40, {
      spread: 10, type: 'star', size: 5, upward: true
    });
    this.spawnParticles(this.width / 2, this.height / 2, '#f5d98a', 30, {
      spread: 8, type: 'spark', size: 3
    });
    this.addFloatingText(this.width / 2, this.height / 2 - 20, '胜 利', '#ffd700', {
      size: 36, bold: true, outline: true, decay: 0.005, vy: -0.5
    });
  },

  showDefeat() {
    this.triggerFlash('#c04040', 0.2);
    this.addFloatingText(this.width / 2, this.height / 2 - 20, '败 北', '#c04040', {
      size: 36, bold: true, outline: true, decay: 0.005, vy: -0.3
    });
  },
};

if (typeof window !== 'undefined') window.BattleCanvas = BattleCanvas;

// 三国·天命 — Canvas Battle Renderer
// Replaces DOM-based battle with animated Canvas 2D combat scene

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

const BattleCanvas = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  particles: [],
  floatingTexts: [],
  screenShake: { x: 0, y: 0, intensity: 0, decay: 0.9 },
  fighters: [], // Visual fighter objects with positions + animations
  animFrame: null,
  running: false,

  // ═══════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════
  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = Math.max(320, Math.min(400, window.innerHeight * 0.45));
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  },

  // ═══════════════════════════════════════
  // FIGHTER VISUAL OBJECTS
  // ═══════════════════════════════════════
  setupFighters(battleState) {
    this.fighters = [];
    const playerCount = battleState.player.filter(f => f).length;
    const enemyCount = battleState.enemy.filter(f => f).length;

    // Position: players on left, enemies on right
    const leftX = this.width * 0.2;
    const rightX = this.width * 0.8;
    const startY = 40;
    const spacing = 56;

    battleState.player.forEach((f, i) => {
      if (!f) return;
      const vd = Visuals.HERO_DATA[f.id] || { ch: '?', c1: '#555', c2: '#888', pat: 'none' };
      this.fighters.push({
        ref: f,
        side: 'player',
        baseX: leftX,
        baseY: startY + i * spacing,
        x: leftX,
        y: startY + i * spacing,
        size: 40,
        ch: vd.ch,
        c1: vd.c1,
        c2: vd.c2,
        rarity: f.rarity || 1,
        anim: { type: 'idle', t: Math.random() * Math.PI * 2 },
        alpha: 1,
        flash: 0,
        flashColor: '#fff',
      });
    });

    battleState.enemy.forEach((f, i) => {
      if (!f) return;
      const vd = Visuals.HERO_DATA[f.id] || { ch: '?', c1: '#555', c2: '#888', pat: 'none' };
      this.fighters.push({
        ref: f,
        side: 'enemy',
        baseX: rightX,
        baseY: startY + i * spacing,
        x: rightX,
        y: startY + i * spacing,
        size: 40,
        ch: vd.ch,
        c1: vd.c1,
        c2: vd.c2,
        rarity: f.rarity || 1,
        anim: { type: 'idle', t: Math.random() * Math.PI * 2 },
        alpha: 1,
        flash: 0,
        flashColor: '#fff',
      });
    });
  },

  findFighter(key) {
    // key = "player-0" or "enemy-2"
    const [side, pos] = key.split('-');
    return this.fighters.find(f => f.ref.side === side && f.ref.pos === parseInt(pos));
  },

  // ═══════════════════════════════════════
  // VFX PROCESSING
  // ═══════════════════════════════════════
  processVFX(vfxList) {
    for (const fx of vfxList) {
      if (fx.type === 'attack') {
        const attacker = this.findFighter(fx.attacker);
        const target = this.findFighter(fx.target);
        if (attacker && target) {
          // Dash animation
          attacker.anim = {
            type: 'dash',
            targetX: target.x + (attacker.side === 'player' ? -50 : 50),
            targetY: target.y,
            t: 0,
            duration: 12,
          };
          // Hit flash on target (delayed)
          setTimeout(() => {
            target.flash = 1;
            target.flashColor = fx.isCrit ? '#ffd700' : '#ff4444';
            this.screenShake.intensity = fx.isCrit ? 8 : 4;
            // Damage particles
            this.spawnHitParticles(target.x, target.y, fx.isCrit);
            // Floating damage number
            this.floatingTexts.push({
              x: target.x,
              y: target.y - 20,
              text: (fx.isCrit ? '暴击! ' : '-') + fx.dmg,
              color: fx.isCrit ? '#ffd700' : '#ff6b6b',
              size: fx.isCrit ? 22 : 16,
              life: 60,
              vy: -1.5,
            });
          }, 150);
        }
      }
      if (fx.type === 'skill') {
        const caster = this.findFighter(fx.caster);
        if (caster) {
          caster.anim = { type: 'skill', t: 0, duration: 30 };
          // Skill name floating text
          this.floatingTexts.push({
            x: caster.x,
            y: caster.y - 30,
            text: '【' + fx.skillName + '】',
            color: '#c084fc',
            size: 14,
            life: 50,
            vy: -0.8,
          });
          // Skill burst particles
          this.spawnSkillParticles(caster.x, caster.y);
        }
      }
      if (fx.type === 'kill') {
        const target = this.findFighter(fx.target);
        if (target) {
          target.anim = { type: 'death', t: 0, duration: 40 };
          this.spawnDeathParticles(target.x, target.y);
          this.screenShake.intensity = 10;
        }
      }
    }
  },

  // ═══════════════════════════════════════
  // PARTICLES
  // ═══════════════════════════════════════
  spawnHitParticles(x, y, isCrit) {
    const count = isCrit ? 20 : 10;
    const color = isCrit ? '#ffd700' : '#ff6b6b';
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * (isCrit ? 4 : 3);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * (isCrit ? 4 : 2),
        color,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        type: 'spark',
      });
    }
  },

  spawnSkillParticles(x, y) {
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 30;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 0.5,
        vy: -1 - Math.random() * 2,
        size: 2 + Math.random() * 3,
        color: ['#c084fc', '#818cf8', '#a78bfa', '#f0abfc'][Math.floor(Math.random() * 4)],
        life: 30 + Math.random() * 20,
        maxLife: 50,
        type: 'magic',
      });
    }
  },

  spawnDeathParticles(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 3 + Math.random() * 4,
        color: ['#ef4444', '#f97316', '#fbbf24', '#dc2626'][Math.floor(Math.random() * 4)],
        life: 30 + Math.random() * 30,
        maxLife: 60,
        type: 'explosion',
      });
    }
  },

  // ═══════════════════════════════════════
  // RENDER LOOP
  // ═══════════════════════════════════════
  start() {
    this.running = true;
    this.particles = [];
    this.floatingTexts = [];
    this.loop();
  },

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  },

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  update() {
    const now = performance.now();

    // Update fighters
    for (const f of this.fighters) {
      // Idle breathing
      if (f.anim.type === 'idle') {
        f.anim.t += 0.05;
        f.y = f.baseY + Math.sin(f.anim.t) * 2;
      }

      // Dash attack
      if (f.anim.type === 'dash') {
        f.anim.t++;
        const progress = Math.min(f.anim.t / f.anim.duration, 1);
        if (progress < 0.5) {
          // Dash toward target
          const p = progress * 2;
          const ease = p * p; // ease-in
          f.x = f.baseX + (f.anim.targetX - f.baseX) * ease;
          f.y = f.baseY + (f.anim.targetY - f.baseY) * ease;
        } else {
          // Return to base
          const p = (progress - 0.5) * 2;
          const ease = 1 - (1 - p) * (1 - p); // ease-out
          f.x = f.anim.targetX + (f.baseX - f.anim.targetX) * ease;
          f.y = f.anim.targetY + (f.baseY - f.anim.targetY) * ease;
        }
        if (progress >= 1) {
          f.x = f.baseX;
          f.y = f.baseY;
          f.anim = { type: 'idle', t: Math.random() * Math.PI * 2 };
        }
      }

      // Skill cast glow
      if (f.anim.type === 'skill') {
        f.anim.t++;
        if (f.anim.t >= f.anim.duration) {
          f.anim = { type: 'idle', t: 0 };
        }
      }

      // Death fade
      if (f.anim.type === 'death') {
        f.anim.t++;
        f.alpha = Math.max(0, 1 - f.anim.t / f.anim.duration);
      }

      // Flash decay
      if (f.flash > 0) f.flash *= 0.85;
      if (f.flash < 0.01) f.flash = 0;

      // Sync alive state
      if (!f.ref.alive && f.anim.type !== 'death' && f.alpha > 0) {
        f.anim = { type: 'death', t: 0, duration: 40 };
      }
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'explosion') p.vy += 0.05; // gravity
      p.life--;
      return p.life > 0;
    });

    // Update floating texts
    this.floatingTexts = this.floatingTexts.filter(t => {
      t.y += t.vy;
      t.life--;
      return t.life > 0;
    });

    // Screen shake decay
    if (this.screenShake.intensity > 0.1) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= this.screenShake.decay;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
      this.screenShake.intensity = 0;
    }
  },

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0e1a');
    bgGrad.addColorStop(0.5, '#111827');
    bgGrad.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-10, -10, w + 20, h + 20);

    // Ground line
    const groundY = h - 30;
    ctx.strokeStyle = 'rgba(212,168,67,.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // VS divider
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#d4a843';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 20);
    ctx.lineTo(w / 2, h - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw fighters
    for (const f of this.fighters) {
      if (f.alpha <= 0) continue;
      this.drawFighter(ctx, f);
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      if (p.type === 'magic') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw floating texts
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life / 15);
      ctx.font = 'bold ' + t.size + 'px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.shadowColor = 'rgba(0,0,0,.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.restore();
  },

  drawFighter(ctx, f) {
    ctx.save();
    ctx.globalAlpha = f.alpha;

    const x = f.x;
    const y = f.y;
    const s = f.size;
    const half = s / 2;

    // Rarity glow ring
    if (f.rarity >= 4) {
      ctx.save();
      const glowColor = f.rarity >= 5 ? 'rgba(212,168,67,.3)' : 'rgba(168,85,247,.2)';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, half + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Skill cast aura
    if (f.anim.type === 'skill') {
      const progress = f.anim.t / f.anim.duration;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.5;
      const auraGrad = ctx.createRadialGradient(x, y, half, x, y, half + 20 + progress * 30);
      auraGrad.addColorStop(0, 'rgba(192,132,252,.4)');
      auraGrad.addColorStop(1, 'rgba(192,132,252,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(x, y, half + 20 + progress * 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Main circle body
    const bodyGrad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, half);
    bodyGrad.addColorStop(0, f.c2);
    bodyGrad.addColorStop(1, f.c1);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, half, 0, Math.PI * 2);
    ctx.fill();

    // Border ring
    ctx.strokeStyle = f.c2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, half, 0, Math.PI * 2);
    ctx.stroke();

    // Character text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (s * 0.45) + 'px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = 2;
    ctx.fillText(f.ch, x, y + 1);
    ctx.shadowBlur = 0;

    // Hit flash overlay
    if (f.flash > 0) {
      ctx.save();
      ctx.globalAlpha = f.flash * 0.6;
      ctx.fillStyle = f.flashColor;
      ctx.beginPath();
      ctx.arc(x, y, half, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // HP bar below
    if (f.ref.alive || f.alpha > 0.3) {
      const barW = s + 4;
      const barH = 4;
      const barX = x - barW / 2;
      const barY = y + half + 6;
      const hpPct = Math.max(0, f.ref.hp / f.ref.maxHp);

      // BG
      ctx.fillStyle = 'rgba(255,255,255,.1)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 2);
      ctx.fill();

      // HP fill
      if (hpPct > 0) {
        const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW * hpPct, 0);
        hpGrad.addColorStop(0, hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444');
        hpGrad.addColorStop(1, hpPct > 0.5 ? '#16a34a' : hpPct > 0.25 ? '#d97706' : '#dc2626');
        ctx.fillStyle = hpGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * hpPct, barH, 2);
        ctx.fill();
      }

      // Rage bar (thin)
      const rageY = barY + barH + 2;
      const ragePct = Math.min(1, (f.ref.rage || 0) / (f.ref.maxRage || 100));
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.beginPath();
      ctx.roundRect(barX, rageY, barW, 2, 1);
      ctx.fill();
      if (ragePct > 0) {
        ctx.fillStyle = ragePct >= 1 ? '#fbbf24' : '#d4a843';
        ctx.beginPath();
        ctx.roundRect(barX, rageY, barW * ragePct, 2, 1);
        ctx.fill();
        // Full rage glow
        if (ragePct >= 1) {
          ctx.save();
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.roundRect(barX, rageY, barW, 2, 1);
          ctx.fill();
          ctx.restore();
        }
      }

      // Name label
      ctx.fillStyle = 'rgba(240,230,211,.7)';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.ref.name, x, barY + barH + 14);
    }

    ctx.restore();
  },

  // ═══════════════════════════════════════
  // SLASH / ATTACK TRAIL EFFECT
  // ═══════════════════════════════════════
  drawSlash(fromX, fromY, toX, toY) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    // Curved slash
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 20;
    ctx.quadraticCurveTo(midX, midY, toX, toY);
    ctx.stroke();
    ctx.restore();
  },
};

if (typeof window !== 'undefined') window.BattleCanvas = BattleCanvas;

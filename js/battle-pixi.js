/**
 * battle-pixi.js — PixiJS WebGL Battle Renderer
 * Overrides the Canvas2D BattleCanvas with GPU-accelerated rendering.
 * Requires PIXI (v7.3.2) to be loaded before this script.
 */
(function () {
  'use strict';

  /* ── Guard: need PIXI + WebGL ───────────────────────────────── */
  if (typeof PIXI === 'undefined') return;

  // Quick WebGL support test
  try {
    var c = document.createElement('canvas');
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) throw 0;
  } catch (_) {
    console.warn('[battle-pixi] WebGL not supported — keeping Canvas2D fallback');
    return;
  }

  /* ── Preserve old renderer as fallback ──────────────────────── */
  var _oldBC = window.BattleCanvas;
  if (_oldBC) window._BattleCanvasFallback = _oldBC;

  /* ── Constants ──────────────────────────────────────────────── */
  var MAX_PARTICLES = 300;
  var POOL_INIT = 80;

  var TERRAIN_COLORS = {
    plains:   [0x0a1628, 0x142840],
    mountain: [0x0f1520, 0x1a2535],
    river:    [0x081828, 0x0f2840],
    forest:   [0x081a10, 0x102818],
    castle:   [0x100c18, 0x1a1428]
  };

  var FACTION_COLORS = {
    shu: 0x4a8c6f,
    wei: 0x5a8fc7,
    wu:  0xc04040,
    qun: 0x9a6dd7
  };

  var ELEMENT_COLORS = {
    fire:      [0xff6600, 0xff3300],
    water:     [0x3399ff, 0x0066cc],
    lightning: [0xffff66, 0xffffff],
    ice:       [0x99ccff, 0xccffff],
    wind:      [0x66cc66, 0x33ff99],
    earth:     [0x996633, 0x664400],
    dark:      [0x9933ff, 0x660099]
  };

  /* ── Utility helpers ────────────────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function hpColor(pct) {
    if (pct > 0.55) return 0x44cc44;
    if (pct > 0.25) return 0xcccc00;
    return 0xcc3333;
  }
  function hexToNum(hex) {
    if (typeof hex === 'number') return hex;
    return parseInt(String(hex).replace('#', ''), 16);
  }

  function getFaction(id) {
    if (typeof HEROES !== 'undefined' && HEROES[id]) return HEROES[id].faction || 'qun';
    return 'qun';
  }
  function getElement(id) {
    if (typeof HEROES !== 'undefined' && HEROES[id]) return HEROES[id].element;
    return undefined;
  }

  /* ── Particle Pool ──────────────────────────────────────────── */
  function ParticlePool() {
    this._dead = [];
    this._alive = [];
  }
  ParticlePool.prototype.get = function () {
    var g;
    if (this._dead.length > 0) {
      g = this._dead.pop();
      g.clear();
      g.visible = true;
      g.alpha = 1;
      g.scale.set(1);
      g.rotation = 0;
      g.blendMode = PIXI.BLEND_MODES.NORMAL;
    } else {
      g = new PIXI.Graphics();
    }
    g._life = 0;
    g._maxLife = 30;
    g._vx = 0;
    g._vy = 0;
    g._gravity = 0;
    g._fadeSpeed = 0;
    g._shrink = 0;
    g._rotSpeed = 0;
    g._custom = null;
    this._alive.push(g);
    return g;
  };
  ParticlePool.prototype.kill = function (g) {
    g.visible = false;
    g.alpha = 0;
    var idx = this._alive.indexOf(g);
    if (idx !== -1) this._alive.splice(idx, 1);
    this._dead.push(g);
  };
  ParticlePool.prototype.count = function () { return this._alive.length; };
  ParticlePool.prototype.each = function (fn) {
    for (var i = this._alive.length - 1; i >= 0; i--) {
      fn(this._alive[i], i);
    }
  };
  ParticlePool.prototype.destroyAll = function () {
    var all = this._alive.concat(this._dead);
    for (var i = 0; i < all.length; i++) all[i].destroy();
    this._alive = [];
    this._dead = [];
  };

  /* ═══════════════════════════════════════════════════════════════
     PixiBattle — the main renderer object
     ═══════════════════════════════════════════════════════════════ */
  var PixiBattle = {
    /* state */
    app: null,
    stage: null,
    bgLayer: null,
    fighterLayer: null,
    vfxLayer: null,
    uiLayer: null,
    originalCanvas: null,
    parentEl: null,
    width: 800,
    height: 450,
    running: false,

    /* fighters */
    fighters: {},       // id → { container, nameText, hpBar, rageBar, portrait, data, baseY, bobPhase }
    battleState: null,
    turnCount: 0,
    turnText: null,
    vsText: null,

    /* effects */
    pool: null,
    slashes: [],
    impacts: [],
    cinematics: [],
    floatingTexts: [],
    killAnims: [],

    /* timing */
    _tickerFn: null,
    _freezeTimer: 0,

    /* ── init ─────────────────────────────────────────────── */
    init: function (canvasOrId) {
      var canvas;
      if (typeof canvasOrId === 'string') {
        canvas = document.getElementById(canvasOrId);
      } else {
        canvas = canvasOrId;
      }
      if (!canvas) {
        console.error('[battle-pixi] Canvas element not found');
        return;
      }

      this.originalCanvas = canvas;
      this.parentEl = canvas.parentNode;

      // Get dimensions from parent
      var rect = this.parentEl.getBoundingClientRect();
      this.width = Math.round(rect.width) || 800;
      this.height = Math.round(rect.height) || 450;

      // Hide original
      canvas.style.display = 'none';

      // Create PIXI app
      this.app = new PIXI.Application({
        width: this.width,
        height: this.height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true
      });

      // Style the PIXI view
      var view = this.app.view;
      view.style.display = 'block';
      view.style.width = '100%';
      view.style.height = '100%';
      view.style.borderRadius = getComputedStyle(canvas).borderRadius || '12px';
      this.parentEl.appendChild(view);

      this.stage = this.app.stage;
      this.stage.sortableChildren = true;

      // Create layers
      this.bgLayer = new PIXI.Container();
      this.bgLayer.zIndex = 0;
      this.fighterLayer = new PIXI.Container();
      this.fighterLayer.zIndex = 10;
      this.vfxLayer = new PIXI.Container();
      this.vfxLayer.zIndex = 20;
      this.uiLayer = new PIXI.Container();
      this.uiLayer.zIndex = 30;

      this.stage.addChild(this.bgLayer);
      this.stage.addChild(this.fighterLayer);
      this.stage.addChild(this.vfxLayer);
      this.stage.addChild(this.uiLayer);

      // Particle pool
      this.pool = new ParticlePool();
      // Pre-warm pool
      var prewarmed = [];
      for (var i = 0; i < POOL_INIT; i++) {
        var pg = this.pool.get();
        this.vfxLayer.addChild(pg);
        prewarmed.push(pg);
      }
      for (var j = 0; j < prewarmed.length; j++) {
        this.pool.kill(prewarmed[j]);
      }

      // Reset collections
      this.fighters = {};
      this.slashes = [];
      this.impacts = [];
      this.cinematics = [];
      this.floatingTexts = [];
      this.killAnims = [];
      this._freezeTimer = 0;
      this.turnCount = 0;

      // Main update loop
      var self = this;
      this._tickerFn = function (delta) { self.update(delta); };
      this.app.ticker.add(this._tickerFn);
    },

    /* ── setupFighters / initFighters ─────────────────────── */
    setupFighters: function (state) {
      this.initFighters(state);
    },

    initFighters: function (state) {
      if (!state) return;
      this.battleState = state;

      // Clear existing fighters
      for (var key in this.fighters) {
        if (this.fighters[key].container) {
          this.fighters[key].container.destroy({ children: true });
        }
      }
      this.fighters = {};
      this.fighterLayer.removeChildren();

      // Draw background
      this._drawBackground(state.terrain);

      // Create fighters
      var sides = ['player', 'enemy'];
      for (var s = 0; s < sides.length; s++) {
        var side = sides[s];
        var list = state[side];
        if (!list) continue;
        for (var i = 0; i < list.length; i++) {
          var f = list[i];
          var fid = side + '-' + i;
          this._createFighter(f, fid, side, i, list.length);
        }
      }
    },

    /* ── start ────────────────────────────────────────────── */
    start: function (state) {
      if (state) this.initFighters(state);
      this.running = true;
      this.turnCount = 0;
    },

    /* ── stop ─────────────────────────────────────────────── */
    stop: function () {
      this.running = false;
      // Clean up effects
      this.slashes = [];
      this.impacts = [];
      this.cinematics = [];
      this.floatingTexts = [];
      this.killAnims = [];
      this.vfxLayer.removeChildren();
      // Re-add pooled particles (hidden) to vfxLayer so pool stays valid
    },

    /* ── resize ───────────────────────────────────────────── */
    resize: function () {
      if (!this.app || !this.parentEl) return;
      var rect = this.parentEl.getBoundingClientRect();
      this.width = Math.round(rect.width) || 800;
      this.height = Math.round(rect.height) || 450;
      this.app.renderer.resize(this.width, this.height);

      // Reposition fighters
      for (var key in this.fighters) {
        var fi = this.fighters[key];
        var pos = this._fighterPosition(fi._side, fi._index, fi._total);
        fi.container.x = pos.x;
        fi.container.y = pos.y;
        fi.baseY = pos.y;
      }

      // Redraw background
      if (this.battleState) this._drawBackground(this.battleState.terrain);
    },

    /* ── syncState ────────────────────────────────────────── */
    syncState: function (state) {
      if (!state) return;
      this.battleState = state;
      var sides = ['player', 'enemy'];
      for (var s = 0; s < sides.length; s++) {
        var side = sides[s];
        var list = state[side];
        if (!list) continue;
        for (var i = 0; i < list.length; i++) {
          var f = list[i];
          var fid = side + '-' + i;
          var fi = this.fighters[fid];
          if (!fi) continue;
          fi.data = f;
          this._updateBars(fi);
          if (!f.alive && fi.container.visible) {
            fi.container.alpha = 0.3;
          }
        }
      }
      if (state.turn !== undefined) {
        this.turnCount = state.turn;
        if (this.turnText) this.turnText.text = '回合 ' + this.turnCount;
      }
    },

    /* ── processVFX ───────────────────────────────────────── */
    processVFX: function (vfxArr) {
      if (!vfxArr || !vfxArr.length) return;
      for (var i = 0; i < vfxArr.length; i++) {
        var vfx = vfxArr[i];
        switch (vfx.type) {
          case 'attack': this._vfxAttack(vfx); break;
          case 'skill':  this._vfxSkill(vfx);  break;
          case 'kill':   this._vfxKill(vfx);   break;
          case 'heal':   this._vfxHeal(vfx);   break;
          case 'buff':   this._vfxBuff(vfx);   break;
          case 'debuff': this._vfxDebuff(vfx);  break;
        }
      }
    },

    /* ── showVictory ──────────────────────────────────────── */
    showVictory: function () {
      var self = this;
      var w = this.width, h = this.height;

      // Gold overlay
      var overlay = new PIXI.Graphics();
      overlay.beginFill(0xffd700, 0.15);
      overlay.drawRect(0, 0, w, h);
      overlay.endFill();
      overlay.alpha = 0;
      overlay._life = 0;
      overlay._maxLife = 120;
      this.uiLayer.addChild(overlay);
      this.cinematics.push({
        type: 'victory-overlay',
        gfx: overlay,
        update: function (d) {
          overlay._life += d;
          overlay.alpha = Math.min(overlay._life / 30, 0.15);
          return overlay._life < overlay._maxLife;
        }
      });

      // 胜利 text
      var txt = new PIXI.Text('胜利', {
        fontSize: 48,
        fontFamily: '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif',
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 5,
        fontWeight: 'bold'
      });
      txt.anchor.set(0.5);
      txt.x = w / 2;
      txt.y = h / 2;
      txt.scale.set(2.5);
      txt.alpha = 0;
      txt._life = 0;
      this.uiLayer.addChild(txt);
      this.cinematics.push({
        type: 'victory-text',
        gfx: txt,
        update: function (d) {
          txt._life += d;
          if (txt._life < 20) {
            var t = txt._life / 20;
            txt.alpha = t;
            // Overshoot bounce: 2.5 → 0.85 → 1.0
            var s = 2.5 - 1.65 * t;
            if (t > 0.7) s = 0.85 + (t - 0.7) / 0.3 * 0.15;
            txt.scale.set(Math.max(s, 0.85));
          } else {
            txt.scale.set(1.0);
            txt.alpha = 1;
          }
          return txt._life < 120;
        }
      });

      // Star fountain
      for (var i = 0; i < 50; i++) {
        (function (delay) {
          setTimeout(function () {
            self._spawnStar(w / 2 + rand(-60, 60), h, 0xffd700);
          }, delay * 30);
        })(i);
      }

      // Confetti
      var confettiColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
      for (var j = 0; j < 30; j++) {
        (function (delay) {
          setTimeout(function () {
            self._spawnConfetti(rand(0, w), -10, confettiColors[randInt(0, confettiColors.length - 1)]);
          }, delay * 50);
        })(j);
      }
    },

    /* ── showDefeat ───────────────────────────────────────── */
    showDefeat: function () {
      var w = this.width, h = this.height;

      // Desaturate filter
      var colorFilter = new PIXI.ColorMatrixFilter();
      if (!this.stage.filters) this.stage.filters = [];
      this.stage.filters.push(colorFilter);
      var desat = { val: 0 };
      this.cinematics.push({
        type: 'defeat-desat',
        update: function (d) {
          desat.val = Math.min(desat.val + d * 0.02, 1);
          colorFilter.desaturate();
          // modulate: mix identity with desaturated by val
          var m = colorFilter.matrix;
          for (var i = 0; i < 20; i++) {
            var identity = (i % 6 === 0) ? 1 : 0;
            m[i] = lerp(identity, m[i], desat.val);
          }
          return desat.val < 1;
        }
      });

      // Dark vignette
      var vig = new PIXI.Graphics();
      vig.alpha = 0;
      vig._life = 0;
      this.uiLayer.addChild(vig);
      this.cinematics.push({
        type: 'defeat-vignette',
        gfx: vig,
        update: function (d) {
          vig._life += d;
          vig.alpha = Math.min(vig._life / 60, 0.55);
          vig.clear();
          vig.beginFill(0x000000, 1);
          vig.drawRect(0, 0, w, h);
          vig.endFill();
          // Cut out center oval
          vig.beginFill(0x000000, 0);
          // Not a real vignette but dark overlay suffices
          return vig._life < 120;
        }
      });

      // 败北 text
      var txt = new PIXI.Text('败北', {
        fontSize: 48,
        fontFamily: '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif',
        fill: '#cc2222',
        stroke: '#000000',
        strokeThickness: 5,
        fontWeight: 'bold'
      });
      txt.anchor.set(0.5);
      txt.x = w / 2;
      txt.y = h / 2;
      txt.alpha = 0;
      txt._life = 0;
      this.uiLayer.addChild(txt);
      this.cinematics.push({
        type: 'defeat-text',
        gfx: txt,
        update: function (d) {
          txt._life += d;
          txt.alpha = Math.min(txt._life / 60, 1);
          return txt._life < 120;
        }
      });
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — Background
       ═════════════════════════════════════════════════════════ */
    _drawBackground: function (terrain) {
      this.bgLayer.removeChildren();
      var w = this.width, h = this.height;
      var colors = TERRAIN_COLORS[terrain] || TERRAIN_COLORS.plains;

      var bg = new PIXI.Graphics();
      // Gradient approximation via horizontal stripes
      var steps = 32;
      for (var i = 0; i < steps; i++) {
        var t = i / (steps - 1);
        var r1 = (colors[0] >> 16) & 0xff, g1 = (colors[0] >> 8) & 0xff, b1 = colors[0] & 0xff;
        var r2 = (colors[1] >> 16) & 0xff, g2 = (colors[1] >> 8) & 0xff, b2 = colors[1] & 0xff;
        var r = Math.round(lerp(r1, r2, t));
        var g = Math.round(lerp(g1, g2, t));
        var b = Math.round(lerp(b1, b2, t));
        var c = (r << 16) | (g << 8) | b;
        bg.beginFill(c, 1);
        bg.drawRect(0, Math.floor(h * i / steps), w, Math.ceil(h / steps) + 1);
        bg.endFill();
      }
      this.bgLayer.addChild(bg);

      // VS text
      this.vsText = new PIXI.Text('VS', {
        fontSize: 72,
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fill: '#ffffff',
        fontWeight: 'bold'
      });
      this.vsText.anchor.set(0.5);
      this.vsText.x = w / 2;
      this.vsText.y = h / 2 - 10;
      this.vsText.alpha = 0.12;
      this.bgLayer.addChild(this.vsText);

      // Turn counter
      this.turnText = new PIXI.Text('回合 ' + this.turnCount, {
        fontSize: 14,
        fontFamily: '"Noto Sans SC", sans-serif',
        fill: '#aaaaaa'
      });
      this.turnText.anchor.set(0.5, 1);
      this.turnText.x = w / 2;
      this.turnText.y = h - 8;
      this.turnText.alpha = 0.5;
      this.bgLayer.addChild(this.turnText);
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — Fighter creation & positioning
       ═════════════════════════════════════════════════════════ */
    _fighterPosition: function (side, index, total) {
      var w = this.width, h = this.height;
      var baseX = side === 'player' ? w * 0.22 : w * 0.78;
      var spacing = Math.min(90, (h * 0.7) / Math.max(total, 1));
      var startY = h / 2 - ((total - 1) * spacing) / 2;
      return { x: baseX, y: startY + index * spacing };
    },

    _createFighter: function (data, fid, side, index, total) {
      var pos = this._fighterPosition(side, index, total);
      var container = new PIXI.Container();
      container.x = pos.x;
      container.y = pos.y;
      container.sortableChildren = true;

      var faction = getFaction(data.id);
      var borderColor = FACTION_COLORS[faction] || FACTION_COLORS.qun;
      var radius = 26;

      // Portrait circle (multiple concentric circles for gradient-like effect)
      var portrait = new PIXI.Graphics();
      // Outer ring (border)
      portrait.lineStyle(3, borderColor, 1);
      portrait.beginFill(0x1a1a2e, 1);
      portrait.drawCircle(0, 0, radius);
      portrait.endFill();
      // Inner gradient-like circles
      for (var r = radius - 4; r > 0; r -= 4) {
        var a = 0.15 + 0.3 * (1 - r / radius);
        portrait.beginFill(borderColor, a);
        portrait.drawCircle(0, 0, r);
        portrait.endFill();
      }
      portrait.zIndex = 0;
      container.addChild(portrait);

      // Character text (first char of name)
      var charText = new PIXI.Text(data.name ? data.name.charAt(0) : '?', {
        fontSize: 22,
        fontFamily: '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif',
        fill: '#ffffff',
        fontWeight: 'bold'
      });
      charText.anchor.set(0.5);
      charText.y = -1;
      charText.zIndex = 1;
      container.addChild(charText);

      // Name below
      var nameText = new PIXI.Text(data.name || fid, {
        fontSize: 11,
        fontFamily: '"Noto Sans SC", sans-serif',
        fill: '#cccccc'
      });
      nameText.anchor.set(0.5, 0);
      nameText.y = radius + 4;
      nameText.zIndex = 1;
      container.addChild(nameText);

      // HP bar
      var barWidth = 50;
      var hpBar = new PIXI.Graphics();
      hpBar.y = radius + 20;
      hpBar.x = -barWidth / 2;
      hpBar.zIndex = 1;
      container.addChild(hpBar);

      // Rage bar
      var rageBar = new PIXI.Graphics();
      rageBar.y = radius + 27;
      rageBar.x = -barWidth / 2;
      rageBar.zIndex = 1;
      container.addChild(rageBar);

      this.fighterLayer.addChild(container);

      var fi = {
        container: container,
        portrait: portrait,
        charText: charText,
        nameText: nameText,
        hpBar: hpBar,
        rageBar: rageBar,
        data: data,
        baseY: pos.y,
        bobPhase: Math.random() * Math.PI * 2,
        barWidth: barWidth,
        _side: side,
        _index: index,
        _total: total
      };

      this.fighters[fid] = fi;
      this._updateBars(fi);

      if (!data.alive) {
        container.alpha = 0.3;
      }
    },

    _updateBars: function (fi) {
      var d = fi.data;
      var bw = fi.barWidth;

      // HP bar
      var hpPct = d.maxHp > 0 ? Math.max(0, d.hp / d.maxHp) : 0;
      fi.hpBar.clear();
      fi.hpBar.beginFill(0x333333, 0.7);
      fi.hpBar.drawRoundedRect(0, 0, bw, 5, 2);
      fi.hpBar.endFill();
      if (hpPct > 0) {
        fi.hpBar.beginFill(hpColor(hpPct), 0.9);
        fi.hpBar.drawRoundedRect(0, 0, bw * hpPct, 5, 2);
        fi.hpBar.endFill();
      }

      // Rage bar
      var ragePct = d.maxRage > 0 ? Math.max(0, (d.rage || 0) / d.maxRage) : 0;
      fi.rageBar.clear();
      fi.rageBar.beginFill(0x333333, 0.5);
      fi.rageBar.drawRoundedRect(0, 0, bw, 3, 1);
      fi.rageBar.endFill();
      if (ragePct > 0) {
        fi.rageBar.beginFill(0xdaa520, 0.85);
        fi.rageBar.drawRoundedRect(0, 0, bw * ragePct, 3, 1);
        fi.rageBar.endFill();
      }
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — VFX: Attack
       ═════════════════════════════════════════════════════════ */
    _vfxAttack: function (vfx) {
      var atkFi = this.fighters[vfx.attacker];
      var tgtFi = this.fighters[vfx.target];
      if (!atkFi || !tgtFi) return;

      var tx = tgtFi.container.x;
      var ty = tgtFi.container.y;
      var ax = atkFi.container.x;
      var ay = atkFi.container.y;
      var isCrit = vfx.isCrit;

      // Fighter hit flash
      this._flashFighter(tgtFi, isCrit);

      // Slash trails
      var numSlashes = isCrit ? 2 : 1;
      for (var s = 0; s < numSlashes; s++) {
        this._spawnSlash(ax, ay, tx, ty, isCrit, s);
      }

      // Impact wave
      this._spawnImpactWave(tx, ty, isCrit);

      // Damage number
      var dmgStr = isCrit ? '暴击 ' + vfx.dmg : '-' + vfx.dmg;
      var dmgColor = isCrit ? '#ffd700' : '#ff4444';
      this._spawnFloatingText(tx, ty - 35, dmgStr, dmgColor, isCrit ? 20 : 16);

      // Element particles
      var atkId = atkFi.data.id;
      var element = getElement(atkId);
      if (element) {
        this._spawnElementParticles(element, tx, ty, isCrit ? 30 : 18);
      }

      // Crit freeze-frame
      if (isCrit && this.app) {
        var self = this;
        this.app.ticker.speed = 0.15;
        this._freezeTimer = 300;
      }
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — VFX: Skill Cinematic
       ═════════════════════════════════════════════════════════ */
    _vfxSkill: function (vfx) {
      var self = this;
      var w = this.width, h = this.height;
      var casterFi = this.fighters[vfx.caster];
      var cx = casterFi ? casterFi.container.x : w / 2;
      var cy = casterFi ? casterFi.container.y : h / 2;

      // Dark overlay
      var overlay = new PIXI.Graphics();
      overlay.beginFill(0x000000, 1);
      overlay.drawRect(0, 0, w, h);
      overlay.endFill();
      overlay.alpha = 0;
      overlay._life = 0;
      overlay._maxLife = 80;
      this.uiLayer.addChild(overlay);

      // Skill name text
      var skillText = new PIXI.Text(vfx.skillName || '绝技', {
        fontSize: 32,
        fontFamily: '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif',
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 4,
        fontWeight: 'bold'
      });
      skillText.anchor.set(0.5);
      skillText.x = w / 2;
      skillText.y = h / 2;
      skillText.scale.set(2.0);
      skillText.alpha = 0;
      this.uiLayer.addChild(skillText);

      // Element burst from caster
      var element = casterFi ? getElement(casterFi.data.id) : 'fire';
      this._spawnElementParticles(element || 'fire', cx, cy, 50);

      this.cinematics.push({
        type: 'skill',
        overlay: overlay,
        text: skillText,
        life: 0,
        update: function (d) {
          this.life += d;
          // Phase 1: fade in overlay + text bounce
          if (this.life < 20) {
            var t = this.life / 20;
            overlay.alpha = t * 0.4;
            skillText.alpha = t;
            var s = 2.0 - 1.0 * t;
            if (t > 0.6) s = 1.0 - (t - 0.6) / 0.4 * 0.15 + 0.15;
            skillText.scale.set(Math.max(s, 0.9));
          } else if (this.life < 25) {
            skillText.scale.set(1.0);
            skillText.alpha = 1;
            overlay.alpha = 0.4;
          } else if (this.life < 40) {
            // Hold
          } else {
            // Fade out
            var ft = (this.life - 40) / 30;
            overlay.alpha = 0.4 * (1 - ft);
            skillText.alpha = 1 - ft;
            if (ft >= 1) {
              overlay.parent && overlay.parent.removeChild(overlay);
              overlay.destroy();
              skillText.parent && skillText.parent.removeChild(skillText);
              skillText.destroy();
              return false;
            }
          }
          return true;
        }
      });
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — VFX: Kill
       ═════════════════════════════════════════════════════════ */
    _vfxKill: function (vfx) {
      var fi = this.fighters[vfx.target];
      if (!fi) return;
      var tx = fi.container.x;
      var ty = fi.container.y;

      // Death animation on container
      fi._dying = true;
      this.killAnims.push({
        fi: fi,
        life: 0,
        maxLife: 20,
        update: function (d) {
          this.life += d;
          var t = Math.min(this.life / this.maxLife, 1);
          this.fi.container.scale.set(1 - t);
          this.fi.container.alpha = 1 - t;
          return t < 1;
        }
      });

      // Fragment particles
      for (var i = 0; i < 25; i++) {
        this._spawnFragment(tx, ty);
      }

      // Ghost particles floating up
      for (var j = 0; j < 10; j++) {
        this._spawnGhost(tx + rand(-20, 20), ty);
      }

      // Screen shake / scale pulse
      var stage = this.stage;
      this.cinematics.push({
        type: 'kill-pulse',
        life: 0,
        update: function (d) {
          this.life += d;
          var t = this.life / 15;
          if (t < 0.5) {
            stage.scale.set(1 + 0.03 * (t / 0.5));
          } else if (t < 1) {
            stage.scale.set(1 + 0.03 * (1 - (t - 0.5) / 0.5));
          } else {
            stage.scale.set(1);
            return false;
          }
          return true;
        }
      });
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — VFX: Heal
       ═════════════════════════════════════════════════════════ */
    _vfxHeal: function (vfx) {
      var fi = this.fighters[vfx.target];
      if (!fi) return;
      var tx = fi.container.x;
      var ty = fi.container.y;

      // Green + particles
      for (var i = 0; i < 8; i++) {
        this._spawnHealPlus(tx + rand(-20, 20), ty + rand(-10, 10));
      }

      // Floating text
      var amtStr = '+' + (vfx.amount || '?');
      this._spawnFloatingText(tx, ty - 35, amtStr, '#44ff44', 16);
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — VFX: Buff / Debuff
       ═════════════════════════════════════════════════════════ */
    _vfxBuff: function (vfx) {
      var fi = this.fighters[vfx.target];
      if (!fi) return;
      var label = (vfx.stat || '').toUpperCase() + ' +' + Math.abs(vfx.amount || 0);
      this._spawnFloatingText(fi.container.x, fi.container.y - 35, label, '#66ccff', 13);

      // Upward sparkles
      for (var i = 0; i < 6; i++) {
        this._spawnBuffSparkle(fi.container.x + rand(-15, 15), fi.container.y + 10, 0x66ccff);
      }
    },

    _vfxDebuff: function (vfx) {
      var fi = this.fighters[vfx.target];
      if (!fi) return;
      var label = (vfx.stat || '').toUpperCase() + ' ' + (vfx.amount || 0);
      this._spawnFloatingText(fi.container.x, fi.container.y - 35, label, '#ff6666', 13);

      // Downward drip particles
      for (var i = 0; i < 6; i++) {
        this._spawnBuffSparkle(fi.container.x + rand(-15, 15), fi.container.y - 15, 0xff6666, true);
      }
    },

    /* ═════════════════════════════════════════════════════════
       INTERNAL — Spawn helpers
       ═════════════════════════════════════════════════════════ */

    /* Slash trail */
    _spawnSlash: function (ax, ay, tx, ty, isCrit, idx) {
      var g = new PIXI.Graphics();
      g.blendMode = PIXI.BLEND_MODES.ADD;
      var color = isCrit ? 0xffd700 : 0xffffff;
      var thickness = isCrit ? 5 : 3;

      // Random arc direction
      var angle = idx === 0 ? rand(-0.8, 0.8) : rand(Math.PI - 0.8, Math.PI + 0.8);
      var cx1 = (ax + tx) / 2 + Math.cos(angle) * rand(30, 80);
      var cy1 = (ay + ty) / 2 + Math.sin(angle) * rand(30, 80);

      g.lineStyle(thickness, color, 1);
      g.moveTo(ax, ay);
      g.bezierCurveTo(cx1, cy1, (cx1 + tx) / 2, (cy1 + ty) / 2, tx, ty);

      g._life = 0;
      g._maxLife = 15;
      g._thickness = thickness;
      g._color = color;
      g._ax = ax; g._ay = ay; g._tx = tx; g._ty = ty;
      g._cx1 = cx1; g._cy1 = cy1;

      this.vfxLayer.addChild(g);
      this.slashes.push(g);
    },

    /* Impact wave */
    _spawnImpactWave: function (x, y, isCrit) {
      var g = new PIXI.Graphics();
      g.blendMode = PIXI.BLEND_MODES.ADD;
      g.x = x;
      g.y = y;
      g._life = 0;
      g._maxLife = 20;
      g._maxRadius = isCrit ? 60 : 35;
      g._isCrit = isCrit;
      g._color = isCrit ? 0xffd700 : 0xffffff;
      this.vfxLayer.addChild(g);
      this.impacts.push(g);

      // Crit: white flash on enemies
      if (isCrit) {
        for (var key in this.fighters) {
          if (key.indexOf('enemy') === 0) {
            var fi = this.fighters[key];
            fi.portrait.tint = 0xffffff;
            (function (p) {
              setTimeout(function () { p.tint = 0xffffff; /* default */ }, 100);
            })(fi.portrait);
          }
        }
      }
    },

    /* Floating text */
    _spawnFloatingText: function (x, y, str, color, size) {
      var txt = new PIXI.Text(str, {
        fontSize: size || 16,
        fontFamily: '"Noto Sans SC", sans-serif',
        fill: color || '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        fontWeight: 'bold'
      });
      txt.anchor.set(0.5);
      txt.x = x + rand(-10, 10);
      txt.y = y;
      txt._life = 0;
      txt._maxLife = 40;
      txt._vy = -1.5;
      this.vfxLayer.addChild(txt);
      this.floatingTexts.push(txt);
    },

    /* Flash fighter on hit */
    _flashFighter: function (fi, isCrit) {
      var orig = fi.portrait.tint || 0xffffff;
      fi.portrait.tint = isCrit ? 0xffd700 : 0xff4444;
      setTimeout(function () { fi.portrait.tint = 0xffffff; }, 120);

      // Shake
      var origX = fi.container.x;
      var ct = fi.container;
      var shakeAmt = isCrit ? 8 : 4;
      ct.x = origX + shakeAmt;
      setTimeout(function () { ct.x = origX - shakeAmt; }, 30);
      setTimeout(function () { ct.x = origX + shakeAmt * 0.5; }, 60);
      setTimeout(function () { ct.x = origX; }, 90);
    },

    /* Element particles */
    _spawnElementParticles: function (element, tx, ty, count) {
      if (this.pool.count() >= MAX_PARTICLES) count = Math.min(count, 5);
      var colors = ELEMENT_COLORS[element] || ELEMENT_COLORS.fire;
      var addBlend = (element === 'fire' || element === 'lightning');

      for (var i = 0; i < count; i++) {
        var p = this.pool.get();
        if (!p.parent) this.vfxLayer.addChild(p);
        var col = colors[randInt(0, colors.length - 1)];

        p.x = tx + rand(-15, 15);
        p.y = ty + rand(-15, 15);
        if (addBlend) p.blendMode = PIXI.BLEND_MODES.ADD;

        switch (element) {
          case 'fire':
            p.beginFill(col, 0.9);
            p.drawCircle(0, 0, rand(2, 5));
            p.endFill();
            p._vx = rand(-1, 1);
            p._vy = rand(-3, -1);
            p._fadeSpeed = 0.03;
            p._maxLife = 30;
            break;

          case 'water':
            p.beginFill(col, 0.7);
            p.drawCircle(0, 0, rand(2, 4));
            p.endFill();
            p._vx = rand(-2, 2);
            p._vy = rand(-2, 2);
            p._fadeSpeed = 0.025;
            p._maxLife = 35;
            p._shrink = 0;
            break;

          case 'lightning':
            p.lineStyle(2, col, 0.9);
            var lx = 0, ly = 0;
            for (var seg = 0; seg < 4; seg++) {
              var nx = lx + rand(-8, 8);
              var ny = ly + rand(-8, 8);
              p.moveTo(lx, ly);
              p.lineTo(nx, ny);
              lx = nx; ly = ny;
            }
            p._vx = rand(-1, 1);
            p._vy = rand(-1, 1);
            p._fadeSpeed = 0.06;
            p._maxLife = 15;
            break;

          case 'ice':
            // Hexagon approximation
            p.beginFill(col, 0.7);
            var sz = rand(2, 5);
            p.moveTo(sz, 0);
            for (var a = 1; a <= 6; a++) {
              p.lineTo(sz * Math.cos(a * Math.PI / 3), sz * Math.sin(a * Math.PI / 3));
            }
            p.endFill();
            p._vx = rand(-0.5, 0.5);
            p._vy = rand(0.5, 1.5);
            p._fadeSpeed = 0.02;
            p._maxLife = 40;
            break;

          case 'wind':
            p.lineStyle(2, col, 0.8);
            p.moveTo(0, 0);
            p.lineTo(rand(5, 12), rand(-3, 3));
            p._vx = rand(-2, 2);
            p._vy = rand(-2, 2);
            p._rotSpeed = rand(-0.1, 0.1);
            p._fadeSpeed = 0.03;
            p._maxLife = 30;
            break;

          case 'earth':
            p.beginFill(col, 0.8);
            var rw = rand(3, 7), rh = rand(3, 7);
            p.drawRect(-rw / 2, -rh / 2, rw, rh);
            p.endFill();
            p._vx = rand(-2, 2);
            p._vy = rand(-3, 0);
            p._gravity = 0.12;
            p._rotSpeed = rand(-0.1, 0.1);
            p._fadeSpeed = 0.025;
            p._maxLife = 35;
            break;

          case 'dark':
            p.beginFill(col, 0.8);
            p.drawCircle(0, 0, rand(2, 5));
            p.endFill();
            // Move inward toward center
            var dx = tx - p.x;
            var dy = ty - p.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            p.x = tx + rand(-50, 50);
            p.y = ty + rand(-50, 50);
            dx = tx - p.x; dy = ty - p.y;
            dist = Math.sqrt(dx * dx + dy * dy) || 1;
            p._vx = (dx / dist) * rand(1, 3);
            p._vy = (dy / dist) * rand(1, 3);
            p._fadeSpeed = 0.025;
            p._maxLife = 30;
            break;

          default:
            p.beginFill(0xffffff, 0.6);
            p.drawCircle(0, 0, 3);
            p.endFill();
            p._vx = rand(-1, 1);
            p._vy = rand(-2, 0);
            p._fadeSpeed = 0.03;
            p._maxLife = 25;
        }
        p._life = 0;
      }
    },

    /* Fragment particles (kill) */
    _spawnFragment: function (x, y) {
      if (this.pool.count() >= MAX_PARTICLES) return;
      var p = this.pool.get();
      if (!p.parent) this.vfxLayer.addChild(p);
      var col = [0xcc4444, 0xff6644, 0xffaa44, 0xffffff][randInt(0, 3)];
      p.beginFill(col, 0.9);
      var s = rand(2, 5);
      p.drawRect(-s / 2, -s / 2, s, s);
      p.endFill();
      p.x = x; p.y = y;
      p._vx = rand(-4, 4);
      p._vy = rand(-5, -1);
      p._gravity = 0.15;
      p._rotSpeed = rand(-0.2, 0.2);
      p._fadeSpeed = 0.03;
      p._maxLife = 35;
      p._life = 0;
    },

    /* Ghost particles (kill) */
    _spawnGhost: function (x, y) {
      if (this.pool.count() >= MAX_PARTICLES) return;
      var p = this.pool.get();
      if (!p.parent) this.vfxLayer.addChild(p);
      p.beginFill(0xffffff, 0.5);
      p.drawCircle(0, 0, rand(3, 6));
      p.endFill();
      p.x = x; p.y = y;
      p._vx = rand(-0.5, 0.5);
      p._vy = rand(-1.5, -0.5);
      p._fadeSpeed = 0.015;
      p._maxLife = 50;
      p._life = 0;
    },

    /* Heal plus particles */
    _spawnHealPlus: function (x, y) {
      if (this.pool.count() >= MAX_PARTICLES) return;
      var p = this.pool.get();
      if (!p.parent) this.vfxLayer.addChild(p);
      p.beginFill(0x44ff44, 0.8);
      // Plus shape
      p.drawRect(-1, -4, 2, 8);
      p.drawRect(-4, -1, 8, 2);
      p.endFill();
      p.x = x; p.y = y;
      p._vx = rand(-0.3, 0.3);
      p._vy = rand(-2, -0.8);
      p._fadeSpeed = 0.025;
      p._maxLife = 35;
      p._life = 0;
    },

    /* Buff sparkle */
    _spawnBuffSparkle: function (x, y, color, down) {
      if (this.pool.count() >= MAX_PARTICLES) return;
      var p = this.pool.get();
      if (!p.parent) this.vfxLayer.addChild(p);
      p.beginFill(color, 0.8);
      p.drawCircle(0, 0, rand(1.5, 3));
      p.endFill();
      p.x = x; p.y = y;
      p._vx = rand(-0.5, 0.5);
      p._vy = down ? rand(0.5, 2) : rand(-2.5, -0.8);
      p._fadeSpeed = 0.03;
      p._maxLife = 30;
      p._life = 0;
    },

    /* Star particle (victory) */
    _spawnStar: function (x, y, color) {
      if (this.pool.count() >= MAX_PARTICLES) return;
      var p = this.pool.get();
      if (!p.parent) this.vfxLayer.addChild(p);
      p.blendMode = PIXI.BLEND_MODES.ADD;
      // Simple star = 4-point cross
      p.beginFill(color, 0.9);
      p.moveTo(0, -4);
      p.lineTo(1.5, -1.5);
      p.lineTo(4, 0);
      p.lineTo(1.5, 1.5);
      p.lineTo(0, 4);
      p.lineTo(-1.5, 1.5);
      p.lineTo(-4, 0);
      p.lineTo(-1.5, -1.5);
      p.closePath();
      p.endFill();
      p.x = x; p.y = y;
      p._vx = rand(-3, 3);
      p._vy = rand(-8, -3);
      p._gravity = 0.12;
      p._rotSpeed = rand(-0.1, 0.1);
      p._fadeSpeed = 0.015;
      p._maxLife = 60;
      p._life = 0;
    },

    /* Confetti particle (victory) */
    _spawnConfetti: function (x, y, color) {
      if (this.pool.count() >= MAX_PARTICLES) return;
      var p = this.pool.get();
      if (!p.parent) this.vfxLayer.addChild(p);
      p.beginFill(color, 0.9);
      p.drawRect(-3, -2, 6, 4);
      p.endFill();
      p.x = x; p.y = y;
      p._vx = rand(-1.5, 1.5);
      p._vy = rand(1, 3);
      p._gravity = 0.03;
      p._rotSpeed = rand(-0.15, 0.15);
      p._fadeSpeed = 0.01;
      p._maxLife = 80;
      p._life = 0;
    },

    /* ═════════════════════════════════════════════════════════
       MAIN UPDATE LOOP
       ═════════════════════════════════════════════════════════ */
    update: function (delta) {
      var d = delta || 1;

      /* Freeze-frame unfreeze */
      if (this._freezeTimer > 0) {
        this._freezeTimer -= d * 16.67;
        if (this._freezeTimer <= 0) {
          this._freezeTimer = 0;
          if (this.app) this.app.ticker.speed = 1.0;
        }
      }

      /* Fighter idle bob */
      for (var key in this.fighters) {
        var fi = this.fighters[key];
        if (fi._dying) continue;
        fi.bobPhase += d * 0.04;
        fi.container.y = fi.baseY + Math.sin(fi.bobPhase) * 3;
      }

      /* Particles */
      var self = this;
      this.pool.each(function (p) {
        p._life += d;
        if (p._life >= p._maxLife) {
          self.pool.kill(p);
          return;
        }
        p.x += (p._vx || 0) * d;
        p.y += (p._vy || 0) * d;
        p._vy += (p._gravity || 0) * d;
        p.alpha -= (p._fadeSpeed || 0.03) * d;
        if (p._shrink) p.scale.set(Math.max(0, p.scale.x - p._shrink * d));
        if (p._rotSpeed) p.rotation += p._rotSpeed * d;
        if (p.alpha <= 0) {
          self.pool.kill(p);
        }
      });

      /* Slash trails */
      for (var si = this.slashes.length - 1; si >= 0; si--) {
        var sl = this.slashes[si];
        sl._life += d;
        var st = sl._life / sl._maxLife;
        sl.alpha = 1 - st;
        // Redraw with thinner line
        var thick = sl._thickness * (1 - st * 0.7);
        sl.clear();
        sl.lineStyle(Math.max(0.5, thick), sl._color, 1 - st);
        sl.moveTo(sl._ax, sl._ay);
        sl.bezierCurveTo(sl._cx1, sl._cy1, (sl._cx1 + sl._tx) / 2, (sl._cy1 + sl._ty) / 2, sl._tx, sl._ty);
        if (sl._life >= sl._maxLife) {
          sl.parent && sl.parent.removeChild(sl);
          sl.destroy();
          this.slashes.splice(si, 1);
        }
      }

      /* Impact waves */
      for (var ii = this.impacts.length - 1; ii >= 0; ii--) {
        var imp = this.impacts[ii];
        imp._life += d;
        var it = imp._life / imp._maxLife;
        var rad = imp._maxRadius * it;
        imp.clear();
        imp.lineStyle(2 * (1 - it) + 0.5, imp._color, 1 - it);
        imp.drawCircle(0, 0, rad);
        imp.alpha = 1 - it;
        if (it >= 1) {
          imp.parent && imp.parent.removeChild(imp);
          imp.destroy();
          this.impacts.splice(ii, 1);
        }
      }

      /* Floating texts */
      for (var ti = this.floatingTexts.length - 1; ti >= 0; ti--) {
        var ft = this.floatingTexts[ti];
        ft._life += d;
        ft.y += ft._vy * d;
        var tt = ft._life / ft._maxLife;
        if (tt > 0.6) ft.alpha = 1 - (tt - 0.6) / 0.4;
        if (ft._life >= ft._maxLife) {
          ft.parent && ft.parent.removeChild(ft);
          ft.destroy();
          this.floatingTexts.splice(ti, 1);
        }
      }

      /* Kill anims */
      for (var ki = this.killAnims.length - 1; ki >= 0; ki--) {
        if (!this.killAnims[ki].update(d)) {
          this.killAnims.splice(ki, 1);
        }
      }

      /* Cinematics */
      for (var ci = this.cinematics.length - 1; ci >= 0; ci--) {
        if (!this.cinematics[ci].update(d)) {
          this.cinematics.splice(ci, 1);
        }
      }
    }
  };

  /* ── Install ────────────────────────────────────────────── */
  window.BattleCanvas = PixiBattle;
  console.log('[battle-pixi] PixiJS WebGL renderer installed');

})();

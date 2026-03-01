// ═══════════════════════════════════════════════════════════════
// 三国·天命 — Premium Anime-RPG Battle UI Renderer
// Replaces tiny 48px canvas circles with large 100-120px SVG portraits
// Fire Emblem Heroes / Genshin Impact inspired battle presentation
// Full CSS-animated attack sequences, skill cinematics, kill effects
// ═══════════════════════════════════════════════════════════════

const BattleUI = {
  container: null,
  statusBar: null,
  enemyRow: null,
  playerRow: null,
  attackOverlay: null,
  damageLayer: null,
  weatherLayer: null,
  bgGlow: null,
  _fighterEls: {},   // key → DOM element map
  _state: null,
  _active: false,
  _animating: false,
  _vfxQueue: [],

  // ══════════════════════════════════════════
  //  INIT — Build entire battle UI from scratch
  // ══════════════════════════════════════════
  init(battleState) {
    if (!battleState) throw new Error('battleState is required');
    this._state = battleState;
    this._fighterEls = {};
    this._animating = false;
    this._vfxQueue = [];

    // Find or create container
    const battlePage = document.getElementById('page-battle');
    if (!battlePage) throw new Error('page-battle not found');

    // Remove previous UI if any
    const old = document.getElementById('battle-ui-container');
    if (old) old.remove();

    // Create container
    const c = document.createElement('div');
    c.id = 'battle-ui-container';
    this.container = c;

    // Background glow
    const bg = document.createElement('div');
    bg.className = 'bui-bg-glow terrain-' + (battleState.terrain || 'plains');
    this.bgGlow = bg;
    c.appendChild(bg);

    // Weather particles
    const wp = document.createElement('div');
    wp.className = 'bui-weather-particles';
    this.weatherLayer = wp;
    c.appendChild(wp);
    this._setupWeather(battleState.weather);

    // Status bar
    const sb = document.createElement('div');
    sb.className = 'bui-status-bar';
    this.statusBar = sb;
    c.appendChild(sb);
    this._updateStatusBar(battleState);

    // Enemy row
    const er = document.createElement('div');
    er.className = 'bui-row enemy-row';
    this.enemyRow = er;
    c.appendChild(er);

    // Center divider
    const center = document.createElement('div');
    center.className = 'bui-center';
    center.innerHTML = '<div class="bui-divider-line"></div><span class="bui-vs-text">VS</span>';
    c.appendChild(center);

    // Player row
    const pr = document.createElement('div');
    pr.className = 'bui-row player-row';
    this.playerRow = pr;
    c.appendChild(pr);

    // Attack overlay
    const ao = document.createElement('div');
    ao.className = 'bui-attack-overlay';
    this.attackOverlay = ao;
    c.appendChild(ao);

    // Damage numbers layer
    const dl = document.createElement('div');
    dl.className = 'bui-damage-layer';
    dl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:70;overflow:hidden;';
    this.damageLayer = dl;
    c.appendChild(dl);

    // Feature 3: Build fighter cards with null safety
    const validEnemies = (battleState.enemy || []).filter(f => f != null);
    const validPlayers = (battleState.player || []).filter(f => f != null);
    this._buildFighters(validEnemies, 'enemy', er);
    this._buildFighters(validPlayers, 'player', pr);

    // Insert into page (before the canvas wrap)
    const canvasWrap = document.getElementById('battle-canvas-wrap');
    if (canvasWrap && canvasWrap.parentNode) {
      canvasWrap.parentNode.insertBefore(c, canvasWrap);
    } else {
      // Fallback: append after header
      const header = battlePage.querySelector('.page-header');
      if (header && header.parentNode) header.after(c);
      else battlePage.prepend(c);
    }

    // Mark active
    this._active = true;
    this._comboCount = 0;
    battlePage.classList.add('bui-active');

    // Play battle start animation
    this.playBattleStart();
  },

  // ══════════════════════════════════════════
  //  BUILD FIGHTER CARDS
  // ══════════════════════════════════════════
  _buildFighters(fighters, side, row) {
    for (const f of fighters) {
      if (!f) continue;
      const key = side + '-' + f.pos;
      const el = this._createFighterCard(f, side);
      this._fighterEls[key] = { el, f, side };
      row.appendChild(el);
    }
  },

  _createFighterCard(f, side) {
    const div = document.createElement('div');
    div.className = 'bui-fighter';
    div.dataset.key = f.side + '-' + f.pos;
    if (!f.alive) div.classList.add('dead');

    const hero = typeof HEROES !== 'undefined' ? HEROES[f.id] : null;
    const faction = hero?.faction || f.faction || 'qun';
    const rarity = hero?.rarity || f.rarity || 1;

    // Portrait
    const portrait = document.createElement('div');
    portrait.className = 'bui-portrait faction-' + faction;
    if (rarity >= 5) portrait.classList.add('rarity-5');

    // Render SVG portrait at full size as rounded rectangle (100-120px)
    let svgContent = '';
    if (typeof Portraits !== 'undefined') {
      try {
        svgContent = Portraits.getRect ? Portraits.getRect(f.id, 120) : Portraits.get(f.id, 120);
      } catch(e) {}
    }
    if (!svgContent && typeof Visuals !== 'undefined') {
      // Fallback to basic rect portrait
      const vd = Visuals.HERO_DATA[f.id] || { ch: f.name?.[0] || '?', c1: '#3a3f47', c2: '#6c757d' };
      svgContent = '<svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="bfb-' + f.id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + vd.c1 + '"/><stop offset="100%" stop-color="' + vd.c2 + '"/></linearGradient></defs>' +
        '<rect width="120" height="120" rx="10" fill="url(#bfb-' + f.id + ')"/>' +
        '<text x="60" y="72" text-anchor="middle" font-size="48" font-weight="900" fill="rgba(255,255,255,.9)" font-family="\'Noto Serif SC\',serif">' + vd.ch + '</text></svg>';
    }
    portrait.innerHTML = svgContent;

    // Make portrait SVG fill the rounded rect (not clipped to circle)
    const svgEl = portrait.querySelector('svg');
    if (svgEl) {
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.display = 'block';
    }

    // Element badge
    if (f.element && typeof ELEMENT_INFO !== 'undefined' && ELEMENT_INFO[f.element]) {
      const badge = document.createElement('div');
      badge.className = 'bui-element-badge';
      badge.style.color = ELEMENT_INFO[f.element].color || '#fff';
      badge.style.borderColor = ELEMENT_INFO[f.element].color || 'rgba(255,255,255,.2)';
      badge.textContent = ELEMENT_INFO[f.element].icon || f.element[0];
      portrait.appendChild(badge);
    }

    div.appendChild(portrait);

    // Name
    const name = document.createElement('div');
    name.className = 'bui-name';
    name.textContent = f.name;
    div.appendChild(name);

    // HP bar
    const hpPct = f.alive ? Math.max(0, f.hp / f.maxHp * 100) : 0;
    const hpBar = document.createElement('div');
    hpBar.className = 'bui-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'bui-hp-fill' + this._hpClass(hpPct);
    hpFill.style.width = hpPct + '%';
    hpBar.appendChild(hpFill);
    div.appendChild(hpBar);

    // HP text
    const hpText = document.createElement('div');
    hpText.className = 'bui-hp-text';
    hpText.textContent = f.alive ? f.hp + '/' + f.maxHp : '0';
    div.appendChild(hpText);

    // Rage bar (only for player side, or if rage > 0)
    if (side === 'player' || f.rage > 0) {
      const ragePct = Math.min(100, (f.rage || 0) / (f.maxRage || 100) * 100);
      const rageBar = document.createElement('div');
      rageBar.className = 'bui-rage-bar';
      const rageFill = document.createElement('div');
      rageFill.className = 'bui-rage-fill' + (ragePct >= 100 ? ' full' : '');
      rageFill.style.width = ragePct + '%';
      rageBar.appendChild(rageFill);
      div.appendChild(rageBar);
    }

    // Status effects
    const statusDiv = document.createElement('div');
    statusDiv.className = 'bui-status-icons';
    div.appendChild(statusDiv);
    this._updateStatusIcons(statusDiv, f);

    return div;
  },

  _hpClass(pct) {
    if (pct <= 25) return ' low';
    if (pct <= 55) return ' medium';
    return '';
  },

  _updateStatusIcons(container, f) {
    container.innerHTML = '';
    if (!f.alive) return;
    for (const e of (f.effects || [])) {
      const icon = document.createElement('div');
      icon.className = 'bui-status-icon ' + e.type;
      if (e.type === 'stun') icon.textContent = '晕';
      else if (e.type === 'charm') icon.textContent = '♥';
      else if (e.type === 'invincible') icon.textContent = '盾';
      else icon.textContent = '?';
      container.appendChild(icon);
    }
    // Buffs indicator
    if (f.buffs && f.buffs.length > 0) {
      const icon = document.createElement('div');
      icon.className = 'bui-status-icon';
      icon.style.background = 'rgba(34,197,94,.3)';
      icon.style.borderColor = 'rgba(34,197,94,.5)';
      icon.style.color = '#22c55e';
      icon.textContent = '↑';
      container.appendChild(icon);
    }
    // Debuffs indicator
    if (f.debuffs && f.debuffs.length > 0) {
      const icon = document.createElement('div');
      icon.className = 'bui-status-icon';
      icon.style.background = 'rgba(239,68,68,.3)';
      icon.style.borderColor = 'rgba(239,68,68,.5)';
      icon.style.color = '#ef4444';
      icon.textContent = '↓';
      container.appendChild(icon);
    }
  },

  // ══════════════════════════════════════════
  //  UPDATE — Sync state after each action
  // ══════════════════════════════════════════
  renderFighters(state) {
    if (!this._active) return;
    this._state = state;

    for (const side of ['player', 'enemy']) {
      for (const f of state[side]) {
        if (!f) continue;
        const key = side + '-' + f.pos;
        const data = this._fighterEls[key];
        if (!data) continue;
        const el = data.el;

        // HP
        const hpPct = f.alive ? Math.max(0, f.hp / f.maxHp * 100) : 0;
        const hpFill = el.querySelector('.bui-hp-fill');
        if (hpFill) {
          hpFill.style.width = hpPct + '%';
          hpFill.className = 'bui-hp-fill' + this._hpClass(hpPct);
        }
        const hpText = el.querySelector('.bui-hp-text');
        if (hpText) hpText.textContent = f.alive ? f.hp + '/' + f.maxHp : '0';

        // Rage
        const rageFill = el.querySelector('.bui-rage-fill');
        if (rageFill) {
          const ragePct = Math.min(100, (f.rage || 0) / (f.maxRage || 100) * 100);
          rageFill.style.width = ragePct + '%';
          rageFill.className = 'bui-rage-fill' + (ragePct >= 100 ? ' full' : '');
        }

        // Alive state
        if (!f.alive && !el.classList.contains('dead')) {
          el.classList.add('dead');
        }

        // Status effects
        const statusDiv = el.querySelector('.bui-status-icons');
        if (statusDiv) this._updateStatusIcons(statusDiv, f);

        // Update stored fighter ref
        data.f = f;
      }
    }

    // Update status bar
    this._updateStatusBar(state);
  },

  _updateStatusBar(state) {
    if (!this.statusBar) return;
    const terrainNames = { plains: '平原', mountain: '山地', water: '水域', river: '河流', forest: '森林', castle: '城池' };
    const terrainIcons = { plains: '🌾', mountain: '⛰️', water: '🌊', river: '🏞️', forest: '🌲', castle: '🏯' };
    const weatherNames = { clear: '晴', rain: '雨', fog: '雾', fire: '火', wind: '风', storm: '雷暴' };
    const weatherIcons = { clear: '☀️', rain: '🌧️', fog: '🌫️', fire: '🔥', wind: '💨', storm: '⛈️' };

    const t = state.terrain || 'plains';
    const w = state.weather || 'clear';

    this.statusBar.innerHTML =
      '<span>' + (weatherIcons[w] || '') + ' ' + (weatherNames[w] || w) + '</span>' +
      '<span>' + (terrainIcons[t] || '') + ' ' + (terrainNames[t] || t) + '</span>' +
      '<span class="bui-turn-badge">回合 ' + (state.turn || 0) + '</span>';
  },

  // ══════════════════════════════════════════
  //  VFX PROCESSING — Handle battle events
  // ══════════════════════════════════════════
  async processVFX(vfxList) {
    if (!this._active || !vfxList || vfxList.length === 0) return;

    // Queue VFX if already animating
    if (this._animating) {
      this._vfxQueue.push(...vfxList);
      return;
    }

    this._animating = true;

    for (const fx of vfxList) {
      try {
        if (fx.type === 'attack') {
          // Only play attack VFX if target is still rendered
          const tData = this._fighterEls[fx.target];
          if (tData && tData.el && !tData.el.classList.contains('dead')) {
            await this.playAttack(fx.attacker, fx.target, fx.dmg, fx.isCrit);
          }
        } else if (fx.type === 'skill') {
          await this.playSkill(fx.caster, fx.skillName);
        } else if (fx.type === 'kill') {
          await this.playKill(fx.target);
        } else if (fx.type === 'weather_change') {
          this._setupWeather(fx.weather);
          if (this.bgGlow) {
            this.bgGlow.className = 'bui-bg-glow terrain-' + (this._state?.terrain || 'plains');
          }
        }
      } catch(e) {
        console.error('[BattleUI VFX]', e);
      }
    }

    this._animating = false;

    // Process queued VFX
    if (this._vfxQueue.length > 0) {
      const queued = this._vfxQueue.splice(0);
      await this.processVFX(queued);
    }
  },

  // ══════════════════════════════════════════
  //  ATTACK ANIMATION
  // ══════════════════════════════════════════
  // Track combo hits for combo counter
  _comboCount: 0,
  _comboTimer: null,

  async playAttack(attackerKey, targetKey, dmg, isCrit) {
    const aData = this._fighterEls[attackerKey];
    const tData = this._fighterEls[targetKey];
    if (!aData || !tData) return;

    // Skip if target is already dead
    if (tData.f && !tData.f.alive) return;

    const aEl = aData.el;
    const tEl = tData.el;

    // Track combo
    this._comboCount++;
    clearTimeout(this._comboTimer);
    this._comboTimer = setTimeout(() => { this._comboCount = 0; }, 2000);

    // 1. Highlight attacker
    aEl.classList.add('attacking');

    // 2. Zoom portrait to center (for crits and every 3rd attack for impact)
    const showZoom = isCrit || Math.random() < 0.35;
    if (showZoom) {
      await this._showAttackZoom(aData.f, isCrit, isCrit ? 'crit' : 'attack');
    } else {
      await this._wait(80);
    }

    // 3. Crit flash + screen shake
    if (isCrit) {
      this._showCritFlash();
      this._screenShake('heavy');
    } else {
      this._screenShake('light');
    }

    // 4. Impact on target — flash white then shake
    tEl.classList.add('hit');
    this._showImpactFlash(tEl);
    this._showDamageNumber(tEl, dmg, isCrit);

    // 5. Particle explosion on hit
    this._spawnHitParticles(tEl, isCrit);

    // 6. Slash effect (on container)
    this._showSlashEffect(aEl, tEl, isCrit);

    // 7. Combo counter
    if (this._comboCount >= 3) {
      this._showComboText(this._comboCount);
    }

    // Wait for animations
    await this._wait(isCrit ? 350 : 250);

    // 8. Cleanup
    aEl.classList.remove('attacking');
    setTimeout(() => tEl.classList.remove('hit'), 350);

    await this._wait(isCrit ? 200 : 100);
  },

  // ══════════════════════════════════════════
  //  SKILL ANIMATION
  // ══════════════════════════════════════════
  async playSkill(casterKey, skillName) {
    const cData = this._fighterEls[casterKey];
    if (!cData) return;

    const cEl = cData.el;

    // 1. Highlight caster
    cEl.classList.add('attacking');

    // 2. Show skill banner
    this._showSkillBanner(skillName || '技能');

    // 3. Zoom portrait with skill styling
    await this._showAttackZoom(cData.f, false, 'skill');

    // 4. Trigger SkillCutIn if available
    if (typeof SkillCutIn !== 'undefined' && SkillCutIn.has(cData.f.id)) {
      try {
        // Attach skill cutin overlay to our container
        const wrap = this.container;
        if (wrap) {
          let ov = wrap.querySelector('#bui-skill-cutin-overlay');
          if (!ov) {
            ov = document.createElement('div');
            ov.id = 'bui-skill-cutin-overlay';
            ov.style.cssText = 'position:absolute;inset:0;z-index:100;pointer-events:none;overflow:hidden;border-radius:16px;display:none;';
            wrap.appendChild(ov);
          }
          SkillCutIn.overlay = ov;
          SkillCutIn.play(cData.f.id, skillName || cData.f.skill?.name || '');
        }
      } catch(e) { console.error('[BattleUI SkillCutIn]', e); }
    }

    await this._wait(300);
    cEl.classList.remove('attacking');
  },

  // ══════════════════════════════════════════
  //  KILL ANIMATION
  // ══════════════════════════════════════════
  async playKill(targetKey) {
    const tData = this._fighterEls[targetKey];
    if (!tData) return;

    const tEl = tData.el;

    // Show kill text near the target
    const rect = tEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const cx = rect.left - containerRect.left + rect.width / 2;
    const cy = rect.top - containerRect.top + rect.height / 2;

    // Heavy screen shake on kill
    this._screenShake('heavy');

    // Kill flash — brief red flash on entire screen
    const killFlash = document.createElement('div');
    killFlash.className = 'bui-kill-flash';
    this.container.appendChild(killFlash);
    setTimeout(() => killFlash.remove(), 300);

    const killText = document.createElement('div');
    killText.className = 'bui-kill-text';
    killText.textContent = '斩!';
    killText.style.left = cx + 'px';
    killText.style.top = cy + 'px';
    killText.style.transform = 'translate(-50%, -50%)';
    this.container.appendChild(killText);

    // Death particle burst
    this._spawnDeathParticles(tEl);

    // Death animation
    tEl.classList.add('dying');

    await this._wait(600);

    tEl.classList.remove('dying');
    tEl.classList.add('dead');

    // Remove kill text
    setTimeout(() => killText.remove(), 200);
  },

  _spawnDeathParticles(targetEl) {
    if (!this.container || !this.damageLayer) return;

    const rect = targetEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const cx = rect.left - containerRect.left + rect.width / 2;
    const cy = rect.top - containerRect.top + rect.height / 2;

    const colors = ['#ef4444', '#ff6b6b', '#ff8888', '#991b1b', '#fca5a5', '#dc2626'];
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'bui-death-particle';
      const angle = (Math.PI * 2 / 20) * i + (Math.random() - 0.5);
      const dist = 30 + Math.random() * 60;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (3 + Math.random() * 5) + 'px';
      p.style.height = p.style.width;
      p.style.animationDuration = (0.4 + Math.random() * 0.4) + 's';
      this.damageLayer.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  },

  // ══════════════════════════════════════════
  //  VICTORY / DEFEAT
  // ══════════════════════════════════════════
  async playVictory() {
    if (!this._active || !this.container) return;

    // Golden flash
    const goldFlash = document.createElement('div');
    goldFlash.className = 'bui-victory-flash';
    this.container.appendChild(goldFlash);
    setTimeout(() => goldFlash.remove(), 500);

    // Glow all surviving player fighters
    for (const key of Object.keys(this._fighterEls)) {
      const data = this._fighterEls[key];
      if (data.side === 'player' && data.f.alive) {
        data.el.classList.add('victory-glow');
      }
    }

    // Victory text with sub-text
    const overlay = document.createElement('div');
    overlay.className = 'bui-victory-overlay';
    overlay.innerHTML = '<div class="bui-victory-text">大 胜</div>' +
      '<div class="bui-victory-sub">VICTORY</div>';
    this.container.appendChild(overlay);

    // Confetti
    this._spawnConfetti();

    // Victory light rays
    this._spawnVictoryRays();

    await this._wait(1500);
  },

  _spawnVictoryRays() {
    if (!this.container) return;
    for (let i = 0; i < 8; i++) {
      const ray = document.createElement('div');
      ray.className = 'bui-victory-ray';
      ray.style.transform = 'rotate(' + (i * 45) + 'deg)';
      ray.style.animationDelay = (i * 0.1) + 's';
      this.container.appendChild(ray);
      setTimeout(() => ray.remove(), 2000);
    }
  },

  async playDefeat() {
    if (!this._active || !this.container) return;

    // Dim all fighters
    for (const key of Object.keys(this._fighterEls)) {
      this._fighterEls[key].el.classList.add('defeat-dim');
    }

    // Defeat overlay
    const overlay = document.createElement('div');
    overlay.className = 'bui-defeat-overlay';
    overlay.innerHTML = '<div class="bui-defeat-text">战败...</div>';
    this.container.appendChild(overlay);

    await this._wait(1000);
  },

  // ══════════════════════════════════════════
  //  VFX HELPERS
  // ══════════════════════════════════════════
  async _showAttackZoom(fighter, isCrit, zoomType) {
    if (!this.container) return;

    const overlay = this.attackOverlay;
    overlay.innerHTML = '';
    overlay.classList.add('active');

    // Dim
    const dim = document.createElement('div');
    dim.className = 'bui-attack-dim';
    overlay.appendChild(dim);

    // Zoom portrait
    const zoom = document.createElement('div');
    zoom.className = 'bui-attack-zoom';
    if (zoomType === 'skill') zoom.classList.add('skill-zoom');

    // Render portrait at zoom size (rounded rect)
    let svgContent = '';
    if (typeof Portraits !== 'undefined') {
      try { svgContent = Portraits.getRect ? Portraits.getRect(fighter.id, 200) : Portraits.get(fighter.id, 200); } catch(e) {}
    }
    if (!svgContent) {
      const vd = (typeof Visuals !== 'undefined' && Visuals.HERO_DATA[fighter.id]) || { ch: fighter.name?.[0] || '?', c1: '#3a3f47', c2: '#6c757d' };
      svgContent = '<svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="200" height="200" rx="16" fill="' + vd.c1 + '"/>' +
        '<text x="100" y="120" text-anchor="middle" font-size="80" font-weight="900" fill="rgba(255,255,255,.9)" font-family="\'Noto Serif SC\',serif">' + vd.ch + '</text></svg>';
    }
    zoom.innerHTML = svgContent;
    const svgEl = zoom.querySelector('svg');
    if (svgEl) {
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.display = 'block';
    }
    overlay.appendChild(zoom);

    // Animate in
    requestAnimationFrame(() => {
      dim.classList.add('active');
      zoom.classList.add('active');
    });

    // Hold
    await this._wait(isCrit ? 350 : 220);

    // Animate out
    zoom.classList.remove('active');
    dim.classList.remove('active');

    await this._wait(150);

    overlay.classList.remove('active');
    overlay.innerHTML = '';
  },

  _showDamageNumber(targetEl, dmg, isCrit) {
    if (!this.container || !this.damageLayer) return;

    const rect = targetEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + 10;

    const el = document.createElement('div');
    el.className = 'bui-damage' + (isCrit ? ' crit' : '');
    el.textContent = (isCrit ? '暴击! ' : '-') + dmg;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = 'translateX(-50%)';
    this.damageLayer.appendChild(el);

    setTimeout(() => el.remove(), 850);
  },

  _showCritFlash() {
    if (!this.container) return;

    const flash = document.createElement('div');
    flash.className = 'bui-crit-flash';
    this.container.appendChild(flash);

    const text = document.createElement('div');
    text.className = 'bui-crit-text';
    text.textContent = '暴击!';
    this.container.appendChild(text);

    setTimeout(() => { flash.remove(); text.remove(); }, 550);
  },

  _showSlashEffect(attackerEl, targetEl, isCrit) {
    if (!this.container) return;

    const aRect = attackerEl.getBoundingClientRect();
    const tRect = targetEl.getBoundingClientRect();
    const cRect = this.container.getBoundingClientRect();

    const x1 = aRect.left - cRect.left + aRect.width / 2;
    const y1 = aRect.top - cRect.top + aRect.height / 2;
    const x2 = tRect.left - cRect.left + tRect.width / 2;
    const y2 = tRect.top - cRect.top + tRect.height / 2;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'bui-slash');
    svg.setAttribute('viewBox', '0 0 ' + this.container.offsetWidth + ' ' + this.container.offsetHeight);
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:35;pointer-events:none;';

    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', isCrit ? '#ffd700' : 'rgba(255,255,255,.6)');
    line.setAttribute('stroke-width', isCrit ? '3' : '2');
    line.setAttribute('stroke-linecap', 'round');
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = len;
    line.style.animation = 'bui-slash-draw .2s ease-out forwards';

    svg.appendChild(line);
    this.container.appendChild(svg);

    setTimeout(() => svg.remove(), 350);
  },

  _showSkillBanner(skillName) {
    if (!this.container) return;

    const banner = document.createElement('div');
    banner.className = 'bui-skill-banner';
    banner.innerHTML = '<div class="bui-skill-banner-text">【' + skillName + '】</div>';
    this.container.appendChild(banner);

    setTimeout(() => banner.remove(), 900);
  },

  _spawnConfetti() {
    if (!this.container) return;
    const colors = ['#ffd700', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];
    const w = this.container.offsetWidth;
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('div');
      c.className = 'bui-confetti';
      c.style.left = (Math.random() * w) + 'px';
      c.style.top = '-10px';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDelay = (Math.random() * .8) + 's';
      c.style.animationDuration = (1.5 + Math.random()) + 's';
      c.style.width = (4 + Math.random() * 4) + 'px';
      c.style.height = (4 + Math.random() * 4) + 'px';
      c.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      this.container.appendChild(c);
      setTimeout(() => c.remove(), 2500);
    }
  },

  // ══════════════════════════════════════════
  //  DRAMATIC SCREEN SHAKE
  // ══════════════════════════════════════════
  _screenShake(intensity) {
    if (!this.container) return;
    const cls = intensity === 'heavy' ? 'bui-shake-heavy' : 'bui-shake-light';
    this.container.classList.add(cls);
    setTimeout(() => this.container.classList.remove(cls), intensity === 'heavy' ? 400 : 250);
  },

  // ══════════════════════════════════════════
  //  IMPACT FLASH on target (white flash overlay)
  // ══════════════════════════════════════════
  _showImpactFlash(targetEl) {
    if (!targetEl) return;
    const flash = document.createElement('div');
    flash.className = 'bui-impact-flash';
    const portrait = targetEl.querySelector('.bui-portrait');
    if (portrait) {
      portrait.style.position = 'relative';
      portrait.appendChild(flash);
      setTimeout(() => flash.remove(), 200);
    }
  },

  // ══════════════════════════════════════════
  //  PARTICLE EXPLOSION on hit
  // ══════════════════════════════════════════
  _spawnHitParticles(targetEl, isCrit) {
    if (!this.container || !this.damageLayer) return;

    const rect = targetEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const cx = rect.left - containerRect.left + rect.width / 2;
    const cy = rect.top - containerRect.top + rect.height / 2;

    const count = isCrit ? 16 : 8;
    const colors = isCrit
      ? ['#ffd700', '#ff6b00', '#ff4444', '#ffaa00', '#fff']
      : ['#ff6b6b', '#ff8888', '#ffaaaa', '#fff', '#ff4444'];

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'bui-hit-particle';
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
      const dist = 20 + Math.random() * (isCrit ? 50 : 30);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (isCrit ? 4 + Math.random() * 4 : 3 + Math.random() * 3) + 'px';
      p.style.height = p.style.width;
      p.style.animationDuration = (0.3 + Math.random() * 0.3) + 's';
      this.damageLayer.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  },

  // ══════════════════════════════════════════
  //  COMBO COUNTER TEXT
  // ══════════════════════════════════════════
  _showComboText(count) {
    if (!this.container) return;

    // Remove existing combo text
    const existing = this.container.querySelector('.bui-combo-text');
    if (existing) existing.remove();

    const combo = document.createElement('div');
    combo.className = 'bui-combo-text';
    combo.innerHTML = '<span class="bui-combo-num">' + count + '</span><span class="bui-combo-label">COMBO</span>';
    this.container.appendChild(combo);
    setTimeout(() => combo.remove(), 1200);
  },

  // ══════════════════════════════════════════
  //  BATTLE START ANIMATION
  // ══════════════════════════════════════════
  async playBattleStart() {
    if (!this._active || !this.container) return;

    const overlay = document.createElement('div');
    overlay.className = 'bui-battle-start-overlay';
    overlay.innerHTML = '<div class="bui-battle-start-text">战 斗 开 始</div>' +
      '<div class="bui-battle-start-sub">BATTLE START</div>';
    this.container.appendChild(overlay);

    await this._wait(1200);
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    await this._wait(400);
    overlay.remove();
  },

  _setupWeather(weather) {
    if (!this.weatherLayer) return;
    this.weatherLayer.innerHTML = '';

    if (weather === 'rain') {
      for (let i = 0; i < 20; i++) {
        const drop = document.createElement('div');
        drop.className = 'bui-rain-drop';
        drop.style.left = (Math.random() * 100) + '%';
        drop.style.animationDelay = (Math.random() * 1) + 's';
        drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
        this.weatherLayer.appendChild(drop);
      }
    } else if (weather === 'fog') {
      const fog = document.createElement('div');
      fog.className = 'bui-fog-layer';
      this.weatherLayer.appendChild(fog);
    }
  },

  // ══════════════════════════════════════════
  //  CLEANUP
  // ══════════════════════════════════════════
  destroy() {
    this._active = false;
    this._animating = false;
    this._vfxQueue = [];
    this._fighterEls = {};
    this._state = null;
    this.container = null;
    this.statusBar = null;
    this.enemyRow = null;
    this.playerRow = null;
    this.attackOverlay = null;
    this.damageLayer = null;
    this.weatherLayer = null;
    this.bgGlow = null;
    try {
      const c = document.getElementById('battle-ui-container');
      if (c && c.parentNode) c.remove();
    } catch(e) { /* safe cleanup */ }
    try {
      const page = document.getElementById('page-battle');
      if (page) page.classList.remove('bui-active');
    } catch(e) { /* safe cleanup */ }
  },

  // ══════════════════════════════════════════
  //  UTILITY
  // ══════════════════════════════════════════
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

if (typeof window !== 'undefined') window.BattleUI = BattleUI;

// 三国·天命 — Dynamic Battlefield System (动态战场)
// Weather shifts, terrain transforms, day/night cycle, environmental hazards
// The battlefield is ALIVE — every battle feels unique

const DynamicBattlefield = {

  // ═══════════════════════════════════════════
  //  WEATHER SYSTEM (6 types)
  // ═══════════════════════════════════════════
  WEATHER: {
    clear:  { name: '晴', icon: '☀️', desc: '万里无云', effects: {}, visual: { brightness: 1.0 } },
    rain:   { name: '雨', icon: '🌧️', desc: '大雨倾盆', effects: { fire_dmg: -0.5, water_dmg: 0.3, spd: -0.1 }, visual: { brightness: 0.7, particles: 'rain' } },
    wind:   { name: '风', icon: '🌬️', desc: '狂风大作', effects: { fire_dmg: 0.5, ranged_miss: 0.15 }, visual: { particles: 'wind_leaves' } },
    fog:    { name: '雾', icon: '🌫️', desc: '浓雾弥漫', effects: { miss_chance: 0.2, crit: -0.1 }, visual: { brightness: 0.5, overlay: 'fog' } },
    storm:  { name: '雷', icon: '⛈️', desc: '雷暴将至', effects: { metal_dmg: 0.3, random_lightning: true }, visual: { brightness: 0.6, particles: 'rain', flash: true } },
    snow:   { name: '雪', icon: '❄️', desc: '大雪纷飞', effects: { spd: -0.2, ice_dmg: 0.3 }, visual: { brightness: 0.8, particles: 'snow' } },
  },

  // ═══════════════════════════════════════════
  //  TERRAIN SYSTEM (8 types)
  // ═══════════════════════════════════════════
  TERRAIN: {
    plains:   { name: '平原', icon: '🌾', desc: '一马平川', effects: { cavalry_atk: 0.15 }, color: '#2d4a1e' },
    forest:   { name: '森林', icon: '🌲', desc: '密林深处', effects: { ranged_def: 0.2, fire_spread: true }, color: '#1a3312', destructible: true, burnedState: 'charred' },
    mountain: { name: '山地', icon: '⛰️', desc: '崇山峻岭', effects: { def: 0.15, spd: -0.15, cavalry_atk: -0.2 }, color: '#3d3525' },
    river:    { name: '江河', icon: '🌊', desc: '大江东去', effects: { water_dmg: 0.2, fire_dmg: -0.3, spd: -0.1 }, color: '#1a2d40' },
    castle:   { name: '城池', icon: '🏰', desc: '城墙坚固', effects: { def: 0.25, siege_vulnerable: true }, color: '#2a2520' },
    desert:   { name: '荒漠', icon: '🏜️', desc: '黄沙漫天', effects: { fire_dmg: 0.2, water_dmg: -0.3, atk: -0.05 }, color: '#4a3d20' },
    swamp:    { name: '沼泽', icon: '🐊', desc: '泥泞难行', effects: { spd: -0.25, poison_chance: 0.1 }, color: '#1a2a1a' },
    charred:  { name: '焦土', icon: '🔥', desc: '战火焚烧后的废墟', effects: { fire_dmg: -0.5, morale: -0.1 }, color: '#1a1510' },
  },

  // ═══════════════════════════════════════════
  //  TERRITORY → TERRAIN MAPPING
  // ═══════════════════════════════════════════
  TERRITORY_TERRAIN: {
    luoyang: 'castle', changan: 'castle', xuchang: 'plains', hulao: 'mountain',
    guandu: 'plains', yecheng: 'castle', xiapi: 'river', jianye: 'river',
    chaisang: 'river', chibi: 'river', jingzhou: 'plains', changsha: 'forest',
    yiling: 'forest', hanzhong: 'mountain', dingjun: 'mountain', chengdu: 'plains',
    nanzhong: 'swamp', xiliang: 'desert', hefei: 'castle', wuzhang: 'mountain',
  },

  // ═══════════════════════════════════════════
  //  DAY/NIGHT CYCLE
  // ═══════════════════════════════════════════
  TIME_OF_DAY: {
    dawn:  { name: '拂晓', icon: '🌅', brightness: 0.7, skyColor: '#2a1a3a', effect: { surprise_bonus: 0.15 } },
    day:   { name: '白日', icon: '☀️', brightness: 1.0, skyColor: '#1a2440', effect: {} },
    dusk:  { name: '黄昏', icon: '🌇', brightness: 0.75, skyColor: '#3a2010', effect: { fire_visual: 1.3 } },
    night: { name: '夜晚', icon: '🌙', brightness: 0.4, skyColor: '#0a0a15', effect: { miss_chance: 0.1, ambush_bonus: 0.2 } },
  },

  // ═══════════════════════════════════════════
  //  ENVIRONMENTAL HAZARDS
  // ═══════════════════════════════════════════
  HAZARDS: {
    river:    { name: '洪水', icon: '🌊', desc: '大水冲来！', dmgType: 'water', dmgMult: 0.15 },
    mountain: { name: '落石', icon: '🪨', desc: '山间巨石滚落！', dmgType: 'physical', dmgMult: 0.12 },
    swamp:    { name: '毒雾', icon: '☠️', desc: '沼泽毒雾弥漫！', dmgType: 'poison', dmgMult: 0.08, dot: true },
    storm:    { name: '雷击', icon: '⚡', desc: '天降雷霆！', dmgType: 'lightning', dmgMult: 0.25, bothSides: true },
  },

  // ═══════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════
  state: null,

  // ═══════════════════════════════════════════
  //  INIT — called when battle starts
  // ═══════════════════════════════════════════
  init(territoryId, overrideTerrain, overrideWeather) {
    // Determine terrain from territory or override
    let terrainKey = overrideTerrain || 'plains';
    if (territoryId && this.TERRITORY_TERRAIN[territoryId]) {
      terrainKey = this.TERRITORY_TERRAIN[territoryId];
    }

    // Random initial weather (weighted: clear most common)
    const weatherKeys = Object.keys(this.WEATHER);
    const weatherWeights = [30, 15, 15, 10, 10, 10]; // clear, rain, wind, fog, storm, snow
    let weatherKey = overrideWeather || this._weightedRandom(weatherKeys, weatherWeights);

    // Ensure valid keys
    if (!this.TERRAIN[terrainKey]) terrainKey = 'plains';
    if (!this.WEATHER[weatherKey]) weatherKey = 'clear';

    // Random time of day
    const timeKeys = Object.keys(this.TIME_OF_DAY);
    const timeKey = timeKeys[Math.floor(Math.random() * timeKeys.length)];

    this.state = {
      terrain: terrainKey,
      weather: weatherKey,
      timeOfDay: timeKey,
      turn: 0,
      fireHits: 0,           // Track fire hits on forest for terrain destruction
      announcements: [],      // Queue of announcements to display
      hazardLog: [],          // Recent hazard events
      weatherChanged: false,  // Flag for UI to show weather change
      terrainChanged: false,  // Flag for UI to show terrain change
    };

    // Update battle state terrain/weather
    if (typeof Battle !== 'undefined' && Battle.state) {
      Battle.state.terrain = terrainKey;
      Battle.state.weather = weatherKey;
    }

    return this.state;
  },

  // ═══════════════════════════════════════════
  //  ON TURN START — called each battle turn
  // ═══════════════════════════════════════════
  onTurnStart(turn, battleState) {
    if (!this.state) return null;
    this.state.turn = turn;
    this.state.weatherChanged = false;
    this.state.terrainChanged = false;
    this.state.announcements = [];

    const events = [];

    // --- Weather change check (every 4 turns, 30% chance) ---
    if (turn > 1 && turn % 4 === 0 && Math.random() < 0.3) {
      const oldWeather = this.state.weather;
      const newWeather = this._pickNewWeather(oldWeather);
      if (newWeather !== oldWeather) {
        this.state.weather = newWeather;
        this.state.weatherChanged = true;
        if (battleState) battleState.weather = newWeather;

        const w = this.WEATHER[newWeather];
        const announcement = w.icon + ' 风云突变！' + w.name + ' — ' + w.desc + '！';
        this.state.announcements.push({ text: announcement, type: 'weather' });
        events.push({ type: 'weather_change', weather: newWeather, text: announcement });
      }
    }

    // --- Day/Night cycle (shift every 6 turns) ---
    if (turn > 1 && turn % 6 === 0) {
      const timeKeys = ['dawn', 'day', 'dusk', 'night'];
      const currentIdx = timeKeys.indexOf(this.state.timeOfDay);
      const nextIdx = (currentIdx + 1) % timeKeys.length;
      const oldTime = this.state.timeOfDay;
      this.state.timeOfDay = timeKeys[nextIdx];

      if (oldTime !== this.state.timeOfDay) {
        const t = this.TIME_OF_DAY[this.state.timeOfDay];
        const timeAnnounce = t.icon + ' ' + t.name + '到来...';
        this.state.announcements.push({ text: timeAnnounce, type: 'time' });
        events.push({ type: 'time_change', time: this.state.timeOfDay, text: timeAnnounce });
      }
    }

    // --- Environmental hazard check (every 3 turns) ---
    if (turn > 1 && turn % 3 === 0) {
      const hazardResult = this._checkHazard(battleState);
      if (hazardResult) {
        events.push(hazardResult);
      }
    }

    return events.length > 0 ? events : null;
  },

  // ═══════════════════════════════════════════
  //  TERRAIN DESTRUCTION — called when fire hits forest
  // ═══════════════════════════════════════════
  onFireHit() {
    if (!this.state || this.state.terrain !== 'forest') return false;

    this.state.fireHits++;
    if (this.state.fireHits >= 3) {
      this.state.terrain = 'charred';
      this.state.terrainChanged = true;
      if (typeof Battle !== 'undefined' && Battle.state) {
        Battle.state.terrain = 'charred';
      }
      const announcement = '🔥 林木焚尽，大地化为焦土！';
      this.state.announcements.push({ text: announcement, type: 'terrain' });
      return true;
    }
    return false;
  },

  // ═══════════════════════════════════════════
  //  FORCE WEATHER — e.g. 借东风 strategy card
  // ═══════════════════════════════════════════
  forceWeather(weatherKey) {
    if (!this.state || !this.WEATHER[weatherKey]) return;
    const old = this.state.weather;
    this.state.weather = weatherKey;
    this.state.weatherChanged = true;
    if (typeof Battle !== 'undefined' && Battle.state) {
      Battle.state.weather = weatherKey;
    }
    const w = this.WEATHER[weatherKey];
    const announcement = '🎴 ' + w.icon + ' 天象异变！' + w.desc + '！';
    this.state.announcements.push({ text: announcement, type: 'weather' });
  },

  // ═══════════════════════════════════════════
  //  DAMAGE MODIFIER — factor in all battlefield effects
  // ═══════════════════════════════════════════
  getDamageModifier(attacker, defender, baseDmg, isSkill) {
    if (!this.state) return 1.0;

    let modifier = 1.0;
    const terrain = this.TERRAIN[this.state.terrain];
    const weather = this.WEATHER[this.state.weather];
    const time = this.TIME_OF_DAY[this.state.timeOfDay];

    // --- Terrain effects ---
    if (terrain && terrain.effects) {
      const te = terrain.effects;
      // Cavalry attack bonus/penalty
      if (attacker.unit === 'cavalry' && te.cavalry_atk) {
        modifier += te.cavalry_atk;
      }
      // Defense bonus (applies to defender)
      if (te.def && defender) {
        modifier -= te.def * 0.5; // Halved since it's a damage modifier
      }
      // Ranged defense (archers/mages take less damage)
      if (te.ranged_def && (defender.unit === 'archer' || defender.unit === 'mage')) {
        modifier -= te.ranged_def;
      }
      // Morale penalty
      if (te.morale) {
        modifier += te.morale;
      }
    }

    // --- Weather effects ---
    if (weather && weather.effects) {
      const we = weather.effects;
      // Fire damage modifier (for fire-type skills/attacks)
      if (we.fire_dmg && isSkill && attacker.skill && attacker.skill.type === 'magic') {
        modifier += we.fire_dmg;
      }
      // Water damage modifier
      if (we.water_dmg && attacker.element === 'water') {
        modifier += we.water_dmg;
      }
      // Miss chance
      if (we.miss_chance && Math.random() < we.miss_chance) {
        return 0; // Complete miss!
      }
      // Ranged miss (wind)
      if (we.ranged_miss && attacker.unit === 'archer' && Math.random() < we.ranged_miss) {
        return 0; // Arrow blown off course
      }
    }

    // --- Time of day effects ---
    if (time && time.effect) {
      if (time.effect.miss_chance && Math.random() < time.effect.miss_chance) {
        return 0; // Darkness miss
      }
      if (time.effect.surprise_bonus && this.state.turn <= 2) {
        modifier += time.effect.surprise_bonus;
      }
      if (time.effect.ambush_bonus && attacker.spd > (defender ? defender.spd : 0)) {
        modifier += time.effect.ambush_bonus * 0.5;
      }
    }

    return Math.max(0.1, modifier);
  },

  // ═══════════════════════════════════════════
  //  SPEED MODIFIER — weather/terrain affecting speed
  // ═══════════════════════════════════════════
  getSpeedModifier() {
    if (!this.state) return 1.0;
    let mod = 1.0;
    const terrain = this.TERRAIN[this.state.terrain];
    const weather = this.WEATHER[this.state.weather];

    if (terrain && terrain.effects && terrain.effects.spd) {
      mod += terrain.effects.spd;
    }
    if (weather && weather.effects && weather.effects.spd) {
      mod += weather.effects.spd;
    }
    return Math.max(0.5, mod);
  },

  // ═══════════════════════════════════════════
  //  STATUS BAR — returns HTML for current conditions
  // ═══════════════════════════════════════════
  getStatusBarHTML() {
    if (!this.state) return '';
    const w = this.WEATHER[this.state.weather];
    const t = this.TERRAIN[this.state.terrain];
    const tod = this.TIME_OF_DAY[this.state.timeOfDay];
    if (!w || !t || !tod) return '';

    return '<span class="bf-status-item bf-weather">' + w.icon + ' ' + w.name + '</span>' +
           '<span class="bf-status-sep">|</span>' +
           '<span class="bf-status-item bf-terrain">' + t.icon + ' ' + t.name + '</span>' +
           '<span class="bf-status-sep">|</span>' +
           '<span class="bf-status-item bf-time">' + tod.icon + ' ' + tod.name + '</span>' +
           '<span class="bf-status-sep">|</span>' +
           '<span class="bf-status-item bf-turn">回合 ' + this.state.turn + '</span>';
  },

  // ═══════════════════════════════════════════
  //  CANVAS VISUAL DATA — for battle-canvas.js
  // ═══════════════════════════════════════════
  getVisualState() {
    if (!this.state) return null;
    const w = this.WEATHER[this.state.weather];
    const t = this.TERRAIN[this.state.terrain];
    const tod = this.TIME_OF_DAY[this.state.timeOfDay];

    return {
      weatherKey: this.state.weather,
      terrainKey: this.state.terrain,
      timeKey: this.state.timeOfDay,
      brightness: Math.min(w.visual?.brightness || 1.0, tod.brightness),
      skyColor: tod.skyColor,
      groundColor: t.color,
      particles: w.visual?.particles || null,
      overlay: w.visual?.overlay || null,
      flash: w.visual?.flash || false,
      announcements: this.state.announcements,
      weatherChanged: this.state.weatherChanged,
      terrainChanged: this.state.terrainChanged,
    };
  },

  // ═══════════════════════════════════════════
  //  INTERNAL HELPERS
  // ═══════════════════════════════════════════

  _weightedRandom(items, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[0];
  },

  _pickNewWeather(current) {
    // Weighted transition — adjacent weathers more likely
    const transitions = {
      clear: ['rain', 'wind', 'fog'],
      rain:  ['storm', 'clear', 'fog'],
      wind:  ['storm', 'clear', 'snow'],
      fog:   ['rain', 'clear', 'wind'],
      storm: ['rain', 'wind', 'clear'],
      snow:  ['wind', 'fog', 'clear'],
    };
    const choices = transitions[current] || Object.keys(this.WEATHER);
    return choices[Math.floor(Math.random() * choices.length)];
  },

  _checkHazard(battleState) {
    if (!battleState) return null;

    // Check terrain-based hazard
    const terrainKey = this.state.terrain;
    const hazardDef = this.HAZARDS[terrainKey];

    // Also check storm hazard
    const weatherHazard = (this.state.weather === 'storm') ? this.HAZARDS.storm : null;

    const hazard = hazardDef || weatherHazard;
    if (!hazard) return null;

    // 40% chance each eligible turn
    if (Math.random() > 0.4) return null;

    // Pick a random target
    const allFighters = [...(battleState.player || []), ...(battleState.enemy || [])].filter(f => f && f.alive);
    if (allFighters.length === 0) return null;

    let targets;
    if (hazard.bothSides) {
      // Lightning can hit anyone
      targets = [allFighters[Math.floor(Math.random() * allFighters.length)]];
    } else {
      // Terrain hazards hit a random fighter (slightly favoring enemies)
      const pool = Math.random() < 0.4
        ? (battleState.player || []).filter(f => f && f.alive)
        : (battleState.enemy || []).filter(f => f && f.alive);
      if (pool.length === 0) return null;
      targets = [pool[Math.floor(Math.random() * pool.length)]];
    }

    const target = targets[0];
    const dmg = Math.floor(target.maxHp * hazard.dmgMult);
    target.hp = Math.max(1, target.hp - dmg); // Hazards don't kill, leave at 1 HP

    const announcement = hazard.icon + ' 天灾！' + hazard.name + '！' + target.name + ' 受到 ' + dmg + ' 伤害！';
    this.state.announcements.push({ text: announcement, type: 'hazard' });
    this.state.hazardLog.push({ turn: this.state.turn, hazard: hazard.name, target: target.name, dmg });

    // Add log to battle
    if (typeof Battle !== 'undefined') {
      Battle.addLog('<span class="bf-hazard-log">' + announcement + '</span>');
    }

    // Poison DOT for swamp
    if (hazard.dot && target.alive) {
      target.debuffs.push({ stat: 'hp_dot', pct: -3, duration: 2, _source: 'hazard_poison' });
    }

    return {
      type: 'hazard',
      hazard: hazard,
      target: target,
      dmg: dmg,
      text: announcement,
    };
  },
};

// ═══════════════════════════════════════════
//  PARTICLE SYSTEM (lightweight, pooled)
//  Integrated into battle-canvas rendering
// ═══════════════════════════════════════════
const BattlefieldParticles = {
  pools: {
    rain: [],
    snow: [],
    wind_leaves: [],
    fog: [],
  },
  active: {
    rain: [],
    snow: [],
    wind_leaves: [],
    fog: [],
  },
  MAX_PARTICLES: {
    rain: 80,
    snow: 50,
    wind_leaves: 15,
    fog: 8,
  },

  // Spawn particles for the current weather
  update(weatherParticleType, canvasWidth, canvasHeight, dt) {
    if (!weatherParticleType) return;
    const maxP = this.MAX_PARTICLES[weatherParticleType] || 30;
    const activeArr = this.active[weatherParticleType];
    if (!activeArr) return;

    // Spawn new particles to maintain count
    while (activeArr.length < maxP) {
      activeArr.push(this._spawn(weatherParticleType, canvasWidth, canvasHeight));
    }

    // Update existing
    for (let i = activeArr.length - 1; i >= 0; i--) {
      const p = activeArr[i];
      p.x += p.vx * (dt || 1);
      p.y += p.vy * (dt || 1);
      p.life -= p.decay * (dt || 1);

      // Recycle particles that go off-screen or die
      if (p.life <= 0 || p.y > canvasHeight + 20 || p.x < -30 || p.x > canvasWidth + 30) {
        activeArr[i] = this._spawn(weatherParticleType, canvasWidth, canvasHeight);
      }
    }
  },

  _spawn(type, w, h) {
    switch (type) {
      case 'rain':
        return {
          x: Math.random() * (w + 40) - 20,
          y: -10 - Math.random() * 40,
          vx: -1 - Math.random() * 0.5,
          vy: 8 + Math.random() * 4,
          len: 10 + Math.random() * 8,
          alpha: 0.2 + Math.random() * 0.3,
          life: 1, decay: 0,
        };
      case 'snow':
        return {
          x: Math.random() * w,
          y: -5 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1 + Math.random() * 1.5,
          size: 2 + Math.random() * 3,
          alpha: 0.3 + Math.random() * 0.4,
          wobble: Math.random() * Math.PI * 2,
          life: 1, decay: 0,
        };
      case 'wind_leaves':
        return {
          x: -10 - Math.random() * 30,
          y: Math.random() * h,
          vx: 3 + Math.random() * 4,
          vy: (Math.random() - 0.5) * 2,
          size: 3 + Math.random() * 4,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          alpha: 0.4 + Math.random() * 0.3,
          color: ['#8B7355', '#6B8E23', '#DAA520', '#CD853F'][Math.floor(Math.random() * 4)],
          life: 1, decay: 0.003,
        };
      case 'fog':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.1,
          size: 40 + Math.random() * 60,
          alpha: 0.03 + Math.random() * 0.04,
          life: 1, decay: 0.001,
        };
      default:
        return { x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 1 };
    }
  },

  // Draw all active particles
  draw(ctx, type) {
    if (!type) return;
    const activeArr = this.active[type];
    if (!activeArr) return;

    ctx.save();

    switch (type) {
      case 'rain':
        for (const p of activeArr) {
          ctx.strokeStyle = 'rgba(150,180,255,' + p.alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 0.5, p.y + p.len);
          ctx.stroke();
        }
        break;

      case 'snow':
        for (const p of activeArr) {
          // Wobble horizontally
          p.wobble += 0.02;
          p.x += Math.sin(p.wobble) * 0.3;
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Inner glow
          ctx.globalAlpha = p.alpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'wind_leaves':
        for (const p of activeArr) {
          p.rotation += p.rotSpeed;
          ctx.globalAlpha = p.alpha * p.life;
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          // Leaf shape: ellipse
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          // Leaf vein
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(p.size, 0);
          ctx.stroke();
          ctx.restore();
        }
        break;

      case 'fog':
        for (const p of activeArr) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, 'rgba(200,200,220,' + (p.alpha * p.life) + ')');
          grad.addColorStop(1, 'rgba(200,200,220,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }

    ctx.restore();
  },

  // Clear all particles (when weather changes)
  clear(type) {
    if (type && this.active[type]) {
      this.active[type] = [];
    } else {
      for (const key of Object.keys(this.active)) {
        this.active[key] = [];
      }
    }
  },

  // Clear all
  clearAll() {
    for (const key of Object.keys(this.active)) {
      this.active[key] = [];
    }
  },
};

if (typeof window !== 'undefined') {
  window.DynamicBattlefield = DynamicBattlefield;
  window.BattlefieldParticles = BattlefieldParticles;
}

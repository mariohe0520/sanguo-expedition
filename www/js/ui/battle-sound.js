// 三国·天命 — Battle Sound Effects Engine
// Real Audio Samples + Web Audio API

const BattleSound = {
  ctx: null,
  _initialized: false,
  _buffers: {},
  _loading: false,
  
  SOUND_PATH: 'assets/sounds/',
  
  SOUNDS: {
    sword_slash: 'sword_slash.wav',
    spear_thrust: 'spear_thrust.wav',
    arrow_shot: 'arrow_shot.wav',
    magic_cast: 'magic_cast.wav',
    cavalry_charge: 'cavalry_charge.wav',
    shield_block: 'shield_block.wav',
    victory_fanfare: 'victory_fanfare.wav',
    battle_start: 'battle_start.wav'
  },

  async init() {
    if (this._initialized || this._loading) return;
    this._loading = true;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load all sound files
      const loadPromises = Object.entries(this.SOUNDS).map(async ([key, filename]) => {
        try {
          const response = await fetch(this.SOUND_PATH + filename);
          const arrayBuffer = await response.arrayBuffer();
          this._buffers[key] = await this.ctx.decodeAudioData(arrayBuffer);
        } catch (e) {
          console.warn(`Failed to load sound: ${filename}`, e);
        }
      });
      
      await Promise.all(loadPromises);
      this._initialized = true;
      // Battle sounds loaded
    } catch(e) {
      console.warn('BattleSound: Web Audio not supported');
    } finally {
      this._loading = false;
    }
  },

  _getCtx() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  
  _playBuffer(name, volume = 1.0) {
    const c = this._getCtx();
    if (!c || !this._buffers[name]) {
      // Fallback to synthesis if buffer not loaded
      return false;
    }
    
    const source = c.createBufferSource();
    source.buffer = this._buffers[name];
    
    const gain = c.createGain();
    gain.gain.value = volume;
    
    source.connect(gain);
    gain.connect(c.destination);
    source.start(0);
    return true;
  },

  // 剑兵攻击 - 剑气斩击
  playAttack(faction = 'shu') {
    // Try real sound first
    if (this._playBuffer('sword_slash', 0.7)) return;
    
    // Fallback synthesis
    const c = this._getCtx();
    if (!c) return;
    
    const frequencies = { shu: [320, 280, 240], wei: [290, 250, 210], wu: [340, 300, 260], qun: [360, 320, 280] };
    const freqs = frequencies[faction] || frequencies.shu;
    
    freqs.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, c.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + i * 0.02);
      osc.stop(c.currentTime + 0.12);
    });
  },

  // 枪兵攻击
  playSpear() {
    if (this._playBuffer('spear_thrust', 0.7)) return;
    this.playAttack('shu');
  },
  
  // 弓兵攻击
  playArrow() {
    if (this._playBuffer('arrow_shot', 0.6)) return;
    
    const c = this._getCtx();
    if (!c) return;
    
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
  },
  
  // 骑兵攻击
  playCavalry() {
    if (this._playBuffer('cavalry_charge', 0.8)) return;
    this.playAttack('wei');
  },
  
  // 盾兵格挡
  playShield() {
    if (this._playBuffer('shield_block', 0.8)) return;
    this.playHit();
  },
  
  // 法师技能
  playMagic() {
    if (this._playBuffer('magic_cast', 0.7)) return;
    this.playSkill();
  },

  // 受到伤害
  playHit() {
    const c = this._getCtx();
    if (!c) return;
    
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.2);
  },

  // 暴击
  playCrit() {
    const c = this._getCtx();
    if (!c) return;
    
    [0, 0.08, 0.16].forEach((offset, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400 + i * 100, c.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + offset + 0.1);
      gain.gain.setValueAtTime(0.15, c.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + offset + 0.12);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + offset);
      osc.stop(c.currentTime + 0.15);
    });
  },

  // 技能释放
  playSkill() {
    const c = this._getCtx();
    if (!c) return;
    
    // 能量上升
    const osc1 = c.createOscillator();
    const gain1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, c.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.3);
    gain1.gain.setValueAtTime(0.15, c.currentTime);
    gain1.gain.linearRampToValueAtTime(0.2, c.currentTime + 0.15);
    gain1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(c.destination);
    osc1.start(c.currentTime);
    osc1.stop(c.currentTime + 0.4);
    
    // 光效
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(600, c.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.1, c.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(c.destination);
    osc2.start(c.currentTime + 0.1);
    osc2.stop(c.currentTime + 0.35);
  },

  // 胜利 - 使用真实音效
  playVictory() {
    if (this._playBuffer('victory_fanfare', 0.8)) return;
    
    // Fallback synthesis
    const c = this._getCtx();
    if (!c) return;
    
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, c.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0, c.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, c.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.5);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + i * 0.15);
      osc.stop(c.currentTime + i * 0.15 + 0.5);
    });
  },
  
  // 战斗开始
  playBattleStart() {
    if (this._playBuffer('battle_start', 0.8)) return;
    this.playVictory();
  },

  // 失败
  playDefeat() {
    const c = this._getCtx();
    if (!c) return;
    
    const notes = [400, 350, 300, 250];
    notes.forEach((f, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, c.currentTime + i * 0.2);
      gain.gain.setValueAtTime(0.15, c.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.2 + 0.3);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + i * 0.2);
      osc.stop(c.currentTime + i * 0.2 + 0.3);
    });
  },

  // 普攻挥砍
  playSwing() {
    const c = this._getCtx();
    if (!c) return;
    
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
  }
};

if (typeof window !== 'undefined') window.BattleSound = BattleSound;

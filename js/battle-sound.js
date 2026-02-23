// 三国·天命 — Battle Sound Effects Engine
// Web Audio API based sound synthesis

const BattleSound = {
  ctx: null,
  _initialized: false,

  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch(e) {
      console.warn('BattleSound: Web Audio not supported');
    }
  },

  _getCtx() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  // 攻击音效 - 刀剑碰撞
  playAttack(faction = 'shu') {
    const c = this._getCtx();
    if (!c) return;
    
    const frequencies = {
      shu: [320, 280, 240],
      wei: [290, 250, 210],
      wu: [340, 300, 260],
      qun: [360, 320, 280]
    };
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

  // 胜利
  playVictory() {
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

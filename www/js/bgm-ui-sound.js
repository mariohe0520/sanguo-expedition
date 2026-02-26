// 三国·天命 — BGM & UI Sound System
// 背景音乐 + UI交互音效

const BGM = {
  ctx: null,
  _bgmSource: null,
  _bgmGain: null,
  _initialized: false,
  _currentBgm: null,
  _volume: 0.3,
  
  async init() {
    if (this._initialized) return;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._bgmGain = this.ctx.createGain();
      this._bgmGain.gain.value = this._volume;
      this._bgmGain.connect(this.ctx.destination);
      this._initialized = true;
      console.log('🎵 BGM System initialized');
    } catch(e) {
      console.warn('BGM: Web Audio not supported');
    }
  },

  _getCtx() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  // 播放BGM - 使用合成器生成氛围音乐
  playBgm(type = 'peace') {
    const c = this._getCtx();
    if (!c) return;
    
    this.stopBgm();
    
    const configs = {
      peace: { baseFreq: 220, chord: [1, 1.25, 1.5], tempo: 4 },
      battle: { baseFreq: 110, chord: [1, 1.2, 1.5], tempo: 2 },
      victory: { baseFreq: 330, chord: [1, 1.25, 1.5, 2], tempo: 1 },
      menu: { baseFreq: 440, chord: [1, 1.5], tempo: 3 }
    };
    
    const config = configs[type] || configs.peace;
    this._currentBgm = type;
    
    // 创建氛围音乐循环
    const playChord = () => {
      if (this._currentBgm !== type) return;
      
      config.chord.forEach((ratio, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = config.baseFreq * ratio;
        
        gain.gain.setValueAtTime(0, c.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.5);
        gain.gain.setValueAtTime(0.08, c.currentTime + config.tempo * 0.8);
        gain.gain.linearRampToValueAtTime(0, c.currentTime + config.tempo);
        
        osc.connect(gain);
        gain.connect(this._bgmGain);
        
        osc.start(c.currentTime);
        osc.stop(c.currentTime + config.tempo);
      });
      
      // 继续循环
      this._bgmSource = setTimeout(playChord, config.tempo * 1000);
    };
    
    playChord();
  },

  stopBgm() {
    if (this._bgmSource) {
      clearTimeout(this._bgmSource);
      this._bgmSource = null;
    }
    this._currentBgm = null;
  },

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._bgmGain) {
      this._bgmGain.gain.value = this._volume;
    }
  },

  // 切换到战斗音乐
  playBattleBgm() {
    this.playBgm('battle');
  },

  // 切换到和平音乐
  playPeaceBgm() {
    this.playBgm('peace');
  },

  // 切换到胜利音乐
  playVictoryBgm() {
    this.playBgm('victory');
    setTimeout(() => this.playBgm('peace'), 8000);
  }
};

// UI 音效系统
const UISound = {
  ctx: null,
  _initialized: false,

  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch(e) {}
  },

  _play(freq, duration, type = 'sine', volume = 0.15) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // 点击音效
  playClick() {
    this._play(800, 0.05, 'sine', 0.1);
  },

  // 按钮 hover
  playHover() {
    this._play(600, 0.03, 'sine', 0.05);
  },

  // 获得金币
  playCoin() {
    this._play(1200, 0.1, 'sine', 0.12);
    setTimeout(() => this._play(1600, 0.15, 'sine', 0.1), 80);
  },

  // 获得装备
  playEquip() {
    this._play(523, 0.1, 'sine', 0.15);
    setTimeout(() => this._play(659, 0.1, 'sine', 0.15), 100);
    setTimeout(() => this._play(784, 0.2, 'sine', 0.12), 200);
  },

  // 升级
  playLevelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._play(f, 0.15, 'sine', 0.15), i * 100);
    });
  },

  // 抽卡成功
  playGacha() {
    const notes = [440, 554, 659, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this._play(f, 0.12, 'sine', 0.12), i * 80);
    });
  },

  // 错误/失败
  playError() {
    this._play(200, 0.3, 'sawtooth', 0.1);
  },

  // 成功
  playSuccess() {
    this._play(600, 0.1, 'sine', 0.12);
    setTimeout(() => this._play(800, 0.15, 'sine', 0.1), 100);
  },

  // 页面切换
  playPageSwitch() {
    this._play(400, 0.05, 'sine', 0.08);
  }
};

// 导出
if (typeof window !== 'undefined') {
  window.BGM = BGM;
  window.UISound = UISound;
}

// 三国·天命 — 开场剧情动画

const OpeningCinematic = {
  _played: false,
  
  init() {
    // Check if already played (check both old and new key for backwards compat)
    if (localStorage.getItem('sg-cinematicPlayed') || localStorage.getItem('sanguo_cinematic_played')) {
      this._played = true;
      return;
    }
  },
  
  play() {
    if (this._played) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'opening-cinematic';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #0a0e1a 0%, #1a1a2e 50%, #16213e 100%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: inherit;
      overflow: hidden;
    `;
    
    const scenes = [
      { text: '东汉末年，天下大乱', sub: '公元184年，黄巾起义爆发', delay: 2000 },
      { text: '群雄并起，诸侯割据', sub: '乱世之中，英雄辈出', delay: 2000 },
      { text: '你，一位天命之子', sub: '将在这个乱世中崛起', delay: 2000 },
      { text: '招兵买马，攻城略地', sub: '建立属于自己的霸业', delay: 2000 },
      { text: '三国·天命', sub: '你的传奇，即将开始...', delay: 2500 }
    ];
    
    let currentScene = 0;
    
    const showScene = () => {
      if (currentScene >= scenes.length) {
        this._endCinematic(overlay);
        return;
      }
      
      const scene = scenes[currentScene];
      overlay.innerHTML = `
        <div class="cinematic-text" style="
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 1s ease forwards;
          text-shadow: 0 0 30px rgba(255,255,255,0.3);
        ">${scene.text}</div>
        <div class="cinematic-sub" style="
          font-size: 16px;
          color: #94a3b8;
          margin-top: 20px;
          text-align: center;
          opacity: 0;
          animation: fadeInUp 1s ease 0.5s forwards;
        ">${scene.sub}</div>
      `;
      
      // Play BGM for cinematic
      if (typeof BGM !== 'undefined') {
        BGM.playBgm('menu');
      }
      
      currentScene++;
      setTimeout(showScene, scene.delay);
    };
    
    // Add skip button
    const skipBtn = document.createElement('button');
    skipBtn.textContent = '跳过 >>';
    skipBtn.style.cssText = `
      position: absolute;
      bottom: 40px;
      right: 40px;
      padding: 10px 20px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #94a3b8;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      z-index: 10000;
    `;
    skipBtn.onclick = () => this._endCinematic(overlay);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(skipBtn);
    document.body.appendChild(overlay);
    
    showScene();
  },
  
  _endCinematic(overlay) {
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      this._played = true;
      localStorage.setItem('sg-cinematicPlayed', JSON.stringify(true));
      
      // Resume normal BGM
      if (typeof BGM !== 'undefined') {
        BGM.playPeaceBgm();
      }
    }, 500);
  },
  
  // Reset for testing
  reset() {
    localStorage.removeItem('sg-cinematicPlayed');
    localStorage.removeItem('sanguo_cinematic_played'); // legacy cleanup
    this._played = false;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.OpeningCinematic = OpeningCinematic;
}

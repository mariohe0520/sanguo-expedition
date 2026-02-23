/**
 * 3D战斗启动器
 * 在战斗页面添加"进入3D战斗"按钮
 */
(function() {
  'use strict';
  
  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', function() {
    init3DBattleButton();
  });
  
  function init3DBattleButton() {
    // 查找战斗页面容器
    const battlePage = document.getElementById('page-battle');
    if (!battlePage) {
      // 战斗页面可能还没加载，延迟重试
      setTimeout(init3DBattleButton, 1000);
      return;
    }
    
    // 检查是否已有3D按钮
    if (document.getElementById('btn-3d-battle')) return;
    
    // 创建3D战斗按钮
    const btn3D = document.createElement('button');
    btn3D.id = 'btn-3d-battle';
    btn3D.className = 'btn btn-3d-battle';
    btn3D.innerHTML = '🎮 进入3D战斗';
    btn3D.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    `;
    
    btn3D.onclick = start3DBattle;
    
    // 添加到body
    document.body.appendChild(btn3D);
    
    console.log('[3D Battle] 按钮已添加');
  }
  
  function start3DBattle() {
    console.log('[3D Battle] 启动3D战斗模式！');
    
    // 创建3D容器
    let container = document.getElementById('battle-3d-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'battle-3d-container';
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0a0e1a;
        z-index: 9999;
      `;
      
      // 添加关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕ 退出3D';
      closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 20px;
        cursor: pointer;
        z-index: 10000;
      `;
      closeBtn.onclick = () => container.remove();
      container.appendChild(closeBtn);
      
      // 添加标题
      const title = document.createElement('div');
      title.innerHTML = '⚔️ 三国·天命 3D战斗模式';
      title.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        font-size: 24px;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255,215,0,0.5);
        z-index: 10000;
      `;
      container.appendChild(title);
      
      document.body.appendChild(container);
    }
    
    // 初始化3D场景
    if (window.Battle3DScene) {
      const scene = new Battle3DScene(container);
      
      // 测试数据 - 模拟战斗
      const testBattleData = {
        heroes: [
          { id: 1, name: '关羽', faction: 'shu', hp: 1000, attack: 150, defense: 80, x: -5, z: 0 },
          { id: 2, name: '张飞', faction: 'shu', hp: 1200, attack: 120, defense: 100, x: -8, z: 3 },
          { id: 3, name: '刘备', faction: 'shu', hp: 800, attack: 100, defense: 60, x: -8, z: -3 },
          { id: 4, name: '曹操', faction: 'wei', hp: 1100, attack: 140, defense: 70, x: 5, z: 0 },
          { id: 5, name: '司马懿', faction: 'wei', hp: 900, attack: 160, defense: 50, x: 8, z: 3 },
          { id: 6, name: '张辽', faction: 'wei', hp: 1000, attack: 130, defense: 90, x: 8, z: -3 },
        ]
      };
      
      scene.start(testBattleData);
      
      console.log('[3D Battle] 场景已启动！');
    } else {
      console.error('[3D Battle] Battle3DScene未加载！');
      alert('3D系统加载失败，请刷新页面重试');
    }
  }
})();

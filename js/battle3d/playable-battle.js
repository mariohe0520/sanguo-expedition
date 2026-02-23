/**
 * 可玩的3D战斗 - 直接整合到游戏
 */

// 创建战斗入口页面
function create3DBattleUI() {
  const container = document.getElementById('page-battle');
  if (!container) return;
  
  // 添加3D战斗按钮
  const btn3D = document.createElement('button');
  btn3D.id = 'btn-3d-battle-playable';
  btn3D.className = 'btn btn-3d-play';
  btn3D.innerHTML = '🎮 3D战斗模式';
  btn3D.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    background: linear-gradient(135deg, #ff6b6b, #feca57);
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(255,107,107,0.4);
  `;
  
  btn3D.onclick = startPlayable3DBattle;
  document.body.appendChild(btn3D);
}

// 开始可玩的3D战斗
let battle3D = null;
let playerHero = null;
let enemyHeroes = [];

function startPlayable3DBattle() {
  // 隐藏主界面
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  
  // 创建3D容器
  const container = document.createElement('div');
  container.id = 'battle-3d-fullscreen';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #0a0e1a;
    z-index: 9999;
  `;
  document.body.appendChild(container);
  
  // 加载Three.js
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/three@0.170.0/build/three.module.js';
  script.type = 'module';
  script.onload = () => initPlayableBattle(container);
  document.head.appendChild(script);
  
  // 添加退出按钮
  const exitBtn = document.createElement('button');
  exitBtn.innerHTML = '✕ 退出战斗';
  exitBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 10px 20px;
    background: rgba(255,255,255,0.2);
    color: white;
    border: 1px solid white;
    border-radius: 20px;
    cursor: pointer;
  `;
  exitBtn.onclick = exit3DBattle;
  container.appendChild(exitBtn);
  
  // 添加操作提示
  const tips = document.createElement('div');
  tips.innerHTML = `
    <div style="position:fixed;bottom:20px;left:20px;color:white;z-index:10000;font-size:14px;background:rgba(0,0,0,0.5);padding:10px;border-radius:10px;">
      <div>🖱️ 点击敌人攻击</div>
      <div>⌨️ 1-4 释放技能</div>
      <div>💥 空格 必杀技</div>
    </div>
  `;
  container.appendChild(tips);
}

function initPlayableBattle(container) {
  // 初始化Three.js场景
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.02);
  
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 8, 15);
  camera.lookAt(0, 0, 0);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  
  // 光照
  const ambient = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambient);
  
  const sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
  sun.position.set(5, 10, 5);
  sun.castShadow = true;
  scene.add(sun);
  
  // 地面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // 玩家英雄 - 关羽
  playerHero = createHero(scene, 0, 0, 0x4a8c6f, 'player');
  
  // 敌人 - 曹操
  const enemy = createHero(scene, 0, 0, 8, 0x5a8fc7, 'enemy');
  enemy.hp = 500;
  enemy.maxHp = 500;
  enemy.userData.hp = 500;
  enemy.userData.maxHp = 500;
  enemyHeroes.push(enemy);
  
  // 敌人2 - 张辽
  const enemy2 = createHero(scene, -3, 0, 6, 0x5a8fc7, 'enemy');
  enemy2.hp = 300;
  enemy2.maxHp = 300;
  enemy2.userData.hp = 300;
  enemy2.userData.maxHp = 300;
  enemyHeroes.push(enemy2);
  
  // 敌人3 - 司马懿
  const enemy3 = createHero(scene, 3, 0, 6, 0x5a8fc7, 'enemy');
  enemy3.hp = 300;
  enemy3.maxHp = 300;
  enemy3.userData.hp = 300;
  enemy3.userData.maxHp = 300;
  enemyHeroes.push(enemy3);
  
  // 创建血条UI
  createBattleUI(playerHero, enemyHeroes);
  
  // 点击攻击
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  renderer.domElement.onclick = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(enemyHeroes);
    
    if (intersects.length > 0) {
      const target = intersects[0].object;
      // 攻击动画
      playerHero.position.z += 2;
      setTimeout(() => playerHero.position.z -= 2, 200);
      
      // 扣血
      const damage = Math.floor(Math.random() * 50) + 50;
      target.userData.hp -= damage;
      updateHP(target);
      
      // 受伤特效
      target.children.forEach(c => {
        if (c.material) c.material.emissive = new THREE.Color(0xff0000);
      });
      setTimeout(() => {
        target.children.forEach(c => {
          if (c.material) c.material.emissive = new THREE.Color(0x000000);
        });
      }, 100);
      
      checkWin();
    }
  };
  
  // 动画循环
  function animate() {
    requestAnimationFrame(animate);
    
    // 敌人待机动画
    enemyHeroes.forEach(e => {
      if (e.userData.hp > 0) {
        e.position.y = Math.sin(Date.now() * 0.003) * 0.1;
      }
    });
    
    renderer.render(scene, camera);
  }
  animate();
}

function createHero(scene, x, y, z, color, type) {
  const group = new THREE.Group();
  
  // 身体
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.6, 2, 16),
    new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.6 })
  );
  body.position.y = 1;
  body.castShadow = true;
  group.add(body);
  
  // 头
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffdbac })
  );
  head.position.y = 2.3;
  head.castShadow = true;
  group.add(head);
  
  // 名字
  const name = type === 'player' ? '关羽' : '敌将';
  const label = createTextSprite(name, type === 'player' ? '#4a8c6f' : '#5a8fc7');
  label.position.y = 3.2;
  group.add(label);
  
  group.position.set(x, y, z);
  group.userData = { 
    type: type, 
    hp: 500, 
    maxHp: 500,
    name: name 
  };
  
  scene.add(group);
  return group;
}

function createTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 40);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
}

function createBattleUI(player, enemies) {
  // 玩家血条
  const playerHP = document.createElement('div');
  playerHP.id = 'player-hp-bar';
  playerHP.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 30px;
    background: rgba(0,0,0,0.7);
    border-radius: 15px;
    overflow: hidden;
    z-index: 10000;
  `;
  playerHP.innerHTML = `
    <div id="player-hp-fill" style="width:100%;height:100%;background:linear-gradient(90deg,#4a8c6f,#6ab04c);transition:width 0.3s;">
    </div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-weight:bold;">关羽 500/500</div>
  `;
  document.body.appendChild(playerHP);
  
  // 敌人血条
  enemies.forEach((e, i) => {
    const hp = document.createElement('div');
    hp.id = `enemy-hp-${i}`;
    hp.style.cssText = `
      position: fixed;
      top: ${100 + i * 60}px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 20px;
      background: rgba(0,0,0,0.7);
      border-radius: 10px;
      overflow: hidden;
      z-index: 10000;
    `;
    hp.innerHTML = `
      <div class="fill" style="width:100%;height:100%;background:linear-gradient(90deg,#5a8fc7,#4a8cff);"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:12px;">敌将 ${e.userData.hp}/${e.userData.maxHp}</div>
    `;
    document.body.appendChild(hp);
  });
}

function updateHP(hero) {
  const pct = (hero.userData.hp / hero.userData.maxHp) * 100;
  
  if (hero.userData.type === 'player') {
    const fill = document.getElementById('player-hp-fill');
    if (fill) fill.style.width = pct + '%';
  } else {
    const idx = enemyHeroes.indexOf(hero);
    const hp = document.getElementById(`enemy-hp-${idx}`);
    if (hp) {
      const fill = hp.querySelector('.fill');
      if (fill) fill.style.width = pct + '%';
    }
  }
}

function checkWin() {
  const allDead = enemyHeroes.every(e => e.userData.hp <= 0);
  
  if (allDead) {
    setTimeout(() => {
      alert('🎉 胜利！');
      exit3DBattle();
    }, 500);
  }
}

function exit3DBattle() {
  const container = document.getElementById('battle-3d-fullscreen');
  if (container) container.remove();
  
  document.querySelectorAll('.page').forEach(p => p.style.display = '');
  
  ['player-hp-bar', 'enemy-hp-0', 'enemy-hp-1', 'enemy-hp-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

// 页面加载后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', create3DBattleUI);
} else {
  create3DBattleUI();
}

window.startPlayable3DBattle = startPlayable3DBattle;

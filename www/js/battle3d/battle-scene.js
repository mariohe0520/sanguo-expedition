/**
 * 三国远征 - 3D战斗系统 v1.1
 * 整合增强特效 + Qwen AI + TTS
 * 目标: 够屌！
 */
import * as THREE from 'three';

class Battle3DScene {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    
    this.heroes = [];
    this.effects = [];
    this.particles = [];
    this.enhancedFX = null; // 增强特效
    
    this.isRunning = false;
    this.battleData = null;
    
    this.init();
  }
  
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e1a);
    this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.015);
    
    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 15, 20);
    this.camera.lookAt(0, 0, 0);
    
    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    
    this.container.appendChild(this.renderer.domElement);
    
    // 光照
    this.setupLights();
    
    // 战场
    this.createBattlefield();
    
    // 初始化增强特效
    if (window.EnhancedBattleEffects) {
      this.enhancedFX = new EnhancedBattleEffects(this.scene);
    }
    
    this.animate();
    console.log('[Battle3D] v1.1 初始化完成 - 够屌！');
  }
  
  setupLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    this.scene.add(sun);
  }
  
  createBattlefield() {
    // 地面
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // 边界装饰 - 烽火台
    const positions = [[-18, -18], [18, -18], [-18, 18], [18, 18]];
    positions.forEach(pos => {
      // 塔楼
      const towerGeo = new THREE.CylinderGeometry(0.5, 0.8, 6, 8);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x3a3a5e });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(pos[0], 3, pos[1]);
      tower.castShadow = true;
      this.scene.add(tower);
      
      // 火焰光
      const flameLight = new THREE.PointLight(0xff4400, 2, 8);
      flameLight.position.set(pos[0], 6, pos[1]);
      this.scene.add(flameLight);
    });
  }
  
  spawnHero(heroData) {
    const group = new THREE.Group();
    
    // 阵营颜色
    const factionColors = {
      'shu': 0x4a8c6f,
      'wei': 0x5a8fc7,
      'wu': 0xc04040,
      'qun': 0x9a6dd7
    };
    const color = factionColors[heroData.faction] || 0xffffff;
    
    // 身体
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.6,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);
    
    // 头部
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.3;
    head.castShadow = true;
    group.add(head);
    
    // 武器 (简单圆柱)
    const weaponGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8);
    const weaponMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    const weapon = new THREE.Mesh(weaponGeo, weaponMat);
    weapon.position.set(0.6, 1.5, 0.3);
    weapon.rotation.z = Math.PI / 6;
    group.add(weapon);
    
    // 位置
    group.position.set(heroData.x || 0, 0, heroData.z || 0);
    
    group.userData = {
      heroId: heroData.id,
      name: heroData.name,
      hp: heroData.hp,
      maxHp: heroData.hp,
      faction: heroData.faction,
      isAlive: true
    };
    
    this.scene.add(group);
    this.heroes.push(group);
    
    // 技能光环
    if (this.enhancedFX) {
      this.enhancedFX.createAura(group.position, color, 1.5);
    }
    
    return group;
  }
  
  // 攻击特效
  playAttack(attacker, target, type = 'normal') {
    if (!attacker || !target) return;
    
    // 刀光
    if (this.enhancedFX) {
      this.enhancedFX.createSlash(attacker, target, type);
      
      // 暴击特效
      if (type === 'crit') {
        this.enhancedFX.createExplosion(target.position, 1.5);
      }
    }
    
    // 播放攻击音效
    if (window.TTSHelper) {
      const names = { shu: '关羽', wei: '曹操', wu: '周瑜', qun: '吕布' };
      TTSHelper.battleCry(names[attacker.userData.faction] || 'default');
    }
  }
  
  animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // 英雄待机动画
    this.heroes.forEach(hero => {
      if (hero.userData.isAlive) {
        hero.position.y = Math.sin(Date.now() * 0.003) * 0.05;
        // 武器微动
        const weapon = hero.children[2];
        if (weapon) {
          weapon.rotation.x = Math.sin(Date.now() * 0.005) * 0.1;
        }
      }
    });
    
    this.renderer.render(this.scene, this.camera);
  }
  
  start(battleData) {
    this.battleData = battleData;
    this.isRunning = true;
    
    battleData.heroes.forEach(hero => {
      this.spawnHero(hero);
    });
    
    this.animate();
    
    // 欢迎语音
    if (window.TTSHelper) {
      TTSHelper.speak('三国之战，开始！');
    }
  }
  
  stop() { this.isRunning = false; }
  resize(w, h) {
    this.width = w; this.height = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  dispose() {
    this.stop();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

window.Battle3DScene = Battle3DScene;

/**
 * 3D战斗特效增强
 * 目标: 够屌！
 */
class EnhancedBattleEffects {
  constructor(scene) {
    this.scene = scene;
  }
  
  // 🔥 火焰粒子系统
  createFireEffect(position, intensity = 1) {
    const particleCount = 50 * intensity;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = position.y + Math.random() * 2;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
      
      // 火焰颜色渐变
      const t = Math.random();
      colors[i * 3] = 1; // R
      colors[i * 3 + 1] = 0.3 + t * 0.5; // G
      colors[i * 3 + 2] = t * 0.2; // B
      
      sizes[i] = 0.1 + Math.random() * 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    return particles;
  }
  
  // ⚡ 雷电链
  createLightning(start, end) {
    const points = [];
    const segments = 10;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 0.5;
      const y = start.y + (end.y - start.y) * t;
      const z = start.z + (end.z - start.z) * t + (Math.random() - 0.5) * 0.5;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 2,
      transparent: true,
      opacity: 1
    });
    
    const lightning = new THREE.Line(geometry, material);
    this.scene.add(lightning);
    
    // 0.1秒后消失
    setTimeout(() => {
      this.scene.remove(lightning);
    }, 100);
    
    return lightning;
  }
  
  // 💥 爆炸冲击波
  createExplosion(position, scale = 1) {
    // 外扩环
    const ringGeo = new THREE.RingGeometry(0.1, 0.3, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    
    // 扩散动画
    const duration = 500;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const scale = 1 + progress * 5;
        ring.scale.set(scale, scale, 1);
        ring.material.opacity = 1 - progress;
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(ring);
      }
    };
    animate();
    
    // 同时创建火焰
    this.createFireEffect(position, 2);
  }
  
  // ✨ 技能光环
  createAura(position, color, radius = 2) {
    const geometry = new THREE.RingGeometry(radius - 0.1, radius, 64);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const aura = new THREE.Mesh(geometry, material);
    aura.position.set(position.x, 0.1, position.z);
    aura.rotation.x = -Math.PI / 2;
    this.scene.add(aura);
    
    // 旋转动画
    const rotate = () => {
      if (aura.parent) {
        aura.rotation.z += 0.02;
        requestAnimationFrame(rotate);
      }
    };
    rotate();
    
    return aura;
  }
  
  // 🗡️ 刀光剑影
  createSlash(attacker, target, type = 'normal') {
    const colors = {
      'normal': 0xff4400,
      'crit': 0xff0000,
      'magic': 0x00ffff
    };
    
    // 创建弧形光效
    const curve = new THREE.EllipseCurve(0, 0, 2, 0.8, 0, Math.PI, false, 0);
    const points = curve.getPoints(30);
    const vertices = [];
    
    for (let i = 0; i < points.length; i++) {
      vertices.push(points[i].x, 1.5, points[i].y);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: colors[type] || colors['normal'],
      linewidth: 3,
      transparent: true,
      opacity: 1
    });
    
    const slash = new THREE.Line(geometry, material);
    slash.position.copy(target.position);
    slash.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(slash);
    
    // 渐隐动画
    const duration = 400;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        slash.material.opacity = 1 - progress;
        slash.scale.set(1 + progress, 1, 1);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(slash);
      }
    };
    animate();
  }
}

window.EnhancedBattleEffects = EnhancedBattleEffects;
console.log('[BattleFX] 增强特效系统已加载 - 够屌！');

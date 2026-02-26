/**
 * 三国终极战斗特效
 * 目标: 够屌！
 */

// 全屏特效
const ULTIMATE_EFFECTS = {
  // 🔥 火烧赤壁
  fireAttack: (scene, position) => {
    // 创建火焰漩涡
    const fireGroup = new THREE.Group();
    
    for (let i = 0; i < 50; i++) {
      const geometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5),
        transparent: true,
        opacity: 0.8
      });
      const fire = new THREE.Mesh(geometry, material);
      
      fire.position.set(
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        (Math.random() - 0.5) * 3
      );
      
      fireGroup.add(fire);
    }
    
    fireGroup.position.copy(position);
    scene.add(fireGroup);
    
    // 向上飘动画
    const animate = () => {
      fireGroup.children.forEach((fire, i) => {
        fire.position.y += 0.05;
        fire.position.x += (Math.random() - 0.5) * 0.1;
        fire.material.opacity -= 0.01;
      });
      
      if (fireGroup.children[0].material.opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(fireGroup);
      }
    };
    animate();
  },
  
  // ⚡ 雷电审判
  thunderStrike: (scene, position) => {
    // 闪电
    const points = [];
    let x = position.x, y = position.y + 10, z = position.z;
    
    for (let i = 0; i < 10; i++) {
      points.push(new THREE.Vector3(
        x + (Math.random() - 0.5) * 2,
        y,
        z + (Math.random() - 0.5) * 2
      ));
      y -= 1;
    }
    points.push(position.clone());
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 3
    });
    const lightning = new THREE.Line(geometry, material);
    scene.add(lightning);
    
    // 闪光
    const flash = new THREE.PointLight(0xffff00, 5, 20);
    flash.position.copy(position);
    flash.position.y += 3;
    scene.add(flash);
    
    // 0.2秒后消失
    setTimeout(() => {
      scene.remove(lightning);
      scene.remove(flash);
    }, 200);
  },
  
  // 💥 爆炎炸裂
  explosion: (scene, position) => {
    // 冲击波
    const ringGeo = new THREE.RingGeometry(0.1, 0.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    
    // 扩散动画
    let scale = 1;
    const expand = () => {
      scale += 0.5;
      ring.scale.set(scale, scale, 1);
      ring.material.opacity -= 0.05;
      
      if (ring.material.opacity > 0) {
        requestAnimationFrame(expand);
      } else {
        scene.remove(ring);
      }
    };
    expand();
    
    // 粒子
    ULTIMATE_EFFECTS.particleBurst(scene, position, 0xff4400, 20);
  },
  
  // ✨ 神圣光环
  divineAura: (scene, position, color = 0x00ffff) => {
    // 多层光环
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(1 + i * 0.5, 1.2 + i * 0.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5 - i * 0.15
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(position.x, 0.1, position.z);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);
      
      // 旋转动画
      const rotate = () => {
        if (ring.parent) {
          ring.rotation.z += 0.02 * (i + 1);
          requestAnimationFrame(rotate);
        }
      };
      rotate();
    }
  },
  
  // 🌀 粒子爆发
  particleBurst: (scene, position, color, count = 30) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      ));
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.2,
      transparent: true,
      opacity: 1
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.velocities = velocities;
    scene.add(particles);
    
    // 物理动画
    let age = 0;
    const animate = () => {
      age += 0.016;
      
      const positions = particles.geometry.attributes.position.array;
      
      for (let i = 0; i < count; i++) {
        positions[i * 3] += velocities[i].x * 0.016;
        positions[i * 3 + 1] += velocities[i].y * 0.016 - age * 0.1; // 重力
        positions[i * 3 + 2] += velocities[i].z * 0.016;
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      particles.material.opacity = Math.max(0, 1 - age);
      
      if (age < 1) {
        requestAnimationFrame(animate);
      } else {
        scene.remove(particles);
      }
    };
    animate();
  },
  
  // 🎆 全屏烟花
  fireworks: (scene) => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const pos = new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          5 + Math.random() * 10,
          (Math.random() - 0.5) * 20
        );
        const color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
        ULTIMATE_EFFECTS.particleBurst(scene, pos, color.getHex(), 50);
      }, i * 200);
    }
  }
};

window.UltimateEffects = ULTIMATE_EFFECTS;
console.log("⚡ 终极特效系统已加载 - 够屌！");

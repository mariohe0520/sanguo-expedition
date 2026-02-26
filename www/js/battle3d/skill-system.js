/**
 * 三国技能系统
 * 每个武将独特的技能和特效
 */
const BATTLE_SKILLS = {
  // 关羽 - 青龙偃月刀
  guanYu: {
    name: '青龙斩',
    description: '一刀秒杀',
    damage: 200,
    cooldown: 10,
    effect: 'slash',
    color: 0x00ff00,
    animation: 'spinSlash'
  },
  // 张飞 - 蛇矛
  zhangFei: {
    name: '怒吼',
    description: '威慑敌人',
    damage: 50,
    cooldown: 5,
    effect: 'shout',
    color: 0x888888,
    animation: 'shoutWave'
  },
  // 诸葛亮 - 八卦阵
  zhugeLiang: {
    name: '八卦阵',
    description: '控制全场',
    damage: 0,
    cooldown: 20,
    effect: 'magic',
    color: 0x00ffff,
    animation: 'magicCircle'
  },
  // 曹操 - 奸雄
  caoCao: {
    name: '奸雄之智',
    description: '吸血流',
    damage: 80,
    cooldown: 8,
    effect: 'drain',
    color: 0x0000ff,
    animation: 'drainAura'
  },
  // 吕布 - 无双
  lvBu: {
    name: '无双',
    description: '最强攻击',
    damage: 300,
    cooldown: 15,
    effect: 'ultimate',
    color: 0xff0000,
    animation: 'ultimateSlash'
  }
};

// 技能管理器
class SkillManager {
  constructor(battle3d) {
    this.battle = battle3d;
    this.cooldowns = {};
  }
  
  // 释放技能
  useSkill(hero, skillName) {
    const skill = BATTLE_SKILLS[skillName];
    if (!skill) return false;
    
    // 检查冷却
    if (this.isOnCooldown(hero.id, skillName)) {
      console.log(`${skill.name} 冷却中`);
      return false;
    }
    
    // 播放特效
    this.playSkillEffect(hero, skill);
    
    // 设置冷却
    this.cooldowns[`${hero.id}_${skillName}`] = Date.now();
    
    return true;
  }
  
  isOnCooldown(heroId, skillName) {
    const key = `${heroId}_${skillName}`;
    const lastUse = this.cooldowns[key];
    if (!lastUse) return false;
    
    const skill = BATTLE_SKILLS[skillName];
    return Date.now() - lastUse < skill.cooldown * 1000;
  }
  
  playSkillEffect(hero, skill) {
    const scene = this.battle.scene;
    const pos = hero.position;
    
    switch(skill.animation) {
      case 'slash':
        // 旋转斩击
        if (window.UltimateEffects) {
          UltimateEffects.explosion(scene, pos);
        }
        break;
      case 'magicCircle':
        // 法阵
        if (window.UltimateEffects) {
          UltimateEffects.divineAura(scene, pos, skill.color);
        }
        break;
      case 'ultimate':
        // 终极技能
        if (window.UltimateEffects) {
          UltimateEffects.fireworks(scene);
        }
        break;
    }
  }
}

window.SkillManager = SkillManager;
window.BATTLE_SKILLS = BATTLE_SKILLS;

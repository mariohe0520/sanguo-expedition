/**
 * 三国PVP战斗系统
 */
class PVPSystem {
  constructor(battleScene) {
    this.scene = battleScene;
    this.teams = { player: [], enemy: [] };
  }
  
  // 开始PVP
  startPvP(playerTeam, enemyTeam) {
    // 生成玩家队伍
    playerTeam.forEach((hero, i) => {
      const x = -5 + i * 3;
      hero.x = x;
      this.scene.spawnHero(hero);
    });
    
    // 生成敌方队伍
    enemyTeam.forEach((hero, i) => {
      const x = 5 + i * 3;
      hero.x = x;
      hero.faction = 'wei';
      this.scene.spawnHero(hero);
    });
  }
  
  // 回合制战斗
  nextTurn() {
    // 简单的AI攻击逻辑
    this.teams.player.forEach(attacker => {
      if (!attacker.userData.isAlive) return;
      
      // 找最近的敌人
      const targets = this.teams.enemy.filter(h => h.userData.isAlive);
      if (targets.length === 0) return;
      
      const target = targets[Math.floor(Math.random() * targets.length)];
      
      // 攻击
      this.scene.playAttack(attacker, target, 'normal');
    });
  }
}

window.PVPSystem = PVPSystem;

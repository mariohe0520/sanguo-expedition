// 三国·天命 — Idle / AFK System
const Idle = {
  RATES: {
    goldPerMin: 2,
    expPerMin: 1,
    lootChancePerHour: 0.1, // 10% chance per hour for equipment drop
  },
  MAX_HOURS: 12,

  collectRewards() {
    const state = Storage.getIdleState();
    const now = Date.now();
    const elapsed = Math.min((now - state.lastCollect) / 60000, this.MAX_HOURS * 60); // minutes, capped
    
    if (elapsed < 1) return null;

    // Scale rewards with player level
    const player = Storage.getPlayer();
    const levelMult = 1 + (player.level - 1) * 0.15;
    const gold = Math.floor(elapsed * this.RATES.goldPerMin * levelMult);
    const exp = Math.floor(elapsed * this.RATES.expPerMin * levelMult);
    const hours = elapsed / 60;
    const lootRolls = Math.floor(hours);
    let loot = [];
    for (let i = 0; i < lootRolls; i++) {
      if (Math.random() < this.RATES.lootChancePerHour) {
        loot.push(this.rollLoot());
      }
    }

    // Apply rewards
    Storage.addGold(gold);
    Storage.addExp(exp);
    
    state.lastCollect = now;
    Storage.saveIdleState(state);

    return {
      minutes: Math.floor(elapsed),
      gold,
      exp,
      loot,
      message: this.getIdleMessage(elapsed)
    };
  },

  rollLoot() {
    const items = [
      { name: '铁剑', stat: 'atk', value: 5, rarity: 1, emoji: '' },
      { name: '皮甲', stat: 'def', value: 5, rarity: 1, emoji: '' },
      { name: '草鞋', stat: 'spd', value: 3, rarity: 1, emoji: '' },
      { name: '青铜剑', stat: 'atk', value: 10, rarity: 2, emoji: '' },
      { name: '锁子甲', stat: 'def', value: 10, rarity: 2, emoji: '' },
      { name: '战马', stat: 'spd', value: 8, rarity: 2, emoji: '' },
    ];
    const roll = Math.random();
    const pool = roll < 0.3 ? items.filter(i => i.rarity === 2) : items.filter(i => i.rarity === 1);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  getIdleMessage(mins) {
    if (mins < 30) return '将士们刚刚开始巡逻...';
    if (mins < 120) return '将士们在战场上奋勇拼杀！';
    if (mins < 360) return '你的军队已经征战半天了！';
    return '大军征战许久，收获颇丰！';
  },

  getTimeSinceCollect() {
    const state = Storage.getIdleState();
    return Math.floor((Date.now() - state.lastCollect) / 60000);
  }
};

if (typeof window !== 'undefined') window.Idle = Idle;

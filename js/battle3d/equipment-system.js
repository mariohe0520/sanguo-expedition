/**
 * 三国装备系统
 */
const EQUIPMENT = {
  weapons: [
    { id: 'weapon_1', name: '新手剑', attack: 10, rarity: 1 },
    { id: 'weapon_2', name: '铁剑', attack: 20, rarity: 1 },
    { id: 'weapon_3', name: '钢剑', attack: 35, rarity: 2 },
    { id: 'weapon_4', name: '青龙剑', attack: 50, rarity: 3 },
    { id: 'weapon_5', name: '倚天剑', attack: 80, rarity: 4 },
    { id: 'weapon_6', name: '赤霄剑', attack: 100, rarity: 5 }
  ],
  armors: [
    { id: 'armor_1', name: '布衣', defense: 5 },
    { id: 'armor_2', name: '皮甲', defense: 10 },
    { id: 'armor_3', name: '铁甲', defense: 20 },
    { id: 'armor_4', name: '鳞甲', defense: 35 },
    { id: 'armor_5', name: '龙鳞甲', defense: 50 }
  ],
  accessories: [
    { id: 'acc_1', name: '力量戒指', effect: 'attack', value: 10 },
    { id: 'acc_2', name: '防御戒指', effect: 'defense', value: 10 },
    { id: 'acc_3', name: '生命戒指', effect: 'hp', value: 100 }
  ]
};

class EquipmentSystem {
  constructor() {
    this.equipped = { weapon: null, armor: null, accessory: null };
  }
  
  equip(item) {
    const slot = this.getSlot(item);
    this.equipped[slot] = item;
  }
  
  getSlot(item) {
    if (item.attack) return 'weapon';
    if (item.defense) return 'armor';
    return 'accessory';
  }
  
  getStats() {
    let stats = { attack: 0, defense: 0, hp: 0 };
    
    Object.values(this.equipped).forEach(item => {
      if (!item) return;
      if (item.attack) stats.attack += item.attack;
      if (item.defense) stats.defense += item.defense;
      if (item.value) stats[item.effect] += item.value;
    });
    
    return stats;
  }
}

window.EQUIPMENT = EQUIPMENT;
window.EquipmentSystem = EquipmentSystem;

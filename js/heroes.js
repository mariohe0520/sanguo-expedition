// 三国·天命 — Hero Database
// 兵种克制: 骑→弓→枪→盾→术→骑
const UNIT_TYPES = {
  cavalry: { name:'骑兵', emoji:'🐴', strong:'archer', weak:'spear' },
  archer:  { name:'弓兵', emoji:'🏹', strong:'spear',  weak:'cavalry' },
  spear:   { name:'枪兵', emoji:'🔱', strong:'shield', weak:'archer' },
  shield:  { name:'盾兵', emoji:'🛡️', strong:'mage',   weak:'spear' },
  mage:    { name:'术士', emoji:'🔮', strong:'cavalry', weak:'shield' }
};

const FACTIONS = {
  shu:  { name:'蜀', color:'#22c55e', emoji:'🟢' },
  wei:  { name:'魏', color:'#3b82f6', emoji:'🔵' },
  wu:   { name:'吴', color:'#ef4444', emoji:'🔴' },
  qun:  { name:'群', color:'#a855f7', emoji:'🟣' }
};

// Synergy: 3+ same faction = bonus
const FACTION_BONUS = {
  3: { name:'阵营之力', desc:'全队+10% ATK', atkPct: 10 },
  5: { name:'阵营共鸣', desc:'全队+25% ATK, +15% DEF', atkPct: 25, defPct: 15 }
};

const HEROES = {
  liubei: {
    id:'liubei', name:'刘备', title:'仁德之主',
    faction:'shu', unit:'shield', rarity:4,
    baseStats: { hp:1200, atk:85, def:110, spd:60, int:90 },
    skill: { name:'仁德', desc:'回复全体30%HP', type:'heal', target:'all_ally', value:0.3, rage:100 },
    passive: { name:'桃园之誓', desc:'蜀将+15% HP', condition:'faction_shu', stat:'hp', pct:15 },
    emoji:'👑', lore:'编草鞋的少年终成一方霸主'
  },
  guanyu: {
    id:'guanyu', name:'关羽', title:'武圣',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1100, atk:140, def:95, spd:75, int:60 },
    skill: { name:'青龙偃月', desc:'对单体造成250%ATK伤害', type:'damage', target:'single_enemy', value:2.5, rage:100 },
    passive: { name:'忠义', desc:'HP<30%时ATK+40%', condition:'hp_below_30', stat:'atk', pct:40 },
    emoji:'⚔️', lore:'温酒斩华雄，千里走单骑'
  },
  zhangfei: {
    id:'zhangfei', name:'张飞', title:'万人敌',
    faction:'shu', unit:'spear', rarity:4,
    baseStats: { hp:1050, atk:120, def:85, spd:55, int:40 },
    skill: { name:'怒吼', desc:'全体敌人眩晕1回合', type:'cc', target:'all_enemy', effect:'stun', duration:1, rage:120 },
    passive: { name:'燕人之勇', desc:'被攻击时20%反击', condition:'on_hit', chance:20, value:0.8 },
    emoji:'😤', lore:'喝断当阳桥'
  },
  caocao: {
    id:'caocao', name:'曹操', title:'乱世奸雄',
    faction:'wei', unit:'cavalry', rarity:5,
    baseStats: { hp:1000, atk:130, def:90, spd:85, int:110 },
    skill: { name:'挟天子', desc:'全队ATK+30% 持续3回合', type:'buff', target:'all_ally', stat:'atk', pct:30, duration:3, rage:90 },
    passive: { name:'求贤令', desc:'战斗开始时随机1名敌人-20%DEF', condition:'battle_start', target:'random_enemy', stat:'def', pct:-20 },
    emoji:'🖤', lore:'宁教我负天下人，休教天下人负我'
  },
  sunshangxiang: {
    id:'sunshangxiang', name:'孙尚香', title:'弓腰姬',
    faction:'wu', unit:'archer', rarity:4,
    baseStats: { hp:850, atk:125, def:60, spd:90, int:55 },
    skill: { name:'连弩', desc:'对后排3次攻击各100%ATK', type:'damage', target:'back_row', hits:3, value:1.0, rage:80 },
    passive: { name:'巾帼', desc:'速度最高时暴击率+25%', condition:'highest_spd', stat:'crit', pct:25 },
    emoji:'🏹', lore:'东吴郡主，巾帼不让须眉'
  },
  zhaoyun: {
    id:'zhaoyun', name:'赵云', title:'常山赵子龙',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1050, atk:135, def:100, spd:80, int:65 },
    skill: { name:'七进七出', desc:'无敌1回合+对全体150%ATK', type:'damage', target:'all_enemy', value:1.5, selfBuff:{effect:'invincible',duration:1}, rage:110 },
    passive: { name:'浑身是胆', desc:'HP>70%时DEF+20%', condition:'hp_above_70', stat:'def', pct:20 },
    emoji:'🐉', lore:'长坂坡七进七出救幼主'
  },
  zhangjiao: {
    id:'zhangjiao', name:'张角', title:'天公将军',
    faction:'qun', unit:'mage', rarity:4,
    baseStats: { hp:800, atk:60, def:55, spd:70, int:145 },
    skill: { name:'天雷', desc:'对全体造成180%INT伤害', type:'magic', target:'all_enemy', value:1.8, rage:100 },
    passive: { name:'太平道', desc:'每回合回复5%HP', condition:'turn_start', heal_pct:5 },
    emoji:'⚡', lore:'苍天已死，黄天当立'
  },
  lvbu: {
    id:'lvbu', name:'吕布', title:'飞将',
    faction:'qun', unit:'cavalry', rarity:5,
    baseStats: { hp:1100, atk:160, def:80, spd:90, int:35 },
    skill: { name:'无双', desc:'对单体造成350%ATK伤害', type:'damage', target:'single_enemy', value:3.5, rage:120 },
    passive: { name:'方天画戟', desc:'ATK最高时+15%暴击伤害', condition:'highest_atk', stat:'crit_dmg', pct:15 },
    emoji:'👹', lore:'人中吕布，马中赤兔'
  },
  diaochan: {
    id:'diaochan', name:'貂蝉', title:'闭月',
    faction:'qun', unit:'mage', rarity:4,
    baseStats: { hp:750, atk:50, def:50, spd:80, int:140 },
    skill: { name:'闭月', desc:'魅惑ATK最高敌人2回合', type:'cc', target:'highest_atk_enemy', effect:'charm', duration:2, rage:90 },
    passive: { name:'倾国', desc:'被男性武将攻击-15%伤害', condition:'attacked_by_male', dmg_reduce:15 },
    emoji:'🌸', lore:'四大美女之闭月'
  },
  huangzhong: {
    id:'huangzhong', name:'黄忠', title:'老当益壮',
    faction:'shu', unit:'archer', rarity:3,
    baseStats: { hp:900, atk:115, def:70, spd:50, int:50 },
    skill: { name:'百步穿杨', desc:'必中+暴击 200%ATK', type:'damage', target:'single_enemy', value:2.0, guaranteed_crit:true, rage:80 },
    passive: { name:'老将之威', desc:'回合数>5时ATK+25%', condition:'turn_gt_5', stat:'atk', pct:25 },
    emoji:'🎯', lore:'定军山斩夏侯渊'
  },
  // Free starter
  soldier: {
    id:'soldier', name:'新兵', title:'',
    faction:'qun', unit:'spear', rarity:1,
    baseStats: { hp:500, atk:50, def:40, spd:40, int:20 },
    skill: { name:'突刺', desc:'对单体120%ATK伤害', type:'damage', target:'single_enemy', value:1.2, rage:60 },
    passive: null,
    emoji:'🗡️', lore:'刚入伍的士兵'
  },
  archer_recruit: {
    id:'archer_recruit', name:'弓手', title:'',
    faction:'qun', unit:'archer', rarity:1,
    baseStats: { hp:400, atk:55, def:30, spd:50, int:25 },
    skill: { name:'射击', desc:'对单体110%ATK伤害', type:'damage', target:'single_enemy', value:1.1, rage:50 },
    passive: null,
    emoji:'🏹', lore:'村里的猎人'
  }
};

// Export for module use
if (typeof window !== 'undefined') { window.HEROES = HEROES; window.UNIT_TYPES = UNIT_TYPES; window.FACTIONS = FACTIONS; window.FACTION_BONUS = FACTION_BONUS; }

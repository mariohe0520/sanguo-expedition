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
  },
  shield_militia: {
    id:'shield_militia', name:'盾民兵', title:'',
    faction:'qun', unit:'shield', rarity:1,
    baseStats: { hp:600, atk:45, def:65, spd:35, int:20 },
    skill: { name:'盾击', desc:'对单体100%ATK伤害+自身DEF+10%持续2回合', type:'damage', target:'single_enemy', value:1.0, selfBuff:{stat:'def',pct:10,duration:2}, rage:60 },
    passive: null,
    emoji:'🛡️', lore:'扛着木盾的民兵'
  },
  mage_acolyte: {
    id:'mage_acolyte', name:'术士学徒', title:'',
    faction:'qun', unit:'mage', rarity:1,
    baseStats: { hp:350, atk:35, def:25, spd:55, int:80 },
    skill: { name:'火球', desc:'对单体150%INT伤害', type:'magic', target:'single_enemy', value:1.5, rage:55 },
    passive: null,
    emoji:'🔮', lore:'习得皮毛法术的少年'
  },
  elite_cavalry: {
    id:'elite_cavalry', name:'精锐骑兵', title:'',
    faction:'qun', unit:'cavalry', rarity:2,
    baseStats: { hp:800, atk:90, def:60, spd:75, int:30 },
    skill: { name:'冲锋', desc:'对单体180%ATK伤害', type:'damage', target:'single_enemy', value:1.8, rage:70 },
    passive: { name:'铁蹄', desc:'首回合SPD+20%', condition:'turn_1', stat:'spd', pct:20 },
    emoji:'🐴', lore:'久经沙场的骑兵精锐'
  },
  elite_spear: {
    id:'elite_spear', name:'精锐枪兵', title:'',
    faction:'qun', unit:'spear', rarity:2,
    baseStats: { hp:750, atk:85, def:75, spd:50, int:25 },
    skill: { name:'长枪阵', desc:'对前排全体130%ATK伤害', type:'damage', target:'front_row', value:1.3, rage:65 },
    passive: { name:'枪林', desc:'被骑兵攻击时反击50%ATK', condition:'attacked_by_cavalry', value:0.5 },
    emoji:'🔱', lore:'列阵如林的枪兵精锐'
  },

  // ── Chapter 3 enemies ──────────────────────────
  navy_soldier: {
    id:'navy_soldier', name:'水军', title:'',
    faction:'qun', unit:'spear', rarity:2,
    baseStats: { hp:700, atk:75, def:55, spd:45, int:30 },
    skill: { name:'水战突刺', desc:'对单体140%ATK伤害，水上地形+20%', type:'damage', target:'single_enemy', value:1.4, terrain_bonus:{river:0.2}, rage:65 },
    passive: { name:'水性', desc:'河流地形DEF+15%', condition:'terrain_river', stat:'def', pct:15 },
    emoji:'⛵', lore:'精通水战的曹军水师'
  },
  fire_archer: {
    id:'fire_archer', name:'火弓手', title:'',
    faction:'qun', unit:'archer', rarity:2,
    baseStats: { hp:550, atk:95, def:35, spd:60, int:45 },
    skill: { name:'火矢', desc:'对单体160%ATK伤害+灼烧2回合(每回合10%ATK)', type:'damage', target:'single_enemy', value:1.6, dot:{type:'burn',pct:0.1,duration:2}, rage:70 },
    passive: { name:'引火', desc:'风天气ATK+20%', condition:'weather_wind', stat:'atk', pct:20 },
    emoji:'🔥', lore:'箭尖燃火，百发百中'
  },
  caoren: {
    id:'caoren', name:'曹仁', title:'铁壁将军',
    faction:'wei', unit:'shield', rarity:4,
    baseStats: { hp:1400, atk:70, def:140, spd:40, int:65 },
    skill: { name:'铁壁', desc:'全队DEF+35%持续3回合', type:'buff', target:'all_ally', stat:'def', pct:35, duration:3, rage:100 },
    passive: { name:'坚守不退', desc:'HP<50%时DEF+30%', condition:'hp_below_50', stat:'def', pct:30 },
    emoji:'🏰', lore:'曹操宗族大将，善守城池'
  },
  zhouyu: {
    id:'zhouyu', name:'周瑜', title:'美周郎',
    faction:'wu', unit:'mage', rarity:5,
    baseStats: { hp:900, atk:75, def:70, spd:85, int:145 },
    skill: { name:'火烧赤壁', desc:'对全体造成200%INT伤害+灼烧2回合', type:'magic', target:'all_enemy', value:2.0, dot:{type:'burn',pct:0.15,duration:2}, rage:110 },
    passive: { name:'英才', desc:'队伍INT总和最高时全队INT+10%', condition:'team_highest_int', stat:'int', pct:10 },
    emoji:'🔥', lore:'谈笑间，樯橹灰飞烟灭'
  },

  // ── Chapter 4 enemies ──────────────────────────
  strategist: {
    id:'strategist', name:'军师', title:'',
    faction:'qun', unit:'mage', rarity:2,
    baseStats: { hp:500, atk:40, def:35, spd:65, int:110 },
    skill: { name:'妙计', desc:'全体友军ATK+20%持续2回合', type:'buff', target:'all_ally', stat:'atk', pct:20, duration:2, rage:70 },
    passive: { name:'智谋', desc:'每回合30%概率降低1名敌人DEF-15%', condition:'turn_start', chance:30, target:'random_enemy', stat:'def', pct:-15 },
    emoji:'📜', lore:'运筹帷幄的幕后智囊'
  },
  crossbow_corps: {
    id:'crossbow_corps', name:'连弩队', title:'',
    faction:'qun', unit:'archer', rarity:2,
    baseStats: { hp:600, atk:100, def:40, spd:50, int:35 },
    skill: { name:'齐射', desc:'对全体敌人110%ATK伤害', type:'damage', target:'all_enemy', value:1.1, rage:80 },
    passive: { name:'箭雨', desc:'攻击时20%概率攻击相邻单位', condition:'on_attack', chance:20, splash:true },
    emoji:'🎯', lore:'诸葛连弩改良的精锐弩兵'
  },
  simayi: {
    id:'simayi', name:'司马懿', title:'冢虎',
    faction:'wei', unit:'mage', rarity:5,
    baseStats: { hp:1100, atk:65, def:120, spd:60, int:150 },
    skill: { name:'鹰视狼顾', desc:'复制对方最强武将技能使用', type:'mirror', target:'strongest_enemy', rage:110 },
    passive: { name:'隐忍', desc:'受到致命伤害时50%概率存活(HP=1)', condition:'on_lethal', chance:50 },
    emoji:'🦅', lore:'司马懿善忍，终成大器'
  },

  // ── Chapter 5 heroes ──────────────────────────
  luXun: {
    id:'luXun', name:'陆逊', title:'火烧连营',
    faction:'wu', unit:'mage', rarity:5,
    baseStats: { hp:950, atk:70, def:65, spd:80, int:148 },
    skill: { name:'火烧连营', desc:'对全体造成220%INT伤害，森林地形+30%', type:'magic', target:'all_enemy', value:2.2, terrain_bonus:{forest:0.3}, rage:110 },
    passive: { name:'火势蔓延', desc:'火焰伤害连锁至相邻敌人(50%伤害)', condition:'on_fire_damage', chain_targets:'adjacent', chain_pct:50 },
    emoji:'🔥', lore:'夷陵一把火，烧尽蜀汉七百里连营'
  },
  fire_soldier: {
    id:'fire_soldier', name:'火兵', title:'',
    faction:'qun', unit:'archer', rarity:2,
    baseStats: { hp:500, atk:90, def:30, spd:55, int:40 },
    skill: { name:'火箭齐发', desc:'对单体170%ATK伤害+灼烧3回合(每回合12%ATK)', type:'damage', target:'single_enemy', value:1.7, dot:{type:'burn',pct:0.12,duration:3}, rage:70 },
    passive: { name:'引火物', desc:'森林地形ATK+25%', condition:'terrain_forest', stat:'atk', pct:25 },
    emoji:'🔥', lore:'携火油火箭的特殊弓兵'
  },

  // ── Chapter 6 heroes ──────────────────────────
  jiangwei: {
    id:'jiangwei', name:'姜维', title:'幼麟',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1050, atk:138, def:88, spd:82, int:95 },
    skill: { name:'继志北伐', desc:'对单体280%ATK伤害；若诸葛亮在队则额外施放「卧龙遗计」(全体150%INT)', type:'damage', target:'single_enemy', value:2.8, inherit:{hero:'zhugeLiang',bonus_skill:{type:'magic',target:'all_enemy',value:1.5}}, rage:105 },
    passive: { name:'死战不退', desc:'HP<20%时ATK翻倍', condition:'hp_below_20', stat:'atk', pct:100 },
    emoji:'⚔️', lore:'诸葛亮衣钵传人，九伐中原矢志不渝'
  },
  supply_guard: {
    id:'supply_guard', name:'辎重兵', title:'',
    faction:'qun', unit:'shield', rarity:2,
    baseStats: { hp:750, atk:50, def:90, spd:30, int:25 },
    skill: { name:'护粮', desc:'保护补给线，全队回复10%HP', type:'heal', target:'all_ally', value:0.1, rage:65 },
    passive: { name:'辎重守卫', desc:'补给线附近DEF+25%', condition:'near_supply', stat:'def', pct:25 },
    emoji:'📦', lore:'守护粮草辎重的坚实后盾'
  }
};

// Export for module use
if (typeof window !== 'undefined') { window.HEROES = HEROES; window.UNIT_TYPES = UNIT_TYPES; window.FACTIONS = FACTIONS; window.FACTION_BONUS = FACTION_BONUS; }

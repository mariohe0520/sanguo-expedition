// 三国·天命 — Hero Database
// 兵种克制: 骑→弓→枪→盾→术→骑
const UNIT_TYPES = {
  cavalry: { name:'骑兵', icon:'骑', strong:'archer', weak:'spear' },
  archer:  { name:'弓兵', icon:'弓', strong:'spear',  weak:'cavalry' },
  spear:   { name:'枪兵', icon:'枪', strong:'shield', weak:'archer' },
  shield:  { name:'盾兵', icon:'盾', strong:'mage',   weak:'spear' },
  mage:    { name:'术士', icon:'术', strong:'cavalry', weak:'shield' }
};

const FACTIONS = {
  shu:  { name:'蜀', color:'#22c55e', icon:'蜀' },
  wei:  { name:'魏', color:'#3b82f6', icon:'魏' },
  wu:   { name:'吴', color:'#ef4444', icon:'吴' },
  qun:  { name:'群', color:'#a855f7', icon:'群' }
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
    emoji:'刘', lore:'编草鞋的少年终成一方霸主'
  },
  guanyu: {
    id:'guanyu', name:'关羽', title:'武圣',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1100, atk:140, def:95, spd:75, int:60 },
    skill: { name:'青龙偃月', desc:'对单体造成250%ATK伤害', type:'damage', target:'single_enemy', value:2.5, rage:100 },
    passive: { name:'忠义', desc:'HP<30%时ATK+40%', condition:'hp_below_30', stat:'atk', pct:40 },
    emoji:'关', lore:'温酒斩华雄，千里走单骑'
  },
  zhangfei: {
    id:'zhangfei', name:'张飞', title:'万人敌',
    faction:'shu', unit:'spear', rarity:4,
    baseStats: { hp:1050, atk:120, def:85, spd:55, int:40 },
    skill: { name:'怒吼', desc:'全体敌人眩晕1回合', type:'cc', target:'all_enemy', effect:'stun', duration:1, rage:120 },
    passive: { name:'燕人之勇', desc:'被攻击时20%反击', condition:'on_hit', chance:20, value:0.8 },
    emoji:'张', lore:'喝断当阳桥'
  },
  caocao: {
    id:'caocao', name:'曹操', title:'乱世奸雄',
    faction:'wei', unit:'cavalry', rarity:5,
    baseStats: { hp:1000, atk:130, def:90, spd:85, int:110 },
    skill: { name:'挟天子', desc:'全队ATK+30% 持续3回合', type:'buff', target:'all_ally', stat:'atk', pct:30, duration:3, rage:90 },
    passive: { name:'求贤令', desc:'战斗开始时随机1名敌人-20%DEF', condition:'battle_start', target:'random_enemy', stat:'def', pct:-20 },
    emoji:'曹', lore:'宁教我负天下人，休教天下人负我'
  },
  sunshangxiang: {
    id:'sunshangxiang', name:'孙尚香', title:'弓腰姬',
    faction:'wu', unit:'archer', rarity:4,
    baseStats: { hp:850, atk:125, def:60, spd:90, int:55 },
    skill: { name:'连弩', desc:'对后排3次攻击各100%ATK', type:'damage', target:'back_row', hits:3, value:1.0, rage:80 },
    passive: { name:'巾帼', desc:'速度最高时暴击率+25%', condition:'highest_spd', stat:'crit', pct:25 },
    emoji:'孙', lore:'东吴郡主，巾帼不让须眉'
  },
  zhaoyun: {
    id:'zhaoyun', name:'赵云', title:'常山赵子龙',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1050, atk:135, def:100, spd:80, int:65 },
    skill: { name:'七进七出', desc:'无敌1回合+对全体150%ATK', type:'damage', target:'all_enemy', value:1.5, selfBuff:{effect:'invincible',duration:1}, rage:110 },
    passive: { name:'浑身是胆', desc:'HP>70%时DEF+20%', condition:'hp_above_70', stat:'def', pct:20 },
    emoji:'赵', lore:'长坂坡七进七出救幼主'
  },
  zhangjiao: {
    id:'zhangjiao', name:'张角', title:'天公将军',
    faction:'qun', unit:'mage', rarity:4,
    baseStats: { hp:800, atk:60, def:55, spd:70, int:145 },
    skill: { name:'天雷', desc:'对全体造成180%INT伤害', type:'magic', target:'all_enemy', value:1.8, rage:100 },
    passive: { name:'太平道', desc:'每回合回复5%HP', condition:'turn_start', heal_pct:5 },
    emoji:'角', lore:'苍天已死，黄天当立'
  },
  lvbu: {
    id:'lvbu', name:'吕布', title:'飞将',
    faction:'qun', unit:'cavalry', rarity:5,
    baseStats: { hp:1100, atk:160, def:80, spd:90, int:35 },
    skill: { name:'无双', desc:'对单体造成350%ATK伤害', type:'damage', target:'single_enemy', value:3.5, rage:120 },
    passive: { name:'方天画戟', desc:'ATK最高时+15%暴击伤害', condition:'highest_atk', stat:'crit_dmg', pct:15 },
    emoji:'吕', lore:'人中吕布，马中赤兔'
  },
  diaochan: {
    id:'diaochan', name:'貂蝉', title:'闭月',
    faction:'qun', unit:'mage', rarity:4,
    baseStats: { hp:750, atk:50, def:50, spd:80, int:140 },
    skill: { name:'闭月', desc:'魅惑ATK最高敌人2回合', type:'cc', target:'highest_atk_enemy', effect:'charm', duration:2, rage:90 },
    passive: { name:'倾国', desc:'被男性武将攻击-15%伤害', condition:'attacked_by_male', dmg_reduce:15 },
    emoji:'蝉', lore:'四大美女之闭月'
  },
  huangzhong: {
    id:'huangzhong', name:'黄忠', title:'老当益壮',
    faction:'shu', unit:'archer', rarity:3,
    baseStats: { hp:900, atk:115, def:70, spd:50, int:50 },
    skill: { name:'百步穿杨', desc:'必中+暴击 200%ATK', type:'damage', target:'single_enemy', value:2.0, guaranteed_crit:true, rage:80 },
    passive: { name:'老将之威', desc:'回合数>5时ATK+25%', condition:'turn_gt_5', stat:'atk', pct:25 },
    emoji:'黄', lore:'定军山斩夏侯渊'
  },
  // Free starter
  soldier: {
    id:'soldier', name:'新兵', title:'',
    faction:'qun', unit:'spear', rarity:1,
    baseStats: { hp:500, atk:50, def:40, spd:40, int:20 },
    skill: { name:'突刺', desc:'对单体120%ATK伤害', type:'damage', target:'single_enemy', value:1.2, rage:60 },
    passive: null,
    emoji:'兵', lore:'刚入伍的士兵'
  },
  archer_recruit: {
    id:'archer_recruit', name:'弓手', title:'',
    faction:'qun', unit:'archer', rarity:1,
    baseStats: { hp:400, atk:55, def:30, spd:50, int:25 },
    skill: { name:'射击', desc:'对单体110%ATK伤害', type:'damage', target:'single_enemy', value:1.1, rage:50 },
    passive: null,
    emoji:'弓', lore:'村里的猎人'
  },
  shield_militia: {
    id:'shield_militia', name:'盾民兵', title:'',
    faction:'qun', unit:'shield', rarity:1,
    baseStats: { hp:600, atk:45, def:65, spd:35, int:20 },
    skill: { name:'盾击', desc:'对单体100%ATK伤害+自身DEF+10%持续2回合', type:'damage', target:'single_enemy', value:1.0, selfBuff:{stat:'def',pct:10,duration:2}, rage:60 },
    passive: null,
    emoji:'盾', lore:'扛着木盾的民兵'
  },
  mage_acolyte: {
    id:'mage_acolyte', name:'术士学徒', title:'',
    faction:'qun', unit:'mage', rarity:1,
    baseStats: { hp:350, atk:35, def:25, spd:55, int:80 },
    skill: { name:'火球', desc:'对单体150%INT伤害', type:'magic', target:'single_enemy', value:1.5, rage:55 },
    passive: null,
    emoji:'术', lore:'习得皮毛法术的少年'
  },
  elite_cavalry: {
    id:'elite_cavalry', name:'精锐骑兵', title:'',
    faction:'qun', unit:'cavalry', rarity:2,
    baseStats: { hp:800, atk:90, def:60, spd:75, int:30 },
    skill: { name:'冲锋', desc:'对单体180%ATK伤害', type:'damage', target:'single_enemy', value:1.8, rage:70 },
    passive: { name:'铁蹄', desc:'首回合SPD+20%', condition:'turn_1', stat:'spd', pct:20 },
    emoji:'骑', lore:'久经沙场的骑兵精锐'
  },
  elite_spear: {
    id:'elite_spear', name:'精锐枪兵', title:'',
    faction:'qun', unit:'spear', rarity:2,
    baseStats: { hp:750, atk:85, def:75, spd:50, int:25 },
    skill: { name:'长枪阵', desc:'对前排全体130%ATK伤害', type:'damage', target:'front_row', value:1.3, rage:65 },
    passive: { name:'枪林', desc:'被骑兵攻击时反击50%ATK', condition:'attacked_by_cavalry', value:0.5 },
    emoji:'枪', lore:'列阵如林的枪兵精锐'
  },

  // ── Chapter 3 enemies ──────────────────────────
  navy_soldier: {
    id:'navy_soldier', name:'水军', title:'',
    faction:'qun', unit:'spear', rarity:2,
    baseStats: { hp:700, atk:75, def:55, spd:45, int:30 },
    skill: { name:'水战突刺', desc:'对单体140%ATK伤害，水上地形+20%', type:'damage', target:'single_enemy', value:1.4, terrain_bonus:{river:0.2}, rage:65 },
    passive: { name:'水性', desc:'河流地形DEF+15%', condition:'terrain_river', stat:'def', pct:15 },
    emoji:'水', lore:'精通水战的曹军水师'
  },
  fire_archer: {
    id:'fire_archer', name:'火弓手', title:'',
    faction:'qun', unit:'archer', rarity:2,
    baseStats: { hp:550, atk:95, def:35, spd:60, int:45 },
    skill: { name:'火矢', desc:'对单体160%ATK伤害+灼烧2回合(每回合10%ATK)', type:'damage', target:'single_enemy', value:1.6, dot:{type:'burn',pct:0.1,duration:2}, rage:70 },
    passive: { name:'引火', desc:'风天气ATK+20%', condition:'weather_wind', stat:'atk', pct:20 },
    emoji:'火', lore:'箭尖燃火，百发百中'
  },
  caoren: {
    id:'caoren', name:'曹仁', title:'铁壁将军',
    faction:'wei', unit:'shield', rarity:4,
    baseStats: { hp:1400, atk:70, def:140, spd:40, int:65 },
    skill: { name:'铁壁', desc:'全队DEF+35%持续3回合', type:'buff', target:'all_ally', stat:'def', pct:35, duration:3, rage:100 },
    passive: { name:'坚守不退', desc:'HP<50%时DEF+30%', condition:'hp_below_50', stat:'def', pct:30 },
    emoji:'仁', lore:'曹操宗族大将，善守城池'
  },
  zhouyu: {
    id:'zhouyu', name:'周瑜', title:'美周郎',
    faction:'wu', unit:'mage', rarity:5,
    baseStats: { hp:900, atk:75, def:70, spd:85, int:145 },
    skill: { name:'火烧赤壁', desc:'对全体造成200%INT伤害+灼烧2回合', type:'magic', target:'all_enemy', value:2.0, dot:{type:'burn',pct:0.15,duration:2}, rage:110 },
    passive: { name:'英才', desc:'队伍INT总和最高时全队INT+10%', condition:'team_highest_int', stat:'int', pct:10 },
    emoji:'瑜', lore:'谈笑间，樯橹灰飞烟灭'
  },

  // ── Chapter 4 enemies ──────────────────────────
  strategist: {
    id:'strategist', name:'军师', title:'',
    faction:'qun', unit:'mage', rarity:2,
    baseStats: { hp:500, atk:40, def:35, spd:65, int:110 },
    skill: { name:'妙计', desc:'全体友军ATK+20%持续2回合', type:'buff', target:'all_ally', stat:'atk', pct:20, duration:2, rage:70 },
    passive: { name:'智谋', desc:'每回合30%概率降低1名敌人DEF-15%', condition:'turn_start', chance:30, target:'random_enemy', stat:'def', pct:-15 },
    emoji:'谋', lore:'运筹帷幄的幕后智囊'
  },
  crossbow_corps: {
    id:'crossbow_corps', name:'连弩队', title:'',
    faction:'qun', unit:'archer', rarity:2,
    baseStats: { hp:600, atk:100, def:40, spd:50, int:35 },
    skill: { name:'齐射', desc:'对全体敌人110%ATK伤害', type:'damage', target:'all_enemy', value:1.1, rage:80 },
    passive: { name:'箭雨', desc:'攻击时20%概率攻击相邻单位', condition:'on_attack', chance:20, splash:true },
    emoji:'弩', lore:'诸葛连弩改良的精锐弩兵'
  },
  simayi: {
    id:'simayi', name:'司马懿', title:'冢虎',
    faction:'wei', unit:'mage', rarity:5,
    baseStats: { hp:1100, atk:65, def:120, spd:60, int:150 },
    skill: { name:'鹰视狼顾', desc:'复制对方最强武将技能使用', type:'mirror', target:'strongest_enemy', rage:110 },
    passive: { name:'隐忍', desc:'受到致命伤害时50%概率存活(HP=1)', condition:'on_lethal', chance:50 },
    emoji:'司', lore:'司马懿善忍，终成大器'
  },

  // ── Chapter 5 heroes ──────────────────────────
  luXun: {
    id:'luXun', name:'陆逊', title:'火烧连营',
    faction:'wu', unit:'mage', rarity:5,
    baseStats: { hp:950, atk:70, def:65, spd:80, int:148 },
    skill: { name:'火烧连营', desc:'对全体造成220%INT伤害，森林地形+30%', type:'magic', target:'all_enemy', value:2.2, terrain_bonus:{forest:0.3}, rage:110 },
    passive: { name:'火势蔓延', desc:'火焰伤害连锁至相邻敌人(50%伤害)', condition:'on_fire_damage', chain_targets:'adjacent', chain_pct:50 },
    emoji:'逊', lore:'夷陵一把火，烧尽蜀汉七百里连营'
  },
  fire_soldier: {
    id:'fire_soldier', name:'火兵', title:'',
    faction:'qun', unit:'archer', rarity:2,
    baseStats: { hp:500, atk:90, def:30, spd:55, int:40 },
    skill: { name:'火箭齐发', desc:'对单体170%ATK伤害+灼烧3回合(每回合12%ATK)', type:'damage', target:'single_enemy', value:1.7, dot:{type:'burn',pct:0.12,duration:3}, rage:70 },
    passive: { name:'引火物', desc:'森林地形ATK+25%', condition:'terrain_forest', stat:'atk', pct:25 },
    emoji:'焰', lore:'携火油火箭的特殊弓兵'
  },

  // ── Chapter 6 heroes ──────────────────────────
  jiangwei: {
    id:'jiangwei', name:'姜维', title:'幼麟',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1050, atk:138, def:88, spd:82, int:95 },
    skill: { name:'继志北伐', desc:'对单体280%ATK伤害；若诸葛亮在队则额外施放「卧龙遗计」(全体150%INT)', type:'damage', target:'single_enemy', value:2.8, inherit:{hero:'zhugeLiang',bonus_skill:{type:'magic',target:'all_enemy',value:1.5}}, rage:105 },
    passive: { name:'死战不退', desc:'HP<20%时ATK翻倍', condition:'hp_below_20', stat:'atk', pct:100 },
    emoji:'维', lore:'诸葛亮衣钵传人，九伐中原矢志不渝'
  },
  supply_guard: {
    id:'supply_guard', name:'辎重兵', title:'',
    faction:'qun', unit:'shield', rarity:2,
    baseStats: { hp:750, atk:50, def:90, spd:30, int:25 },
    skill: { name:'护粮', desc:'保护补给线，全队回复10%HP', type:'heal', target:'all_ally', value:0.1, rage:65 },
    passive: { name:'辎重守卫', desc:'补给线附近DEF+25%', condition:'near_supply', stat:'def', pct:25 },
    emoji:'辎', lore:'守护粮草辎重的坚实后盾'
  },

  // ══════════════════════════════════════════
  // "Coming Soon" heroes — 23 placeholders
  // ══════════════════════════════════════════
  zhugeLiang: {
    id:'zhugeLiang', name:'诸葛亮', title:'卧龙',
    faction:'shu', unit:'mage', rarity:5,
    baseStats: { hp:950, atk:60, def:75, spd:70, int:160 },
    skill: { name:'八阵图', desc:'对全体敌人造成200%INT伤害+降低ATK 25%持续2回合', type:'magic', target:'all_enemy', value:2.0, rage:110 },
    passive: { name:'卧龙之智', desc:'全队INT+10%', condition:'faction_shu', stat:'int', pct:10 },
    emoji:'葛', lore:'功盖三分国，名成八阵图', comingSoon: true
  },
  pangtong: {
    id:'pangtong', name:'庞统', title:'凤雏',
    faction:'shu', unit:'mage', rarity:5,
    baseStats: { hp:850, atk:55, def:60, spd:75, int:155 },
    skill: { name:'连环计', desc:'使敌方2名目标互相攻击', type:'cc', target:'random_2_enemy', effect:'confuse', duration:2, rage:100 },
    passive: { name:'凤雏之谋', desc:'战斗开始时随机敌人-30%DEF', condition:'battle_start', target:'random_enemy', stat:'def', pct:-30 },
    emoji:'统', lore:'凤雏与卧龙齐名，奈何命陨落凤坡', comingSoon: true
  },
  machao: {
    id:'machao', name:'马超', title:'锦马超',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1000, atk:145, def:85, spd:90, int:45 },
    skill: { name:'西凉铁骑', desc:'对前排全体220%ATK伤害', type:'damage', target:'front_row', value:2.2, rage:100 },
    passive: { name:'神威', desc:'首回合ATK+30%', condition:'turn_1', stat:'atk', pct:30 },
    emoji:'马', lore:'西凉锦马超，杀得曹操割须弃袍', comingSoon: true
  },
  huangyueying: {
    id:'huangyueying', name:'黄月英', title:'巧匠',
    faction:'shu', unit:'mage', rarity:4,
    baseStats: { hp:800, atk:50, def:55, spd:65, int:135 },
    skill: { name:'木牛流马', desc:'全队回复20%HP+SPD+15%持续2回合', type:'heal', target:'all_ally', value:0.2, rage:90 },
    passive: { name:'巧思', desc:'装备效果+20%', condition:'equip_bonus', pct:20 },
    emoji:'英', lore:'诸葛亮之妻，才智不输夫君', comingSoon: true
  },
  ganningwu: {
    id:'ganningwu', name:'甘宁', title:'锦帆贼',
    faction:'wu', unit:'cavalry', rarity:4,
    baseStats: { hp:950, atk:130, def:75, spd:85, int:50 },
    skill: { name:'百骑劫营', desc:'对后排单体300%ATK伤害', type:'damage', target:'back_single', value:3.0, rage:95 },
    passive: { name:'锦帆', desc:'夜战ATK+25%', condition:'night_battle', stat:'atk', pct:25 },
    emoji:'甘', lore:'百骑劫曹营，来去如风', comingSoon: true
  },
  taishici: {
    id:'taishici', name:'太史慈', title:'信义之士',
    faction:'wu', unit:'archer', rarity:4,
    baseStats: { hp:950, atk:125, def:80, spd:75, int:55 },
    skill: { name:'神射', desc:'对单体250%ATK伤害，必中', type:'damage', target:'single_enemy', value:2.5, guaranteed_hit:true, rage:85 },
    passive: { name:'义士', desc:'HP<50%时暴击率+30%', condition:'hp_below_50', stat:'crit', pct:30 },
    emoji:'慈', lore:'大丈夫生于乱世，当带三尺剑立不世之功', comingSoon: true
  },
  xuhuang: {
    id:'xuhuang', name:'徐晃', title:'周亚夫之风',
    faction:'wei', unit:'spear', rarity:4,
    baseStats: { hp:1000, atk:115, def:100, spd:60, int:55 },
    skill: { name:'大斧', desc:'对单体200%ATK伤害+破甲(DEF-20%)2回合', type:'damage', target:'single_enemy', value:2.0, debuff:{stat:'def',pct:-20,duration:2}, rage:85 },
    passive: { name:'治军严明', desc:'全队DEF+10%', condition:'always', stat:'def', pct:10 },
    emoji:'晃', lore:'治军严整，被曹操称赞有周亚夫之风', comingSoon: true
  },
  zhanghe: {
    id:'zhanghe', name:'张郃', title:'巧变将军',
    faction:'wei', unit:'spear', rarity:4,
    baseStats: { hp:980, atk:110, def:95, spd:70, int:60 },
    skill: { name:'巧变', desc:'对全体150%ATK伤害+自身闪避+30%持续2回合', type:'damage', target:'all_enemy', value:1.5, rage:90 },
    passive: { name:'灵活', desc:'被攻击时20%闪避', condition:'on_hit', dodge:20 },
    emoji:'郃', lore:'以巧变著称的五子良将', comingSoon: true
  },
  xiahouyuan: {
    id:'xiahouyuan', name:'夏侯渊', title:'疾行将军',
    faction:'wei', unit:'cavalry', rarity:4,
    baseStats: { hp:900, atk:130, def:70, spd:95, int:45 },
    skill: { name:'急袭', desc:'先手攻击，对单体260%ATK伤害', type:'damage', target:'single_enemy', value:2.6, priority:true, rage:80 },
    passive: { name:'神速', desc:'SPD最高时ATK+20%', condition:'highest_spd', stat:'atk', pct:20 },
    emoji:'渊', lore:'三日五百里，六日一千里', comingSoon: true
  },
  zhangzhao: {
    id:'zhangzhao', name:'张昭', title:'江东之柱',
    faction:'wu', unit:'mage', rarity:3,
    baseStats: { hp:750, atk:40, def:60, spd:55, int:120 },
    skill: { name:'定国策', desc:'全队DEF+25%持续3回合', type:'buff', target:'all_ally', stat:'def', pct:25, duration:3, rage:80 },
    passive: { name:'老成谋国', desc:'战斗开始全队+5%全属性', condition:'battle_start', all_pct:5 },
    emoji:'昭', lore:'孙策遗命：内事不决问张昭', comingSoon: true
  },
  menghuo: {
    id:'menghuo', name:'孟获', title:'南蛮王',
    faction:'qun', unit:'shield', rarity:4,
    baseStats: { hp:1500, atk:100, def:120, spd:35, int:30 },
    skill: { name:'蛮力', desc:'对单体200%ATK伤害+自身回复15%HP', type:'damage', target:'single_enemy', value:2.0, selfHeal:0.15, rage:90 },
    passive: { name:'蛮王之躯', desc:'HP越低DEF越高(最高+50%)', condition:'hp_scaling', stat:'def', maxPct:50 },
    emoji:'获', lore:'七擒七纵，终心悦诚服', comingSoon: true
  },
  zhurong: {
    id:'zhurong', name:'祝融', title:'火神后裔',
    faction:'qun', unit:'cavalry', rarity:4,
    baseStats: { hp:900, atk:125, def:70, spd:80, int:60 },
    skill: { name:'飞刀', desc:'对随机3名敌人各150%ATK伤害', type:'damage', target:'random_3', value:1.5, rage:85 },
    passive: { name:'火神血脉', desc:'火焰伤害免疫', condition:'immune_fire' },
    emoji:'融', lore:'孟获之妻，祝融氏后人', comingSoon: true
  },
  guojia: {
    id:'guojia', name:'郭嘉', title:'鬼才',
    faction:'wei', unit:'mage', rarity:5,
    baseStats: { hp:800, atk:50, def:55, spd:80, int:158 },
    skill: { name:'十胜十败', desc:'降低全体敌人全属性15%持续3回合', type:'debuff', target:'all_enemy', all_pct:-15, duration:3, rage:100 },
    passive: { name:'遗计', desc:'死亡时对全体敌人造成100%INT伤害', condition:'on_death', value:1.0 },
    emoji:'嘉', lore:'天生郭奉孝，豪杰冠群英', comingSoon: true
  },
  sunce: {
    id:'sunce', name:'孙策', title:'小霸王',
    faction:'wu', unit:'cavalry', rarity:5,
    baseStats: { hp:1050, atk:140, def:80, spd:88, int:60 },
    skill: { name:'霸王之击', desc:'对单体280%ATK伤害+眩晕1回合', type:'damage', target:'single_enemy', value:2.8, effect:'stun', duration:1, rage:100 },
    passive: { name:'霸气', desc:'击杀敌人后ATK+15%(可叠加)', condition:'on_kill', stat:'atk', pct:15 },
    emoji:'策', lore:'小霸王横扫江东', comingSoon: true
  },
  xunyu: {
    id:'xunyu', name:'荀彧', title:'王佐之才',
    faction:'wei', unit:'mage', rarity:5,
    baseStats: { hp:850, atk:45, def:65, spd:70, int:152 },
    skill: { name:'驱虎吞狼', desc:'使2名敌人互相攻击+全队回复15%HP', type:'cc', target:'random_2_enemy', effect:'confuse', heal:0.15, rage:105 },
    passive: { name:'王佐', desc:'全队战斗开始INT+15%', condition:'battle_start_team', stat:'int', pct:15 },
    emoji:'彧', lore:'荀令留香，王佐之才', comingSoon: true
  },
  pangde: {
    id:'pangde', name:'庞德', title:'抬棺将军',
    faction:'wei', unit:'cavalry', rarity:4,
    baseStats: { hp:1050, atk:135, def:90, spd:70, int:40 },
    skill: { name:'抬棺死战', desc:'对单体250%ATK伤害+自身不死1回合', type:'damage', target:'single_enemy', value:2.5, selfBuff:{effect:'undying',duration:1}, rage:100 },
    passive: { name:'死志', desc:'HP<20%时ATK+50%', condition:'hp_below_20', stat:'atk', pct:50 },
    emoji:'德', lore:'抬棺而战，誓死不降', comingSoon: true
  },
  yanyan: {
    id:'yanyan', name:'严颜', title:'断头将军',
    faction:'shu', unit:'shield', rarity:3,
    baseStats: { hp:1100, atk:80, def:110, spd:40, int:50 },
    skill: { name:'不屈', desc:'自身DEF+40%持续3回合+回复20%HP', type:'buff', target:'self', stat:'def', pct:40, duration:3, heal:0.2, rage:80 },
    passive: { name:'老将风范', desc:'被攻击时10%概率无视伤害', condition:'on_hit', nullify_chance:10 },
    emoji:'严', lore:'砍头便砍头，何为怒邪！', comingSoon: true
  },
  weiyan: {
    id:'weiyan', name:'魏延', title:'脑后反骨',
    faction:'shu', unit:'cavalry', rarity:4,
    baseStats: { hp:1000, atk:138, def:78, spd:80, int:55 },
    skill: { name:'子午谷奇谋', desc:'对单体300%ATK伤害（有20%概率失败）', type:'damage', target:'single_enemy', value:3.0, failChance:20, rage:95 },
    passive: { name:'反骨', desc:'被队友治疗时额外+20%治疗效果', condition:'on_healed', heal_bonus:20 },
    emoji:'延', lore:'子午谷奇谋，大胆而冒险', comingSoon: true
  },
  lusu: {
    id:'lusu', name:'鲁肃', title:'忠厚长者',
    faction:'wu', unit:'shield', rarity:4,
    baseStats: { hp:1200, atk:60, def:100, spd:50, int:110 },
    skill: { name:'榻上策', desc:'全队回复25%HP+DEF+20%持续2回合', type:'heal', target:'all_ally', value:0.25, buffStat:'def', buffPct:20, duration:2, rage:95 },
    passive: { name:'和气', desc:'降低被暴击概率50%', condition:'always', crit_resist:50 },
    emoji:'肃', lore:'鲁子敬忠厚豪爽，为孙刘联盟穿针引线', comingSoon: true
  },
  huatuo: {
    id:'huatuo', name:'华佗', title:'神医',
    faction:'qun', unit:'mage', rarity:5,
    baseStats: { hp:800, atk:35, def:50, spd:60, int:140 },
    skill: { name:'五禽戏', desc:'全队回复40%HP+解除所有负面效果', type:'heal', target:'all_ally', value:0.4, cleanse:true, rage:120 },
    passive: { name:'妙手回春', desc:'每回合最低HP队友回复8%HP', condition:'turn_start', heal_lowest:8 },
    emoji:'佗', lore:'华佗再世，刮骨疗毒', comingSoon: true
  },
  yuanshao: {
    id:'yuanshao', name:'袁绍', title:'四世三公',
    faction:'qun', unit:'shield', rarity:4,
    baseStats: { hp:1300, atk:90, def:100, spd:45, int:80 },
    skill: { name:'官渡列阵', desc:'全队DEF+30%持续3回合', type:'buff', target:'all_ally', stat:'def', pct:30, duration:3, rage:90 },
    passive: { name:'名门之后', desc:'战斗开始全队HP+10%', condition:'battle_start_team', stat:'hp', pct:10 },
    emoji:'绍', lore:'四世三公，门生故吏遍天下', comingSoon: true
  },
  dongzhuo: {
    id:'dongzhuo', name:'董卓', title:'暴虐太师',
    faction:'qun', unit:'shield', rarity:4,
    baseStats: { hp:1400, atk:110, def:130, spd:30, int:60 },
    skill: { name:'暴政', desc:'对全体敌人120%ATK伤害+恐惧(ATK-25%)2回合', type:'damage', target:'all_enemy', value:1.2, debuff:{stat:'atk',pct:-25,duration:2}, rage:100 },
    passive: { name:'暴虐', desc:'击杀敌人回复20%HP', condition:'on_kill', heal_pct:20 },
    emoji:'卓', lore:'废帝立幼，祸乱朝纲', comingSoon: true
  },
  zhenji: {
    id:'zhenji', name:'甄姬', title:'洛神',
    faction:'wei', unit:'mage', rarity:4,
    baseStats: { hp:800, atk:45, def:55, spd:75, int:138 },
    skill: { name:'洛神赋', desc:'对全体敌人170%INT伤害+魅惑ATK最高者1回合', type:'magic', target:'all_enemy', value:1.7, cc:{target:'highest_atk',effect:'charm',duration:1}, rage:95 },
    passive: { name:'倾城', desc:'被攻击时30%概率使攻击者-20%ATK 1回合', condition:'on_hit', chance:30, debuff:{stat:'atk',pct:-20,duration:1} },
    emoji:'甄', lore:'翩若惊鸿，婉若游龙', comingSoon: true
  },

  // ══════════════════════════════════════════
  // Mystery/Placeholder heroes (???)
  // ══════════════════════════════════════════
  mystery_1: {
    id:'mystery_1', name:'???', title:'未知武将',
    faction:'shu', unit:'cavalry', rarity:5,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'传说中的蜀汉名将...', locked: true, mystery: true
  },
  mystery_2: {
    id:'mystery_2', name:'???', title:'未知武将',
    faction:'wei', unit:'mage', rarity:5,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'曹魏最深沉的智者...', locked: true, mystery: true
  },
  mystery_3: {
    id:'mystery_3', name:'???', title:'未知武将',
    faction:'wu', unit:'archer', rarity:5,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'东吴传说中的神弓手...', locked: true, mystery: true
  },
  mystery_4: {
    id:'mystery_4', name:'???', title:'未知武将',
    faction:'qun', unit:'cavalry', rarity:5,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'乱世中最神秘的骑兵...', locked: true, mystery: true
  },
  mystery_5: {
    id:'mystery_5', name:'???', title:'未知武将',
    faction:'shu', unit:'shield', rarity:4,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'铜墙铁壁般的守护者...', locked: true, mystery: true
  },
  mystery_6: {
    id:'mystery_6', name:'???', title:'未知武将',
    faction:'wei', unit:'spear', rarity:4,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'以枪术闻名天下...', locked: true, mystery: true
  },
  mystery_7: {
    id:'mystery_7', name:'???', title:'未知武将',
    faction:'wu', unit:'shield', rarity:4,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'守卫江东的铁壁...', locked: true, mystery: true
  },
  mystery_8: {
    id:'mystery_8', name:'???', title:'未知武将',
    faction:'qun', unit:'mage', rarity:5,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'超越时代的奇才...', locked: true, mystery: true
  },
  mystery_9: {
    id:'mystery_9', name:'???', title:'未知武将',
    faction:'shu', unit:'archer', rarity:4,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'箭无虚发的传奇射手...', locked: true, mystery: true
  },
  mystery_10: {
    id:'mystery_10', name:'???', title:'未知武将',
    faction:'qun', unit:'cavalry', rarity:5,
    baseStats: { hp:1, atk:1, def:1, spd:1, int:1 },
    skill: null, passive: null,
    emoji:'甄', lore:'天命最终章的关键人物...', locked: true, mystery: true
  },
};

// ===== HERO AFFINITY SYSTEM (羁绊) =====
const HERO_AFFINITIES = [
  {
    id: 'taoyuan',
    name: '桃园三兄弟',
    heroes: ['liubei', 'guanyu', 'zhangfei'],
    emoji: '桃',
    desc: '桃园结义，生死与共',
    bonus: { all_pct: 20 },
    bonusDesc: '全属性+20%',
    minRequired: 3,
  },
  {
    id: 'wolong_fengchu',
    name: '卧龙凤雏',
    heroes: ['zhugeLiang', 'pangtong'],
    emoji: '龙',
    desc: '卧龙凤雏得一可安天下',
    bonus: { int_pct: 30 },
    bonusDesc: 'INT+30%',
    minRequired: 2,
  },
  {
    id: 'tiger_wall',
    name: '虎将双壁',
    heroes: ['zhaoyun', 'machao'],
    emoji: '虎',
    desc: '常山赵子龙与锦马超的合击',
    bonus: { atk_pct: 25 },
    bonusDesc: 'ATK+25%',
    minRequired: 2,
  },
  {
    id: 'fire_duo',
    name: '江东火计',
    heroes: ['zhouyu', 'luXun'],
    emoji: '火',
    desc: '赤壁之火与夷陵之焰',
    bonus: { fire_dmg_pct: 30 },
    bonusDesc: '火焰伤害+30%',
    minRequired: 2,
  },
  {
    id: 'wu_tiger',
    name: '五虎上将',
    heroes: ['guanyu', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong'],
    emoji: '将',
    desc: '蜀汉五虎大将齐聚',
    bonus: { atk_pct: 15, def_pct: 15 },
    bonusDesc: 'ATK+15%, DEF+15%',
    minRequired: 3,
  },
  {
    id: 'wei_advisors',
    name: '魏之双璧',
    heroes: ['simayi', 'guojia'],
    emoji: '谋',
    desc: '曹魏最强谋士组合',
    bonus: { int_pct: 25 },
    bonusDesc: 'INT+25%',
    minRequired: 2,
  },
  {
    id: 'wu_pillars',
    name: '吴国柱石',
    heroes: ['zhouyu', 'lusu', 'luXun'],
    emoji: '柱',
    desc: '东吴三任大都督',
    bonus: { all_pct: 10, int_pct: 15 },
    bonusDesc: '全属性+10%, INT+15%',
    minRequired: 2,
  },
  {
    id: 'beauty',
    name: '绝代双骄',
    heroes: ['diaochan', 'zhenji'],
    emoji: '美',
    desc: '倾国倾城，四大美女其二',
    bonus: { int_pct: 20, spd_pct: 15 },
    bonusDesc: 'INT+20%, SPD+15%',
    minRequired: 2,
  },
  {
    id: 'nanman',
    name: '南蛮双雄',
    heroes: ['menghuo', 'zhurong'],
    emoji: '蛮',
    desc: '南蛮王与火神后裔',
    bonus: { hp_pct: 20, atk_pct: 15 },
    bonusDesc: 'HP+20%, ATK+15%',
    minRequired: 2,
  },
  {
    id: 'heir',
    name: '继志北伐',
    heroes: ['zhugeLiang', 'jiangwei'],
    emoji: '继',
    desc: '诸葛亮与其衣钵传人',
    bonus: { int_pct: 20, atk_pct: 10 },
    bonusDesc: 'INT+20%, ATK+10%',
    minRequired: 2,
  },
];

// ===== ELEMENT SYSTEM =====
const HERO_ELEMENTS = {
  // Shu
  liubei: 'earth', guanyu: 'fire', zhangfei: 'lightning', zhaoyun: 'wind',
  huangzhong: 'earth', zhugeLiang: 'wind', jiangwei: 'lightning',
  machao: 'wind', huangyueying: 'wind', weiyan: 'fire', yanyan: 'earth',
  // Wei
  caocao: 'wind', simayi: 'ice', guojia: 'ice', xunyu: 'wind',
  xuhuang: 'earth', zhanghe: 'wind', xiahouyuan: 'lightning',
  pangde: 'fire', zhenji: 'ice',
  // Wu
  sunshangxiang: 'wind', zhouyu: 'fire', luXun: 'fire',
  ganningwu: 'water', taishici: 'wind', lusu: 'water',
  sunce: 'lightning', zhangzhao: 'earth',
  // Qun
  zhangjiao: 'lightning', lvbu: 'fire', diaochan: 'ice',
  menghuo: 'earth', zhurong: 'fire', dongzhuo: 'fire',
  yuanshao: 'earth', huatuo: 'water',
  // Enemies
  navy_soldier: 'water', fire_archer: 'fire', fire_soldier: 'fire',
  mage_acolyte: 'fire', strategist: 'wind', supply_guard: 'earth',
  shield_militia: 'earth', caoren: 'earth', crossbow_corps: 'wind',
  caocao: 'wind',
};

const ELEMENT_REACTIONS = {
  'fire+wind':      { name: '火风暴', type: 'firestorm', desc: '引燃烈风，全体敌人受到AoE伤害' },
  'wind+fire':      { name: '火风暴', type: 'firestorm', desc: '引燃烈风，全体敌人受到AoE伤害' },
  'water+ice':      { name: '冰冻', type: 'freeze', desc: '极寒冻结，目标眩晕1回合' },
  'ice+water':      { name: '冰冻', type: 'freeze', desc: '极寒冻结，目标眩晕1回合' },
  'earth+lightning': { name: '碎裂', type: 'shatter', desc: '大地崩碎，目标防御-30%持续2回合' },
  'lightning+earth': { name: '碎裂', type: 'shatter', desc: '大地崩碎，目标防御-30%持续2回合' },
};

const ELEMENT_INFO = {
  fire:      { name: '火', icon: '火', color: '#ef4444' },
  water:     { name: '水', icon: '水', color: '#3b82f6' },
  wind:      { name: '风', icon: '风', color: '#22c55e' },
  earth:     { name: '地', icon: '地', color: '#a16207' },
  lightning: { name: '雷', icon: '雷', color: '#eab308' },
  ice:       { name: '冰', icon: '冰', color: '#67e8f9' },
};

// Calculate active affinities for a team
function getActiveAffinities(teamHeroIds) {
  const active = [];
  for (const aff of HERO_AFFINITIES) {
    const matchCount = aff.heroes.filter(h => teamHeroIds.includes(h)).length;
    if (matchCount >= aff.minRequired) {
      active.push({ ...aff, matchCount });
    }
  }
  return active;
}

// Get total hero count (excluding mystery/locked)
function getTotalHeroCount() {
  return Object.values(HEROES).filter(h => !h.mystery).length;
}

// Export for module use
if (typeof window !== 'undefined') {
  window.HEROES = HEROES;
  window.UNIT_TYPES = UNIT_TYPES;
  window.FACTIONS = FACTIONS;
  window.FACTION_BONUS = FACTION_BONUS;
  window.HERO_AFFINITIES = HERO_AFFINITIES;
  window.HERO_ELEMENTS = HERO_ELEMENTS;
  window.ELEMENT_REACTIONS = ELEMENT_REACTIONS;
  window.ELEMENT_INFO = ELEMENT_INFO;
  window.getActiveAffinities = getActiveAffinities;
  window.getTotalHeroCount = getTotalHeroCount;
}

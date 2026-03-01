// js/config/equipment-data.js -- Equipment template data (extracted from equipment.js)
// This file contains ONLY data definitions. Logic remains in systems/equipment.js.

window.EQUIPMENT_DATA = {
  RARITIES: {
    1: { name: '白', color: '#9ca3af', label: '普通' },
    2: { name: '绿', color: '#22c55e', label: '优秀' },
    3: { name: '蓝', color: '#3b82f6', label: '精良' },
    4: { name: '紫', color: '#a855f7', label: '史诗' },
    5: { name: '橙', color: '#f59e0b', label: '传说' },
  },
  SLOTS: {
    weapon:    { name: '武器', icon: 'weapon' },
    armor:     { name: '防具', icon: 'armor' },
    accessory: { name: '饰品', icon: 'accessory' },
    mount:     { name: '坐骑', icon: 'mount' },
  },
  SETS: {
    longdan: {
      name: '龙胆套装', desc: 'ATK专精·Dragon Lance',
      pieces: ['longdan_weapon','longdan_armor','longdan_accessory','longdan_mount'],
      bonuses: { 2: { name: '龙胆·双', desc: 'ATK+15%', stats: { atk_pct: 15 } }, 4: { name: '龙胆·全', desc: '暴击率+25%', stats: { crit_pct: 25 } } }
    },
    fengyi: {
      name: '凤翼套装', desc: 'INT专精·Phoenix Wing',
      pieces: ['fengyi_weapon','fengyi_armor','fengyi_accessory','fengyi_mount'],
      bonuses: { 2: { name: '凤翼·双', desc: 'INT+15%', stats: { int_pct: 15 } }, 4: { name: '凤翼·全', desc: '技能伤害+30%', stats: { skill_dmg_pct: 30 } } }
    },
    xuanjia: {
      name: '玄甲套装', desc: 'DEF专精·Dark Armor',
      pieces: ['xuanjia_weapon','xuanjia_armor','xuanjia_accessory','xuanjia_mount'],
      bonuses: { 2: { name: '玄甲·双', desc: 'DEF+15%', stats: { def_pct: 15 } }, 4: { name: '玄甲·全', desc: '反弹15%伤害', stats: { reflect_pct: 15 } } }
    },
  },
  TEMPLATES: {
    // -- WEAPONS --
    iron_sword:     { id:'iron_sword',     name:'铁剑',     slot:'weapon', rarity:1, stats:{atk:8},               emoji:'' },
    iron_spear:     { id:'iron_spear',     name:'铁枪',     slot:'weapon', rarity:1, stats:{atk:7,hp:20},         emoji:'' },
    wood_bow:       { id:'wood_bow',       name:'木弓',     slot:'weapon', rarity:1, stats:{atk:6,spd:2},         emoji:'' },
    bronze_blade:   { id:'bronze_blade',   name:'青铜刀',   slot:'weapon', rarity:2, stats:{atk:15,def:3},        emoji:'' },
    steel_spear:    { id:'steel_spear',    name:'精钢枪',   slot:'weapon', rarity:2, stats:{atk:14,hp:40},        emoji:'' },
    elm_bow:        { id:'elm_bow',        name:'榆木弓',   slot:'weapon', rarity:2, stats:{atk:13,spd:4},        emoji:'' },
    frost_blade:    { id:'frost_blade',    name:'寒铁刀',   slot:'weapon', rarity:3, stats:{atk:25,def:5},        emoji:'' },
    dragon_spring:  { id:'dragon_spring',  name:'龙泉剑',   slot:'weapon', rarity:3, stats:{atk:28,int:5},        emoji:'' },
    thunder_bow:    { id:'thunder_bow',    name:'雷鸣弓',   slot:'weapon', rarity:3, stats:{atk:24,spd:8},        emoji:'' },
    sky_blade:      { id:'sky_blade',      name:'倚天剑',   slot:'weapon', rarity:4, stats:{atk:42,int:10,def:8}, emoji:'' },
    serpent_spear:  { id:'serpent_spear',  name:'丈八蛇矛', slot:'weapon', rarity:4, stats:{atk:48,hp:80},        emoji:'' },
    phoenix_bow:    { id:'phoenix_bow',    name:'落凰弓',   slot:'weapon', rarity:4, stats:{atk:40,spd:12,int:8}, emoji:'' },
    heaven_halberd: { id:'heaven_halberd', name:'方天画戟', slot:'weapon', rarity:5, stats:{atk:70,spd:10,hp:100},emoji:'' },
    moon_blade:     { id:'moon_blade',     name:'青龙偃月刀',slot:'weapon',rarity:5, stats:{atk:65,def:15,hp:150},emoji:'' },
    star_crossbow:  { id:'star_crossbow',  name:'诸葛连弩', slot:'weapon', rarity:5, stats:{atk:60,spd:15,int:20},emoji:'' },
    // -- ARMOR --
    cloth_armor:     { id:'cloth_armor',     name:'布甲',     slot:'armor', rarity:1, stats:{def:6,hp:30},          emoji:'' },
    leather_vest:    { id:'leather_vest',    name:'皮甲',     slot:'armor', rarity:1, stats:{def:8},                 emoji:'' },
    chain_mail:      { id:'chain_mail',      name:'锁子甲',   slot:'armor', rarity:2, stats:{def:14,hp:60},          emoji:'' },
    iron_plate:      { id:'iron_plate',      name:'铁甲',     slot:'armor', rarity:2, stats:{def:16,hp:40},          emoji:'' },
    scale_armor:     { id:'scale_armor',     name:'鱼鳞甲',   slot:'armor', rarity:3, stats:{def:24,hp:100},         emoji:'' },
    ring_mail:       { id:'ring_mail',       name:'环锁铠',   slot:'armor', rarity:3, stats:{def:22,hp:80,spd:3},    emoji:'' },
    bright_armor:    { id:'bright_armor',    name:'明光铠',   slot:'armor', rarity:4, stats:{def:38,hp:180,spd:5},   emoji:'' },
    dark_iron_armor: { id:'dark_iron_armor', name:'玄铁甲',   slot:'armor', rarity:4, stats:{def:45,hp:200},         emoji:'' },
    tiger_armor:     { id:'tiger_armor',     name:'虎豹铠',   slot:'armor', rarity:5, stats:{def:60,hp:300,atk:15},  emoji:'' },
    flame_armor:     { id:'flame_armor',     name:'赤焰战甲', slot:'armor', rarity:5, stats:{def:55,hp:250,int:20},  emoji:'' },
    // -- ACCESSORIES --
    charm:           { id:'charm',           name:'护身符',   slot:'accessory', rarity:1, stats:{hp:40},              emoji:'' },
    bronze_mirror:   { id:'bronze_mirror',   name:'铜镜',     slot:'accessory', rarity:1, stats:{int:5},              emoji:'' },
    jade_pendant:    { id:'jade_pendant',    name:'玉佩',     slot:'accessory', rarity:2, stats:{hp:60,int:5},        emoji:'' },
    war_scroll:      { id:'war_scroll',      name:'兵法书',   slot:'accessory', rarity:2, stats:{int:10,atk:5},       emoji:'' },
    white_jade_pin:  { id:'white_jade_pin',  name:'白玉簪',   slot:'accessory', rarity:3, stats:{int:18,spd:5},       emoji:'' },
    ancient_tome:    { id:'ancient_tome',    name:'古卷',     slot:'accessory', rarity:3, stats:{int:20,hp:60},       emoji:'' },
    wisdom_pearl:    { id:'wisdom_pearl',    name:'智珠',     slot:'accessory', rarity:4, stats:{int:35,hp:100,spd:5},emoji:'' },
    spirit_orb:      { id:'spirit_orb',      name:'灵宝珠',   slot:'accessory', rarity:4, stats:{int:30,atk:10,def:10},emoji:'' },
    dragon_seal:     { id:'dragon_seal',     name:'传国玉玺', slot:'accessory', rarity:5, stats:{int:50,hp:200,atk:15},emoji:'' },
    phoenix_feather: { id:'phoenix_feather', name:'凤凰翎',   slot:'accessory', rarity:5, stats:{int:45,spd:15,hp:150},emoji:'' },
    // -- MOUNTS --
    old_horse:    { id:'old_horse',    name:'老马',       slot:'mount', rarity:1, stats:{spd:5},               emoji:'' },
    donkey:       { id:'donkey',       name:'驴',         slot:'mount', rarity:1, stats:{spd:3,hp:30},         emoji:'' },
    war_horse:    { id:'war_horse',    name:'战马',       slot:'mount', rarity:2, stats:{spd:8,hp:40},         emoji:'' },
    swift_horse:  { id:'swift_horse',  name:'骏马',       slot:'mount', rarity:2, stats:{spd:10},              emoji:'' },
    shadow_steed: { id:'shadow_steed', name:'乌骓',       slot:'mount', rarity:3, stats:{spd:14,atk:8},        emoji:'' },
    dayuan_horse: { id:'dayuan_horse', name:'大宛马',     slot:'mount', rarity:3, stats:{spd:16,hp:80},        emoji:'' },
    dilu:         { id:'dilu',         name:'的卢',       slot:'mount', rarity:4, stats:{spd:22,hp:120,def:8}, emoji:'' },
    jueying:      { id:'jueying',      name:'绝影',       slot:'mount', rarity:4, stats:{spd:25,atk:10},       emoji:'' },
    red_hare:     { id:'red_hare',     name:'赤兔',       slot:'mount', rarity:5, stats:{spd:35,atk:20,hp:150},emoji:'' },
    claw_yellow:  { id:'claw_yellow',  name:'爪黄飞电',   slot:'mount', rarity:5, stats:{spd:30,def:15,hp:200},emoji:'' },
    // -- SET: LONGDAN --
    longdan_weapon:    { id:'longdan_weapon',    name:'龙胆·亮银枪', slot:'weapon',    rarity:4, stats:{atk:45,spd:8},          set:'longdan', emoji:'' },
    longdan_armor:     { id:'longdan_armor',     name:'龙胆·银鳞甲', slot:'armor',     rarity:4, stats:{def:30,hp:150,atk:10},  set:'longdan', emoji:'' },
    longdan_accessory: { id:'longdan_accessory', name:'龙胆·龙魂珠', slot:'accessory', rarity:4, stats:{atk:15,int:10,hp:80},   set:'longdan', emoji:'' },
    longdan_mount:     { id:'longdan_mount',     name:'龙胆·白龙驹', slot:'mount',     rarity:4, stats:{spd:20,atk:12},         set:'longdan', emoji:'' },
    // -- SET: FENGYI --
    fengyi_weapon:    { id:'fengyi_weapon',    name:'凤翼·羽扇',   slot:'weapon',    rarity:4, stats:{atk:20,int:30},         set:'fengyi', emoji:'' },
    fengyi_armor:     { id:'fengyi_armor',     name:'凤翼·鹤氅',   slot:'armor',     rarity:4, stats:{def:25,hp:120,int:15},  set:'fengyi', emoji:'' },
    fengyi_accessory: { id:'fengyi_accessory', name:'凤翼·八卦盘', slot:'accessory', rarity:4, stats:{int:35,spd:5},          set:'fengyi', emoji:'' },
    fengyi_mount:     { id:'fengyi_mount',     name:'凤翼·翔鹤',   slot:'mount',     rarity:4, stats:{spd:18,int:12},         set:'fengyi', emoji:'' },
    // -- SET: XUANJIA --
    xuanjia_weapon:    { id:'xuanjia_weapon',    name:'玄甲·重锤',   slot:'weapon',    rarity:4, stats:{atk:30,def:15},         set:'xuanjia', emoji:'' },
    xuanjia_armor:     { id:'xuanjia_armor',     name:'玄甲·铁壁',   slot:'armor',     rarity:4, stats:{def:50,hp:250},         set:'xuanjia', emoji:'' },
    xuanjia_accessory: { id:'xuanjia_accessory', name:'玄甲·铁盾章', slot:'accessory', rarity:4, stats:{def:20,hp:120},         set:'xuanjia', emoji:'' },
    xuanjia_mount:     { id:'xuanjia_mount',     name:'玄甲·铁蹄',   slot:'mount',     rarity:4, stats:{spd:12,def:15,hp:100}, set:'xuanjia', emoji:'' },
  },
  DROP_TABLES: {
    1:  { maxRarity:2, dropChance:0.40, setChance:0    },
    2:  { maxRarity:3, dropChance:0.45, setChance:0.02 },
    3:  { maxRarity:3, dropChance:0.50, setChance:0.05 },
    4:  { maxRarity:4, dropChance:0.55, setChance:0.08 },
    5:  { maxRarity:4, dropChance:0.60, setChance:0.10 },
    6:  { maxRarity:5, dropChance:0.65, setChance:0.12 },
    7:  { maxRarity:5, dropChance:0.68, setChance:0.14 },
    8:  { maxRarity:5, dropChance:0.72, setChance:0.16 },
    9:  { maxRarity:5, dropChance:0.75, setChance:0.18 },
    10: { maxRarity:5, dropChance:0.80, setChance:0.20 },
  },
};

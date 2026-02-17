// 三国·天命 — Equipment + Kingdom + Achievement Systems

// ===== EQUIPMENT SYSTEM =====
const Equipment = {
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
      bonuses: {
        2: { name: '龙胆·双', desc: 'ATK+15%', stats: { atk_pct: 15 } },
        4: { name: '龙胆·全', desc: '暴击率+25%', stats: { crit_pct: 25 } },
      }
    },
    fengyi: {
      name: '凤翼套装', desc: 'INT专精·Phoenix Wing',
      pieces: ['fengyi_weapon','fengyi_armor','fengyi_accessory','fengyi_mount'],
      bonuses: {
        2: { name: '凤翼·双', desc: 'INT+15%', stats: { int_pct: 15 } },
        4: { name: '凤翼·全', desc: '技能伤害+30%', stats: { skill_dmg_pct: 30 } },
      }
    },
    xuanjia: {
      name: '玄甲套装', desc: 'DEF专精·Dark Armor',
      pieces: ['xuanjia_weapon','xuanjia_armor','xuanjia_accessory','xuanjia_mount'],
      bonuses: {
        2: { name: '玄甲·双', desc: 'DEF+15%', stats: { def_pct: 15 } },
        4: { name: '玄甲·全', desc: '反弹15%伤害', stats: { reflect_pct: 15 } },
      }
    },
  },

  // ===== EQUIPMENT TEMPLATES =====
  TEMPLATES: {
    // ── WEAPONS ──
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

    // ── ARMOR ──
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

    // ── ACCESSORIES ──
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

    // ── MOUNTS ──
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

    // ── SET: 龙胆 (Dragon Lance) — ATK focus ──
    longdan_weapon:    { id:'longdan_weapon',    name:'龙胆·亮银枪', slot:'weapon',    rarity:4, stats:{atk:45,spd:8},          set:'longdan', emoji:'' },
    longdan_armor:     { id:'longdan_armor',     name:'龙胆·银鳞甲', slot:'armor',     rarity:4, stats:{def:30,hp:150,atk:10},  set:'longdan', emoji:'' },
    longdan_accessory: { id:'longdan_accessory', name:'龙胆·龙魂珠', slot:'accessory', rarity:4, stats:{atk:15,int:10,hp:80},   set:'longdan', emoji:'' },
    longdan_mount:     { id:'longdan_mount',     name:'龙胆·白龙驹', slot:'mount',     rarity:4, stats:{spd:20,atk:12},         set:'longdan', emoji:'' },

    // ── SET: 凤翼 (Phoenix Wing) — INT focus ──
    fengyi_weapon:    { id:'fengyi_weapon',    name:'凤翼·羽扇',   slot:'weapon',    rarity:4, stats:{atk:20,int:30},         set:'fengyi', emoji:'' },
    fengyi_armor:     { id:'fengyi_armor',     name:'凤翼·鹤氅',   slot:'armor',     rarity:4, stats:{def:25,hp:120,int:15},  set:'fengyi', emoji:'' },
    fengyi_accessory: { id:'fengyi_accessory', name:'凤翼·八卦盘', slot:'accessory', rarity:4, stats:{int:35,spd:5},          set:'fengyi', emoji:'' },
    fengyi_mount:     { id:'fengyi_mount',     name:'凤翼·翔鹤',   slot:'mount',     rarity:4, stats:{spd:18,int:12},         set:'fengyi', emoji:'' },

    // ── SET: 玄甲 (Dark Armor) — DEF focus ──
    xuanjia_weapon:    { id:'xuanjia_weapon',    name:'玄甲·重锤',   slot:'weapon',    rarity:4, stats:{atk:30,def:15},         set:'xuanjia', emoji:'' },
    xuanjia_armor:     { id:'xuanjia_armor',     name:'玄甲·铁壁',   slot:'armor',     rarity:4, stats:{def:50,hp:250},         set:'xuanjia', emoji:'' },
    xuanjia_accessory: { id:'xuanjia_accessory', name:'玄甲·铁盾章', slot:'accessory', rarity:4, stats:{def:20,hp:120},         set:'xuanjia', emoji:'' },
    xuanjia_mount:     { id:'xuanjia_mount',     name:'玄甲·铁蹄',   slot:'mount',     rarity:4, stats:{spd:12,def:15,hp:100}, set:'xuanjia', emoji:'' },
  },

  // Drop tables per chapter
  DROP_TABLES: {
    1: { maxRarity:2, dropChance:0.40, setChance:0    },
    2: { maxRarity:3, dropChance:0.45, setChance:0.02 },
    3: { maxRarity:3, dropChance:0.50, setChance:0.05 },
    4: { maxRarity:4, dropChance:0.55, setChance:0.08 },
    5: { maxRarity:4, dropChance:0.60, setChance:0.10 },
    6: { maxRarity:5, dropChance:0.65, setChance:0.12 },
  },

  // Generate a drop from stage completion
  generateDrop(chapter, isBoss) {
    const table = this.DROP_TABLES[chapter] || this.DROP_TABLES[1];
    const chance = isBoss ? 1.0 : table.dropChance;
    if (Math.random() > chance) return null;
    const maxRar = isBoss ? Math.min(5, table.maxRarity + 1) : table.maxRarity;
    if (Math.random() < (isBoss ? table.setChance * 3 : table.setChance)) return this._rollSetPiece(maxRar);
    return this._rollNormal(maxRar);
  },

  _rollNormal(maxRarity) {
    const w = {1:50,2:30,3:15,4:4,5:1};
    const pool = [];
    for (let r = 1; r <= maxRarity; r++) for (let i = 0; i < w[r]; i++) pool.push(r);
    const rarity = pool[Math.floor(Math.random() * pool.length)];
    const templates = Object.values(this.TEMPLATES).filter(t => t.rarity === rarity && !t.set);
    if (!templates.length) return null;
    return this._createItem(templates[Math.floor(Math.random() * templates.length)].id);
  },

  _rollSetPiece(maxRarity) {
    const pieces = Object.values(this.TEMPLATES).filter(t => t.set && t.rarity <= maxRarity);
    if (!pieces.length) return this._rollNormal(maxRarity);
    return this._createItem(pieces[Math.floor(Math.random() * pieces.length)].id);
  },

  _createItem(templateId) {
    return {
      uid: 'eq_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
      templateId,
      level: 0,
    };
  },

  // Calculate gear score for an equipment instance
  getGearScore(item) {
    const stats = this.getEquipStats(item);
    const tmpl = this.TEMPLATES[item.templateId];
    if (!tmpl) return 0;
    // Weighted score: atk/int weighted higher, hp lower
    const weights = { atk: 3, int: 3, def: 2, spd: 2.5, hp: 0.3 };
    let score = 0;
    for (const [k, v] of Object.entries(stats)) {
      score += v * (weights[k] || 1);
    }
    // Rarity multiplier
    score *= (1 + (tmpl.rarity - 1) * 0.2);
    // Set bonus
    if (tmpl.set) score *= 1.15;
    return Math.floor(score);
  },

  // Get rarity color for a gear score range
  getScoreRarity(score) {
    if (score >= 400) return this.RARITIES[5]; // gold
    if (score >= 250) return this.RARITIES[4]; // purple
    if (score >= 150) return this.RARITIES[3]; // blue
    if (score >= 80) return this.RARITIES[2];  // green
    return this.RARITIES[1];                    // white
  },

  // Get stats of an equipment instance
  getEquipStats(item) {
    const t = this.TEMPLATES[item.templateId];
    if (!t) return {};
    const mult = 1 + item.level * 0.1;
    const stats = {};
    for (const [k,v] of Object.entries(t.stats)) stats[k] = Math.floor(v * mult);
    return stats;
  },

  // Get total equipment stats + set bonuses for a hero
  getHeroEquipmentStats(heroId) {
    const equipped = Storage.getEquipped(heroId);
    const totals = { atk:0, def:0, hp:0, int:0, spd:0 };
    const setPieceCounts = {};

    for (const slot of Object.keys(this.SLOTS)) {
      const uid = equipped[slot];
      if (!uid) continue;
      const item = Storage.getEquipmentByUid(uid);
      if (!item) continue;
      const stats = this.getEquipStats(item);
      for (const [k,v] of Object.entries(stats)) { if (k in totals) totals[k] += v; }
      const tmpl = this.TEMPLATES[item.templateId];
      if (tmpl?.set) setPieceCounts[tmpl.set] = (setPieceCounts[tmpl.set] || 0) + 1;
    }

    // Apply pct-based set bonuses to flat stats
    const activeBonuses = [];
    for (const [setId, count] of Object.entries(setPieceCounts)) {
      const setDef = this.SETS[setId];
      if (!setDef) continue;
      for (const [thresh, bonus] of Object.entries(setDef.bonuses)) {
        if (count >= parseInt(thresh)) {
          activeBonuses.push(bonus);
          if (bonus.stats.atk_pct) totals.atk = Math.floor(totals.atk * (1 + bonus.stats.atk_pct / 100));
          if (bonus.stats.def_pct) totals.def = Math.floor(totals.def * (1 + bonus.stats.def_pct / 100));
          if (bonus.stats.int_pct) totals.int = Math.floor(totals.int * (1 + bonus.stats.int_pct / 100));
        }
      }
    }
    return { stats: totals, activeBonuses, setPieceCounts };
  },

  // Get special battle effects from sets (crit, skill dmg, reflect)
  getHeroBattleEffects(heroId) {
    const equipped = Storage.getEquipped(heroId);
    const setCounts = {};
    for (const slot of Object.keys(this.SLOTS)) {
      const uid = equipped[slot];
      if (!uid) continue;
      const item = Storage.getEquipmentByUid(uid);
      if (!item) continue;
      const tmpl = this.TEMPLATES[item.templateId];
      if (tmpl?.set) setCounts[tmpl.set] = (setCounts[tmpl.set] || 0) + 1;
    }
    const fx = { crit_pct:0, skill_dmg_pct:0, reflect_pct:0 };
    for (const [setId, count] of Object.entries(setCounts)) {
      const setDef = this.SETS[setId];
      if (!setDef) continue;
      for (const [thresh, bonus] of Object.entries(setDef.bonuses)) {
        if (count >= parseInt(thresh) && bonus.stats) {
          if (bonus.stats.crit_pct)      fx.crit_pct      += bonus.stats.crit_pct;
          if (bonus.stats.skill_dmg_pct) fx.skill_dmg_pct += bonus.stats.skill_dmg_pct;
          if (bonus.stats.reflect_pct)   fx.reflect_pct   += bonus.stats.reflect_pct;
        }
      }
    }
    return fx;
  },

  // Enhance: consume material, +1 level
  enhance(equipUid, materialUid) {
    const inv = Storage.getEquipmentInventory();
    const equip    = inv.find(e => e.uid === equipUid);
    const material = inv.find(e => e.uid === materialUid);
    if (!equip || !material || equipUid === materialUid) return { error: '无效操作' };

    const tmpl = this.TEMPLATES[equip.templateId];
    const maxLvl = (tmpl?.rarity || 1) * 3;
    if (equip.level >= maxLvl) return { error: '已达最高强化等级 (+' + maxLvl + ')' };

    const sameTemplate = equip.templateId === material.templateId;
    // Remove material first
    const newInv = inv.filter(e => e.uid !== materialUid);

    if (!sameTemplate && Math.random() > 0.7) {
      Storage.saveEquipmentInventory(newInv);
      return { success: false, message: '强化失败！材料已消耗' };
    }

    const idx = newInv.findIndex(e => e.uid === equipUid);
    if (idx >= 0) newInv[idx].level++;
    Storage.saveEquipmentInventory(newInv);
    return { success: true, newLevel: newInv[idx]?.level || 1, message: '强化成功！+' + (newInv[idx]?.level || 1) };
  },

  // Equip item to hero slot
  equipToHero(heroId, equipUid) {
    const item = Storage.getEquipmentByUid(equipUid);
    if (!item) return { error: '装备不存在' };
    const tmpl = this.TEMPLATES[item.templateId];
    if (!tmpl) return { error: '模板不存在' };

    // Unequip from any other hero first
    const allHeroes = Object.keys(Storage.getRoster());
    for (const hid of allHeroes) {
      const eq = Storage.getEquipped(hid);
      for (const s of Object.keys(this.SLOTS)) {
        if (eq[s] === equipUid) { eq[s] = null; Storage.saveEquipped(hid, eq); }
      }
    }

    const equipped = Storage.getEquipped(heroId);
    equipped[tmpl.slot] = equipUid;
    Storage.saveEquipped(heroId, equipped);
    return { success: true, slot: tmpl.slot };
  },

  unequipFromHero(heroId, slot) {
    const equipped = Storage.getEquipped(heroId);
    const uid = equipped[slot];
    equipped[slot] = null;
    Storage.saveEquipped(heroId, equipped);
    return uid;
  },

  // Sell for gold
  sell(equipUid) {
    const item = Storage.getEquipmentByUid(equipUid);
    if (!item) return 0;
    const tmpl = this.TEMPLATES[item.templateId];
    const gold = (tmpl?.rarity || 1) * 25 * (1 + item.level);
    // Unequip from any hero
    const allHeroes = Object.keys(Storage.getRoster());
    for (const hid of allHeroes) {
      const eq = Storage.getEquipped(hid);
      for (const s of Object.keys(this.SLOTS)) {
        if (eq[s] === equipUid) { eq[s] = null; Storage.saveEquipped(hid, eq); }
      }
    }
    const inv = Storage.getEquipmentInventory().filter(e => e.uid !== equipUid);
    Storage.saveEquipmentInventory(inv);
    Storage.addGold(gold);
    return gold;
  },
};


// ===== KINGDOM SYSTEM =====
const KingdomSystem = {
  KINGDOMS: {
    shu: { name:'蜀汉', faction:'shu', color:'#22c55e', emoji:'', banner:'龙', desc:'仁义之师，匡扶汉室', buff:'蜀阵营武将全属性+10%' },
    wei: { name:'曹魏', faction:'wei', color:'#3b82f6', emoji:'', banner:'鹰', desc:'唯才是举，雄霸天下', buff:'魏阵营武将全属性+10%' },
    wu:  { name:'东吴', faction:'wu',  color:'#ef4444', emoji:'', banner:'虎', desc:'据江东之固，观天下变', buff:'吴阵营武将全属性+10%' },
    qun: { name:'群雄', faction:'qun', color:'#a855f7', emoji:'', banner:'狼', desc:'群雄逐鹿，各为其主', buff:'群阵营武将全属性+10%' },
  },

  // Simulated weekly kingdom war (seeded random, same as leaderboard approach)
  getKingdomWar() {
    const week = Leaderboard.getWeekNumber();
    const rng = Leaderboard.seededRandom(week * 1301);
    const totals = { shu:0, wei:0, wu:0, qun:0 };
    // Simulate 200 "players" across kingdoms
    const kIds = Object.keys(totals);
    for (let i = 0; i < 200; i++) {
      const k = kIds[Math.floor(rng() * kIds.length)];
      totals[k] += Math.floor(500 + rng() * 5000);
    }
    // Add real player power to their kingdom
    const playerKingdom = Storage.getKingdom();
    if (playerKingdom) {
      totals[playerKingdom] += Leaderboard.getPlayerPower();
    }
    // Sort by total power
    const ranked = kIds.map(k => ({ id: k, ...this.KINGDOMS[k], power: totals[k] }))
      .sort((a, b) => b.power - a.power);
    ranked.forEach((k, i) => k.rank = i + 1);
    return ranked;
  },
};


// ===== ACHIEVEMENT SYSTEM =====
const Achievements = {
  DEFS: [
    { id:'first_stage',    name:'初出茅庐',       desc:'通关第一个关卡',     icon:'battle',  reward:{ gold:200 } },
    { id:'first_destiny',  name:'天命之选',       desc:'做出第一个天命抉择', icon:'skill',  reward:{ gems:10 } },
    { id:'first_recruit',  name:'招贤纳士',       desc:'从求贤馆招募第一位武将', icon:'scroll', reward:{ gold:300 } },
    { id:'collect_5',      name:'五虎上将',       desc:'拥有5名武将',        icon:'passive',  reward:{ gems:15 } },
    { id:'collect_10',     name:'千军万马',       desc:'拥有10名武将',       icon:'lock',  reward:{ gems:30, shards:{ zhaoyun:5 } } },
    { id:'clear_ch1',      name:'黄巾终结者',     desc:'通关第一章',         icon:'upgrade',  reward:{ gold:500, gems:5 } },
    { id:'clear_ch2',      name:'虎牢之主',       desc:'通关第二章',         icon:'stats',  reward:{ gold:800, gems:10 } },
    { id:'clear_ch3',      name:'赤壁之英',       desc:'通关第三章',         icon:'battle',  reward:{ gold:1200, gems:15 } },
    { id:'clear_ch4',      name:'五丈原的继承者', desc:'通关第四章',         icon:'scroll',  reward:{ gold:1800, gems:20 } },
    { id:'clear_ch5',      name:'夷陵之焰',       desc:'通关第五章',         icon:'tree',  reward:{ gold:2500, gems:25 } },
    { id:'clear_ch6',      name:'北伐大业',       desc:'通关第六章',         icon:'stats',  reward:{ gold:5000, gems:50 } },
    { id:'level_10',       name:'初露锋芒',       desc:'玩家等级达到10级',   icon:'upgrade',  reward:{ gold:400 } },
    { id:'level_20',       name:'百战之将',       desc:'玩家等级达到20级',   icon:'trophy',  reward:{ gems:20, shards:{ guanyu:5 } } },
    { id:'win_50',         name:'常胜将军',       desc:'累计赢得50场战斗',   icon:'trophy',  reward:{ gold:1000 } },
    { id:'win_100',        name:'不败之师',       desc:'累计赢得100场战斗',  icon:'trophy',  reward:{ gems:30, shards:{ lvbu:3 } } },
    { id:'first_equip',    name:'披挂上阵',       desc:'为武将穿戴第一件装备', icon:'equip', reward:{ gold:200 } },
    { id:'set_longdan',    name:'龙胆之力',       desc:'集齐龙胆套装4件',     icon:'skill', reward:{ gems:25 } },
    { id:'set_fengyi',     name:'凤翼之风',       desc:'集齐凤翼套装4件',     icon:'battle', reward:{ gems:25 } },
    { id:'set_xuanjia',    name:'玄甲之壁',       desc:'集齐玄甲套装4件',     icon:'passive', reward:{ gems:25 } },
    { id:'pick_kingdom',   name:'效忠之心',       desc:'选择势力阵营',       icon:'lock',  reward:{ gold:500, gems:10 } },
  ],

  // Check all achievements and return newly completed ones
  checkAll() {
    const state = Storage.getAchievementState();
    const p = Storage.getPlayer();
    const progress = Storage.getCampaignProgress();
    const roster = Storage.getRoster();
    const stats = Storage.getBattleStats();
    const kingdom = Storage.getKingdom();
    const rosterCount = Object.keys(roster).length;
    const totalStages = (progress.chapter - 1) * 10 + progress.stage;
    const hasChoices = Object.keys(progress.choices || {}).length > 0;

    const conditions = {
      first_stage:    totalStages > 1,
      first_destiny:  hasChoices,
      first_recruit:  rosterCount > 2,
      collect_5:      rosterCount >= 5,
      collect_10:     rosterCount >= 10,
      clear_ch1:      progress.chapter >= 2 || (progress.chapter === 1 && progress.stage > 10),
      clear_ch2:      progress.chapter >= 3 || (progress.chapter === 2 && progress.stage > 10),
      clear_ch3:      progress.chapter >= 4 || (progress.chapter === 3 && progress.stage > 10),
      clear_ch4:      progress.chapter >= 5 || (progress.chapter === 4 && progress.stage > 10),
      clear_ch5:      progress.chapter >= 6 || (progress.chapter === 5 && progress.stage > 10),
      clear_ch6:      progress.chapter > 6  || (progress.chapter === 6 && progress.stage > 10),
      level_10:       p.level >= 10,
      level_20:       p.level >= 20,
      win_50:         stats.wins >= 50,
      win_100:        stats.wins >= 100,
      first_equip:    this._anyHeroHasEquipment(),
      set_longdan:    this._hasFullSet('longdan'),
      set_fengyi:     this._hasFullSet('fengyi'),
      set_xuanjia:    this._hasFullSet('xuanjia'),
      pick_kingdom:   !!kingdom,
    };

    const newlyCompleted = [];
    for (const def of this.DEFS) {
      if (state.unlocked[def.id]) continue;
      if (conditions[def.id]) {
        state.unlocked[def.id] = { completed: true, claimed: false, time: Date.now() };
        newlyCompleted.push(def);
      }
    }
    if (newlyCompleted.length > 0) Storage.saveAchievementState(state);
    return newlyCompleted;
  },

  // Claim reward for a completed achievement
  claim(id) {
    const state = Storage.getAchievementState();
    const entry = state.unlocked[id];
    if (!entry || entry.claimed) return false;
    const def = this.DEFS.find(d => d.id === id);
    if (!def) return false;

    entry.claimed = true;
    if (def.reward.gold) Storage.addGold(def.reward.gold);
    if (def.reward.gems) Storage.addGems(def.reward.gems);
    if (def.reward.shards) {
      for (const [heroId, n] of Object.entries(def.reward.shards)) Storage.addShards(heroId, n);
    }
    Storage.saveAchievementState(state);
    return true;
  },

  getState() { return Storage.getAchievementState(); },

  _anyHeroHasEquipment() {
    const roster = Storage.getRoster();
    for (const hid of Object.keys(roster)) {
      const eq = Storage.getEquipped(hid);
      if (Object.values(eq).some(v => v)) return true;
    }
    return false;
  },

  _hasFullSet(setId) {
    const inv = Storage.getEquipmentInventory();
    const needed = Equipment.SETS[setId]?.pieces || [];
    const owned = new Set(inv.map(e => e.templateId));
    return needed.every(p => owned.has(p));
  },
};


if (typeof window !== 'undefined') {
  window.Equipment = Equipment;
  window.KingdomSystem = KingdomSystem;
  window.Achievements = Achievements;
}

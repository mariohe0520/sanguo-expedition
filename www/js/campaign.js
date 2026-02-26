// 三国·天命 — Campaign / Stages
const Campaign = {
  CHAPTERS: [
    {
      id: 1, name: '黄巾之乱', icon: '黄', terrain: 'plains', weather: 'clear',
      desc: '苍天已死，黄天当立。乱世之始。',
      stages: [
        { id: 1, name: '颍川遭遇', enemies: ['soldier','soldier','archer_recruit'], reward: { gold: 100, exp: 50 }, tutorial: 'basic' },
        { id: 2, name: '黄巾先锋', enemies: ['soldier','soldier','soldier'], reward: { gold: 120, exp: 60 }, tutorial: 'counter' },
        { id: 3, name: '广宗之围', enemies: ['soldier','archer_recruit','soldier','archer_recruit'], reward: { gold: 150, exp: 80 } },
        { id: 4, name: '精锐小队', enemies: ['soldier','soldier','archer_recruit','soldier'], reward: { gold: 180, exp: 100 }, elite: true },
        { id: 5, name: '张角降临', enemies: ['soldier','soldier','zhangjiao','soldier','archer_recruit'], boss: true, reward: { gold: 300, exp: 200, hero_shard: 'zhangjiao' } },
        // --- 天命抉择 #1: 救卢植？---
        { id: 6, name: '南阳追击', enemies: ['soldier','soldier','soldier','archer_recruit','soldier'], reward: { gold: 200, exp: 120 }, branch: 'A' },
        { id: 7, name: '汝南设伏', enemies: ['archer_recruit','soldier','archer_recruit','soldier','archer_recruit'], reward: { gold: 220, exp: 130 }, branch: 'A' },
        { id: 8, name: '陈留守城', enemies: ['soldier','soldier','soldier','soldier','soldier'], reward: { gold: 200, exp: 120 }, terrain: 'castle', branch: 'B' },
        { id: 9, name: '曹操来袭', enemies: ['soldier','archer_recruit','soldier','soldier','archer_recruit'], reward: { gold: 250, exp: 150 }, branch: 'B' },
        { id: 10, name: '张宝复仇', enemies: ['soldier','archer_recruit','zhangjiao','soldier','soldier'], boss: true, reward: { gold: 500, exp: 300, hero_shard: 'huangzhong' } },
      ]
    },
    {
      id: 2, name: '虎牢关', icon: '虎', terrain: 'mountain', weather: 'clear',
      desc: '三英战吕布，天下震动。',
      stages: [
        { id: 1, name: '山道遭伏', enemies: ['soldier','archer_recruit','shield_militia','soldier'], reward: { gold: 200, exp: 100 } },
        { id: 2, name: '汜水关前哨', enemies: ['elite_spear','soldier','archer_recruit','shield_militia'], reward: { gold: 230, exp: 120 } },
        { id: 3, name: '华雄逞威', enemies: ['elite_cavalry','soldier','elite_spear','archer_recruit','mage_acolyte'], reward: { gold: 280, exp: 150 } },
        { id: 4, name: '温酒斩华雄', enemies: ['elite_cavalry','elite_spear','shield_militia','mage_acolyte','soldier'], reward: { gold: 320, exp: 180 }, elite: true },
        { id: 5, name: '吕布出阵', enemies: ['elite_cavalry','elite_spear','lvbu','shield_militia','mage_acolyte'], boss: true, reward: { gold: 500, exp: 300 } },
        // --- 天命抉择 #2: 救百姓还是追吕布？---
        { id: 6, name: '烽烟救民', enemies: ['soldier','mage_acolyte','shield_militia','archer_recruit','soldier'], reward: { gold: 350, exp: 220 }, terrain: 'mountain', branch: 'A' },
        { id: 7, name: '掩护撤离', enemies: ['elite_spear','shield_militia','mage_acolyte','elite_cavalry','archer_recruit'], reward: { gold: 400, exp: 260 }, branch: 'A' },
        { id: 8, name: '追击吕布', enemies: ['elite_cavalry','elite_cavalry','elite_spear','mage_acolyte','soldier'], reward: { gold: 380, exp: 240 }, branch: 'B' },
        { id: 9, name: '虎牢关外', enemies: ['elite_spear','elite_cavalry','shield_militia','mage_acolyte','elite_spear'], reward: { gold: 450, exp: 280 }, branch: 'B' },
        { id: 10, name: '三英战吕布', enemies: ['elite_cavalry','elite_spear','lvbu','mage_acolyte','elite_cavalry'], boss: true, reward: { gold: 800, exp: 500, hero_shard: 'lvbu' } },
      ]
    },
    {
      id: 3, name: '赤壁', icon: '赤', terrain: 'river', weather: 'fog',
      desc: '东风起，火烧连环。天下三分之战。',
      stages: [
        // --- 浓雾笼江 (stages 21-24, fog) ---
        { id: 1, name: '赤壁前哨', enemies: ['navy_soldier','soldier','navy_soldier','archer_recruit'], reward: { gold: 800, exp: 500 }, weather: 'fog' },
        { id: 2, name: '江上巡逻', enemies: ['navy_soldier','fire_archer','navy_soldier','soldier'], reward: { gold: 850, exp: 550 }, weather: 'fog' },
        { id: 3, name: '水寨突袭', enemies: ['navy_soldier','fire_archer','navy_soldier','fire_archer'], reward: { gold: 900, exp: 600 }, weather: 'fog' },
        { id: 4, name: '雾中伏击', enemies: ['fire_archer','navy_soldier','fire_archer','navy_soldier','fire_archer'], reward: { gold: 950, exp: 650 }, weather: 'fog', elite: true },
        // --- 东风渐起 (stages 25-30, wind) ---
        { id: 5, name: '曹仁守江', enemies: ['navy_soldier','elite_spear','caoren','fire_archer','shield_militia'], boss: true, reward: { gold: 1100, exp: 750 }, weather: 'wind' },
        // --- 天命抉择 #3: 火攻还是水路封锁？---
        { id: 6, name: '火船冲阵', enemies: ['fire_archer','fire_archer','navy_soldier','fire_archer','navy_soldier'], reward: { gold: 1050, exp: 700 }, weather: 'wind', branch: 'A' },
        { id: 7, name: '烈焰焚江', enemies: ['fire_archer','fire_archer','navy_soldier','fire_archer','fire_archer'], reward: { gold: 1150, exp: 780 }, weather: 'wind', branch: 'A' },
        { id: 8, name: '水路封锁', enemies: ['navy_soldier','navy_soldier','elite_spear','navy_soldier','shield_militia'], reward: { gold: 1050, exp: 700 }, weather: 'wind', branch: 'B' },
        { id: 9, name: '铁索困敌', enemies: ['navy_soldier','elite_spear','navy_soldier','shield_militia','navy_soldier'], reward: { gold: 1150, exp: 780 }, weather: 'wind', branch: 'B' },
        { id: 10, name: '曹操败走', enemies: ['elite_cavalry','fire_archer','caocao','elite_spear','navy_soldier'], boss: true, reward: { gold: 1500, exp: 1000, hero_shard: 'zhouyu' }, weather: 'wind', mechanic: 'retreat', retreat_hp_pct: 20 },
      ]
    },
    {
      id: 4, name: '五丈原', icon: '五', terrain: 'plains', weather: 'clear',
      desc: '出师未捷身先死，长使英雄泪满襟。',
      stages: [
        { id: 1, name: '五丈原前哨', enemies: ['strategist','soldier','crossbow_corps','soldier'], reward: { gold: 1500, exp: 1000 } },
        { id: 2, name: '渭水之畔', enemies: ['elite_spear','strategist','crossbow_corps','soldier'], reward: { gold: 1600, exp: 1080 } },
        { id: 3, name: '木牛流马', enemies: ['crossbow_corps','strategist','elite_spear','crossbow_corps'], reward: { gold: 1700, exp: 1160 } },
        { id: 4, name: '上方谷诱敌', enemies: ['strategist','crossbow_corps','elite_cavalry','strategist','crossbow_corps'], reward: { gold: 1800, exp: 1250 }, elite: true, fog_of_war: true },
        { id: 5, name: '司马拒战', enemies: ['crossbow_corps','strategist','simayi','elite_spear','strategist'], boss: true, reward: { gold: 2000, exp: 1400 } },
        // --- 天命抉择 #4: 孔明遗计还是正面强攻？---
        { id: 6, name: '孔明遗计', enemies: ['strategist','crossbow_corps','strategist','fire_archer','crossbow_corps'], reward: { gold: 1900, exp: 1300 }, fog_of_war: true, branch: 'A' },
        { id: 7, name: '星落秋风', enemies: ['strategist','fire_archer','strategist','crossbow_corps','strategist'], reward: { gold: 2050, exp: 1420 }, fog_of_war: true, branch: 'A' },
        { id: 8, name: '正面强攻', enemies: ['elite_cavalry','crossbow_corps','elite_spear','crossbow_corps','elite_cavalry'], reward: { gold: 1900, exp: 1300 }, branch: 'B' },
        { id: 9, name: '铁壁突破', enemies: ['elite_spear','crossbow_corps','elite_cavalry','strategist','crossbow_corps'], reward: { gold: 2050, exp: 1420 }, branch: 'B' },
        { id: 10, name: '司马懿决战', enemies: ['strategist','crossbow_corps','simayi','elite_cavalry','strategist'], boss: true, reward: { gold: 2500, exp: 1800, hero_shard: 'simayi' }, mechanic: 'mirror' },
      ]
    },
    {
      id: 5, name: '夷陵之战', icon: '夷', terrain: 'forest', weather: 'wind',
      desc: '为关羽报仇，蜀军倾巢东征。七百里连营，烈火将至。',
      stages: [
        { id: 1, name: '秭归集结', enemies: ['fire_soldier','soldier','fire_soldier','elite_spear'], reward: { gold: 2800, exp: 2000 }, weather: 'clear' },
        { id: 2, name: '林中遭伏', enemies: ['fire_soldier','fire_archer','fire_soldier','soldier'], reward: { gold: 3000, exp: 2100 }, weather: 'wind' },
        { id: 3, name: '连营推进', enemies: ['fire_soldier','elite_spear','fire_archer','fire_soldier','soldier'], reward: { gold: 3200, exp: 2250 }, weather: 'wind' },
        { id: 4, name: '密林苦战', enemies: ['fire_archer','fire_soldier','fire_archer','fire_soldier','fire_archer'], reward: { gold: 3400, exp: 2400 }, weather: 'wind', elite: true },
        { id: 5, name: '陆逊坚守', enemies: ['fire_soldier','fire_archer','luXun','fire_soldier','navy_soldier'], boss: true, reward: { gold: 3800, exp: 2700 }, weather: 'wind', mechanic: 'fire_burn' },
        // --- 天命抉择 #5: 复仇还是放下？---
        { id: 6, name: '怒火攻心', enemies: ['fire_soldier','fire_archer','elite_cavalry','fire_soldier','fire_archer'], reward: { gold: 3600, exp: 2550 }, weather: 'wind', branch: 'A' },
        { id: 7, name: '七百里烈焰', enemies: ['fire_archer','fire_soldier','fire_archer','fire_soldier','fire_archer'], reward: { gold: 3900, exp: 2800 }, weather: 'wind', branch: 'A' },
        { id: 8, name: '白帝托孤', enemies: ['elite_spear','soldier','shield_militia','elite_spear','soldier'], reward: { gold: 3600, exp: 2550 }, weather: 'clear', branch: 'B' },
        { id: 9, name: '蜀军重整', enemies: ['elite_cavalry','elite_spear','strategist','crossbow_corps','elite_spear'], reward: { gold: 3900, exp: 2800 }, weather: 'clear', branch: 'B' },
        { id: 10, name: '夷陵决战', enemies: ['fire_archer','fire_soldier','luXun','fire_soldier','fire_archer'], boss: true, reward: { gold: 5000, exp: 3500, hero_shard: 'luXun' }, weather: 'wind', mechanic: 'fire_burn' },
      ]
    },
    {
      id: 6, name: '北伐', icon: '北', terrain: 'mountain', weather: 'clear',
      desc: '丞相遗志，九伐中原。粮草为命，山道为棺。',
      stages: [
        { id: 1, name: '汉中出师', enemies: ['supply_guard','strategist','crossbow_corps','soldier'], reward: { gold: 4200, exp: 3000 }, mechanic: 'supply_drain' },
        { id: 2, name: '祁山道', enemies: ['elite_spear','supply_guard','crossbow_corps','strategist'], reward: { gold: 4500, exp: 3200 }, mechanic: 'supply_drain' },
        { id: 3, name: '街亭危机', enemies: ['elite_cavalry','crossbow_corps','strategist','elite_spear','supply_guard'], reward: { gold: 4800, exp: 3400 }, mechanic: 'supply_drain' },
        { id: 4, name: '粮道争夺', enemies: ['supply_guard','crossbow_corps','supply_guard','elite_cavalry','crossbow_corps'], reward: { gold: 5100, exp: 3600 }, mechanic: 'supply_drain', elite: true },
        { id: 5, name: '司马懿拒战', enemies: ['strategist','crossbow_corps','simayi','supply_guard','strategist'], boss: true, reward: { gold: 5500, exp: 4000 }, mechanic: 'supply_drain' },
        // --- 天命抉择 #6: 木牛流马还是全面进攻？---
        { id: 6, name: '木牛流马', enemies: ['supply_guard','elite_spear','crossbow_corps','supply_guard','strategist'], reward: { gold: 5200, exp: 3800 }, mechanic: 'supply_drain', branch: 'A' },
        { id: 7, name: '栈道运粮', enemies: ['crossbow_corps','supply_guard','strategist','crossbow_corps','supply_guard'], reward: { gold: 5600, exp: 4100 }, mechanic: 'supply_drain', branch: 'A' },
        { id: 8, name: '铁骑突阵', enemies: ['elite_cavalry','elite_cavalry','crossbow_corps','elite_spear','elite_cavalry'], reward: { gold: 5200, exp: 3800 }, mechanic: 'supply_drain', branch: 'B' },
        { id: 9, name: '中原会战', enemies: ['elite_spear','crossbow_corps','elite_cavalry','strategist','elite_spear'], reward: { gold: 5600, exp: 4100 }, mechanic: 'supply_drain', branch: 'B' },
        { id: 10, name: '司马懿终战', enemies: ['strategist','crossbow_corps','simayi','elite_cavalry','strategist'], boss: true, reward: { gold: 7000, exp: 5000, hero_shard: 'jiangwei' }, mechanic: 'supply_drain', boss_enhanced: { mirror: true, teleport: true } },
      ]
    },
    {
      id: 7, name: '官渡之战', icon: '官', terrain: 'plains', weather: 'clear',
      desc: '曹操以少胜多，奇袭乌巢，大破袁绍。天下归魏之始。',
      stages: [
        { id: 1, name: '白马之围', enemies: ['elite_spear','shield_militia','elite_spear','crossbow_corps'], reward: { gold: 5000, exp: 4000 } },
        { id: 2, name: '延津渡口', enemies: ['elite_cavalry','crossbow_corps','elite_spear','shield_militia'], reward: { gold: 5200, exp: 4200 } },
        { id: 3, name: '袁军前锋', enemies: ['elite_cavalry','elite_spear','crossbow_corps','shield_militia','strategist'], reward: { gold: 5500, exp: 4400 } },
        { id: 4, name: '粮道遭劫', enemies: ['supply_guard','crossbow_corps','elite_cavalry','supply_guard','crossbow_corps'], reward: { gold: 5800, exp: 4600 }, elite: true },
        { id: 5, name: '颜良文丑', enemies: ['elite_cavalry','elite_spear','yuanshao','crossbow_corps','strategist'], boss: true, reward: { gold: 6200, exp: 5000 } },
        // --- 天命抉择 #7: 火烧乌巢 vs 正面决战 ---
        { id: 6, name: '夜袭乌巢', enemies: ['supply_guard','crossbow_corps','supply_guard','shield_militia','supply_guard'], reward: { gold: 6500, exp: 5200 }, branch: 'A' },
        { id: 7, name: '火烧粮仓', enemies: ['supply_guard','elite_spear','strategist','supply_guard','crossbow_corps'], reward: { gold: 7000, exp: 5500 }, branch: 'A' },
        { id: 8, name: '正面列阵', enemies: ['elite_cavalry','elite_spear','crossbow_corps','elite_cavalry','strategist'], reward: { gold: 6500, exp: 5200 }, branch: 'B' },
        { id: 9, name: '中军突破', enemies: ['elite_spear','crossbow_corps','elite_cavalry','strategist','elite_spear'], reward: { gold: 7000, exp: 5500 }, branch: 'B' },
        { id: 10, name: '袁绍决战', enemies: ['elite_cavalry','strategist','yuanshao','crossbow_corps','elite_spear'], boss: true, reward: { gold: 8000, exp: 6000, hero_shard: 'guojia' } },
      ]
    },
    {
      id: 8, name: '合肥之战', icon: '合', terrain: 'castle', weather: 'clear',
      desc: '张辽威震逍遥津，八百骑破十万吴军。',
      stages: [
        { id: 1, name: '逍遥津前哨', enemies: ['navy_soldier','elite_spear','shield_militia','crossbow_corps'], reward: { gold: 7000, exp: 5500 } },
        { id: 2, name: '吴军渡河', enemies: ['navy_soldier','fire_archer','navy_soldier','elite_spear','shield_militia'], reward: { gold: 7400, exp: 5800 } },
        { id: 3, name: '八百骑出击', enemies: ['navy_soldier','crossbow_corps','fire_archer','navy_soldier','elite_spear'], reward: { gold: 7800, exp: 6100 } },
        { id: 4, name: '逍遥津混战', enemies: ['fire_archer','navy_soldier','fire_archer','shield_militia','crossbow_corps'], reward: { gold: 8200, exp: 6500 }, elite: true },
        { id: 5, name: '孙权亲征', enemies: ['navy_soldier','fire_archer','sunquan','elite_spear','shield_militia'], boss: true, reward: { gold: 9000, exp: 7000 } },
        // --- 天命抉择 #8: 死守城池 vs 主动出击 ---
        { id: 6, name: '城门死守', enemies: ['navy_soldier','fire_archer','navy_soldier','crossbow_corps','shield_militia'], reward: { gold: 9500, exp: 7200 }, terrain: 'castle', branch: 'A' },
        { id: 7, name: '瓮城伏兵', enemies: ['crossbow_corps','fire_archer','shield_militia','crossbow_corps','elite_spear'], reward: { gold: 10000, exp: 7500 }, terrain: 'castle', branch: 'A' },
        { id: 8, name: '出城突袭', enemies: ['elite_spear','fire_archer','navy_soldier','elite_spear','crossbow_corps'], reward: { gold: 9500, exp: 7200 }, branch: 'B' },
        { id: 9, name: '追击吴军', enemies: ['navy_soldier','fire_archer','navy_soldier','fire_archer','elite_spear'], reward: { gold: 10000, exp: 7500 }, branch: 'B' },
        { id: 10, name: '威震逍遥津', enemies: ['fire_archer','navy_soldier','sunquan','fire_archer','navy_soldier'], boss: true, reward: { gold: 12000, exp: 8000, hero_shard: 'pangde' } },
      ]
    },
    {
      id: 9, name: '定军山', icon: '定', terrain: 'mountain', weather: 'fog',
      desc: '黄忠斩夏侯渊，老将之威震汉中。',
      stages: [
        { id: 1, name: '阳平关', enemies: ['elite_spear','crossbow_corps','supply_guard','elite_cavalry'], reward: { gold: 10000, exp: 7000 }, weather: 'fog' },
        { id: 2, name: '山道伏击', enemies: ['elite_cavalry','strategist','crossbow_corps','elite_spear'], reward: { gold: 10500, exp: 7300 }, weather: 'fog' },
        { id: 3, name: '争夺高地', enemies: ['elite_spear','crossbow_corps','elite_cavalry','strategist','supply_guard'], reward: { gold: 11000, exp: 7700 }, weather: 'fog' },
        { id: 4, name: '粮草争夺', enemies: ['supply_guard','crossbow_corps','supply_guard','elite_cavalry','strategist'], reward: { gold: 11500, exp: 8000 }, weather: 'fog', elite: true },
        { id: 5, name: '夏侯渊列阵', enemies: ['elite_cavalry','crossbow_corps','xiahouyuan','strategist','elite_spear'], boss: true, reward: { gold: 12500, exp: 8500 }, weather: 'fog' },
        // --- 天命抉择 #9: 奇袭山顶 vs 围而不攻 ---
        { id: 6, name: '夜登山顶', enemies: ['elite_spear','strategist','crossbow_corps','elite_spear','supply_guard'], reward: { gold: 13000, exp: 8800 }, weather: 'fog', branch: 'A' },
        { id: 7, name: '居高临下', enemies: ['elite_cavalry','crossbow_corps','strategist','elite_cavalry','crossbow_corps'], reward: { gold: 14000, exp: 9200 }, weather: 'fog', branch: 'A' },
        { id: 8, name: '围困断粮', enemies: ['supply_guard','elite_spear','crossbow_corps','supply_guard','strategist'], reward: { gold: 13000, exp: 8800 }, weather: 'fog', branch: 'B' },
        { id: 9, name: '疲敌之计', enemies: ['strategist','crossbow_corps','elite_cavalry','strategist','elite_spear'], reward: { gold: 14000, exp: 9200 }, weather: 'fog', branch: 'B' },
        { id: 10, name: '斩将定军山', enemies: ['elite_cavalry','strategist','xiahouyuan','crossbow_corps','elite_cavalry'], boss: true, reward: { gold: 16000, exp: 10000, hero_shard: 'huangzhong' } },
      ]
    },
    {
      id: 10, name: '天下归一', icon: '终', terrain: 'mixed', weather: 'clear',
      desc: '最终章。三国归晋，天命已定。兴复汉室还是顺应天命？',
      stages: [
        { id: 1, name: '司马昭之心', enemies: ['strategist','elite_cavalry','crossbow_corps','elite_spear','shield_militia'], reward: { gold: 15000, exp: 9000 } },
        { id: 2, name: '铁骑南下', enemies: ['elite_cavalry','elite_cavalry','crossbow_corps','strategist','fire_archer'], reward: { gold: 16000, exp: 9500 } },
        { id: 3, name: '三路合围', enemies: ['elite_spear','navy_soldier','fire_archer','crossbow_corps','elite_cavalry'], reward: { gold: 17000, exp: 10000 } },
        { id: 4, name: '最后的抵抗', enemies: ['strategist','crossbow_corps','elite_cavalry','fire_archer','supply_guard','shield_militia'], reward: { gold: 18000, exp: 11000 }, elite: true },
        { id: 5, name: '司马昭出阵', enemies: ['elite_cavalry','strategist','simazhao','crossbow_corps','elite_spear'], boss: true, reward: { gold: 20000, exp: 12000 } },
        // --- 天命抉择 #10: 兴复汉室 vs 顺应天命 ---
        { id: 6, name: '复汉旗帜', enemies: ['elite_cavalry','fire_archer','strategist','crossbow_corps','elite_spear'], reward: { gold: 20000, exp: 12500 }, branch: 'A' },
        { id: 7, name: '光复之战', enemies: ['elite_spear','crossbow_corps','elite_cavalry','strategist','fire_archer','navy_soldier'], reward: { gold: 22000, exp: 13500 }, branch: 'A' },
        { id: 8, name: '顺天应命', enemies: ['strategist','elite_cavalry','crossbow_corps','shield_militia','supply_guard'], reward: { gold: 20000, exp: 12500 }, branch: 'B' },
        { id: 9, name: '新朝之序', enemies: ['elite_cavalry','strategist','crossbow_corps','fire_archer','elite_spear','shield_militia'], reward: { gold: 22000, exp: 13500 }, branch: 'B' },
        { id: 10, name: '天命终章', enemies: ['elite_cavalry','strategist','simazhao','crossbow_corps','fire_archer','elite_spear'], boss: true, reward: { gold: 25000, exp: 15000, hero_shard: 'simayi' }, boss_enhanced: { phases: 3, mirror: true, teleport: true, enrage: true } },
      ]
    }
  ],

  // 天命抉择
  DESTINY_CHOICES: {
    1: {
      trigger_after: 5, // After stage 5
      title: '天命之选：卢植之危',
      desc: '恩师卢植被押往洛阳受刑。你可以冒险去救，或趁乱南下扩张势力。',
      options: [
        { id: 'A', text: '救！恩师之恩不可忘', desc: '冒险营救卢植，获得忠义值和新武将线索', reward: { loyalty: 50, hero_hint: 'guanyu' }, stages: [6, 7] },
        { id: 'B', text: '先壮大自己再说', desc: '南下招兵买马，获得更多金币和兵力', reward: { gold: 500, troops: 100 }, stages: [8, 9] }
      ],
      lore: '选择塑造命运。没有对错，只有不同的三国。'
    },
    2: {
      trigger_after: 5, // After stage 5
      title: '天命之选：虎牢关之岔',
      desc: '吕布退走，关外百姓正遭劫掠。追击吕布可削其势，救助百姓可得民心。',
      options: [
        { id: 'A', text: '救！百姓为重', desc: '护送百姓撤离，获得民心值和名医线索', reward: { loyalty: 80, hero_hint: 'huatuo' }, stages: [6, 7] },
        { id: 'B', text: '追！斩草除根', desc: '穷追吕布，获得战利品和精锐装备', reward: { gold: 800, equip_hint: 'fangtian_halberd' }, stages: [8, 9] }
      ],
      lore: '仁者救人，勇者杀敌。虎牢关下，你的选择将改变天命。'
    },
    3: {
      trigger_after: 5, // After mini-boss 曹仁
      title: '天命之选：赤壁之谋',
      desc: '曹仁已退，曹军大营就在江对岸。周瑜献火攻之计，庞统献铁索连环。然火攻虽猛，江边百姓恐遭殃及。',
      options: [
        { id: 'A', text: '火攻！借东风焚尽曹船', desc: '火烧连环船，造成毁灭性打击，但沿江村落难免波及', reward: { atk_bonus: 30, karma: -20 }, stages: [6, 7] },
        { id: 'B', text: '水路封锁，困死曹军', desc: '切断补给水路，迫曹军不战自溃。耗时更长但保全百姓', reward: { loyalty: 100, def_bonus: 20 }, stages: [8, 9] }
      ],
      lore: '火光冲天还是静水流深？赤壁之上，仁与狠一念之间。'
    },
    4: {
      trigger_after: 5, // After mini-boss 司马懿
      title: '天命之选：五丈原的抉择',
      desc: '孔明病重，星落秋风五丈原。他留下最后一计，施展需燃尽自身生命之火。或可不用此计，以大军正面强攻。',
      options: [
        { id: 'A', text: '施孔明遗计，以命换胜', desc: '使用诸葛亮最后的计谋，威力惊人但主力武将损失大量HP', reward: { int_bonus: 40, hero_cost: { stat: 'hp', pct: -30 } }, stages: [6, 7] },
        { id: 'B', text: '正面强攻，堂堂正正', desc: '不靠奇谋，以绝对兵力碾压。战斗更难但无额外代价', reward: { atk_bonus: 25, gold: 1500 }, stages: [8, 9] }
      ],
      lore: '鞠躬尽瘁，死而后已。丞相的遗志，由你来完成。'
    },
    5: {
      trigger_after: 5, // After mini-boss 陆逊
      title: '天命之选：夷陵之火',
      desc: '关羽已逝，张飞遇害。刘备怒火中烧，率蜀军倾巢东征。陆逊坚守不出，七百里连营暴露在山林之间。是继续复仇的烈焰，还是收拾残局、守住蜀汉根基？',
      options: [
        { id: 'A', text: '复仇！关羽之仇不共戴天', desc: '全军猛攻，ATK+40但随机2名武将因负伤退出3场战斗', reward: { atk_bonus: 40, hero_disable: { count: 2, battles: 3 } }, stages: [6, 7] },
        { id: 'B', text: '放下，重建蜀汉', desc: '接受失去，凝聚人心。忠义+150，解锁特殊阵型「桃园阵」', reward: { loyalty: 150, unlock_formation: 'taoyuan_formation' }, stages: [8, 9] }
      ],
      lore: '烈火焚林还是落叶归根？夷陵之上，蜀汉的命运悬于一念。'
    },
    6: {
      trigger_after: 5, // After mini-boss 司马懿
      title: '天命之选：北伐的命脉',
      desc: '姜维继承丞相遗志北伐中原，然蜀道艰难，粮草补给成为最大瓶颈。木牛流马可保后勤无忧，全面进攻则可毕其功于一役——但粮尽之日便是败亡之时。',
      options: [
        { id: 'A', text: '木牛流马，稳扎稳打', desc: '建造木牛流马保障补给，金+2000，获得后勤增益', reward: { gold: 2000, logistics_buff: true }, stages: [6, 7] },
        { id: 'B', text: '全面进攻，一战定乾坤', desc: 'ATK+35，士气+50，但补给消耗翻倍', reward: { atk_bonus: 35, morale: 50, supply_penalty_multiplier: 2 }, stages: [8, 9] }
      ],
      lore: '兵马未动粮草先行。北伐之路，是稳如泰山还是破釜沉舟？'
    },
    7: {
      trigger_after: 5,
      title: '天命之选：乌巢之火',
      desc: '袁绍大军压境，兵力悬殊。许攸来降，献计奇袭乌巢粮仓。烧毁粮草可令袁军不战自溃，但也可凭曹军精锐正面击溃袁军主力。',
      options: [
        { id: 'A', text: '火烧乌巢，奇兵制胜', desc: '夜袭乌巢粮仓，釜底抽薪。获得大量金币和谋士增益', reward: { gold: 3000, int_bonus: 30 }, stages: [6, 7] },
        { id: 'B', text: '正面决战，以力破力', desc: '堂堂正正击溃袁军主力，ATK+35，获得精锐装备线索', reward: { atk_bonus: 35, equip_hint: 'guanyu_blade' }, stages: [8, 9] }
      ],
      lore: '以少胜多，是智者之道还是勇者之路？官渡一役，天下归属由此而定。'
    },
    8: {
      trigger_after: 5,
      title: '天命之选：合肥攻守',
      desc: '孙权十万大军兵临合肥城下，张辽仅有七千守军。是凭坚城死守消耗吴军，还是主动出击以攻代守？',
      options: [
        { id: 'A', text: '死守城池，以逸待劳', desc: '依托城防消耗吴军，DEF+40，获得铁壁增益', reward: { def_bonus: 40, loyalty: 120 }, stages: [6, 7] },
        { id: 'B', text: '主动出击，八百破十万', desc: '效仿张辽逍遥津之勇，ATK+35，SPD+20', reward: { atk_bonus: 35, spd_bonus: 20 }, stages: [8, 9] }
      ],
      lore: '守如磐石还是攻如烈火？合肥城下，勇气与智慧的终极抉择。'
    },
    9: {
      trigger_after: 5,
      title: '天命之选：定军山之策',
      desc: '夏侯渊据守定军山，地势险要。法正献策可夜袭山顶居高临下，黄忠请战正面猛攻。山路崎岖，奇袭风险与收益并存。',
      options: [
        { id: 'A', text: '奇袭山顶，居高临下', desc: '夜间攀登，占据制高点。INT+35，获得地形优势增益', reward: { int_bonus: 35, terrain_buff: 'mountain_advantage' }, stages: [6, 7] },
        { id: 'B', text: '围而不攻，断其粮道', desc: '切断补给，困死敌军。金+4000，获得后勤增益', reward: { gold: 4000, logistics_buff: true }, stages: [8, 9] }
      ],
      lore: '兵法云：攻其不备，出其不意。定军山上，老将黄忠的一刀将改写历史。'
    },
    10: {
      trigger_after: 5,
      title: '天命之选：天下归属',
      desc: '三国鼎立数十年，司马昭已掌魏国大权。蜀汉、东吴日薄西山。是举全力兴复汉室，逆天改命？还是顺应天命，让天下归于一统？这是最后的抉择。',
      options: [
        { id: 'A', text: '兴复汉室！逆天改命', desc: '燃尽一切，为汉室做最后一搏。全队ATK+50%但HP-20%', reward: { atk_bonus: 50, hero_cost: { stat: 'hp', pct: -20 } }, stages: [6, 7] },
        { id: 'B', text: '顺应天命，天下一统', desc: '放下执念，换取和平。忠义+200，全队DEF+30%', reward: { loyalty: 200, def_bonus: 30 }, stages: [8, 9] }
      ],
      lore: '天下大势，分久必合。但英雄之心，岂甘沉寂？最终之战，你的选择将决定这个时代的结局。'
    }
  },

  // Difficulty modes: multiply on top of chapter scaling
  DIFFICULTY_MODES: {
    normal: { scale: 1, name: '普通', icon: '⚔️', desc: '标准难度', unlockReq: null },
    elite: { scale: 2.0, name: '精英', icon: '🔥', desc: '敌人双倍属性，装备掉落+50%', unlockReq: 'clear_normal', rewardMult: 1.5 },
    hell: { scale: 3.5, name: '地狱', icon: '💀', desc: '敌人3.5倍+随机词缀，稀有掉落+100%', unlockReq: 'clear_elite', rewardMult: 2.0 },
  },

  // Enemy affixes for hell mode (random 1-2 per stage)
  HELL_AFFIXES: [
    { id: 'thorns', name: '荆棘', desc: '反弹20%伤害', effect: { reflect_pct: 20 } },
    { id: 'haste', name: '疾速', desc: 'SPD+30%', effect: { spd_pct: 30 } },
    { id: 'fortified', name: '坚壁', desc: 'DEF+40%', effect: { def_pct: 40 } },
    { id: 'vampiric', name: '吸血', desc: '攻击回复10%HP', effect: { lifesteal: 10 } },
    { id: 'berserker', name: '狂暴', desc: 'HP<50%时ATK+50%', effect: { low_hp_atk: 50 } },
    { id: 'shielded', name: '护盾', desc: '战斗开始获得20%HP护盾', effect: { shield_pct: 20 } },
  ],

  // Difficulty curve: enemy stat multiplier per chapter
  CHAPTER_SCALING: {
    1: { enemyScale: 0.3, desc: '教程难度' },
    2: { enemyScale: 0.5, desc: '需要阵容搭配' },
    3: { enemyScale: 0.8, desc: '需要装备强化' },
    4: { enemyScale: 1.0, desc: '需要天赋投入' },
    5: { enemyScale: 1.3, desc: '需要元素反应策略' },
    6: { enemyScale: 1.6, desc: '终局·需要极限Build' },
    7: { enemyScale: 1.8, desc: '以少胜多·智斗' },
    8: { enemyScale: 2.0, desc: '城防攻坚战' },
    9: { enemyScale: 2.3, desc: '山地极限战' },
    10: { enemyScale: 2.6, desc: '天下归一·最终决战' },
  },

  getEnemyScale(chapterId, difficulty) {
    const base = this.CHAPTER_SCALING[chapterId]?.enemyScale || 1;
    const mode = this.DIFFICULTY_MODES[difficulty || 'normal'];
    return base * (mode?.scale || 1);
  },

  // Check if a difficulty is unlocked for a chapter
  isDifficultyUnlocked(chapterId, difficulty) {
    if (difficulty === 'normal') return true;
    const cleared = Storage.getClearedDifficulties?.() || {};
    const chapterCleared = cleared[chapterId] || [];
    if (difficulty === 'elite') return chapterCleared.includes('normal');
    if (difficulty === 'hell') return chapterCleared.includes('elite');
    return false;
  },

  // Mark a chapter+difficulty as cleared
  markDifficultyCleared(chapterId, difficulty) {
    const cleared = Storage.getClearedDifficulties?.() || {};
    if (!cleared[chapterId]) cleared[chapterId] = [];
    if (!cleared[chapterId].includes(difficulty)) cleared[chapterId].push(difficulty);
    Storage.saveClearedDifficulties?.(cleared);
  },

  getCurrentChapter() {
    const progress = Storage.getCampaignProgress?.() || { chapter: 1, stage: 1, choices: {} };
    return this.CHAPTERS.find(c => c.id === progress.chapter) || this.CHAPTERS[0];
  },

  getCurrentStage() {
    const progress = Storage.getCampaignProgress?.() || { chapter: 1, stage: 1, choices: {} };
    const chapter = this.getCurrentChapter();
    return chapter.stages.find(s => s.id === progress.stage);
  },

  getAvailableStages() {
    const progress = Storage.getCampaignProgress?.() || { chapter: 1, stage: 1, choices: {} };
    const chapter = this.getCurrentChapter();
    return chapter.stages.filter(s => {
      if (s.id > progress.stage) return false;
      if (s.branch) {
        const choice = progress.choices[chapter.id];
        return choice === s.branch;
      }
      return true;
    });
  },

  completeStage(stageId, chapterId) {
    const progress = Storage.getCampaignProgress?.() || { chapter: 1, stage: 1, choices: {} };
    if (!progress.choices) progress.choices = {};

    // Only advance if this stage belongs to the current chapter (prevent replay corruption)
    if (chapterId && chapterId !== progress.chapter) {
      return progress;
    }

    if (stageId >= progress.stage) {
      progress.stage = stageId + 1;
    }

    // Check chapter completion — advance to next chapter if all stages done
    const chapter = this.CHAPTERS.find(c => c.id === progress.chapter);
    if (chapter) {
      // Skip over branch stages that don't match the player's destiny choice
      const choice = progress.choices[chapter.id];
      if (choice) {
        let safety = 0;
        while (safety++ < 20) {
          const nextStage = chapter.stages.find(s => s.id === progress.stage);
          if (!nextStage) break;
          if (nextStage.branch && nextStage.branch !== choice) {
            progress.stage++;
          } else {
            break;
          }
        }
      }

      const maxStage = Math.max(...chapter.stages.map(s => s.id));
      if (progress.stage > maxStage) {
        const nextChapter = this.CHAPTERS.find(c => c.id === progress.chapter + 1);
        if (nextChapter) {
          progress.chapter = nextChapter.id;
          progress.stage = 1;
        }
        // else: last chapter — stay at max
      }
    }
    Storage.saveCampaignProgress?.(progress);
    return progress;
  },

  makeDestinyChoice(chapterId, choiceId) {
    const progress = Storage.getCampaignProgress?.() || { chapter: 1, stage: 1, choices: {} };
    if (!progress.choices) progress.choices = {};
    progress.choices[chapterId] = choiceId;

    // Skip over branch stages that don't match the chosen path
    // (e.g., chose B → skip stages 6,7 which are branch A → land on stage 8)
    const chapter = this.CHAPTERS.find(c => c.id === chapterId);
    if (chapter) {
      let safety = 0;
      while (safety++ < 20) {
        const nextStage = chapter.stages.find(s => s.id === progress.stage);
        if (!nextStage) break;
        if (nextStage.branch && nextStage.branch !== choiceId) {
          progress.stage++;
        } else {
          break;
        }
      }
    }

    Storage.saveCampaignProgress?.(progress);
    return progress;
  }
};

if (typeof window !== 'undefined') window.Campaign = Campaign;

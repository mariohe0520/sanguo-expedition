// 三国·天命 — Campaign / Stages
const Campaign = {
  CHAPTERS: [
    {
      id: 1, name: '黄巾之乱', icon: '⚡', terrain: 'plains', weather: 'clear',
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
      id: 2, name: '虎牢关', icon: '🏔️', terrain: 'mountain', weather: 'clear',
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
      id: 3, name: '赤壁', icon: '🔥', terrain: 'river', weather: 'fog',
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
      id: 4, name: '五丈原', icon: '📜', terrain: 'plains', weather: 'clear',
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
      id: 5, name: '夷陵之战', icon: '🌲', terrain: 'forest', weather: 'wind',
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
      id: 6, name: '北伐', icon: '⛰️', terrain: 'mountain', weather: 'clear',
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
    }
  ],

  // 天命抉择
  DESTINY_CHOICES: {
    1: {
      trigger_after: 5, // After stage 5
      title: '天命之选：卢植之危',
      desc: '恩师卢植被押往洛阳受刑。你可以冒险去救，或趁乱南下扩张势力。',
      options: [
        { id: 'A', text: '🗡️ 救！恩师之恩不可忘', desc: '冒险营救卢植，获得忠义值和新武将线索', reward: { loyalty: 50, hero_hint: 'guanyu' }, stages: [6, 7] },
        { id: 'B', text: '📋 先壮大自己再说', desc: '南下招兵买马，获得更多金币和兵力', reward: { gold: 500, troops: 100 }, stages: [8, 9] }
      ],
      lore: '选择塑造命运。没有对错，只有不同的三国。'
    },
    2: {
      trigger_after: 5, // After stage 5
      title: '天命之选：虎牢关之岔',
      desc: '吕布退走，关外百姓正遭劫掠。追击吕布可削其势，救助百姓可得民心。',
      options: [
        { id: 'A', text: '🛡️ 救！百姓为重', desc: '护送百姓撤离，获得民心值和名医线索', reward: { loyalty: 80, hero_hint: 'huatuo' }, stages: [6, 7] },
        { id: 'B', text: '⚔️ 追！斩草除根', desc: '穷追吕布，获得战利品和精锐装备', reward: { gold: 800, equip_hint: 'fangtian_halberd' }, stages: [8, 9] }
      ],
      lore: '仁者救人，勇者杀敌。虎牢关下，你的选择将改变天命。'
    },
    3: {
      trigger_after: 5, // After mini-boss 曹仁
      title: '天命之选：赤壁之谋',
      desc: '曹仁已退，曹军大营就在江对岸。周瑜献火攻之计，庞统献铁索连环。然火攻虽猛，江边百姓恐遭殃及。',
      options: [
        { id: 'A', text: '🔥 火攻！借东风焚尽曹船', desc: '火烧连环船，造成毁灭性打击，但沿江村落难免波及', reward: { atk_bonus: 30, karma: -20 }, stages: [6, 7] },
        { id: 'B', text: '🌊 水路封锁，困死曹军', desc: '切断补给水路，迫曹军不战自溃。耗时更长但保全百姓', reward: { loyalty: 100, def_bonus: 20 }, stages: [8, 9] }
      ],
      lore: '火光冲天还是静水流深？赤壁之上，仁与狠一念之间。'
    },
    4: {
      trigger_after: 5, // After mini-boss 司马懿
      title: '天命之选：五丈原的抉择',
      desc: '孔明病重，星落秋风五丈原。他留下最后一计，施展需燃尽自身生命之火。或可不用此计，以大军正面强攻。',
      options: [
        { id: 'A', text: '📜 施孔明遗计，以命换胜', desc: '使用诸葛亮最后的计谋，威力惊人但主力武将损失大量HP', reward: { int_bonus: 40, hero_cost: { stat: 'hp', pct: -30 } }, stages: [6, 7] },
        { id: 'B', text: '⚔️ 正面强攻，堂堂正正', desc: '不靠奇谋，以绝对兵力碾压。战斗更难但无额外代价', reward: { atk_bonus: 25, gold: 1500 }, stages: [8, 9] }
      ],
      lore: '鞠躬尽瘁，死而后已。丞相的遗志，由你来完成。'
    },
    5: {
      trigger_after: 5, // After mini-boss 陆逊
      title: '天命之选：夷陵之火',
      desc: '关羽已逝，张飞遇害。刘备怒火中烧，率蜀军倾巢东征。陆逊坚守不出，七百里连营暴露在山林之间。是继续复仇的烈焰，还是收拾残局、守住蜀汉根基？',
      options: [
        { id: 'A', text: '🔥 复仇！关羽之仇不共戴天', desc: '全军猛攻，ATK+40但随机2名武将因负伤退出3场战斗', reward: { atk_bonus: 40, hero_disable: { count: 2, battles: 3 } }, stages: [6, 7] },
        { id: 'B', text: '🕊️ 放下，重建蜀汉', desc: '接受失去，凝聚人心。忠义+150，解锁特殊阵型「桃园阵」', reward: { loyalty: 150, unlock_formation: 'taoyuan_formation' }, stages: [8, 9] }
      ],
      lore: '烈火焚林还是落叶归根？夷陵之上，蜀汉的命运悬于一念。'
    },
    6: {
      trigger_after: 5, // After mini-boss 司马懿
      title: '天命之选：北伐的命脉',
      desc: '姜维继承丞相遗志北伐中原，然蜀道艰难，粮草补给成为最大瓶颈。木牛流马可保后勤无忧，全面进攻则可毕其功于一役——但粮尽之日便是败亡之时。',
      options: [
        { id: 'A', text: '📜 木牛流马，稳扎稳打', desc: '建造木牛流马保障补给，金+2000，获得后勤增益', reward: { gold: 2000, logistics_buff: true }, stages: [6, 7] },
        { id: 'B', text: '⚔️ 全面进攻，一战定乾坤', desc: 'ATK+35，士气+50，但补给消耗翻倍', reward: { atk_bonus: 35, morale: 50, supply_penalty_multiplier: 2 }, stages: [8, 9] }
      ],
      lore: '兵马未动粮草先行。北伐之路，是稳如泰山还是破釜沉舟？'
    }
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

  completeStage(stageId) {
    const progress = Storage.getCampaignProgress?.() || { chapter: 1, stage: 1, choices: {} };
    if (stageId >= progress.stage) {
      progress.stage = stageId + 1;
    }
    // Check chapter completion — advance to next chapter if all stages done
    const chapter = this.CHAPTERS.find(c => c.id === progress.chapter);
    if (chapter) {
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
    progress.choices[chapterId] = choiceId;
    Storage.saveCampaignProgress?.(progress);
    return progress;
  }
};

if (typeof window !== 'undefined') window.Campaign = Campaign;

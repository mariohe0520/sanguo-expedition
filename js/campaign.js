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

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

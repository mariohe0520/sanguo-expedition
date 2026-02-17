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

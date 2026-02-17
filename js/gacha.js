// 三国·天命 — 三顾茅庐抽卡系统
// Not random — you "persuade" heroes to join through dialogue choices
const Gacha = {
  // Available heroes to visit
  VISITS: {
    guanyu:   { cost: 200, dialogues: 3, rarity: 5, hint: '义薄云天之人，最重信义' },
    zhangfei: { cost: 150, dialogues: 2, rarity: 4, hint: '性如烈火，但对兄弟赤诚' },
    zhaoyun:  { cost: 300, dialogues: 3, rarity: 5, hint: '胆识过人，忠心不二' },
    caocao:   { cost: 250, dialogues: 3, rarity: 5, hint: '雄心万丈，唯才是举' },
    sunshangxiang: { cost: 200, dialogues: 2, rarity: 4, hint: '巾帼不让须眉' },
    diaochan: { cost: 200, dialogues: 2, rarity: 4, hint: '以柔克刚，四两拨千斤' },
    lvbu:     { cost: 500, dialogues: 4, rarity: 5, hint: '天下无双，但反复无常' },
    huangzhong: { cost: 100, dialogues: 1, rarity: 3, hint: '老当益壮，百步穿杨' },
  },

  // Dialogue trees — each choice affects sincerity
  DIALOGUES: {
    guanyu: [
      {
        text: '关将军，久仰大名。',
        options: [
          { text: '你武艺天下无双，来我麾下定能封侯拜将！', sincerity: -10, response: '（冷哼）功名利禄，非我所求。' },
          { text: '天下苍生受苦，愿与将军共匡扶汉室。', sincerity: 30, response: '（微微点头）公之志向，倒与我不谋而合。' },
          { text: '我有好酒，不知将军可否赏脸一叙？', sincerity: 15, response: '（捋须）温酒...倒是可以坐下谈谈。' },
        ]
      },
      {
        text: '关羽似乎在考验你...',
        options: [
          { text: '若将军不愿，在下绝不勉强。', sincerity: 25, response: '（正色）你倒是个尊重人的。' },
          { text: '你不来的话，我去找张飞了。', sincerity: -20, response: '（怒目）你这是在威胁我？' },
          { text: '我知道你最重义气，我也一样。', sincerity: 20, response: '（沉默片刻）...说来听听。' },
        ]
      },
      {
        text: '最后一问...',
        options: [
          { text: '跟着我有肉吃有酒喝！', sincerity: -5, response: '（摇头）志不在此。' },
          { text: '即使你不来，我也会守护这片土地的百姓。', sincerity: 35, response: '（拱手）主公！关某愿追随！' },
          { text: '我需要一个能守住后方的大将。', sincerity: 15, response: '（思索）你倒实诚...容我再想想。' },
        ]
      }
    ],
    zhangfei: [
      {
        text: '一个壮汉正在卖肉...',
        options: [
          { text: '好汉，来一斤牛肉，再来两坛好酒！', sincerity: 30, response: '（大笑）爽快！这酒我请了！' },
          { text: '张翼德，我来请你出山。', sincerity: 5, response: '（警惕）你谁啊？我不认识你。' },
          { text: '你这肉看起来一般啊。', sincerity: -15, response: '（怒）你说什么？！' },
        ]
      },
      {
        text: '张飞看起来对你有好感...',
        options: [
          { text: '兄弟，天下大乱，大丈夫当有所作为！', sincerity: 30, response: '（热血沸腾）说得好！干他丫的！' },
          { text: '你力气这么大，给我当保镖怎样？', sincerity: -10, response: '（不悦）我张飞不是给人当走狗的！' },
        ]
      }
    ],
    huangzhong: [
      {
        text: '一位老者正在练箭，百步穿杨。',
        options: [
          { text: '老将军，虽年事已高，箭法依然精湛。', sincerity: 20, response: '（笑）老当益壮，不输后生！' },
          { text: '老人家该享清福了。', sincerity: -10, response: '（怒）你小看老夫？' },
          { text: '黄将军，前方需要您的弓箭！', sincerity: 30, response: '（精神一振）哈！终于有人识货了！' },
        ]
      }
    ],
    // ... more dialogues for other heroes (abbreviated for MVP)
  },

  // Start a visit
  startVisit(heroId) {
    const visit = this.VISITS[heroId];
    if (!visit) return null;
    const player = Storage.getPlayer();
    if (player.gold < visit.cost) return { error: '金币不足' };
    player.gold -= visit.cost;
    Storage.savePlayer(player);
    
    const state = Storage.getGachaState();
    if (!state.visits[heroId]) state.visits[heroId] = { sincerity: 0, dialogueIdx: 0, attempts: 0 };
    state.visits[heroId].attempts++;
    Storage.saveGachaState(state);
    
    return {
      hero: HEROES[heroId],
      visit: state.visits[heroId],
      dialogues: this.DIALOGUES[heroId] || [],
      cost: visit.cost
    };
  },

  // Make dialogue choice
  makeChoice(heroId, choiceIdx) {
    const state = Storage.getGachaState();
    const v = state.visits[heroId];
    if (!v) return null;
    
    const dialogues = this.DIALOGUES[heroId] || [];
    const d = dialogues[v.dialogueIdx];
    if (!d) return null;
    
    const choice = d.options[choiceIdx];
    if (!choice) return null;
    
    v.sincerity += choice.sincerity;
    v.dialogueIdx++;
    
    // Check if all dialogues done → recruit check
    const visit = this.VISITS[heroId];
    let recruited = false;
    if (v.dialogueIdx >= dialogues.length) {
      // Sincerity threshold: 60 for 3-star, 80 for 4-star, 90 for 5-star
      const threshold = visit.rarity === 5 ? 70 : visit.rarity === 4 ? 50 : 30;
      recruited = v.sincerity >= threshold;
      
      if (recruited) {
        Storage.addHero(heroId);
        v.dialogueIdx = 0;
        v.sincerity = 0;
      } else {
        // Failed — reset dialogue but keep some sincerity as "memory"
        v.dialogueIdx = 0;
        v.sincerity = Math.floor(v.sincerity * 0.3); // Remember 30%
      }
    }
    
    Storage.saveGachaState(state);
    return { choice, sincerity: v.sincerity, recruited, response: choice.response };
  },

  // Get visit status for display
  getVisitStatus(heroId) {
    const state = Storage.getGachaState();
    return state.visits[heroId] || { sincerity: 0, dialogueIdx: 0, attempts: 0 };
  }
};

if (typeof window !== 'undefined') window.Gacha = Gacha;

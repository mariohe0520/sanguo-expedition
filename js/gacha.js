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
    zhaoyun: [
      {
        text: '常山赵子龙，一袭白袍，银枪在手。',
        options: [
          { text: '赵将军，你的武艺天下闻名！', sincerity: 5, response: '（微笑）过奖了，不过虚名而已。' },
          { text: '乱世之中，百姓需要你这样的守护者。', sincerity: 30, response: '（眼神一亮）你也在意百姓？' },
          { text: '我麾下缺一员大将，待遇从优！', sincerity: -10, response: '（摇头）赵云非为金银卖命之人。' },
        ]
      },
      {
        text: '赵云似乎在考量你的为人...',
        options: [
          { text: '我愿以性命担保百姓安危！', sincerity: 25, response: '（正色）好！有担当之人。' },
          { text: '你若来，封你为前锋大将！', sincerity: 5, response: '（淡然）官职不重要。' },
          { text: '别的将军都加入了，你还犹豫什么？', sincerity: -15, response: '（冷淡）赵云从不随波逐流。' },
        ]
      },
      {
        text: '赵云提枪而立，等待你的最后回答...',
        options: [
          { text: '不管你来不来，我都会保护这片土地的人民。', sincerity: 35, response: '（抱拳）主公仁义！赵云愿效犬马之劳！' },
          { text: '跟我一起建功立业吧！', sincerity: 10, response: '（犹豫）建功立业...不是我的初衷。' },
          { text: '你不来太可惜了。', sincerity: -5, response: '（沉默）...可惜什么呢？' },
        ]
      }
    ],
    caocao: [
      {
        text: '曹孟德正在帐中读兵书，抬头打量你...',
        options: [
          { text: '曹公，天下英雄唯你与我！', sincerity: 20, response: '（大笑）好大的口气！我喜欢。' },
          { text: '曹公治军严明，在下佩服。', sincerity: 10, response: '（点头）识货之人。' },
          { text: '你手段虽狠，但确有本事。', sincerity: 25, response: '（挑眉）哦？直言不讳，有意思。' },
        ]
      },
      {
        text: '曹操放下书卷，眼中精光闪烁...',
        options: [
          { text: '安天下者，非常人也。我们志同道合。', sincerity: 30, response: '（起身）知我者也！坐，细谈。' },
          { text: '我只想保一方平安。', sincerity: -5, response: '（摇头）格局太小，天下不等人。' },
          { text: '我们可以一起征服天下！', sincerity: 15, response: '（微笑）征服...这个词我喜欢。' },
        ]
      },
      {
        text: '曹操手按佩剑，做最后试探...',
        options: [
          { text: '英雄不问出身，唯才是举。', sincerity: 35, response: '（击掌）妙哉！这正是我一生所求！从此共谋天下！' },
          { text: '我有你缺少的仁义。', sincerity: 15, response: '（沉思）仁义...确实，我需要这样的人。' },
          { text: '加入我，你不会后悔的。', sincerity: -10, response: '（冷笑）曹某从不让人做我的决定。' },
        ]
      }
    ],
    sunshangxiang: [
      {
        text: '孙尚香正在校场练箭，箭箭命中靶心。',
        options: [
          { text: '郡主别来无恙，久闻你弓马娴熟！', sincerity: 25, response: '（回头笑）识货！来，比试一局？' },
          { text: '女子也能上战场？', sincerity: -20, response: '（冷眼）这话你再说一遍？' },
          { text: '东吴与我联手，可破曹贼。', sincerity: 15, response: '（收弓）联手？说来听听。' },
        ]
      },
      {
        text: '孙尚香放下弓箭，认真看着你...',
        options: [
          { text: '我保证给你独立领兵的权力。', sincerity: 30, response: '（眼睛发亮）真的？你是第一个这么说的人！' },
          { text: '跟着我有好多漂亮衣服穿...', sincerity: -15, response: '（怒）你当我是什么人！？' },
          { text: '你的弓术比很多男将都强。', sincerity: 20, response: '（得意）那当然！好吧，我考虑考虑。' },
        ]
      }
    ],
    diaochan: [
      {
        text: '月下，一位绝色女子正在弹琴...',
        options: [
          { text: '闻名不如见面，貂蝉小姐果然倾国倾城。', sincerity: 10, response: '（微笑）又是一个只看脸的...不过谢谢。' },
          { text: '我需要你的智慧，不只是你的美貌。', sincerity: 30, response: '（停琴）...你和别人不一样。' },
          { text: '你能帮我用美人计对付敌人吗？', sincerity: -15, response: '（冷笑）我不是任人摆布的棋子。' },
        ]
      },
      {
        text: '貂蝉起身，月光映照她的面容...',
        options: [
          { text: '你不仅美丽，更有过人的勇气和谋略。', sincerity: 30, response: '（感动）终于...有人看到了真正的我。' },
          { text: '跟着我保证你荣华富贵。', sincerity: -10, response: '（叹气）荣华富贵，我早已看淡。' },
          { text: '你值得一个不把你当棋子的主公。', sincerity: 25, response: '（泪光）你...愿意这样对我？' },
        ]
      }
    ],
    lvbu: [
      {
        text: '吕布骑着赤兔马，方天画戟在手，俯视着你。',
        options: [
          { text: '吕将军，天下无双！在下特来拜会。', sincerity: 10, response: '（看了一眼）嗯，还算有眼光。' },
          { text: '我听说你连主公都杀过几个？', sincerity: -20, response: '（怒目）你找死？！' },
          { text: '赤兔马配英雄，我这里还有宝马良驹。', sincerity: 20, response: '（眼睛一亮）哦？什么马？说来听听。' },
        ]
      },
      {
        text: '吕布翻身下马，手中画戟一震...',
        options: [
          { text: '不如我们比试一番？你若赢了我心服口服。', sincerity: 25, response: '（大笑）有胆色！好，我欣赏你！' },
          { text: '我出三倍价钱请你。', sincerity: 15, response: '（撇嘴）钱...也不是不行。' },
          { text: '我比你之前的主公都强。', sincerity: -10, response: '（冷哼）大话谁都会说。' },
        ]
      },
      {
        text: '吕布收起画戟，第一次正眼看你...',
        options: [
          { text: '英雄不受束缚，我不会限制你的自由。', sincerity: 25, response: '（若有所思）自由...这个词我喜欢。' },
          { text: '忠诚是双向的，我会对你坦诚相待。', sincerity: 20, response: '（意外）坦诚...之前没人对我说过这个。' },
          { text: '你若背叛我，我会亲手取你性命。', sincerity: -5, response: '（嗤笑）就凭你？不过...有点意思。' },
        ]
      },
      {
        text: '吕布将方天画戟插入地面，双臂环胸...',
        options: [
          { text: '天下英雄，就该追随最强的主公！', sincerity: 15, response: '（点头）最强...我只跟最强的人。' },
          { text: '我给你独当一面的机会和最好的装备。', sincerity: 30, response: '（拔出画戟）好！吕布今日起，为你效力！' },
          { text: '跟不跟随都无所谓，我照样能一统天下。', sincerity: 10, response: '（挑眉）狂...但我喜欢狂人。' },
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
    // Reset dialogue index for this new visit attempt
    state.visits[heroId].dialogueIdx = 0;
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
    let visitComplete = false;

    if (v.dialogueIdx >= dialogues.length) {
      visitComplete = true;
      // Sincerity threshold: 70 for 5-star, 50 for 4-star, 30 for 3-star
      const threshold = visit.rarity === 5 ? 70 : visit.rarity === 4 ? 50 : 30;
      recruited = v.sincerity >= threshold;
      
      if (recruited) {
        Storage.addHero(heroId);
        // Reset for future shard visits
        v.sincerity = 0;
      } else {
        // Failed — keep 30% sincerity as "memory" for next visit
        v.sincerity = Math.floor(v.sincerity * 0.3);
      }
      // Keep dialogueIdx past the end so UI knows visit is complete
      // It will be reset to 0 in startVisit on next visit
    }
    
    Storage.saveGachaState(state);
    return { choice, sincerity: v.sincerity, recruited, visitComplete, response: choice.response };
  },

  // Get visit status for display
  getVisitStatus(heroId) {
    const state = Storage.getGachaState();
    return state.visits[heroId] || { sincerity: 0, dialogueIdx: 0, attempts: 0 };
  }
};

if (typeof window !== 'undefined') window.Gacha = Gacha;

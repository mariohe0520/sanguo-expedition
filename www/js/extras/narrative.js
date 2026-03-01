// 三国·天命 — Cinematic Narrative Engine
// Pre-battle and post-battle story scenes with character dialogues

const Narrative = (() => {
  let _overlay = null;
  let _typeTimeout = null;
  let _onComplete = null;
  let _skipAll = false;

  // ═══════════════════════════════════════════════════
  // STORY DATABASE — Chapter × Stage dialogues
  // Each entry: { speakers, lines[], mood }
  // speaker: heroId or special ('narrator','player')
  // ═══════════════════════════════════════════════════
  const STORIES = {
    // ── Chapter 1: 黄巾之乱 ──
    'ch1_pre1': {
      lines: [
        { speaker: 'narrator', text: '中平元年，苍天已死，黄天当立。' },
        { speaker: 'narrator', text: '张角率黄巾军席卷八州，天下大乱。' },
        { speaker: 'player', text: '乱世之中，唯有拔剑而起，方能守护身边之人。' },
        { speaker: 'narrator', text: '颍川城外，黄巾先锋已至——' },
      ]
    },
    'ch1_post1': {
      lines: [
        { speaker: 'player', text: '初战告捷！但这只是开始……' },
        { speaker: 'narrator', text: '远处烟尘滚滚，更多黄巾贼正在集结。' },
      ]
    },
    'ch1_pre5': {
      lines: [
        { speaker: 'narrator', text: '广宗城内，张角以太平道术蛊惑人心。' },
        { speaker: 'zhangjiao', text: '苍天已死，黄天当立！今日便是你的末日！', mood: 'angry' },
        { speaker: 'player', text: '太平道不过是蛊惑百姓的邪术，今日我必将你伏法！' },
        { speaker: 'narrator', text: 'Boss战：天公将军·张角' },
      ]
    },
    'ch1_post5': {
      lines: [
        { speaker: 'narrator', text: '张角倒下了，但他的眼中没有恐惧。' },
        { speaker: 'zhangjiao', text: '你以为……杀了我……就能改变什么吗？', mood: 'sad' },
        { speaker: 'narrator', text: '黄巾之乱虽平，天下的裂缝却已无法弥合。' },
        { speaker: 'narrator', text: '乱世，才刚刚开始。' },
      ]
    },
    'ch1_pre2': {
      lines: [
        { speaker: 'narrator', text: '黄巾军声势浩大，旌旗蔽日。然乌合之众终不敌铁血之师。' },
        { speaker: 'player', text: '敌军虽多，但阵形松散。以少击多，关键在于先声夺人！' },
      ]
    },
    'ch1_pre3': {
      lines: [
        { speaker: 'narrator', text: '广宗城已被团团围住，城中百姓惶恐不安。' },
        { speaker: 'player', text: '城在人在！传令三军——死守广宗！' },
        { speaker: 'narrator', text: '战鼓擂动，杀声震天。一场恶战在所难免。' },
      ]
    },
    'ch1_pre4': {
      lines: [
        { speaker: 'narrator', text: '斥候来报：黄巾军派出了精锐小队，企图突袭侧翼。' },
        { speaker: 'player', text: '将计就计！设伏于此，给他们一个迎头痛击！' },
      ]
    },
    'ch1_post10': {
      lines: [
        { speaker: 'narrator', text: '张宝伏诛，黄巾之乱终于平定。' },
        { speaker: 'narrator', text: '然战后的废墟中，新的野心正在萌芽。' },
        { speaker: 'player', text: '和平来之不易。但我知道……这只是暴风雨前的宁静。' },
        { speaker: 'narrator', text: '—— 第一章「黄巾之乱」完 ——' },
      ]
    },
    'ch1_pre10': {
      lines: [
        { speaker: 'narrator', text: '黄巾残部卷土重来，张宝誓为兄报仇。' },
        { speaker: 'narrator', text: '"大哥！我定要让那些人血债血偿！"' },
        { speaker: 'player', text: '张宝虽悲愤，但愤怒会蒙蔽双眼。来吧，这次我不会再让百姓受苦。' },
      ]
    },

    // ── Chapter 2: 虎牢关 ──
    'ch2_pre1': {
      lines: [
        { speaker: 'narrator', text: '初平元年，春。董卓废帝篡权，洛阳民不聊生。' },
        { speaker: 'narrator', text: '十八路诸侯盟誓于酸枣——"讨伐国贼董卓！"' },
        { speaker: 'narrator', text: '大军浩荡西进，兵锋直指虎牢关。' },
        { speaker: 'player', text: '虎牢关雄踞天险，一夫当关万夫莫开。此战凶险万分。' },
        { speaker: 'narrator', text: '关城之上，一面"董"字大旗在朔风中猎猎作响。' },
      ]
    },
    'ch2_pre2': {
      lines: [
        { speaker: 'narrator', text: '汜水关前，敌军严阵以待。' },
        { speaker: 'player', text: '先取汜水关，再图虎牢。步步为营！' },
      ]
    },
    'ch2_pre3': {
      lines: [
        { speaker: 'narrator', text: '前方传来噩耗——华雄连斩数员大将！' },
        { speaker: 'narrator', text: '"鲍忠、祖茂，俱死于华雄刀下。"' },
        { speaker: 'player', text: '华雄此人，武艺非凡。必须从长计议。' },
      ]
    },
    'ch2_post10': {
      lines: [
        { speaker: 'narrator', text: '吕布虽败，仍似困兽犹斗。' },
        { speaker: 'narrator', text: '方天画戟划过长空，带着不甘与怒火。' },
        { speaker: 'lvbu', text: '天下英雄……终有一日，我会让你们跪在我面前！', mood: 'angry' },
        { speaker: 'narrator', text: '虎牢关之战落幕，但吕布的传说远未结束。' },
        { speaker: 'narrator', text: '—— 第二章「虎牢关」完 ——' },
      ]
    },
    'ch2_pre4': {
      lines: [
        { speaker: 'narrator', text: '华雄在关前连斩数将，诸侯面面相觑。' },
        { speaker: 'guanyu', text: '某虽不才，愿往斩华雄头，献于帐下！', mood: 'brave' },
        { speaker: 'player', text: '此酒且留，待云长凯旋再饮不迟。' },
        { speaker: 'narrator', text: '温酒尚温——' },
      ]
    },
    'ch2_post4': {
      lines: [
        { speaker: 'narrator', text: '帐外鼓声震天，关羽提刀归来，华雄首级在手。' },
        { speaker: 'guanyu', text: '酒尚温否？', mood: 'calm' },
        { speaker: 'narrator', text: '满座皆惊，温酒斩华雄之名，传遍天下。' },
      ]
    },
    'ch2_pre5': {
      lines: [
        { speaker: 'narrator', text: '虎牢关前，一骑当关万夫莫开。' },
        { speaker: 'lvbu', text: '鼠辈！谁敢与我一战？', mood: 'angry' },
        { speaker: 'zhangfei', text: '三姓家奴休狂！燕人张飞在此！', mood: 'angry' },
        { speaker: 'guanyu', text: '二弟勿急，待为兄助你！', mood: 'brave' },
        { speaker: 'player', text: '三英战吕布——这一战，必将载入史册！' },
      ]
    },
    'ch2_post5': {
      lines: [
        { speaker: 'narrator', text: '吕布力战三英，方天画戟挟雷霆之势。' },
        { speaker: 'narrator', text: '但三兄弟配合无间，吕布渐感不支。' },
        { speaker: 'lvbu', text: '哼……有些本事。但这不是结束。', mood: 'cold' },
        { speaker: 'narrator', text: '吕布拨马而退，虎牢关的传说就此写下。' },
      ]
    },
    'ch2_pre10': {
      lines: [
        { speaker: 'narrator', text: '三英战吕布——终局之战。' },
        { speaker: 'player', text: '吕布，今日虎牢关前，便是你的终点！' },
        { speaker: 'lvbu', text: '我乃天下第一！区区三人也想挡我？', mood: 'angry' },
      ]
    },

    // ── Chapter 3: 赤壁 ──
    'ch3_pre1': {
      lines: [
        { speaker: 'narrator', text: '建安十三年冬，曹操率号称八十万大军南下。' },
        { speaker: 'narrator', text: '荆州刘琮不战而降，曹军势如破竹。' },
        { speaker: 'narrator', text: '长江之上，雾气弥漫，战云密布。两岸万家灯火，不知明日是否还能点亮。' },
        { speaker: 'player', text: '赤壁……这是决定天下三分的一战。成败在此一举。' },
        { speaker: 'zhouyu', text: '曹操虽强，但北人不习水战。此乃天赐良机。', mood: 'calm' },
      ]
    },
    'ch3_pre2': {
      lines: [
        { speaker: 'narrator', text: '浓雾笼江，视线不及十步。' },
        { speaker: 'player', text: '雾中巡逻，最忌大意。保持警惕！' },
      ]
    },
    'ch3_pre3': {
      lines: [
        { speaker: 'narrator', text: '曹军水寨规模惊人，战船首尾相连，绵延数里。' },
        { speaker: 'zhouyu', text: '铁索连环……这不正是天助我也？', mood: 'calm' },
        { speaker: 'narrator', text: '周瑜的嘴角浮起一抹意味深长的笑。' },
      ]
    },
    'ch3_pre5': {
      lines: [
        { speaker: 'zhouyu', text: '曹贼铁索连环，正合我意。', mood: 'calm' },
        { speaker: 'narrator', text: '周瑜掌中折扇轻摇，眼中是燃尽一切的火。' },
        { speaker: 'player', text: '先破曹仁守军，再图赤壁大计。' },
        { speaker: 'narrator', text: 'Boss战：铁壁将军·曹仁' },
      ]
    },
    'ch3_post5': {
      lines: [
        { speaker: 'narrator', text: '曹仁败退，江面水寨尽在掌控。' },
        { speaker: 'zhouyu', text: '万事俱备，只欠东风。', mood: 'calm' },
        { speaker: 'narrator', text: '天命之选即将到来——火攻，还是水路封锁？' },
      ]
    },
    'ch3_pre10': {
      lines: [
        { speaker: 'narrator', text: '赤壁之上，火光冲天。' },
        { speaker: 'caocao', text: '不可能……我的百万大军……', mood: 'shocked' },
        { speaker: 'player', text: '曹操！天命不在你这边！' },
        { speaker: 'narrator', text: '最终决战：乱世奸雄·曹操' },
      ]
    },
    'ch3_post10': {
      lines: [
        { speaker: 'narrator', text: '赤壁火光映红了整片天空。' },
        { speaker: 'narrator', text: '曹操仓皇北逃，天下三分之势已成。' },
        { speaker: 'caocao', text: '好……好一把火。但孤还会回来的。', mood: 'cold' },
        { speaker: 'player', text: '赤壁之战，此后千年仍有人传唱。' },
        { speaker: 'narrator', text: '—— 第三章「赤壁」完 ——' },
      ]
    },

    // ── Chapter 4: 五丈原 ──
    'ch4_pre1': {
      lines: [
        { speaker: 'narrator', text: '建兴十二年，诸葛亮第六次北伐。' },
        { speaker: 'narrator', text: '蜀军驻扎五丈原，与司马懿隔渭水对峙。' },
        { speaker: 'player', text: '丞相鞠躬尽瘁，我等怎敢懈怠。' },
      ]
    },
    'ch4_pre5': {
      lines: [
        { speaker: 'simayi', text: '诸葛亮？不过是个会种地的村夫罢了。', mood: 'cold' },
        { speaker: 'narrator', text: '司马懿深沟高垒，以不变应万变。' },
        { speaker: 'player', text: '冢虎之名非浪得虚名，必须全力以赴！' },
      ]
    },
    'ch4_post5': {
      lines: [
        { speaker: 'narrator', text: '司马懿果然难缠，两军再度陷入僵持。' },
        { speaker: 'narrator', text: '然而丞相的身体……已经到了极限。' },
        { speaker: 'player', text: '丞相……' },
      ]
    },
    'ch4_pre10': {
      lines: [
        { speaker: 'narrator', text: '秋风萧瑟，星辰黯淡。' },
        { speaker: 'narrator', text: '五丈原上，这是最后的决战。' },
        { speaker: 'player', text: '为了丞相的遗志！全军……出击！' },
        { speaker: 'narrator', text: '最终Boss战：冢虎·司马懿' },
      ]
    },
    'ch4_post10': {
      lines: [
        { speaker: 'narrator', text: '出师未捷身先死，长使英雄泪满襟。' },
        { speaker: 'narrator', text: '五丈原的秋风中，似乎还能听见丞相的叹息。' },
        { speaker: 'player', text: '丞相的遗志……我们会继承下去。' },
        { speaker: 'narrator', text: '—— 第四章「五丈原」完 ——' },
      ]
    },

    // ── Chapter 5: 夷陵之战 ──
    'ch5_pre1': {
      lines: [
        { speaker: 'narrator', text: '章武元年。关羽败走麦城，身首异处。张飞为部将所害。' },
        { speaker: 'narrator', text: '桃园三结义，如今只剩刘备一人。' },
        { speaker: 'narrator', text: '"不求同年同月同日生，但求同年同月同日死。"' },
        { speaker: 'narrator', text: '怒火焚心的刘备，不顾群臣劝阻，率蜀军倾巢东征。' },
        { speaker: 'player', text: '七百里连营……这一仗，赌上了蜀汉的国运。' },
      ]
    },
    'ch5_pre2': {
      lines: [
        { speaker: 'narrator', text: '蜀军深入吴境，林木幽深，道路曲折。' },
        { speaker: 'player', text: '此地地形复杂，需小心伏击。' },
        { speaker: 'narrator', text: '一阵山风吹过，林叶沙沙作响，仿佛暗藏杀机。' },
      ]
    },
    'ch5_post5': {
      lines: [
        { speaker: 'luxun', text: '还不是时候。再等等。', mood: 'calm' },
        { speaker: 'narrator', text: '陆逊年仅二十七，却有着远超年龄的沉稳。' },
        { speaker: 'narrator', text: '蜀军连营七百里，渐成强弩之末。' },
        { speaker: 'player', text: '陆逊在等什么？这份从容，让人不寒而栗……' },
      ]
    },
    'ch5_post10': {
      lines: [
        { speaker: 'narrator', text: '夷陵火光冲天，蜀军七百里连营一夕化为灰烬。' },
        { speaker: 'narrator', text: '刘备退守白帝城，蜀汉元气大伤。' },
        { speaker: 'player', text: '关羽、张飞……对不起，我终究未能为你们报仇。' },
        { speaker: 'narrator', text: '桃园之誓犹在耳畔，但英雄已垂暮。' },
        { speaker: 'narrator', text: '—— 第五章「夷陵之战」完 ——' },
      ]
    },
    'ch5_pre5': {
      lines: [
        { speaker: 'narrator', text: '陆逊年少却老谋深算，面对蜀军猛攻巍然不动。' },
        { speaker: 'luxun', text: '急什么？让他们扎营……扎得越长越好。', mood: 'calm' },
        { speaker: 'player', text: '此人年轻却不可小觑。小心有诈！' },
      ]
    },
    'ch5_pre10': {
      lines: [
        { speaker: 'narrator', text: '夷陵之上，山风呼啸。' },
        { speaker: 'luxun', text: '时候到了。放火。', mood: 'cold' },
        { speaker: 'narrator', text: '七百里连营，一夜之间化为火海。' },
        { speaker: 'player', text: '不！……全军准备突围！' },
      ]
    },

    // ── Chapter 6: 北伐 ──
    'ch6_pre1': {
      lines: [
        { speaker: 'narrator', text: '延熙十六年。蜀汉偏安一隅，国力日衰。' },
        { speaker: 'narrator', text: '大将军姜维继承诸葛武侯遗志，誓要北伐中原。' },
        { speaker: 'jiangwei', text: '师父的北伐之志，由我来完成。鞠躬尽瘁，死而后已。', mood: 'brave' },
        { speaker: 'player', text: '蜀道难，但不伐中原，蜀汉何以存？粮草务必先行！' },
        { speaker: 'narrator', text: '大军出汉中，向着中原的方向再次进发。' },
      ]
    },
    'ch6_post5': {
      lines: [
        { speaker: 'narrator', text: '司马懿故技重施，深沟高垒拒不出战。' },
        { speaker: 'jiangwei', text: '又是这一招……粮草撑不了多久了。', mood: 'sad' },
        { speaker: 'narrator', text: '北伐的最大敌人，从来不是魏军——而是蜀道千里运粮的难题。' },
      ]
    },
    'ch6_post10': {
      lines: [
        { speaker: 'narrator', text: '九伐中原，功败垂成。' },
        { speaker: 'jiangwei', text: '师父……维尽力了。', mood: 'sad' },
        { speaker: 'narrator', text: '姜维望着北方的天空，眼中闪着不灭的光。' },
        { speaker: 'narrator', text: '—— 第六章「北伐」完 ——' },
      ]
    },
    'ch6_pre5': {
      lines: [
        { speaker: 'simayi', text: '又来了？蜀国就没有别的人了吗？', mood: 'cold' },
        { speaker: 'jiangwei', text: '只要我还在，北伐就不会停！', mood: 'angry' },
        { speaker: 'narrator', text: '第五次北伐——终极对决。' },
      ]
    },

    // ── Chapter 7: 官渡之战 ──
    'ch7_pre1': {
      lines: [
        { speaker: 'narrator', text: '建安五年，袁绍亲率十万大军南下。' },
        { speaker: 'narrator', text: '曹操以不到两万之兵驻于官渡，以少敌多。' },
        { speaker: 'player', text: '兵力悬殊十倍，此战唯有以智取胜。' },
      ]
    },
    'ch7_pre5': {
      lines: [
        { speaker: 'yuanshao', text: '曹阿瞒不过一宦官之后，何足挂齿！', mood: 'arrogant' },
        { speaker: 'narrator', text: '颜良文丑为袁绍先锋，气势如虹。' },
        { speaker: 'player', text: '袁绍虽兵多，但刚愎自用。此战有机可乘！' },
      ]
    },
    'ch7_post10': {
      lines: [
        { speaker: 'narrator', text: '官渡一役，袁绍大军溃败。' },
        { speaker: 'narrator', text: '曹操以少胜多，奠定了北方霸业的基础。' },
        { speaker: 'player', text: '以少胜多……这就是智谋的力量。' },
        { speaker: 'narrator', text: '—— 第七章「官渡之战」完 ——' },
      ]
    },

    // ── Chapter 8: 合肥之战 ──
    'ch8_pre1': {
      lines: [
        { speaker: 'narrator', text: '建安二十年。合肥城——曹魏的南方门户，扼守淮水要冲。' },
        { speaker: 'narrator', text: '曹操北征张鲁，留张辽、李典、乐进三人守合肥，仅七千余人。' },
        { speaker: 'narrator', text: '孙权趁虚而入，率十万大军兵临城下。' },
        { speaker: 'player', text: '八百破十万？这得是何等勇武……张文远，当世之虎将也！' },
      ]
    },
    'ch8_post5': {
      lines: [
        { speaker: 'narrator', text: '张辽率八百勇士突入吴军大阵，直冲孙权中军！' },
        { speaker: 'narrator', text: '吴军十万之众，竟被这八百人杀得人仰马翻。' },
        { speaker: 'sunquan', text: '张辽这个疯子……快撤！快撤！', mood: 'shocked' },
        { speaker: 'narrator', text: '逍遥津之战，张辽威震江东，小儿闻其名止啼。' },
      ]
    },
    'ch8_post10': {
      lines: [
        { speaker: 'narrator', text: '合肥之战，魏军以少胜多，孙权铩羽而归。' },
        { speaker: 'narrator', text: '"张辽止啼"之名传遍江东，成为一代佳话。' },
        { speaker: 'player', text: '以七千破十万……张辽之勇，千古无双。' },
        { speaker: 'narrator', text: '—— 第八章「合肥之战」完 ——' },
      ]
    },
    'ch8_pre5': {
      lines: [
        { speaker: 'sunquan', text: '合肥必须拿下！集中兵力总攻！', mood: 'brave' },
        { speaker: 'narrator', text: '孙权亲征，十万吴军兵临城下。' },
        { speaker: 'player', text: '孙权御驾亲征，这一战将决定江淮归属。' },
      ]
    },

    // ── Chapter 9: 定军山 ──
    'ch9_pre1': {
      lines: [
        { speaker: 'narrator', text: '汉中争夺战，黄忠请命出战。' },
        { speaker: 'huangzhong', text: '老将虽年迈，百步之内，箭不虚发！', mood: 'brave' },
        { speaker: 'player', text: '老将军勇气可嘉！定军山之战，拜托了！' },
      ]
    },
    'ch9_pre5': {
      lines: [
        { speaker: 'xiahouyuan', text: '黄忠老匹夫！安敢犯我定军山？', mood: 'angry' },
        { speaker: 'huangzhong', text: '今日定军山上，必斩汝首！', mood: 'brave' },
        { speaker: 'narrator', text: 'Boss战：疾行将军·夏侯渊' },
      ]
    },
    'ch9_post10': {
      lines: [
        { speaker: 'narrator', text: '黄忠一刀斩下夏侯渊，定军山归蜀。' },
        { speaker: 'huangzhong', text: '不服老？哼，且看老将之威！', mood: 'proud' },
        { speaker: 'narrator', text: '—— 第九章「定军山」完 ——' },
      ]
    },

    // ── Chapter 10: 天下归一 ──
    'ch10_pre1': {
      lines: [
        { speaker: 'narrator', text: '三国鼎立数十年，百姓疲于征战。' },
        { speaker: 'narrator', text: '司马昭掌握曹魏大权，虎视天下。' },
        { speaker: 'player', text: '最后的篇章……天下归一的时刻到了。' },
      ]
    },
    'ch10_pre5': {
      lines: [
        { speaker: 'simazhao', text: '天命在我司马氏。识时务者为俊杰。', mood: 'cold' },
        { speaker: 'player', text: '天命？天命由人不由天！' },
        { speaker: 'narrator', text: 'Boss战：天命之人·司马昭' },
      ]
    },
    'ch10_pre10': {
      lines: [
        { speaker: 'narrator', text: '这是最终的决战。三国的命运，在此一举。' },
        { speaker: 'simazhao', text: '来吧。让我看看，你所谓的"天命"。', mood: 'cold' },
        { speaker: 'player', text: '为了所有人的牺牲……为了三国的未来！' },
        { speaker: 'narrator', text: '最终章：天命终战' },
      ]
    },
    'ch10_post10': {
      lines: [
        { speaker: 'narrator', text: '战火终于停息。' },
        { speaker: 'narrator', text: '无论天下归谁，英雄们的故事已经写完。' },
        { speaker: 'narrator', text: '但传说……永不落幕。' },
        { speaker: 'player', text: '三国……再见。' },
        { speaker: 'narrator', text: '—— 三国·天命 全章完结 ——' },
      ]
    },
  };

  // Character display data (maps heroId → display info for dialogue)
  const CHAR_INFO = {
    narrator:  { name: '旁白', color: '#94a3b8', portrait: '📜' },
    player:    { name: '主公', color: '#f5c518', portrait: '⚔' },
    liubei:    { name: '刘备', color: '#22c55e', portrait: '刘' },
    guanyu:    { name: '关羽', color: '#22c55e', portrait: '关' },
    zhangfei:  { name: '张飞', color: '#22c55e', portrait: '张' },
    zhaoyun:   { name: '赵云', color: '#22c55e', portrait: '赵' },
    caocao:    { name: '曹操', color: '#3b82f6', portrait: '曹' },
    simayi:    { name: '司马懿', color: '#3b82f6', portrait: '司' },
    simazhao:  { name: '司马昭', color: '#3b82f6', portrait: '昭' },
    zhouyu:    { name: '周瑜', color: '#ef4444', portrait: '瑜' },
    sunquan:   { name: '孙权', color: '#ef4444', portrait: '权' },
    lvbu:      { name: '吕布', color: '#a855f7', portrait: '吕' },
    zhangjiao: { name: '张角', color: '#a855f7', portrait: '角' },
    luxun:     { name: '陆逊', color: '#ef4444', portrait: '逊' },
    jiangwei:  { name: '姜维', color: '#22c55e', portrait: '维' },
    huangzhong:{ name: '黄忠', color: '#22c55e', portrait: '黄' },
    xiahouyuan:{ name: '夏侯渊', color: '#3b82f6', portrait: '渊' },
    yuanshao:  { name: '袁绍', color: '#a855f7', portrait: '绍' },
  };

  // Mood effects for character portraits
  const MOOD_EFFECTS = {
    angry: '🔥',
    calm: '🌸',
    sad: '💧',
    brave: '⚔️',
    shocked: '⚡',
    cold: '❄️',
    proud: '✨',
    arrogant: '👑',
    determined: '💪',
    fearful: '😰',
    cunning: '🧠',
    melancholy: '🌙',
  };

  // ═══════════════════════════════════════════════════
  // CORE API
  // ═══════════════════════════════════════════════════

  function getStoryKey(chapterId, stageId, phase) {
    return 'ch' + chapterId + '_' + phase + stageId;
  }

  function hasStory(chapterId, stageId, phase) {
    return !!STORIES[getStoryKey(chapterId, stageId, phase)];
  }

  function show(chapterId, stageId, phase, onComplete) {
    const key = getStoryKey(chapterId, stageId, phase);
    const story = STORIES[key];
    if (!story) {
      if (onComplete) onComplete();
      return;
    }
    _onComplete = onComplete;
    _skipAll = false;
    _showDialogue(story.lines, 0);
  }

  // ═══════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════

  function _ensureOverlay() {
    if (_overlay && document.body.contains(_overlay)) return _overlay;
    _overlay = document.createElement('div');
    _overlay.id = 'narrative-overlay';
    _overlay.className = 'narrative-overlay';
    _overlay.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;' +
      'background:linear-gradient(180deg,rgba(6,8,16,0.95) 0%,rgba(10,14,26,0.98) 100%);' +
      'display:flex;flex-direction:column;justify-content:flex-end;align-items:center;' +
      'opacity:0;transition:opacity 0.4s ease;pointer-events:auto;';
    document.body.appendChild(_overlay);
    requestAnimationFrame(() => { _overlay.style.opacity = '1'; });
    return _overlay;
  }

  function _showDialogue(lines, index) {
    if (index >= lines.length || _skipAll) {
      _closeOverlay();
      return;
    }

    const line = lines[index];
    const charInfo = CHAR_INFO[line.speaker] || CHAR_INFO.narrator;
    const isNarrator = line.speaker === 'narrator';
    const overlay = _ensureOverlay();

    overlay.innerHTML = '';

    // Top gradient area (scene atmosphere)
    const sceneArea = document.createElement('div');
    sceneArea.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;padding:20px;';

    // If not narrator, show a portrait
    if (!isNarrator) {
      const portraitBox = document.createElement('div');
      portraitBox.style.cssText =
        'width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
        'font-size:56px;font-weight:900;color:#fff;' +
        'background:radial-gradient(circle,rgba(255,255,255,0.1) 0%,transparent 70%);' +
        'border:3px solid ' + charInfo.color + ';' +
        'box-shadow:0 0 30px ' + charInfo.color + '40,0 0 60px ' + charInfo.color + '20;' +
        'animation:narrativePortraitPulse 2s ease-in-out infinite;';

      // Use hero image if available
      const heroData = (typeof HEROES !== 'undefined') ? HEROES[line.speaker] : null;
      if (heroData && heroData.id && typeof Portraits !== 'undefined') {
        const imgSrc = Portraits.getUrl ? Portraits.getUrl(heroData.id) : ('img/heroes/' + heroData.id + '.jpg');
        portraitBox.style.backgroundImage = 'url(' + imgSrc + ')';
        portraitBox.style.backgroundSize = 'cover';
        portraitBox.style.backgroundPosition = 'center';
        portraitBox.textContent = '';
      } else {
        portraitBox.textContent = charInfo.portrait;
      }

      // Mood indicator
      if (line.mood && MOOD_EFFECTS[line.mood]) {
        const moodEl = document.createElement('div');
        moodEl.style.cssText =
          'position:absolute;top:-8px;right:-8px;font-size:24px;' +
          'animation:narrativeMoodBounce 0.6s ease infinite alternate;';
        moodEl.textContent = MOOD_EFFECTS[line.mood];
        portraitBox.style.position = 'relative';
        portraitBox.appendChild(moodEl);
      }

      sceneArea.appendChild(portraitBox);
    } else {
      // Narrator scene - show atmospheric text or ink dots
      const atmosEl = document.createElement('div');
      atmosEl.style.cssText =
        'font-size:14px;color:rgba(255,255,255,0.2);letter-spacing:12px;text-transform:uppercase;';
      atmosEl.textContent = '· · ·';
      sceneArea.appendChild(atmosEl);
    }

    overlay.appendChild(sceneArea);

    // Dialogue box
    const dialogBox = document.createElement('div');
    dialogBox.style.cssText =
      'width:100%;max-width:520px;padding:0 20px 40px;';

    // Speaker name
    const nameEl = document.createElement('div');
    nameEl.style.cssText =
      'font-size:14px;font-weight:700;margin-bottom:8px;' +
      'color:' + charInfo.color + ';letter-spacing:2px;' +
      (isNarrator ? 'font-style:italic;opacity:0.7;' : '');
    nameEl.textContent = isNarrator ? '' : charInfo.name;
    dialogBox.appendChild(nameEl);

    // Text area
    const textEl = document.createElement('div');
    textEl.style.cssText =
      'font-size:' + (isNarrator ? '16px' : '18px') + ';' +
      'color:' + (isNarrator ? 'rgba(255,255,255,0.7)' : '#fff') + ';' +
      'line-height:1.8;min-height:60px;' +
      (isNarrator ? 'font-style:italic;text-align:center;' : '') +
      'text-shadow:0 2px 4px rgba(0,0,0,0.3);';
    textEl.id = 'narrative-text';
    dialogBox.appendChild(textEl);

    // Progress indicator
    const progressEl = document.createElement('div');
    progressEl.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;margin-top:16px;';

    const dotsEl = document.createElement('div');
    dotsEl.style.cssText = 'display:flex;gap:4px;';
    for (let i = 0; i < lines.length; i++) {
      const dot = document.createElement('div');
      dot.style.cssText =
        'width:6px;height:6px;border-radius:50%;' +
        'background:' + (i <= index ? '#f5c518' : 'rgba(255,255,255,0.2)') + ';' +
        'transition:background 0.3s ease;';
      dotsEl.appendChild(dot);
    }
    progressEl.appendChild(dotsEl);

    const skipBtn = document.createElement('div');
    skipBtn.style.cssText =
      'font-size:12px;color:rgba(255,255,255,0.3);cursor:pointer;';
    skipBtn.textContent = '跳过 ▶▶';
    skipBtn.onclick = (e) => {
      e.stopPropagation();
      _skipAll = true;
      _closeOverlay();
    };
    progressEl.appendChild(skipBtn);
    dialogBox.appendChild(progressEl);

    overlay.appendChild(dialogBox);

    // Typewriter effect
    _typewriter(textEl, line.text, 0, () => {
      // After typewriter, show "tap to continue" hint
      const hintEl = document.createElement('div');
      hintEl.style.cssText =
        'text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:8px;' +
        'animation:narrativeBlink 1.5s ease-in-out infinite;';
      hintEl.textContent = '▼ 点击继续';
      dialogBox.appendChild(hintEl);
    });

    // Tap to advance
    let canAdvance = false;
    setTimeout(() => { canAdvance = true; }, 300);

    overlay.onclick = () => {
      if (!canAdvance) return;
      // If still typing, skip to full text
      if (_typeTimeout) {
        clearTimeout(_typeTimeout);
        _typeTimeout = null;
        textEl.textContent = line.text;
        canAdvance = true;
        // Show hint
        const existing = dialogBox.querySelector('[style*="narrativeBlink"]');
        if (!existing) {
          const hintEl = document.createElement('div');
          hintEl.style.cssText =
            'text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:8px;' +
            'animation:narrativeBlink 1.5s ease-in-out infinite;';
          hintEl.textContent = '▼ 点击继续';
          dialogBox.appendChild(hintEl);
        }
        return;
      }
      // Advance to next line
      _showDialogue(lines, index + 1);
    };
  }

  function _typewriter(el, text, idx, onDone) {
    if (idx >= text.length) {
      if (onDone) onDone();
      return;
    }
    el.textContent = text.substring(0, idx + 1);
    const ch = text[idx];
    const delay = '，。！？、'.includes(ch) ? 100 : '；：…'.includes(ch) ? 80 : 35;
    _typeTimeout = setTimeout(() => _typewriter(el, text, idx + 1, onDone), delay);
  }

  function _closeOverlay() {
    if (_typeTimeout) {
      clearTimeout(_typeTimeout);
      _typeTimeout = null;
    }
    if (_overlay) {
      _overlay.style.opacity = '0';
      setTimeout(() => {
        if (_overlay && _overlay.parentNode) {
          _overlay.parentNode.removeChild(_overlay);
        }
        _overlay = null;
        if (_onComplete) {
          const cb = _onComplete;
          _onComplete = null;
          cb();
        }
      }, 400);
    } else if (_onComplete) {
      const cb = _onComplete;
      _onComplete = null;
      cb();
    }
  }

  // ═══════════════════════════════════════════════════
  // INJECT CSS ANIMATIONS
  // ═══════════════════════════════════════════════════
  function _injectStyles() {
    if (document.getElementById('narrative-styles')) return;
    const style = document.createElement('style');
    style.id = 'narrative-styles';
    style.textContent =
      '@keyframes narrativePortraitPulse{0%,100%{box-shadow:0 0 30px var(--glow,rgba(255,255,255,0.2)),0 0 60px var(--glow,rgba(255,255,255,0.1))}50%{box-shadow:0 0 40px var(--glow,rgba(255,255,255,0.3)),0 0 80px var(--glow,rgba(255,255,255,0.15))}}' +
      '@keyframes narrativeMoodBounce{0%{transform:scale(1) translateY(0)}100%{transform:scale(1.2) translateY(-4px)}}' +
      '@keyframes narrativeBlink{0%,100%{opacity:0.3}50%{opacity:0.8}}';
    document.head.appendChild(style);
  }

  // Auto-inject on load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _injectStyles);
    } else {
      _injectStyles();
    }
  }

  // ═══════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════
  return {
    hasStory,
    show,
    STORIES,
    CHAR_INFO,
  };
})();

if (typeof window !== 'undefined') window.Narrative = Narrative;

// 三国·天命 — Hero Personality & Bond System (英雄人格 + 羁绊)
// Mood, Bonds, Loyalty, Hero Dialogue

const HeroPersonality = {

  // ═══════════════════════════════════════
  // MOOD SYSTEM (心情)
  // ═══════════════════════════════════════
  MOODS: {
    elated:    { id: 'elated',    name: '高昂', emoji: '😊', color: '#fbbf24', effects: { atk: 0.10, skill_dmg: 0.10 } },
    calm:      { id: 'calm',      name: '平静', emoji: '😐', color: '#94a3b8', effects: {} },
    furious:   { id: 'furious',   name: '愤怒', emoji: '😤', color: '#ef4444', effects: { atk: 0.20, def: -0.10 }, allyAttackChance: 0.05 },
    depressed: { id: 'depressed', name: '低落', emoji: '😢', color: '#6366f1', effects: { atk: -0.15, def: -0.15, spd: -0.15, int: -0.15 } },
    excited:   { id: 'excited',   name: '激动', emoji: '🔥', color: '#f97316', effects: { atk: 0.15, def: 0.15, spd: 0.15, int: 0.15 }, rageGainBonus: 0.20 },
  },

  // Mood value mapping: -100 to 100
  // < -60: depressed, -60~-20: calm trending down, -20~20: calm, 20~60: elated, > 60: excited
  // Furious is triggered by specific events (enemy bond)
  getMoodFromValue(moodValue, isFurious) {
    if (isFurious) return this.MOODS.furious;
    if (moodValue <= -60) return this.MOODS.depressed;
    if (moodValue >= 60) return this.MOODS.excited;
    if (moodValue >= 20) return this.MOODS.elated;
    return this.MOODS.calm;
  },

  // ═══════════════════════════════════════
  // BOND SYSTEM (羁绊)
  // ═══════════════════════════════════════
  BONDS: [
    {
      id: 'taoyuan', name: '桃园结义', icon: '🍑',
      desc: '三兄弟同心，其利断金',
      heroes: ['liubei', 'guanyu', 'zhangfei'],
      bonus: { atk: 0.12, def: 0.12 },
      bonusDesc: 'ATK+12%, DEF+12%',
      story: '桃园之中，刘备、关羽、张飞三人焚香设誓，结为异姓兄弟。不求同年同月同日生，但求同年同月同日死。',
    },
    {
      id: 'wolong_fengchu', name: '卧龙凤雏', icon: '🐉',
      desc: '得一可安天下',
      heroes: ['zhugeLiang', 'pangtong'],
      bonus: { atk: 0.15, skill_dmg: 0.20 },
      bonusDesc: 'ATK+15%, 技能伤害+20%',
      story: '水镜先生曾言：卧龙凤雏，得一可安天下。二人才华横溢，却命运殊途。',
    },
    {
      id: 'wuhu', name: '五虎上将', icon: '🐯',
      desc: '蜀汉五虎，天下无敌',
      heroes: ['guanyu', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong'],
      bonus: { atk: 0.20, crit: 0.10 },
      bonusDesc: 'ATK+20%, 暴击+10%',
      story: '关羽、张飞、赵云、马超、黄忠，五位将军各怀绝技，蜀汉柱石。',
      minRequired: 3,
    },
    {
      id: 'lvdiao', name: '吕貂之恋', icon: '💕',
      desc: '英雄难过美人关',
      heroes: ['lvbu', 'diaochan'],
      bonus: { atk: 0.10, def: -0.05, rage_gain: 0.30 },
      bonusDesc: 'ATK+10%, DEF-5%, 怒气获取+30%',
      story: '连环计中，貂蝉翩翩起舞，吕布为她倾倒，一代猛将甘为美人驱策。',
    },
    {
      id: 'weiwu', name: '魏武之臣', icon: '🏴',
      desc: '奉天子以令不臣',
      heroes: ['caocao', 'simayi', 'guojia'],
      bonus: { def: 0.15, skill_dmg: 0.15 },
      bonusDesc: 'DEF+15%, 技能伤害+15%',
      story: '曹操帐下，谋士如云。郭嘉鬼才，司马懿隐忍，皆为一代人杰。',
      minRequired: 2,
    },
    {
      id: 'jiangdong', name: '江东之虎', icon: '🌊',
      desc: '江东子弟多才俊',
      heroes: ['zhouyu', 'sunce', 'sunshangxiang'],
      bonus: { atk: 0.12, spd: 0.10 },
      bonusDesc: 'ATK+12%, SPD+10%',
      story: '孙家三代基业，孙策开疆拓土，周瑜赤壁之谋，孙尚香巾帼不让须眉。',
      minRequired: 2,
    },
    {
      id: 'husband_wife', name: '夫妻同心', icon: '💞',
      desc: '夫唱妇随，携手天下',
      heroes: ['zhugeLiang', 'huangyueying'],
      bonus: { skill_dmg: 0.20, def: 0.10 },
      bonusDesc: '技能伤害+20%, DEF+10%',
      story: '黄月英虽被人说丑，才华横溢。诸葛亮慧眼识珠，二人琴瑟和鸣。',
    },
    {
      id: 'nanman', name: '南蛮王', icon: '🦁',
      desc: '七擒七纵，心服口服',
      heroes: ['menghuo', 'zhurong'],
      bonus: { atk: 0.15, hp: 0.10 },
      bonusDesc: 'ATK+15%, HP+10%',
      story: '南中之地，蛮王孟获勇猛无双，其妻祝融乃火神后裔，夫妻并肩作战。',
    },
    {
      id: 'rival', name: '宿命之敌', icon: '⚔️',
      desc: '棋逢对手，将遇良才',
      heroes: ['zhugeLiang', 'simayi'],
      bonus: { skill_dmg: 0.25 },
      bonusDesc: '技能伤害+25%',
      story: '五丈原上，两位旷世奇才的最终对决。诸葛亮鞠躬尽瘁，司马懿按兵不动。',
    },
    {
      id: 'tiger_wolf', name: '虎狼之师', icon: '🐺',
      desc: '乱世枭雄，唯才是举',
      heroes: ['caocao', 'lvbu'],
      bonus: { atk: 0.20, def: -0.10 },
      bonusDesc: 'ATK+20%, DEF-10%',
      story: '曹操爱才惜才，吕布虽骁勇善战，终因背信弃义而殒命白门楼。',
    },
    {
      id: 'yijing', name: '医者仁心', icon: '💊',
      desc: '悬壶济世，妙手回春',
      heroes: ['huatuo', 'liubei'],
      bonus: { hp: 0.15, heal: 0.20 },
      bonusDesc: 'HP+15%, 治疗效果+20%',
      story: '华佗神医，悬壶济世。刘备仁德爱民，二人皆以济世为己任。',
    },
    {
      id: 'betrayal', name: '背叛之刃', icon: '🗡️',
      desc: '魏延反骨，终成祸患',
      heroes: ['weiyan', 'zhugeLiang'],
      bonus: { atk: 0.15, crit: 0.15 },
      bonusDesc: 'ATK+15%, 暴击+15%',
      story: '诸葛亮初见魏延，便言其脑后有反骨。然魏延骁勇善战，功不可没。',
    },
    {
      id: 'chibi_fire', name: '赤壁烈焰', icon: '🔥',
      desc: '谈笑间，樯橹灰飞烟灭',
      heroes: ['zhouyu', 'zhugeLiang'],
      bonus: { skill_dmg: 0.20, int: 0.10 },
      bonusDesc: '技能伤害+20%, INT+10%',
      story: '赤壁之战，周瑜与诸葛亮联手设计火攻，一把大火烧尽曹军八十万。',
    },
    {
      id: 'wei_five', name: '五子良将', icon: '🛡️',
      desc: '曹魏五子，攻守兼备',
      heroes: ['xuhuang', 'zhanghe', 'xiahouyuan', 'pangde'],
      bonus: { atk: 0.12, def: 0.12 },
      bonusDesc: 'ATK+12%, DEF+12%',
      story: '曹魏帐下，五子良将各有所长，攻城拔寨无往不利。',
      minRequired: 2,
    },
    {
      id: 'beauty_scheme', name: '美人计', icon: '🌙',
      desc: '倾国之姿，乱世之计',
      heroes: ['diaochan', 'zhenji'],
      bonus: { int: 0.15, spd: 0.10 },
      bonusDesc: 'INT+15%, SPD+10%',
      story: '貂蝉闭月羞花，甄姬翩若惊鸿。两位绝世美人，皆是乱世中的传奇。',
    },
    {
      id: 'chaos_lords', name: '乱世枭雄', icon: '👑',
      desc: '群雄逐鹿，天下纷争',
      heroes: ['dongzhuo', 'yuanshao', 'lvbu'],
      bonus: { atk: 0.15, hp: 0.10 },
      bonusDesc: 'ATK+15%, HP+10%',
      story: '董卓暴虐，袁绍四世三公，吕布武勇无双。乱世之初，群雄割据。',
      minRequired: 2,
    },
    {
      id: 'sima_dynasty', name: '司马天下', icon: '🏯',
      desc: '三代谋划，终归司马',
      heroes: ['simayi', 'simazhao'],
      bonus: { int: 0.20, def: 0.15 },
      bonusDesc: 'INT+20%, DEF+15%',
      story: '司马懿隐忍半生，司马昭路人皆知。父子接力，终成晋朝霸业。',
    },
    {
      id: 'heir_war', name: '继志北伐', icon: '⚡',
      desc: '师徒一脉，壮志未酬',
      heroes: ['zhugeLiang', 'jiangwei'],
      bonus: { atk: 0.12, int: 0.15 },
      bonusDesc: 'ATK+12%, INT+15%',
      story: '诸葛亮将毕生所学传于姜维，姜维九伐中原，继承丞相遗志。',
    },
  ],

  // ═══════════════════════════════════════
  // LOYALTY SYSTEM (忠诚度)
  // ═══════════════════════════════════════
  LOYALTY_THRESHOLDS: {
    high:    { min: 80, bonus: 0.05, desc: '忠心耿耿', color: '#22c55e', icon: '💚' },
    medium:  { min: 40, bonus: 0, desc: '尚可', color: '#eab308', icon: '💛' },
    low:     { min: 1,  bonus: 0, desc: '心怀不满', color: '#ef4444', icon: '💔', refuseChance: 0.03 },
    zero:    { min: 0,  bonus: 0, desc: '叛离！', color: '#7f1d1d', icon: '💀' },
  },

  getLoyaltyTier(loyalty) {
    if (loyalty >= 80) return this.LOYALTY_THRESHOLDS.high;
    if (loyalty >= 40) return this.LOYALTY_THRESHOLDS.medium;
    if (loyalty >= 1) return this.LOYALTY_THRESHOLDS.low;
    return this.LOYALTY_THRESHOLDS.zero;
  },

  // ═══════════════════════════════════════
  // HERO DIALOGUE (英雄对话)
  // ═══════════════════════════════════════
  HERO_LINES: {
    // ── 蜀汉 ──
    liubei: {
      battleStart: ['吾虽不才，愿与诸公共扶社稷！', '以仁待人，以义服人！'],
      skill: ['仁者无敌！', '桃园之誓，永不相负！', '汉室苗裔，绝不妥协！', '为天下苍生，吾当竭尽所能！', '仁义之道，此战为证！'],
      victory: ['天命所归，汉室当兴！', '多谢诸位将军！'],
      defeat: ['吾之不德...连累将士...', '大业未成...不甘心...'],
      bondMet: { guanyu: '云长，有你在吾便安心。', zhangfei: '翼德，莫要鲁莽！', zhugeLiang: '军师，一切拜托了。', zhaoyun: '子龙！有你在真好！' },
      lowMorale: ['百姓疾苦，吾心亦苦...', '唉...路漫漫其修远兮...'],
      highMorale: ['天下虽乱，仁义犹在！', '今日定当一展宏图！'],
    },
    guanyu: {
      battleStart: ['义之所在，虽千万人吾往矣！', '温酒斩华雄，不过如此！'],
      skill: ['看我青龙偃月刀！', '过五关斩六将！', '义薄云天，此刀问心！', '温酒斩华雄——快哉！', '汉寿亭侯，刀下留情！'],
      victory: ['哈哈，痛快！', '关某不才，幸不辱命。'],
      defeat: ['大哥，某愧对桃园之誓...', '走麦城？不可能！'],
      bondMet: { zhangfei: '三弟，随我杀敌！', liubei: '大哥放心，某在此！', zhaoyun: '子龙兄弟，好身手！' },
      lowMorale: ['心中烦闷...', '某近日有些疲惫。'],
      highMorale: ['今日精神百倍！', '热血沸腾！'],
    },
    zhangfei: {
      battleStart: ['燕人张飞在此！谁敢一战！', '呔！吃俺一矛！'],
      skill: ['谁敢与我决一死战！！', '当阳桥上，吓退曹军！', '吃俺老张一矛！！！', '长坂坡上，俺一声喝退百万兵！', '燕人张翼德在此——来战！！'],
      victory: ['哈哈哈！痛快痛快！', '区区鼠辈！'],
      defeat: ['可恶...俺不服！', '大哥...俺丢人了...'],
      bondMet: { guanyu: '二哥！一起杀！', liubei: '大哥在后面歇着，这有俺！' },
      lowMorale: ['闷得慌...想喝酒...', '没仗打真无聊...'],
      highMorale: ['痛快！今天俺浑身是劲！', '来来来，放马过来！'],
    },
    zhaoyun: {
      battleStart: ['常山赵子龙在此！', '银枪在手，万夫莫敌！'],
      skill: ['七进七出！', '吾乃常山赵子龙！', '银龙破阵——疾！', '长坂七进七出，此乃小技！', '子龙枪出，谁与争锋！', '护主之志，枪尖作证！'],
      victory: ['区区小敌，不足挂齿。', '主公大业，指日可待。'],
      defeat: ['护不住主公...子龙之过。', '暂且退却，来日再战。'],
      bondMet: { liubei: '主公安心，子龙在此！', zhugeLiang: '军师妙计，子龙愿为先锋！', guanyu: '关将军威名远播！' },
      lowMorale: ['子龙虽勇，奈何...', '有些力不从心。'],
      highMorale: ['银枪如龙！今日大杀四方！', '热血未凉，壮志犹在！'],
    },
    zhugeLiang: {
      battleStart: ['万事俱备...', '且看今日之计。'],
      skill: ['八阵图，变！', '借东风！', '草船借箭，妙哉！', '空城计——退！', '呼风唤雨，天地为我所用！', '七星灯，续命之法——启！'],
      victory: ['一切尽在掌握。', '此乃天命所归。'],
      defeat: ['谋事在人...成事在天。', '出师未捷...'],
      bondMet: { liubei: '主公三顾之恩，亮铭记于心。', pangtong: '士元兄，久违了。', jiangwei: '伯约，吾之衣钵就交给你了。', huangyueying: '月英，辛苦你了。' },
      lowMorale: ['鞠躬尽瘁，死而后已...但偶尔也会疲倦。', '星象紊乱...不太吉利。'],
      highMorale: ['今日天象大利！必胜无疑！', '运筹帷幄，决胜千里。'],
    },
    huangzhong: {
      battleStart: ['老夫宝刀未老！', '看老将的本事！'],
      skill: ['百步穿杨！', '定军山，老夫来也！', '老将出马，一个顶俩！', '老骥伏枥，志在千里——射！', '廉颇尚能饭，老夫弓弦犹劲！'],
      victory: ['老当益壮！', '哼，莫要小看老将！'],
      defeat: ['老夫...不服老...', '廉颇虽老，尚能饭否...'],
      bondMet: { guanyu: '关将军，老夫不输于你！', liubei: '主公知遇之恩，老夫铭记！' },
      lowMorale: ['老了...骨头都在响...', '唉...力不从心了。'],
      highMorale: ['今日精气神十足！', '老夫今天要让年轻人看看！'],
    },
    machao: {
      battleStart: ['西凉马超在此！', '西凉铁骑，所向披靡！'],
      skill: ['西凉铁骑，冲！', '神威将军之名，非浪得虚名！'],
      victory: ['哼，不堪一击。', '西凉勇士，无人可挡！'],
      defeat: ['父仇...未报...', '可恶...不能输在这里...'],
      bondMet: { zhaoyun: '子龙兄，比试比试？', zhangfei: '张将军，好力气！' },
      lowMorale: ['漂泊半生...何处是家...', '西凉...回不去了...'],
      highMorale: ['西凉儿郎，今日杀敌！', '锦马超之名，天下皆知！'],
    },
    jiangwei: {
      battleStart: ['丞相遗志，维必承之！', '北伐中原！'],
      skill: ['继志北伐！', '诸葛丞相在上！'],
      victory: ['丞相...您看到了吗？', '北伐大业又进一步！'],
      defeat: ['丞相...维辜负您了...', '壮志难酬...'],
      bondMet: { zhugeLiang: '丞相！学生在此！' },
      lowMorale: ['九伐中原...何时才能成功...', '蜀中无大将...唉...'],
      highMorale: ['丞相遗志，绝不辜负！', '今日北伐，必有斩获！'],
    },
    huangyueying: {
      battleStart: ['木牛流马，准备就绪！', '让我来试试新发明。'],
      skill: ['看我的机关术！', '木牛流马，启动！'],
      victory: ['实验成功！', '呵呵，这就是科学的力量。'],
      defeat: ['计算有误...需要改进...', '下次一定改进设计...'],
      bondMet: { zhugeLiang: '夫君，我又改良了连弩！' },
      lowMorale: ['灵感枯竭...需要休息...', '最近做什么都不顺...'],
      highMorale: ['灵感来了！', '今天状态绝佳，可以做三个发明！'],
    },
    weiyan: {
      battleStart: ['谁说魏延有反骨！', '子午谷奇谋，谁人能挡！'],
      skill: ['子午谷！奇袭！', '看我的！'],
      victory: ['哼，丞相不用我，他错了！', '魏延非池中之物！'],
      defeat: ['可恶...又失败了...', '没人信任魏延...'],
      bondMet: { zhugeLiang: '丞相...给我一次机会！' },
      lowMorale: ['没人理解我...', '反骨...反骨...我哪有反骨！'],
      highMorale: ['今天要让所有人刮目相看！', '哈哈，看我的！'],
    },
    yanyan: {
      battleStart: ['砍头便砍头，何为怒邪！', '老将严颜在此！'],
      skill: ['不屈！', '宁死不降！'],
      victory: ['忠义之士，岂会投降！', '老将风范犹在。'],
      defeat: ['气节不灭...', '巴郡老将...不辱门风...'],
      lowMorale: ['老矣...', '巴蜀之地...不知还能守多久...'],
      highMorale: ['老当益壮，不坠青云之志！', '忠肝义胆！'],
    },

    // ── 曹魏 ──
    caocao: {
      battleStart: ['宁教我负天下人！', '孤的天下，谁人能挡！'],
      skill: ['挟天子以令诸侯！', '对酒当歌，人生几何！', '宁我负人，休人负我！', '孟德之谋，天下无二！', '老骥伏枥——志在千里！', '周公吐哺，天下归心！'],
      victory: ['天下英雄，唯使君与操耳。', '哈哈哈，天命在我！'],
      defeat: ['胜败乃兵家常事。', '割须弃袍又如何？'],
      bondMet: { simayi: '仲达，孤信你...暂时。', guojia: '奉孝！有你真好！', lvbu: '吕奉先...果然骁勇。' },
      lowMorale: ['唉...烦心事太多了...', '天下何时能定？'],
      highMorale: ['日月之行，若出其中！', '星汉灿烂，若出其里！壮哉！'],
    },
    simayi: {
      battleStart: ['鹰视狼顾...', '急什么...慢慢来。'],
      skill: ['鹰视狼顾！', '隐忍...方能成大事。'],
      victory: ['呵呵...一切按计划进行。', '忍了这么久，值了。'],
      defeat: ['此战...不过是权宜之计。', '退一步...海阔天空。'],
      bondMet: { caocao: '魏王...臣在此。', simazhao: '昭儿，看为父的。', zhugeLiang: '诸葛亮...你我之间，必有了断。', guojia: '郭奉孝...真是个聪明人。' },
      lowMorale: ['装病...再装一会...', '时机未到...不可妄动...'],
      highMorale: ['时机到了！', '天命...在我司马氏！'],
    },
    guojia: {
      battleStart: ['十胜十败，已有定论。', '此战...奉孝已算好了。'],
      skill: ['十胜十败论！', '天意如此！'],
      victory: ['不过如此。', '一切...尽在意料之中。'],
      defeat: ['奉孝...看来天命弄人...', '可惜...身体不争气...'],
      bondMet: { caocao: '主公，嘉有一计。', simayi: '仲达兄...好深的城府。' },
      lowMorale: ['咳咳...身体越来越差了...', '若能多活几年...'],
      highMorale: ['今日灵感迸发！', '哈哈，看我鬼才之谋！'],
    },
    xunyu: {
      battleStart: ['驱虎吞狼之计，且看分晓。', '王佐之才，当为明主效力。'],
      skill: ['驱虎吞狼！', '乱中取胜！'],
      victory: ['不负王佐之名。', '曹魏基业，当固若金汤。'],
      defeat: ['计策虽妙...奈何时运不济。', '我心已碎...'],
      bondMet: { caocao: '主公...请听彧一言。' },
      lowMorale: ['空有留香之名...唉...', '汉室...曹魏...何去何从...'],
      highMorale: ['今日定当献上妙计！', '王佐之才，当有所为！'],
    },
    xuhuang: {
      battleStart: ['军令如山！', '徐晃在此，谁敢犯我！'],
      skill: ['大斧破甲！', '治军严明！'],
      victory: ['军纪严明，方能取胜。', '周亚夫之风，不敢有愧。'],
      defeat: ['撤退！不可恋战！', '败中有序，方为将才。'],
      lowMorale: ['军心不稳...需整顿。', '士气低落...不利出战。'],
      highMorale: ['三军用命！', '今日大破敌军！'],
    },
    zhanghe: {
      battleStart: ['巧变者，不困于一隅。', '张郃在此！'],
      skill: ['巧变！', '灵活应变！'],
      victory: ['以巧取胜，方为上策。', '哈哈，敌人完全被耍了。'],
      defeat: ['巧亦有穷时...', '此次失算了...'],
      lowMorale: ['变化多端...但有时也累...', '敌我悬殊太大...'],
      highMorale: ['今日灵光一闪！', '看我七十二变！'],
    },
    xiahouyuan: {
      battleStart: ['兵贵神速！', '三日五百里，六日一千里！'],
      skill: ['急袭！', '神速攻击！'],
      victory: ['速战速决！', '天下武功，唯快不破。'],
      defeat: ['太快了...没看清陷阱...', '定军山...不...'],
      lowMorale: ['跑不动了...', '前方道路不明...'],
      highMorale: ['今日疾如风！', '闪电战！冲！'],
    },
    pangde: {
      battleStart: ['抬棺而战！', '庞德誓死不降！'],
      skill: ['死战到底！', '抬棺！'],
      victory: ['棺材白抬了。', '忠义之士，宁死不屈！'],
      defeat: ['纵然战死...亦无怨无悔！', '庞德...宁死不降！'],
      lowMorale: ['生死看淡...', '棺材越来越重了...'],
      highMorale: ['今日便是死期...敌人的死期！', '抬棺出征！'],
    },
    caoren: {
      battleStart: ['坚守不退！', '铁壁曹仁在此！'],
      skill: ['铁壁！', '守城如山！'],
      victory: ['固若金汤。', '防守就是最好的进攻。'],
      defeat: ['城破了...', '守不住了...'],
      lowMorale: ['墙裂了...', '援军何时到...'],
      highMorale: ['坚如磐石！', '让他们来撞铁壁吧！'],
    },
    zhenji: {
      battleStart: ['翩若惊鸿...', '洛水之畔，甄姬来也。'],
      skill: ['洛神赋！', '翩若惊鸿，婉若游龙...'],
      victory: ['凌波微步，罗袜生尘。', '美人如玉...'],
      defeat: ['落花有意...流水无情...', '红颜薄命...'],
      bondMet: { caocao: '曹公...妾身在此。' },
      lowMorale: ['深宫寂寞...', '无人懂甄姬的心...'],
      highMorale: ['今日洛水之畔，定要惊艳四座！', '灵感如泉涌！'],
    },
    simazhao: {
      battleStart: ['天命在我！', '司马昭之心...你们看得到吗？'],
      skill: ['路人皆知！', '天下归心！'],
      victory: ['三国归晋，大势所趋。', '哈哈...一切皆在掌握。'],
      defeat: ['不急...不急...', '父亲...儿还需修炼。'],
      bondMet: { simayi: '父亲！儿在此！' },
      lowMorale: ['路人皆知...皆知什么？', '天下事...难啊...'],
      highMorale: ['今日便是改天换地之时！', '大魏天下...不，大晋天下！'],
    },

    // ── 东吴 ──
    zhouyu: {
      battleStart: ['谈笑间，樯橹灰飞烟灭。', '既生瑜...何必再论。'],
      skill: ['火烧赤壁！', '大江东去，浪淘尽！'],
      victory: ['赤壁一战，千古留名！', '江东周郎，名不虚传。'],
      defeat: ['既生瑜...何生亮...', '大业未成...'],
      bondMet: { sunce: '伯符兄！总角之交！', zhugeLiang: '诸葛亮...你我再较量！', sunshangxiang: '公主殿下，周瑜有礼。' },
      lowMorale: ['心中郁闷...不如弹琴消遣...', '曲有误...周郎顾...'],
      highMorale: ['今日东风起！大破敌军！', '周公瑾智谋无双！'],
    },
    sunshangxiang: {
      battleStart: ['弓腰姬孙尚香！', '巾帼不让须眉！'],
      skill: ['连弩齐发！', '看我的箭法！'],
      victory: ['哼，小意思。', '东吴女将，不可小觑！'],
      defeat: ['可恶...本姑娘不服！', '下次一定赢！'],
      bondMet: { sunce: '大哥！一起冲！', zhouyu: '周瑜哥哥！', liubei: '皇叔...你还好吗？' },
      lowMorale: ['无聊...好想回东吴...', '唉...做个公主真累...'],
      highMorale: ['今天箭法手感超好！', '东吴第一女将，非我莫属！'],
    },
    sunce: {
      battleStart: ['小霸王孙策！谁敢一战！', '江东基业，策来守护！'],
      skill: ['霸王之击！', '挡我者死！'],
      victory: ['哈哈！小霸王之名，名副其实！', '江东英杰，非我莫属！'],
      defeat: ['可恶...竟输了...', '江东基业...不能断送在我手里...'],
      bondMet: { zhouyu: '公瑾兄！又一起杀敌！', sunshangxiang: '妹妹，哥保护你！' },
      lowMorale: ['唉...想念公瑾了...', '英雄气短...'],
      highMorale: ['今日横扫千军！', '小霸王出征，寸草不生！'],
    },
    luxun: {
      battleStart: ['火烧连营之策，已成。', '陆逊在此。'],
      skill: ['火烧连营！', '全军出击！'],
      victory: ['一把火...足矣。', '夷陵大捷。'],
      defeat: ['唔...计策被识破了...', '需要重新部署...'],
      lowMorale: ['年纪轻轻...总被人小看...', '大都督之位...任重道远...'],
      highMorale: ['今日胸有成竹！', '火计已成，大获全胜！'],
    },
    ganningwu: {
      battleStart: ['铃铃铃～锦帆贼来了！', '百骑劫营！甘宁到！'],
      skill: ['百骑劫营！', '杀！'],
      victory: ['哈哈哈！来去如风！', '锦帆贼的威名又添一笔！'],
      defeat: ['可恶...这次运气不好...', '下次百骑变千骑！'],
      lowMorale: ['锦帆不再飘...', '没有仗打好闷...'],
      highMorale: ['今日劫营去！', '铃铛响，甘宁到！'],
    },
    taishici: {
      battleStart: ['大丈夫生于乱世，当带三尺剑！', '太史慈在此！'],
      skill: ['神射！', '箭无虚发！'],
      victory: ['大丈夫之志，不可辜负！', '信义为先！'],
      defeat: ['壮志未酬...', '恨不能再战...'],
      lowMorale: ['信义之士...却找不到明主...', '射得再准也无用...'],
      highMorale: ['今日箭无虚发！', '信义当头，万夫莫敌！'],
    },
    zhangzhao: {
      battleStart: ['老夫有一策...', '稳中求胜，方为上策。'],
      skill: ['定国安邦！', '听老夫一言！'],
      victory: ['不出所料。', '内事不决问张昭。'],
      defeat: ['唉...老夫失算了。', '需要重新部署。'],
      lowMorale: ['吴国...还能撑多久...', '老了...不中用了...'],
      highMorale: ['今日定有妙计！', '老骥伏枥，志在千里！'],
    },
    lusu: {
      battleStart: ['和为贵...但该打还得打。', '鲁肃在此。'],
      skill: ['榻上策！', '联盟之力！'],
      victory: ['和平共处，方为上策。', '孙刘联盟，固若金汤。'],
      defeat: ['联盟...出了问题...', '外交失败了...'],
      lowMorale: ['两头为难...', '做和事佬真累...'],
      highMorale: ['今日定促成联盟大计！', '忠厚者必有后福！'],
    },
    sunquan: {
      battleStart: ['生子当如孙仲谋！', '碧眼儿御驾亲征！'],
      skill: ['坐断东南！', '吴国万岁！'],
      victory: ['东吴基业，万古长存！', '孙仲谋之名，非浪得虚名。'],
      defeat: ['不...东吴不能倒...', '暂退...另图良策...'],
      lowMorale: ['称帝之路...如此艰难...', '父兄之业...好重...'],
      highMorale: ['今日吴国称霸！', '东南之主，天命所归！'],
    },

    // ── 群雄 ──
    lvbu: {
      battleStart: ['天下无双！', '吕布在此，谁敢犯我！'],
      skill: ['看我方天画戟！', '无双！', '赤兔马下，无一合之将！', '天下第一——方天画戟斩！', '人中吕布，马中赤兔——来！', '戟扫八方，无人可挡！'],
      victory: ['哼，不堪一击。', '天下第一，非我莫属！'],
      defeat: ['不可能...我是吕布...', '大丈夫...'],
      bondMet: { diaochan: '貂蝉...为你，我愿战天下。', caocao: '曹操...你配不上我。' },
      lowMorale: ['谁都不信任吕布...', '赤兔马...你还在吗...'],
      highMorale: ['天下无敌！哈哈哈！', '方天画戟今日饮血！'],
    },
    diaochan: {
      battleStart: ['妾身虽弱，愿为大局。', '月下起舞...'],
      skill: ['闭月羞花...', '将军，请看这边~'],
      victory: ['呵呵，男人真好骗。', '任务完成。'],
      defeat: ['花落人亡...', '可惜了...'],
      bondMet: { lvbu: '将军...要保重啊。', zhenji: '甄姬妹妹，你真美。' },
      lowMorale: ['寂寞...', '美人如花隔云端...'],
      highMorale: ['今夜月色真美，适合跳舞。', '闭月之姿，倾国倾城！'],
    },
    zhangjiao: {
      battleStart: ['苍天已死，黄天当立！', '岁在甲子，天下大吉！'],
      skill: ['天雷降世！', '太平道法！'],
      victory: ['天命所归！黄天万岁！', '太平道...终将胜利！'],
      defeat: ['苍天...还没死吗...', '黄天...当立...'],
      lowMorale: ['太平之世...遥遥无期...', '道法修为不够...'],
      highMorale: ['今日天雷震震！', '苍天已死！黄天当立！'],
    },
    dongzhuo: {
      battleStart: ['不服者死！', '太师驾到，跪！'],
      skill: ['暴政！', '天下都是本太师的！'],
      victory: ['哈哈哈！谁敢反我！', '本太师...天下第一！'],
      defeat: ['吕布！保护本太师！', '不可能...'],
      lowMorale: ['酒喝多了...头疼...', '那些逆臣...烦死了...'],
      highMorale: ['今日大宴群臣！', '天下尽在掌中！'],
    },
    yuanshao: {
      battleStart: ['四世三公袁本初！', '河北之地，本初说了算！'],
      skill: ['官渡列阵！', '河北精锐，出击！'],
      victory: ['门生故吏遍天下！', '四世三公之威，不可阻挡！'],
      defeat: ['官渡...怎会输...', '优柔寡断...是我的错...'],
      lowMorale: ['田丰...沮授...你们说得对...', '名门之后...又如何...'],
      highMorale: ['河北四州尽在我手！', '今日定扫平天下！'],
    },
    menghuo: {
      battleStart: ['俺是南蛮王！', '蛮力无敌！'],
      skill: ['看俺的蛮力！', '南蛮王之怒！'],
      victory: ['哈哈哈！谁说蛮人不行！', '南蛮王不是吹的！'],
      defeat: ['这次不算！再来！', '第几次被擒了...算了不数了...'],
      bondMet: { zhurong: '老婆！一起上！', zhugeLiang: '诸葛先生...俺服了。' },
      lowMorale: ['被擒太多次了...没脸见人...', '南中太热了...不想动...'],
      highMorale: ['今天蛮力翻倍！', '南蛮勇士！冲啊！'],
    },
    zhurong: {
      battleStart: ['火神后裔祝融！', '飞刀准备！'],
      skill: ['飞刀！', '看我的火焰飞刀！'],
      victory: ['哼，就这？', '火神的力量不是开玩笑的！'],
      defeat: ['大王...我们走...', '下次一定赢！'],
      bondMet: { menghuo: '大王！看我的！' },
      lowMorale: ['大王又被抓了...', '南中水土不服...'],
      highMorale: ['火焰在我血液中燃烧！', '今日飞刀百发百中！'],
    },
    huatuo: {
      battleStart: ['医者仁心，不得已而战。', '五禽戏...开始。'],
      skill: ['五禽戏！', '妙手回春！'],
      victory: ['战争结束了...该救人了。', '但愿天下无疾苦。'],
      defeat: ['医术救不了所有人...', '唉...无力回天。'],
      bondMet: { liubei: '刘使君，仁心难得。' },
      lowMorale: ['病人太多...救不过来...', '刮骨疗毒之痛...'], 
      highMorale: ['今日神清气爽！', '五禽戏修炼有成！'],
    },
    pangtong: {
      battleStart: ['凤雏庞统，献上一计。', '连环计...开始。'],
      skill: ['连环计！', '且看凤雏之谋！'],
      victory: ['凤雏之名，不逊卧龙。', '哈，被我算计了吧。'],
      defeat: ['落凤坡...不...还没到那一步。', '天妒英才...'],
      bondMet: { zhugeLiang: '孔明兄，好久不见。' },
      lowMorale: ['容貌丑陋...不被重用...', '凤雏...听着好听，有什么用...'],
      highMorale: ['今日妙计百出！', '凤雏展翅！'],
    },
  },

  // ═══════════════════════════════════════
  // CORE API
  // ═══════════════════════════════════════

  // Get personality state for a hero (mood, loyalty, battle count, etc.)
  getState(heroId) {
    if (typeof Storage !== 'undefined' && Storage.getHeroPersonality) {
      return Storage.getHeroPersonality(heroId);
    }
    return this._defaultState();
  },

  saveState(heroId, state) {
    if (typeof Storage !== 'undefined' && Storage.saveHeroPersonality) {
      Storage.saveHeroPersonality(heroId, state);
    }
  },

  _defaultState() {
    return {
      moodValue: 0,        // -100 to 100
      isFurious: false,
      loyalty: 60,          // 0-100
      battlesUsed: 0,       // total battles
      battlesSinceUsed: 0,  // battles since last used
      lastBattleTime: 0,
    };
  },

  // Get current mood object for a hero
  getHeroMood(heroId) {
    const state = this.getState(heroId);
    return this.getMoodFromValue(state.moodValue, state.isFurious);
  },

  // Get loyalty tier for a hero
  getHeroLoyalty(heroId) {
    const state = this.getState(heroId);
    return { value: state.loyalty, tier: this.getLoyaltyTier(state.loyalty) };
  },

  // ═══════════════════════════════════════
  // BOND QUERIES
  // ═══════════════════════════════════════

  // Get all bonds a hero belongs to
  getHeroBonds(heroId) {
    return this.BONDS.filter(b => b.heroes.includes(heroId));
  },

  // Get active bonds for a team (heroes present)
  getActiveBonds(teamHeroIds) {
    const active = [];
    for (const bond of this.BONDS) {
      const minReq = bond.minRequired || bond.heroes.length;
      const present = bond.heroes.filter(h => teamHeroIds.includes(h));
      if (present.length >= minReq) {
        active.push({ ...bond, presentCount: present.length, totalRequired: bond.heroes.length });
      }
    }
    return active;
  },

  // Check bond activation status (for roster display)
  getBondStatus(bondId, ownedHeroIds) {
    const bond = this.BONDS.find(b => b.id === bondId);
    if (!bond) return null;
    const minReq = bond.minRequired || bond.heroes.length;
    const owned = bond.heroes.filter(h => ownedHeroIds.includes(h));
    return {
      bond,
      ownedCount: owned.length,
      totalRequired: bond.heroes.length,
      minRequired: minReq,
      isOwned: owned.length >= minReq,
      ownedHeroes: owned,
      missingHeroes: bond.heroes.filter(h => !ownedHeroIds.includes(h)),
    };
  },

  // ═══════════════════════════════════════
  // BATTLE INTEGRATION
  // ═══════════════════════════════════════

  // Apply mood effects to fighter stats
  applyMoodEffects(fighter) {
    const state = this.getState(fighter.id);
    const mood = this.getMoodFromValue(state.moodValue, state.isFurious);
    if (!mood.effects) return;

    for (const [stat, pct] of Object.entries(mood.effects)) {
      if (stat === 'skill_dmg') continue; // handled separately in skill use
      if (fighter[stat] !== undefined) {
        fighter[stat] = Math.floor(fighter[stat] * (1 + pct));
      }
    }
    // Store mood on fighter for later reference
    fighter._mood = mood;
    fighter._moodState = state;
  },

  // Apply bond bonuses to fighters
  applyBondEffects(fighters) {
    const ids = fighters.filter(f => f).map(f => f.id);
    const activeBonds = this.getActiveBonds(ids);
    for (const bond of activeBonds) {
      for (const f of fighters) {
        if (!f || !bond.heroes.includes(f.id)) continue;
        const bonus = bond.bonus;
        if (bonus.atk) f.atk = Math.floor(f.atk * (1 + bonus.atk));
        if (bonus.def) f.def = Math.floor(f.def * (1 + bonus.def));
        if (bonus.hp) { f.hp = Math.floor(f.hp * (1 + bonus.hp)); f.maxHp = Math.floor(f.maxHp * (1 + bonus.hp)); }
        if (bonus.spd) f.spd = Math.floor(f.spd * (1 + bonus.spd));
        if (bonus.int) f.int = Math.floor(f.int * (1 + bonus.int));
        if (bonus.crit) f._bondCrit = (f._bondCrit || 0) + bonus.crit * 100;
        if (bonus.skill_dmg) f._bondSkillDmg = (f._bondSkillDmg || 0) + bonus.skill_dmg;
        if (bonus.rage_gain) f._bondRageGain = (f._bondRageGain || 0) + bonus.rage_gain;
        if (bonus.heal) f._bondHealBonus = (f._bondHealBonus || 0) + bonus.heal;
      }
    }
    return activeBonds;
  },

  // Apply loyalty effects to fighter
  applyLoyaltyEffects(fighter) {
    const state = this.getState(fighter.id);
    const tier = this.getLoyaltyTier(state.loyalty);
    fighter._loyalty = state.loyalty;
    fighter._loyaltyTier = tier;

    if (state.loyalty >= 80) {
      // High loyalty: +5% all stats
      fighter.atk = Math.floor(fighter.atk * 1.05);
      fighter.def = Math.floor(fighter.def * 1.05);
      fighter.hp = Math.floor(fighter.hp * 1.05);
      fighter.maxHp = Math.floor(fighter.maxHp * 1.05);
      fighter.spd = Math.floor(fighter.spd * 1.05);
      fighter.int = Math.floor(fighter.int * 1.05);
    }
  },

  // Check if hero refuses orders (low loyalty)
  checkLoyaltyRefusal(fighter) {
    if (!fighter._loyalty || fighter._loyalty >= 40) return false;
    return Math.random() < 0.03; // 3% chance to refuse
  },

  // Check if furious hero attacks ally
  checkFuriousAllyAttack(fighter) {
    if (!fighter._mood || fighter._mood.id !== 'furious') return false;
    return Math.random() < 0.05; // 5% chance
  },

  // ═══════════════════════════════════════
  // POST-BATTLE UPDATES
  // ═══════════════════════════════════════

  onBattleEnd(teamHeroIds, result, allRosterIds) {
    const activeBonds = this.getActiveBonds(teamHeroIds);

    for (const heroId of teamHeroIds) {
      if (!HEROES[heroId]) continue;
      const state = this.getState(heroId);

      // Win/Loss mood change
      if (result === 'victory') {
        state.moodValue = Math.min(100, state.moodValue + 15);
        state.loyalty = Math.min(100, state.loyalty + 2);
      } else {
        state.moodValue = Math.max(-100, state.moodValue - 10);
        state.loyalty = Math.max(0, state.loyalty - 1);
      }

      // Bond partner mood boost
      const heroBonds = this.getHeroBonds(heroId);
      for (const bond of heroBonds) {
        const partnersPresent = bond.heroes.filter(h => h !== heroId && teamHeroIds.includes(h));
        if (partnersPresent.length > 0) {
          state.moodValue = Math.min(100, state.moodValue + 10);
          state.loyalty = Math.min(100, state.loyalty + 3);
          state.isFurious = false;
        }
      }

      // Reset battle counters
      state.battlesUsed++;
      state.battlesSinceUsed = 0;
      state.lastBattleTime = Date.now();

      this.saveState(heroId, state);
    }

    // Update heroes NOT in battle (idle penalty)
    if (allRosterIds) {
      for (const heroId of allRosterIds) {
        if (teamHeroIds.includes(heroId)) continue;
        if (!HEROES[heroId]) continue;
        const state = this.getState(heroId);
        state.battlesSinceUsed++;

        // Idle drift: after 3+ battles unused, mood drifts towards depressed
        if (state.battlesSinceUsed >= 3) {
          state.moodValue = Math.max(-100, state.moodValue - 5);
        }

        this.saveState(heroId, state);
      }
    }

    // Check for loyalty 0 defection
    const defected = [];
    for (const heroId of allRosterIds || []) {
      const state = this.getState(heroId);
      if (state.loyalty <= 0 && heroId !== 'soldier' && heroId !== 'archer_recruit') {
        defected.push(heroId);
      }
    }
    return { defected };
  },

  // Daily loyalty decay for unused heroes
  dailyLoyaltyDecay() {
    if (typeof Storage === 'undefined') return;
    const roster = Storage.getRoster();
    const lastDecay = Storage._get('loyaltyLastDecay', 0);
    const now = Date.now();
    const dayMs = 86400000;

    if (now - lastDecay < dayMs) return; // Already decayed today

    for (const heroId of Object.keys(roster)) {
      const state = this.getState(heroId);
      const timeSinceLastBattle = now - (state.lastBattleTime || now);
      const daysIdle = Math.floor(timeSinceLastBattle / dayMs);

      if (daysIdle >= 1) {
        state.loyalty = Math.max(0, state.loyalty - 1);
        this.saveState(heroId, state);
      }
    }

    Storage._set('loyaltyLastDecay', now);
  },

  // ═══════════════════════════════════════
  // DIALOGUE SYSTEM
  // ═══════════════════════════════════════

  // Get a random line for an event
  getLine(heroId, event, context) {
    const lines = this.HERO_LINES[heroId];
    if (!lines) return null;

    // Bond-specific greeting
    if (event === 'bondMet' && context?.partnerId && lines.bondMet?.[context.partnerId]) {
      return lines.bondMet[context.partnerId];
    }

    // Mood-based lines
    if (event === 'idle') {
      const mood = this.getHeroMood(heroId);
      if (mood.id === 'depressed' || mood.id === 'calm') {
        const pool = lines.lowMorale || [];
        if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
      }
      if (mood.id === 'elated' || mood.id === 'excited') {
        const pool = lines.highMorale || [];
        if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
      }
    }

    const pool = lines[event];
    if (!pool || !Array.isArray(pool) || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  // ═══════════════════════════════════════
  // DIALOGUE BUBBLE (DOM-based overlay)
  // ═══════════════════════════════════════

  _activeBubbles: [],

  showDialogueBubble(heroId, text, side, posX, posY, container) {
    if (!text || !container) return;

    const bubble = document.createElement('div');
    bubble.className = 'dialogue-bubble ' + (side === 'player' ? 'bubble-ally' : 'bubble-enemy');
    bubble.textContent = text;

    // Position relative to the canvas container
    bubble.style.left = posX + 'px';
    bubble.style.top = (posY - 50) + 'px';

    container.appendChild(bubble);
    this._activeBubbles.push(bubble);

    // Animate in
    requestAnimationFrame(() => {
      bubble.classList.add('bubble-show');
    });

    // Remove after 2.5 seconds
    setTimeout(() => {
      bubble.classList.add('bubble-hide');
      setTimeout(() => {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        this._activeBubbles = this._activeBubbles.filter(b => b !== bubble);
      }, 500);
    }, 2500);
  },

  clearAllBubbles() {
    for (const bubble of this._activeBubbles) {
      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
    }
    this._activeBubbles = [];
  },

  // ═══════════════════════════════════════
  // UI RENDERING HELPERS
  // ═══════════════════════════════════════

  // Render bond section for hero detail page
  renderBondSection(heroId) {
    const bonds = this.getHeroBonds(heroId);
    if (bonds.length === 0) return '';

    const roster = typeof Storage !== 'undefined' ? Storage.getRoster() : {};
    const ownedIds = Object.keys(roster);

    let html = '<div class="card personality-bond-card">';
    html += '<div style="font-size:14px;font-weight:600;margin-bottom:12px">' +
            '<span class="bond-section-icon">🔗</span> 英雄羁绊</div>';

    for (const bond of bonds) {
      const status = this.getBondStatus(bond.id, ownedIds);
      const isActive = status.isOwned;

      html += '<div class="bond-item' + (isActive ? ' bond-active' : '') + '">';
      html += '<div class="bond-header">';
      html += '<span class="bond-icon">' + bond.icon + '</span>';
      html += '<span class="bond-name">' + bond.name + '</span>';
      html += '<span class="bond-status">' + (isActive ? '✨ 已激活' : status.ownedCount + '/' + status.minRequired) + '</span>';
      html += '</div>';
      html += '<div class="bond-desc">' + bond.desc + '</div>';
      html += '<div class="bond-heroes">';
      for (const hid of bond.heroes) {
        const hero = HEROES[hid];
        if (!hero) continue;
        const owned = ownedIds.includes(hid);
        html += '<span class="bond-hero-tag' + (owned ? ' owned' : ' missing') + '">';
        if (typeof Visuals !== 'undefined') {
          html += Visuals.heroPortrait(hid, 'xs') + ' ';
        }
        html += hero.name + '</span>';
      }
      html += '</div>';
      if (isActive) {
        html += '<div class="bond-bonus">加成: ' + bond.bonusDesc + '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  // Render mood & loyalty indicators for hero detail
  renderPersonalitySection(heroId) {
    const state = this.getState(heroId);
    const mood = this.getMoodFromValue(state.moodValue, state.isFurious);
    const loyaltyTier = this.getLoyaltyTier(state.loyalty);

    let html = '<div class="card personality-status-card">';
    html += '<div style="font-size:14px;font-weight:600;margin-bottom:12px">' +
            '<span class="bond-section-icon">🧠</span> 英雄状态</div>';

    // Mood display
    html += '<div class="personality-row">';
    html += '<span class="personality-label">心情</span>';
    html += '<span class="mood-badge" style="--mood-color:' + mood.color + '">';
    html += mood.emoji + ' ' + mood.name + '</span>';
    if (Object.keys(mood.effects).length > 0) {
      const effectStrs = [];
      for (const [stat, val] of Object.entries(mood.effects)) {
        const sign = val > 0 ? '+' : '';
        const label = { atk: 'ATK', def: 'DEF', spd: 'SPD', int: 'INT', skill_dmg: '技能伤害' }[stat] || stat;
        effectStrs.push(label + sign + Math.round(val * 100) + '%');
      }
      html += '<span class="mood-effects">' + effectStrs.join(', ') + '</span>';
    }
    html += '</div>';

    // Loyalty display
    html += '<div class="personality-row">';
    html += '<span class="personality-label">忠诚</span>';
    html += '<div class="loyalty-bar-wrap">';
    html += '<div class="loyalty-bar" style="width:' + state.loyalty + '%;background:' + loyaltyTier.color + '"></div>';
    html += '</div>';
    html += '<span class="loyalty-value" style="color:' + loyaltyTier.color + '">' + loyaltyTier.icon + ' ' + state.loyalty + '</span>';
    html += '</div>';

    // Battle stats
    html += '<div class="personality-row">';
    html += '<span class="personality-label">出战次数</span>';
    html += '<span class="personality-value">' + state.battlesUsed + '次</span>';
    html += '</div>';

    if (state.battlesSinceUsed >= 3) {
      html += '<div class="personality-idle-warning">⚠️ 已闲置' + state.battlesSinceUsed + '场未出战，心情下降中</div>';
    }

    html += '</div>';

    // Dialogue preview
    const line = this.getLine(heroId, 'idle');
    if (line) {
      html += '<div class="card personality-dialogue-card">';
      html += '<div class="hero-dialogue-preview">';
      html += '<span class="dialogue-quote">"' + line + '"</span>';
      html += '</div>';
      html += '</div>';
    }

    return html;
  },

  // Render active bonds in battle header
  renderBattleBondBanner(teamHeroIds) {
    const activeBonds = this.getActiveBonds(teamHeroIds);
    if (activeBonds.length === 0) return '';

    let html = '<div class="battle-bond-banner">';
    for (const bond of activeBonds) {
      html += '<span class="battle-bond-tag">' + bond.icon + ' ' + bond.name + '</span>';
    }
    html += '</div>';
    return html;
  },
};

// ═══════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════
if (typeof window !== 'undefined') {
  window.HeroPersonality = HeroPersonality;

  // Convenience HERO_QUOTES global for quick access
  // Maps heroId → { battle, victory, defeat } using existing HERO_LINES
  window.HERO_QUOTES = new Proxy({}, {
    get(_, heroId) {
      if (heroId === '_default') {
        return { battle: '为主公征战，义不容辞！', victory: '旗开得胜，再创辉煌！', defeat: '虽败犹荣，卷土重来！' };
      }
      const lines = HeroPersonality.HERO_LINES[heroId];
      if (!lines) return window.HERO_QUOTES._default;
      const pick = arr => (arr && arr.length > 0) ? arr[Math.floor(Math.random() * arr.length)] : null;
      return {
        battle: pick(lines.battleStart) || '为主公征战，义不容辞！',
        victory: pick(lines.victory) || '旗开得胜，再创辉煌！',
        defeat: pick(lines.defeat) || '虽败犹荣，卷土重来！',
      };
    }
  });
}

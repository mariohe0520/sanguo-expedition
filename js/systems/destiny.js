// 三国·天命 — Destiny Choice System (天命抉择)
// Cinematic branching choices that permanently alter the game world

const Destiny = {

  // ===== 12 MAJOR DESTINY CHOICES =====
  CHOICES: [
    {
      id: 'hulao_pass',
      trigger: { territory: 'hulao', stage: 3 },
      title: '虎牢关之战',
      narrative: '董卓已败，虎牢关大开。十八路诸侯各怀心思，天下将往何处？',
      optionA: {
        text: '追击董卓，斩草除根',
        desc: '穷追猛打，不给喘息之机',
        hint: '可能解锁新领地，但树敌更多...',
        consequence: '长安解锁，但董卓残部成为复仇势力，后续出现更强敌人',
        effects: { unlockTerritory: 'changan', buffEnemy: { faction: 'qun', atk: 0.15 }, reputation: 10 }
      },
      optionB: {
        text: '安抚百姓，收拢人心',
        desc: '先稳根据地，再图天下',
        hint: '民心可用，招募费用降低...',
        consequence: '获得"仁德之主"称号，民心所向，招募费用降低，但董卓逃回长安壮大势力',
        effects: { buffEnemy: { territory: 'changan', def: 0.2 }, title: '仁德之主', gachaDiscount: 0.15, reputation: 20 }
      },
    },
    {
      id: 'guandu_gambit',
      trigger: { territory: 'guandu', stage: 3 },
      title: '官渡之策',
      narrative: '袁绍大军压境，兵力悬殊。许攸来投，献计火烧乌巢。但这可能是诈降...',
      optionA: {
        text: '信许攸，火烧乌巢',
        desc: '孤注一掷，奇袭粮仓',
        hint: '可能直取邺城，但功臣难驭...',
        consequence: '大胜！袁绍势力崩溃，但战后许攸居功自傲，忠诚度下降',
        effects: { instantWin: 'yecheng', lootMultiplier: 2.0, loyaltyDrop: { heroes: ['caocao'], amount: -10 }, reputation: 5 }
      },
      optionB: {
        text: '正面决战，堂堂正正',
        desc: '以少胜多，靠实力说话',
        hint: '苦战在所难免，但军心凝聚...',
        consequence: '苦战惨胜，损失惨重但声望大增，所有英雄忠诚度上升',
        effects: { teamDamage: 0.5, loyaltyAll: 10, reputation: 15 }
      },
    },
    {
      id: 'chibi_flame',
      trigger: { territory: 'chibi', stage: 3 },
      title: '赤壁烈焰',
      narrative: '曹操百万大军，铁锁连环。周瑜问计，东风将起...',
      optionA: {
        text: '火攻连环船',
        desc: '借东风，一把火烧尽曹军',
        hint: '可获传说谋略卡，但结下死仇...',
        consequence: '经典火攻！获得传说谋略卡"借东风"，但曹操从此视你为死敌',
        effects: { gainCard: 'east_wind', buffEnemy: { faction: 'wei', atk: 0.2 }, reputation: 10 }
      },
      optionB: {
        text: '暗中联络曹营内应',
        desc: '不战而屈人之兵',
        hint: '可得曹营降将碎片，但盟友不满...',
        consequence: '曹军内乱，不战而退。获得曹营降将碎片，但东吴盟友不满你的阴谋手段',
        effects: { gainHeroShards: { hero: 'guojia', amount: 10 }, allyTrust: { faction: 'wu', change: -20 }, reputation: -5 }
      },
    },
    {
      id: 'jingzhou_oath',
      trigger: { territory: 'jingzhou', stage: 3 },
      title: '荆州之约',
      narrative: '荆州到手，但孙权索要。关羽驻守，刘备远在西川...',
      optionA: {
        text: '信守承诺，归还荆州',
        desc: '维护联盟，以大局为重',
        hint: '失地换信任，可能解锁东吴名将...',
        consequence: '失去荆州但获得东吴信任，吴蜀联盟加强，后续吴将可招募',
        effects: { loseTerritory: 'jingzhou', allyTrust: { faction: 'wu', change: 30 }, unlockRecruits: ['zhouyu', 'sunce'], reputation: 25 }
      },
      optionB: {
        text: '拒不归还，据为己有',
        desc: '荆州乃兵家必争，不可让也',
        hint: '保住领地，但东吴翻脸...',
        consequence: '保住荆州但东吴翻脸，关羽面临腹背受敌的危险...',
        effects: { keepTerritory: 'jingzhou', allyTrust: { faction: 'wu', change: -50 }, heroRisk: 'guanyu', reputation: -10 }
      },
    },
    {
      id: 'hanzhong_king',
      trigger: { territory: 'hanzhong', stage: 3 },
      title: '汉中称王',
      narrative: '汉中已定，群臣劝进。是否称汉中王，与曹操分庭抗礼？',
      optionA: {
        text: '称王！汉室正统在我！',
        desc: '正式建立政权',
        hint: '全军振奋，但群雄侧目...',
        consequence: '全军士气大振，但曹操和孙权同时视你为威胁',
        effects: { title: '汉中王', loyaltyAll: 15, buffEnemy: { faction: 'wei', atk: 0.1 }, buffEnemy2: { faction: 'wu', atk: 0.1 }, reputation: 20 }
      },
      optionB: {
        text: '韬光养晦，不急称王',
        desc: '实力未足，先积蓄力量',
        hint: '低调发展，城池收益短期翻倍...',
        consequence: '没有引起曹魏东吴注意，暗中发展，城池收益翻倍一段时间',
        effects: { cityIncomeMultiplier: 2.0, duration: 72, reputation: 5 }
      },
    },
    {
      id: 'nanzhong_mercy',
      trigger: { territory: 'nanzhong', stage: 3 },
      title: '七擒孟获',
      narrative: '孟获已被擒获七次，南中蛮族心服口服...',
      optionA: {
        text: '纳为己用，蛮兵归心',
        desc: '以德服人，化敌为友',
        hint: '可获蛮族英雄，南中繁荣...',
        consequence: '获得孟获+祝融，南中永不叛乱，额外蛮兵部队',
        effects: { gainHero: ['menghuo', 'zhurong'], territoryBonus: { nanzhong: { income: 2.0 } }, reputation: 20 }
      },
      optionB: {
        text: '斩杀示威，永绝后患',
        desc: '蛮夷不可信，杀一儆百',
        hint: '省去后顾之忧，但代价沉重...',
        consequence: '南中平定但代价沉重，无法获得蛮族英雄，部分英雄忠诚度下降',
        effects: { cannotRecruit: ['menghuo', 'zhurong'], loyaltyDrop: { heroes: ['liubei', 'zhugeLiang'], amount: -15 }, reputation: -15 }
      },
    },
    {
      id: 'wuzhang_stars',
      trigger: { territory: 'wuzhang', stage: 3 },
      title: '五丈原·星落',
      narrative: '诸葛亮积劳成疾，七星灯续命之际，魏延闯入...',
      optionA: {
        text: '拼死护灯，续命成功',
        desc: '不惜一切代价保护军师',
        hint: '军师永久强化，但有人叛逃...',
        consequence: '诸葛亮续命成功但魏延叛逃，诸葛亮获得"天命"状态，魏延成为敌方Boss',
        effects: { heroBuff: { hero: 'zhugeLiang', permanent: true, allStats: 0.2 }, loseHero: 'weiyan', newBoss: 'weiyan', reputation: 10 }
      },
      optionB: {
        text: '天命难违，接受现实',
        desc: '军师...一路走好',
        hint: '痛失军师，但遗志永存...',
        consequence: '诸葛亮陨落，但留下锦囊妙计。全军获得"遗志"永久buff，解锁姜维',
        effects: { loseHero: 'zhugeLiang', gainHero: ['jiangwei'], teamBuff: { permanent: true, allStats: 0.1 }, gainCard: 'seven_star_lamp', reputation: 15 }
      },
    },
    {
      id: 'xiapi_prisoner',
      trigger: { territory: 'xiapi', stage: 3 },
      title: '下邳之围',
      narrative: '吕布被擒，跪地求降。"明公不见布事丁建阳、董太师之事乎？"',
      optionA: {
        text: '留其性命，收为己用',
        desc: '天下第一猛将，不可多得',
        hint: '获得猛将，但忠诚堪忧...',
        consequence: '获得吕布！但他忠诚度极低，随时可能叛变...',
        effects: { gainHero: ['lvbu'], heroLoyalty: { hero: 'lvbu', value: 20 }, heroRisk: 'lvbu', reputation: -5 }
      },
      optionB: {
        text: '杀之！此人反复无常',
        desc: '三姓家奴，留之必祸',
        hint: '获得神兵，但有人悲伤...',
        consequence: '吕布已死，但貂蝉悲痛欲绝，若已有貂蝉则忠诚度暴跌',
        effects: { cannotRecruit: ['lvbu'], loyaltyDrop: { heroes: ['diaochan'], amount: -30 }, gainEquip: 'fang_tian_ji', reputation: 5 }
      },
    },
    {
      id: 'chengdu_throne',
      trigger: { territory: 'chengdu', stage: 3 },
      title: '入主成都',
      narrative: '刘璋开城投降，益州归于掌中。百姓夹道欢迎，还是心怀忐忑？',
      optionA: {
        text: '善待刘璋，以礼相待',
        desc: '仁义之名传天下',
        hint: '益州繁荣，获得"仁君"称号...',
        consequence: '益州民心归附，城池收益+50%，获得"仁君"称号',
        effects: { title: '仁君', territoryBonus: { chengdu: { income: 1.5 } }, loyaltyAll: 5, reputation: 20 }
      },
      optionB: {
        text: '软禁刘璋，清除旧势力',
        desc: '政治需要铁腕手段',
        hint: '军事大增，但仁义有损...',
        consequence: '益州完全掌控，军事实力大增，但"仁义"之名有损',
        effects: { teamBuff: { atk: 0.1, def: 0.1 }, loyaltyDrop: { heroes: ['liubei'], amount: -10 }, reputation: -10 }
      },
    },
    {
      id: 'xiliang_horse',
      trigger: { territory: 'xiliang', stage: 3 },
      title: '西凉铁骑',
      narrative: '西凉平定，马超归降。西北骏马无数，如何处置？',
      optionA: {
        text: '组建骑兵军团',
        desc: '天下精骑尽出西凉',
        hint: '骑兵系英雄永久强化...',
        consequence: '全军速度+15%，骑兵英雄永久强化',
        effects: { classBuff: { class: 'cavalry', spd: 0.15, atk: 0.1 }, reputation: 5 }
      },
      optionB: {
        text: '开放马市，发展经济',
        desc: '以商养军，细水长流',
        hint: '西凉收入翻3倍...',
        consequence: '西凉变为最高收益城池，金币收入翻3倍',
        effects: { territoryBonus: { xiliang: { income: 3.0 } }, reputation: 10 }
      },
    },
    {
      id: 'hefei_glory',
      trigger: { territory: 'hefei', stage: 3 },
      title: '合肥之战',
      narrative: '张辽八百破十万，威震逍遥津。如今轮到你来攻...',
      optionA: {
        text: '正面强攻，以牙还牙',
        desc: '用更猛的攻势碾碎他们',
        hint: '损失惨重但获得永久攻击加成...',
        consequence: '惨烈攻城战，损失惨重但获得"无畏战神"称号，ATK永久+10%',
        effects: { teamDamage: 0.6, title: '无畏战神', teamBuff: { permanent: true, atk: 0.1 }, reputation: 15 }
      },
      optionB: {
        text: '水淹合肥，智取',
        desc: '引淝水灌城',
        hint: '巧妙获胜，获得谋略卡...',
        consequence: '巧妙获胜，伤亡极小，获得谋略卡"水攻"',
        effects: { gainCard: 'flood_attack', reputation: 10 }
      },
    },
    {
      id: 'final_unification',
      trigger: { territory: 'all_conquered' },
      title: '天下归一',
      narrative: '所有城池已在你的旗下。天下一统，万民归心。但这份和平能持续多久？',
      optionA: {
        text: '开创盛世，以文治天下',
        desc: '放下兵戈，发展民生',
        hint: '和平盛世，收益翻倍...',
        consequence: '和平结局。城池收益全部翻倍，解锁"太平盛世"永久模式',
        effects: { ending: 'peace', allIncome: 2.0, title: '太平天子' }
      },
      optionB: {
        text: '继续征伐，打出国门',
        desc: '华夏不应止于此',
        hint: '解锁无限远征挑战...',
        consequence: '战争结局。解锁"远征模式"——无限新大陆挑战',
        effects: { ending: 'war', unlockEndgame: true, title: '征服者' }
      },
    },
  ],

  // ===== STATE MANAGEMENT =====
  getState() {
    return Storage.getDestinyState();
  },

  saveState(state) {
    Storage.saveDestinyState(state);
  },

  initState() {
    const existing = this.getState();
    if (existing && existing.choices) return existing;
    const state = {
      choices: {},        // { choiceId: { chosen: 'A'|'B', timestamp: number } }
      titles: [],         // earned titles
      activeBuffs: [],    // { type, value, expiresAt? }
      appliedEffects: {}, // track which effects have been applied
      reputation: 0,
    };
    this.saveState(state);
    return state;
  },

  // ===== TRIGGER CHECK =====
  // Called after a territory is fully conquered (stagesCleared === 3)
  checkTrigger(territoryId) {
    const state = this.initState();

    // Check for "all_conquered" trigger
    if (typeof KingdomMap !== 'undefined') {
      const mapStats = KingdomMap.getStats();
      if (mapStats.conquered >= mapStats.total) {
        const finalChoice = this.CHOICES.find(c => c.trigger.territory === 'all_conquered');
        if (finalChoice && !state.choices[finalChoice.id]) {
          return finalChoice;
        }
      }
    }

    // Check for territory-specific triggers
    for (const choice of this.CHOICES) {
      if (choice.trigger.territory === territoryId && !state.choices[choice.id]) {
        return choice;
      }
    }

    return null;
  },

  // ===== CHOICE MADE =====
  makeChoice(choiceId, option) {
    const state = this.initState();
    const choice = this.CHOICES.find(c => c.id === choiceId);
    if (!choice || state.choices[choiceId]) return;

    const chosen = option === 'A' ? choice.optionA : choice.optionB;
    state.choices[choiceId] = {
      chosen: option,
      timestamp: Date.now(),
      title: choice.title,
      text: chosen.text,
      consequence: chosen.consequence,
    };

    // Apply reputation
    if (chosen.effects.reputation) {
      state.reputation = (state.reputation || 0) + chosen.effects.reputation;
      // Also update KingdomMap reputation
      if (typeof KingdomMap !== 'undefined') {
        const mapState = KingdomMap.getState();
        if (mapState) {
          mapState.reputation = (mapState.reputation || 0) + chosen.effects.reputation;
          KingdomMap.saveState(mapState);
        }
      }
    }

    // Apply title
    if (chosen.effects.title) {
      if (!state.titles.includes(chosen.effects.title)) {
        state.titles.push(chosen.effects.title);
      }
    }

    this.saveState(state);
    this._applyEffects(choiceId, chosen.effects);
    return chosen;
  },

  // ===== EFFECT APPLICATION =====
  _applyEffects(choiceId, effects) {
    const state = this.getState();
    if (state.appliedEffects[choiceId]) return; // Already applied
    state.appliedEffects[choiceId] = true;
    this.saveState(state);

    // --- Unlock Territory ---
    if (effects.unlockTerritory && typeof KingdomMap !== 'undefined') {
      const mapState = KingdomMap.getState();
      if (mapState && mapState.territories[effects.unlockTerritory]) {
        if (mapState.territories[effects.unlockTerritory].status === 'locked') {
          mapState.territories[effects.unlockTerritory].status = 'available';
          KingdomMap.saveState(mapState);
        }
      }
    }

    // --- Lose Territory ---
    if (effects.loseTerritory && typeof KingdomMap !== 'undefined') {
      const mapState = KingdomMap.getState();
      if (mapState && mapState.territories[effects.loseTerritory]) {
        if (mapState.territories[effects.loseTerritory].status === 'conquered') {
          mapState.territories[effects.loseTerritory].status = 'available';
          mapState.territories[effects.loseTerritory].stagesCleared = 0;
          mapState.conqueredCount = Math.max(0, (mapState.conqueredCount || 0) - 1);
          KingdomMap.saveState(mapState);
        }
      }
    }

    // --- Buff Enemies (store for battle system to read) ---
    if (effects.buffEnemy) {
      const buffs = this._getActiveBuffs();
      buffs.push({ type: 'enemy_buff', ...effects.buffEnemy, source: choiceId });
      this._saveActiveBuffs(buffs);
    }
    if (effects.buffEnemy2) {
      const buffs = this._getActiveBuffs();
      buffs.push({ type: 'enemy_buff', ...effects.buffEnemy2, source: choiceId });
      this._saveActiveBuffs(buffs);
    }

    // --- Gain Hero ---
    if (effects.gainHero) {
      const heroes = Array.isArray(effects.gainHero) ? effects.gainHero : [effects.gainHero];
      for (const heroId of heroes) {
        if (typeof HEROES !== 'undefined' && HEROES[heroId]) {
          Storage.addHero(heroId);
        }
      }
    }

    // --- Lose Hero ---
    if (effects.loseHero) {
      const roster = Storage.getRoster();
      if (roster[effects.loseHero]) {
        delete roster[effects.loseHero];
        Storage.saveRoster(roster);
        // Remove from team if present
        const team = Storage.getTeam();
        for (let i = 0; i < team.length; i++) {
          if (team[i] === effects.loseHero) team[i] = null;
        }
        Storage.saveTeam(team);
      }
    }

    // --- Cannot Recruit (mark heroes as blocked) ---
    if (effects.cannotRecruit) {
      const state2 = this.getState();
      if (!state2.blockedHeroes) state2.blockedHeroes = [];
      for (const h of effects.cannotRecruit) {
        if (!state2.blockedHeroes.includes(h)) state2.blockedHeroes.push(h);
      }
      this.saveState(state2);
    }

    // --- Gain Hero Shards ---
    if (effects.gainHeroShards) {
      const sh = effects.gainHeroShards;
      if (sh.hero && sh.amount) {
        Storage.addShards(sh.hero, sh.amount);
      }
    }

    // --- Gain Card (Strategy) ---
    if (effects.gainCard && typeof Strategy !== 'undefined') {
      try {
        const stratState = Storage.getStrategyState();
        if (!stratState.ownedCards.includes(effects.gainCard)) {
          stratState.ownedCards.push(effects.gainCard);
          Storage.saveStrategyState(stratState);
        }
      } catch (e) { console.error('[Destiny gainCard]', e); }
    }

    // --- Gain Equipment ---
    if (effects.gainEquip && typeof Equipment !== 'undefined') {
      try {
        const drop = Equipment.generateDrop(8, true); // high-level boss drop
        if (drop) {
          Storage.addEquipment(drop);
        }
      } catch (e) { console.error('[Destiny gainEquip]', e); }
    }

    // --- Gacha Discount ---
    if (effects.gachaDiscount) {
      const s = this.getState();
      s.gachaDiscount = effects.gachaDiscount;
      this.saveState(s);
    }

    // --- Loyalty changes ---
    if (effects.loyaltyAll && typeof HeroPersonality !== 'undefined') {
      try {
        const roster = Storage.getRoster();
        for (const heroId of Object.keys(roster)) {
          const p = Storage.getHeroPersonality(heroId);
          p.loyalty = Math.min(100, Math.max(0, (p.loyalty || 60) + effects.loyaltyAll));
          Storage.saveHeroPersonality(heroId, p);
        }
      } catch (e) { console.error('[Destiny loyaltyAll]', e); }
    }

    if (effects.loyaltyDrop) {
      try {
        const heroes = effects.loyaltyDrop.heroes || [];
        const amount = effects.loyaltyDrop.amount || 0;
        for (const heroId of heroes) {
          if (typeof HeroPersonality !== 'undefined') {
            const p = Storage.getHeroPersonality(heroId);
            p.loyalty = Math.min(100, Math.max(0, (p.loyalty || 60) + amount));
            Storage.saveHeroPersonality(heroId, p);
          }
        }
      } catch (e) { console.error('[Destiny loyaltyDrop]', e); }
    }

    if (effects.heroLoyalty && typeof HeroPersonality !== 'undefined') {
      try {
        const p = Storage.getHeroPersonality(effects.heroLoyalty.hero);
        p.loyalty = effects.heroLoyalty.value;
        Storage.saveHeroPersonality(effects.heroLoyalty.hero, p);
      } catch (e) { console.error('[Destiny heroLoyalty]', e); }
    }

    // --- Unlock Recruits (make "comingSoon" heroes available) ---
    if (effects.unlockRecruits) {
      const s = this.getState();
      if (!s.unlockedRecruits) s.unlockedRecruits = [];
      for (const h of effects.unlockRecruits) {
        if (!s.unlockedRecruits.includes(h)) s.unlockedRecruits.push(h);
      }
      this.saveState(s);
    }

    // --- Team Buff (permanent or temporary) ---
    if (effects.teamBuff) {
      const s = this.getState();
      if (!s.teamBuffs) s.teamBuffs = [];
      s.teamBuffs.push({ ...effects.teamBuff, source: choiceId });
      this.saveState(s);
    }

    // --- Hero Buff (permanent) ---
    if (effects.heroBuff) {
      const s = this.getState();
      if (!s.heroBuffs) s.heroBuffs = [];
      s.heroBuffs.push({ ...effects.heroBuff, source: choiceId });
      this.saveState(s);
    }

    // --- Class Buff ---
    if (effects.classBuff) {
      const s = this.getState();
      if (!s.classBuffs) s.classBuffs = [];
      s.classBuffs.push({ ...effects.classBuff, source: choiceId });
      this.saveState(s);
    }

    // --- Territory Bonus ---
    if (effects.territoryBonus) {
      const s = this.getState();
      if (!s.territoryBonuses) s.territoryBonuses = {};
      for (const [tid, bonus] of Object.entries(effects.territoryBonus)) {
        s.territoryBonuses[tid] = bonus;
      }
      this.saveState(s);
    }

    // --- All Income multiplier ---
    if (effects.allIncome) {
      const s = this.getState();
      s.allIncomeMultiplier = effects.allIncome;
      this.saveState(s);
    }

    // --- City Income Multiplier (temporary) ---
    if (effects.cityIncomeMultiplier) {
      const s = this.getState();
      s.cityIncomeBoost = {
        multiplier: effects.cityIncomeMultiplier,
        expiresAt: Date.now() + (effects.duration || 72) * 3600000,
      };
      this.saveState(s);
    }

    // --- Instant Win (auto-conquer territory) ---
    if (effects.instantWin && typeof KingdomMap !== 'undefined') {
      const mapState = KingdomMap.getState();
      if (mapState && mapState.territories[effects.instantWin]) {
        mapState.territories[effects.instantWin].status = 'conquered';
        mapState.territories[effects.instantWin].stagesCleared = 3;
        mapState.conqueredCount = (mapState.conqueredCount || 0) + 1;
        // Unlock connections
        const t = KingdomMap.TERRITORIES[effects.instantWin];
        if (t) {
          for (const connId of t.connections) {
            if (mapState.territories[connId] && mapState.territories[connId].status === 'locked') {
              mapState.territories[connId].status = 'available';
            }
          }
        }
        KingdomMap.saveState(mapState);
      }
    }

    // --- Loot Multiplier (store temporarily) ---
    if (effects.lootMultiplier) {
      const s = this.getState();
      s.lootMultiplier = effects.lootMultiplier;
      this.saveState(s);
    }

    // --- Ending ---
    if (effects.ending) {
      const s = this.getState();
      s.ending = effects.ending;
      this.saveState(s);
    }

    // --- Endgame unlock ---
    if (effects.unlockEndgame) {
      const s = this.getState();
      s.endgameUnlocked = true;
      this.saveState(s);
    }
  },

  // ===== BUFF HELPERS =====
  _getActiveBuffs() {
    const s = this.getState();
    return s.activeBuffs || [];
  },

  _saveActiveBuffs(buffs) {
    const s = this.getState();
    s.activeBuffs = buffs;
    this.saveState(s);
  },

  // Get permanent team buffs for battle system integration
  getTeamBuffs() {
    const s = this.getState();
    return s.teamBuffs || [];
  },

  getHeroBuffs(heroId) {
    const s = this.getState();
    return (s.heroBuffs || []).filter(b => b.hero === heroId);
  },

  getClassBuffs(unitType) {
    const s = this.getState();
    return (s.classBuffs || []).filter(b => b.class === unitType);
  },

  getTerritoryBonus(territoryId) {
    const s = this.getState();
    return s.territoryBonuses ? (s.territoryBonuses[territoryId] || null) : null;
  },

  getCurrentTitle() {
    const s = this.getState();
    return s.titles && s.titles.length > 0 ? s.titles[s.titles.length - 1] : null;
  },

  getReputation() {
    const s = this.getState();
    return s.reputation || 0;
  },

  isHeroBlocked(heroId) {
    const s = this.getState();
    return s.blockedHeroes ? s.blockedHeroes.includes(heroId) : false;
  },

  // ===== DESTINY RECORD (天命录) =====
  getRecord() {
    const state = this.initState();
    return this.CHOICES.map(choice => {
      const made = state.choices[choice.id];
      return {
        id: choice.id,
        title: choice.title,
        narrative: choice.narrative,
        optionA: choice.optionA,
        optionB: choice.optionB,
        trigger: choice.trigger,
        chosen: made ? made.chosen : null,
        timestamp: made ? made.timestamp : null,
        consequence: made ? made.consequence : null,
      };
    });
  },

  // ===== UI RENDERING =====
  // Show full-screen cinematic destiny choice
  showChoice(choice, onComplete) {
    this._onComplete = onComplete;
    this._currentChoice = choice;
    this._typewriterTimeout = null;

    const overlay = document.getElementById('destiny-choice-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    overlay.classList.remove('hidden');
    overlay.classList.add('active');

    // Background container
    const bg = document.createElement('div');
    bg.className = 'destiny-bg';
    overlay.appendChild(bg);

    // Particles
    const particleContainer = document.createElement('div');
    particleContainer.className = 'destiny-particles';
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'destiny-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = Math.random() * 5 + 's';
      p.style.animationDuration = (3 + Math.random() * 4) + 's';
      particleContainer.appendChild(p);
    }
    overlay.appendChild(particleContainer);

    // Content container
    const content = document.createElement('div');
    content.className = 'destiny-choice-content';

    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'destiny-choice-title';
    titleEl.textContent = choice.title;
    content.appendChild(titleEl);

    // Decorative line
    const line = document.createElement('div');
    line.className = 'destiny-choice-line';
    content.appendChild(line);

    // Narrative (typewriter)
    const narrativeEl = document.createElement('div');
    narrativeEl.className = 'destiny-choice-narrative';
    narrativeEl.id = 'destiny-narrative-text';
    content.appendChild(narrativeEl);

    // Options container (hidden initially)
    const optionsEl = document.createElement('div');
    optionsEl.className = 'destiny-choice-options';
    optionsEl.id = 'destiny-choice-options';
    optionsEl.style.opacity = '0';
    optionsEl.style.pointerEvents = 'none';

    // Option A
    const cardA = this._createChoiceCard(choice.optionA, 'A', choice);
    optionsEl.appendChild(cardA);

    // Option B
    const cardB = this._createChoiceCard(choice.optionB, 'B', choice);
    optionsEl.appendChild(cardB);

    content.appendChild(optionsEl);
    overlay.appendChild(content);

    // Start typewriter after fade-in
    setTimeout(() => {
      this._typewriter(narrativeEl, choice.narrative, 0, () => {
        // Show options after narrative finishes
        setTimeout(() => {
          optionsEl.style.opacity = '1';
          optionsEl.style.pointerEvents = 'auto';
          optionsEl.classList.add('destiny-options-visible');
        }, 400);
      });
    }, 800);

    // Allow skipping typewriter by clicking narrative
    narrativeEl.addEventListener('click', () => {
      if (this._typewriterTimeout) {
        clearTimeout(this._typewriterTimeout);
        this._typewriterTimeout = null;
        narrativeEl.textContent = choice.narrative;
        setTimeout(() => {
          optionsEl.style.opacity = '1';
          optionsEl.style.pointerEvents = 'auto';
          optionsEl.classList.add('destiny-options-visible');
        }, 200);
      }
    });
  },

  _createChoiceCard(option, label, choice) {
    const card = document.createElement('div');
    card.className = 'destiny-card destiny-card-' + label.toLowerCase();

    card.innerHTML =
      '<div class="destiny-card-label">' + (label === 'A' ? '甲' : '乙') + '</div>' +
      '<div class="destiny-card-text">' + option.text + '</div>' +
      '<div class="destiny-card-desc">' + option.desc + '</div>' +
      '<div class="destiny-card-hint">' + option.hint + '</div>';

    card.addEventListener('click', () => {
      this._onChoiceMade(choice, label);
    });

    return card;
  },

  _onChoiceMade(choice, option) {
    const chosen = this.makeChoice(choice.id, option);
    if (!chosen) return;

    const overlay = document.getElementById('destiny-choice-overlay');
    const optionsEl = document.getElementById('destiny-choice-options');

    // Highlight chosen, dim other
    const cards = optionsEl.querySelectorAll('.destiny-card');
    cards.forEach(card => {
      card.style.pointerEvents = 'none';
      if (card.classList.contains('destiny-card-' + option.toLowerCase())) {
        card.classList.add('destiny-card-chosen');
      } else {
        card.classList.add('destiny-card-dimmed');
      }
    });

    // Flash effect
    const flash = document.createElement('div');
    flash.className = 'destiny-flash';
    overlay.appendChild(flash);

    // Show consequence after flash
    setTimeout(() => {
      flash.remove();
      const consequenceEl = document.createElement('div');
      consequenceEl.className = 'destiny-consequence';
      consequenceEl.innerHTML =
        '<div class="destiny-consequence-label">天命已定</div>' +
        '<div class="destiny-consequence-text">' + chosen.consequence + '</div>' +
        (chosen.effects.title ? '<div class="destiny-consequence-title">获得称号：「' + chosen.effects.title + '」</div>' : '') +
        '<button class="destiny-continue-btn" id="destiny-continue-btn">继续征途</button>';

      const content = overlay.querySelector('.destiny-choice-content');
      content.appendChild(consequenceEl);

      // Animate in
      requestAnimationFrame(() => {
        consequenceEl.classList.add('visible');
      });

      document.getElementById('destiny-continue-btn').addEventListener('click', () => {
        this._closeOverlay();
      });
    }, 600);
  },

  _closeOverlay() {
    const overlay = document.getElementById('destiny-choice-overlay');
    overlay.classList.add('closing');

    setTimeout(() => {
      overlay.classList.remove('active', 'closing');
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      if (this._onComplete) {
        this._onComplete();
        this._onComplete = null;
      }
    }, 600);
  },

  _typewriter(el, text, index, onComplete) {
    if (index >= text.length) {
      if (onComplete) onComplete();
      return;
    }
    el.textContent = text.substring(0, index + 1);
    // Pause longer at punctuation
    const char = text[index];
    const delay = '，。！？、'.includes(char) ? 120 : '；：'.includes(char) ? 100 : 45;
    this._typewriterTimeout = setTimeout(() => {
      this._typewriter(el, text, index + 1, onComplete);
    }, delay);
  },

  // ===== DESTINY RECORD UI (天命录) =====
  renderRecord() {
    const records = this.getRecord();
    const state = this.initState();

    let html = '<div class="destiny-record">';
    html += '<div class="destiny-record-header">';
    html += '<div class="destiny-record-title">天命录</div>';
    html += '<div class="destiny-record-subtitle">每一个选择，都塑造了不同的三国</div>';
    if (state.titles && state.titles.length > 0) {
      html += '<div class="destiny-record-titles">';
      for (const t of state.titles) {
        html += '<span class="destiny-title-badge">' + t + '</span>';
      }
      html += '</div>';
    }
    html += '<div class="destiny-record-reputation">声望: ' + (state.reputation || 0) + '</div>';
    html += '</div>';

    html += '<div class="destiny-timeline">';
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const isDecided = r.chosen !== null;
      const isLast = i === records.length - 1;

      html += '<div class="destiny-timeline-item ' + (isDecided ? 'decided' : 'pending') + '">';
      html += '<div class="destiny-timeline-dot ' + (isDecided ? 'active' : '') + '"></div>';
      if (!isLast) html += '<div class="destiny-timeline-line ' + (isDecided ? 'active' : '') + '"></div>';

      html += '<div class="destiny-timeline-content">';
      html += '<div class="destiny-timeline-title">' + r.title + '</div>';

      if (isDecided) {
        const chosenOption = r.chosen === 'A' ? r.optionA : r.optionB;
        const otherOption = r.chosen === 'A' ? r.optionB : r.optionA;
        html += '<div class="destiny-timeline-chosen">' +
          '<span class="destiny-chosen-label">✦</span> ' + chosenOption.text +
          '</div>';
        html += '<div class="destiny-timeline-other">' + otherOption.text + '</div>';
        html += '<div class="destiny-timeline-consequence">' + r.consequence + '</div>';
        if (r.timestamp) {
          const date = new Date(r.timestamp);
          html += '<div class="destiny-timeline-date">' +
            date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() +
            '</div>';
        }
      } else {
        html += '<div class="destiny-timeline-pending">命运未至...</div>';
      }

      html += '</div>'; // content
      html += '</div>'; // item
    }
    html += '</div>'; // timeline
    html += '</div>'; // record

    return html;
  },
};

if (typeof window !== 'undefined') window.Destiny = Destiny;

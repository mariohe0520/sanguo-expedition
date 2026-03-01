// 三国·天命 — War Director System
// Long-term meta loop: battlefield directives + doctrine progression.

const WarDirector = {
  SCENARIOS: [
    {
      id: 'blitz_assault',
      name: '疾风突击',
      desc: '先手压制：我军速度与暴击提升，战斗更快结束。',
      tags: ['aggression'],
      battle: { playerSpdPct: 12, playerCritPct: 8, enemyDefPct: -6 },
      reward: { goldPct: 8, expPct: 6, points: 10 }
    },
    {
      id: 'iron_wall',
      name: '铁壁防线',
      desc: '稳扎稳打：我军防御与血量提升，容错更高。',
      tags: ['resilience'],
      battle: { playerDefPct: 14, playerHpPct: 10, enemyAtkPct: -5 },
      reward: { goldPct: 5, expPct: 8, points: 9 }
    },
    {
      id: 'decapitation',
      name: '斩首行动',
      desc: '精准打击：对Boss与精英目标伤害提高。',
      tags: ['command'],
      battle: { bossDmgPct: 18, eliteDmgPct: 12, playerAtkPct: 6 },
      reward: { goldPct: 10, expPct: 4, points: 11 }
    },
    {
      id: 'bloody_moon',
      name: '血月鏖战',
      desc: '高风险高收益：双方伤害提升，胜负更快分出。',
      tags: ['aggression', 'risk'],
      battle: { playerAtkPct: 16, enemyAtkPct: 12, playerDefPct: -6 },
      reward: { goldPct: 15, expPct: 12, points: 12 }
    },
    {
      id: 'supply_secure',
      name: '后勤稳固',
      desc: '补给压制：敌方速度下降，我方怒气增长更快。',
      tags: ['command', 'resilience'],
      battle: { enemySpdPct: -10, rageGainPct: 20, playerIntPct: 8 },
      reward: { goldPct: 7, expPct: 9, points: 10 }
    },
  ],

  DOCTRINE_CAP: 10,
  MOMENTUM_FACTIONS: ['wei', 'shu', 'wu'],

  getState() {
    if (typeof Storage === 'undefined') {
      return {
        version: 1, points: 0, streak: 0, doctrinePoints: 0,
        doctrines: { aggression: 0, resilience: 0, command: 0 },
        momentum: { wei: 0, shu: 0, wu: 0 },
        lastScenarioId: null, lastBattleAt: 0,
      };
    }
    const s = Storage.getWarState ? Storage.getWarState() : {};
    if (!s.doctrines) s.doctrines = { aggression: 0, resilience: 0, command: 0 };
    if (!s.momentum) s.momentum = { wei: 0, shu: 0, wu: 0 };
    if (typeof s.points !== 'number') s.points = 0;
    if (typeof s.streak !== 'number') s.streak = 0;
    if (typeof s.doctrinePoints !== 'number') s.doctrinePoints = 0;
    if (!s.version) s.version = 1;
    return s;
  },

  saveState(state) {
    if (typeof Storage !== 'undefined' && Storage.saveWarState) Storage.saveWarState(state);
  },

  _dailySeed() {
    const now = new Date();
    return (now.getFullYear() * 10000) + ((now.getMonth() + 1) * 100) + now.getDate();
  },

  getDoctrineBonus() {
    const s = this.getState();
    const a = s.doctrines.aggression || 0;
    const r = s.doctrines.resilience || 0;
    const c = s.doctrines.command || 0;
    return {
      atkPct: a * 1.4,
      critPct: a * 1.0,
      defPct: r * 1.6,
      hpPct: r * 1.8,
      spdPct: c * 0.9,
      intPct: c * 1.2,
      rewardGoldPct: c * 1.4,
      rewardExpPct: r * 1.0 + a * 0.6,
      warPointsBonus: c * 0.8 + a * 0.5,
    };
  },

  normalizeMomentum(momentum) {
    const m = Object.assign({ wei: 0, shu: 0, wu: 0 }, momentum || {});
    this.MOMENTUM_FACTIONS.forEach((f) => {
      if (typeof m[f] !== 'number' || Number.isNaN(m[f])) m[f] = 0;
      m[f] = Math.max(-100, Math.min(100, Math.round(m[f])));
    });
    return m;
  },

  inferEnemyFaction(stage) {
    const ids = Array.isArray(stage?.enemies) ? stage.enemies : [];
    const count = { wei: 0, shu: 0, wu: 0 };
    for (const id of ids) {
      const faction = (HEROES[id]?.faction || '').toLowerCase();
      if (count[faction] !== undefined) count[faction] += 1;
    }
    let dominant = 'neutral';
    let best = 0;
    Object.keys(count).forEach((f) => {
      if (count[f] > best) {
        best = count[f];
        dominant = f;
      }
    });
    return dominant;
  },

  getMomentumDominance() {
    const s = this.getState();
    const m = this.normalizeMomentum(s.momentum);
    let faction = 'neutral';
    let score = 0;
    this.MOMENTUM_FACTIONS.forEach((f) => {
      if (Math.abs(m[f]) > Math.abs(score)) {
        score = m[f];
        faction = f;
      }
    });
    return { faction, score, momentum: m };
  },

  getMomentumModifier(stage) {
    const dom = this.getMomentumDominance();
    const abs = Math.abs(dom.score);
    if (dom.faction === 'neutral' || abs < 18) {
      return {
        title: '三方制衡',
        desc: '魏蜀吴态势相持，暂无额外战场偏置。',
        battle: {},
        reward: {},
      };
    }

    const tier = abs >= 55 ? 2 : 1;
    const mods = {
      wei: tier === 2
        ? {
            title: '魏势压境',
            desc: '魏军军纪森严，敌军更耐打，但战利品更丰厚。',
            battle: { enemyDefPct: 8, enemyAtkPct: 6 },
            reward: { goldPct: 10, expPct: 6, points: 2 },
          }
        : {
            title: '魏势抬头',
            desc: '魏军推进，敌军防守更稳。',
            battle: { enemyDefPct: 5, enemyAtkPct: 3 },
            reward: { goldPct: 6, expPct: 4, points: 1 },
          },
      shu: tier === 2
        ? {
            title: '蜀志高昂',
            desc: '蜀军士气高涨，我军先手与暴击更强。',
            battle: { playerSpdPct: 10, playerCritPct: 12, playerAtkPct: 6 },
            reward: { goldPct: 5, expPct: 8, points: 2 },
          }
        : {
            title: '蜀势进取',
            desc: '蜀军攻势明显，我军节奏更快。',
            battle: { playerSpdPct: 6, playerCritPct: 7, playerAtkPct: 3 },
            reward: { goldPct: 3, expPct: 5, points: 1 },
          },
      wu: tier === 2
        ? {
            title: '吴火燎原',
            desc: '吴军机动与火攻兴盛，我军智谋与怒气收益提升。',
            battle: { playerIntPct: 10, rageGainPct: 24, playerDefPct: 4 },
            reward: { goldPct: 8, expPct: 7, points: 2 },
          }
        : {
            title: '吴势连营',
            desc: '吴军稳进，战术与节奏收益提升。',
            battle: { playerIntPct: 6, rageGainPct: 14, playerDefPct: 2 },
            reward: { goldPct: 5, expPct: 4, points: 1 },
          },
    };

    const mod = mods[dom.faction] || mods.wei;
    const battle = Object.assign({}, mod.battle);
    const reward = Object.assign({}, mod.reward);

    // Attacking a dominant faction should feel harder and more rewarding.
    const enemyFaction = this.inferEnemyFaction(stage);
    if (enemyFaction !== 'neutral' && enemyFaction === dom.faction) {
      battle.enemyAtkPct = (battle.enemyAtkPct || 0) + 4;
      reward.points = (reward.points || 0) + 1;
      mod.desc += ' 本关敌方受主势力加成。';
    }

    return {
      title: mod.title,
      desc: mod.desc,
      battle,
      reward,
      faction: dom.faction,
      score: dom.score,
    };
  },

  _combineWarContexts(baseContext, momentumContext) {
    const base = baseContext || {};
    const extra = momentumContext || {};
    const mergePct = (objA, objB) => {
      const out = Object.assign({}, objA || {});
      Object.entries(objB || {}).forEach(([k, v]) => {
        if (typeof v === 'number') out[k] = (out[k] || 0) + v;
      });
      return out;
    };
    return Object.assign({}, base, {
      name: extra.title ? `${base.name} · ${extra.title}` : base.name,
      desc: extra.desc ? `${base.desc} ${extra.desc}` : base.desc,
      battle: mergePct(base.battle, extra.battle),
      reward: mergePct(base.reward, extra.reward),
      _momentum: extra,
    });
  },

  rollScenario(stage, chapter) {
    const chapterId = chapter?.id || stage?._chapter?.id || 1;
    const stageId = stage?.id || 1;
    const s = this.getState();
    const seed = this._dailySeed() + chapterId * 37 + stageId * 71 + s.points;
    let idx = Math.abs(seed) % this.SCENARIOS.length;

    // Avoid forcing the exact same scenario repeatedly.
    if (this.SCENARIOS[idx].id === s.lastScenarioId) {
      idx = (idx + 1) % this.SCENARIOS.length;
    }
    const scenario = this.SCENARIOS[idx];
    const core = {
      scenarioId: scenario.id,
      chapterId,
      stageId,
      enemyIds: Array.isArray(stage?.enemies) ? stage.enemies.slice() : [],
      isBoss: !!stage?.boss,
      isElite: !!stage?.elite,
      ...scenario,
    };
    const momentumContext = this.getMomentumModifier(stage);
    return this._combineWarContexts(core, momentumContext);
  },

  applyBattleModifiers(battleState, warContext) {
    if (!battleState || !warContext) return null;
    const doctrine = this.getDoctrineBonus();
    const battle = warContext.battle || {};

    const applyPct = (val, pct) => Math.floor(val * (1 + pct / 100));
    const applyTeam = (fighters, fn) => (fighters || []).forEach(f => { if (f && f.alive !== false) fn(f); });

    applyTeam(battleState.player, (f) => {
      f.atk = applyPct(f.atk, (doctrine.atkPct || 0) + (battle.playerAtkPct || 0));
      f.def = applyPct(f.def, (doctrine.defPct || 0) + (battle.playerDefPct || 0));
      f.maxHp = applyPct(f.maxHp, (doctrine.hpPct || 0) + (battle.playerHpPct || 0));
      f.hp = Math.min(f.maxHp, applyPct(f.hp, (doctrine.hpPct || 0) + (battle.playerHpPct || 0)));
      f.spd = applyPct(f.spd, (doctrine.spdPct || 0) + (battle.playerSpdPct || 0));
      f.int = applyPct(f.int, (doctrine.intPct || 0) + (battle.playerIntPct || 0));
      if (!f.buffs) f.buffs = [];
      const crit = (doctrine.critPct || 0) + (battle.playerCritPct || 0);
      if (crit) f.buffs.push({ stat: 'crit', pct: Math.round(crit), duration: 99 });
      if (battle.rageGainPct) f._warRageGain = (battle.rageGainPct / 100);
      if (warContext.isBoss && battle.bossDmgPct) f._warBossDmg = (battle.bossDmgPct / 100);
      if (warContext.isElite && battle.eliteDmgPct) f._warEliteDmg = (battle.eliteDmgPct / 100);
    });

    applyTeam(battleState.enemy, (f) => {
      if (battle.enemyAtkPct) f.atk = applyPct(f.atk, battle.enemyAtkPct);
      if (battle.enemyDefPct) f.def = applyPct(f.def, battle.enemyDefPct);
      if (battle.enemySpdPct) f.spd = applyPct(f.spd, battle.enemySpdPct);
    });

    battleState._warContext = warContext;
    battleState._warDoctrine = doctrine;
    return {
      title: warContext.name,
      desc: warContext.desc,
    };
  },

  getRewardMultiplier(warContext) {
    const d = this.getDoctrineBonus();
    const wr = (warContext && warContext.reward) ? warContext.reward : {};
    const gold = 1 + ((d.rewardGoldPct || 0) + (wr.goldPct || 0)) / 100;
    const exp = 1 + ((d.rewardExpPct || 0) + (wr.expPct || 0)) / 100;
    return { gold, exp };
  },

  onBattleComplete(result, warContext) {
    const s = this.getState();
    const d = this.getDoctrineBonus();
    const base = result === 'victory' ? 10 : 4;
    const streakDelta = result === 'victory' ? 1 : -1;
    s.streak = Math.max(0, s.streak + streakDelta);

    const scenarioPoints = (warContext?.reward?.points || 8);
    const streakBonus = result === 'victory' ? Math.min(8, s.streak) : 0;
    const doctrineBonus = Math.floor(d.warPointsBonus || 0);
    const gained = base + scenarioPoints + streakBonus + doctrineBonus;
    s.points += gained;

    // Every 120 points grants one doctrine point.
    const threshold = 120;
    const unlocked = Math.floor(s.points / threshold);
    const spentApprox = (s.doctrines.aggression || 0) + (s.doctrines.resilience || 0) + (s.doctrines.command || 0);
    s.doctrinePoints = Math.max(0, unlocked - spentApprox);
    s.lastScenarioId = warContext?.scenarioId || null;
    s.lastBattleAt = Date.now();
    s.momentum = this._updateMomentum(s.momentum, result, warContext);
    this.saveState(s);

    return { gainedPoints: gained, streak: s.streak, doctrinePoints: s.doctrinePoints };
  },

  _updateMomentum(momentum, result, warContext) {
    const next = this.normalizeMomentum(momentum);
    const targetFaction = this.inferEnemyFaction({
      enemies: warContext?.enemyIds || [],
    });
    const resolvedFaction = targetFaction === 'neutral'
      ? (warContext?._momentum?.faction || 'neutral')
      : targetFaction;

    const sign = result === 'victory' ? -1 : 1;
    const delta = result === 'victory' ? 4 : 3;
    if (this.MOMENTUM_FACTIONS.includes(resolvedFaction)) {
      next[resolvedFaction] += sign * delta;
    }

    // Gentle drift to avoid permanent runaway.
    this.MOMENTUM_FACTIONS.forEach((f) => {
      if (next[f] > 0) next[f] -= 1;
      if (next[f] < 0) next[f] += 1;
    });
    return this.normalizeMomentum(next);
  },

  upgradeDoctrine(path) {
    const s = this.getState();
    if (!s.doctrines[path]) s.doctrines[path] = 0;
    if (s.doctrinePoints <= 0) return { ok: false, msg: '没有可用军略点' };
    if (s.doctrines[path] >= this.DOCTRINE_CAP) return { ok: false, msg: '该学派已满级' };

    s.doctrines[path] += 1;
    s.doctrinePoints -= 1;
    this.saveState(s);
    return { ok: true, level: s.doctrines[path], remaining: s.doctrinePoints };
  },

  getHomeSummary() {
    const s = this.getState();
    const d = this.getDoctrineBonus();
    const dom = this.getMomentumDominance();
    const momentumMap = { wei: '魏', shu: '蜀', wu: '吴', neutral: '均势' };
    return {
      points: s.points,
      streak: s.streak,
      doctrinePoints: s.doctrinePoints,
      doctrines: s.doctrines,
      momentum: this.normalizeMomentum(s.momentum),
      momentumTitle: `${momentumMap[dom.faction] || '均势'}势 ${dom.score >= 0 ? '+' : ''}${dom.score}`,
      bonusText: `攻+${(d.atkPct || 0).toFixed(1)}% 防+${(d.defPct || 0).toFixed(1)}% 赏金+${(d.rewardGoldPct || 0).toFixed(1)}%`,
    };
  },
};

if (typeof window !== 'undefined') window.WarDirector = WarDirector;

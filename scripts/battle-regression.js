#!/usr/bin/env node

/*
 * 三国·天命 - 30场自动战斗平衡回归
 * 目标：用真实战斗引擎 + 真实关卡配置，输出可追踪的平衡指标报告。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const REPORT_DIR = path.join(ROOT, 'reports');

const BATTLE_COUNT = Number(process.env.BATTLE_COUNT || 30);
const RNG_SEED = Number(process.env.REGRESSION_SEED || 20260301);
const REPORT_PREFIX = process.env.REPORT_PREFIX || 'battle-regression';
const CHAPTER_MIN = Number(process.env.CHAPTER_MIN || 5);
const CHAPTER_MAX = Number(process.env.CHAPTER_MAX || 10);

const TARGET = {
  winRateMin: Number(process.env.TARGET_WIN_RATE_MIN || 0.55),
  winRateMax: Number(process.env.TARGET_WIN_RATE_MAX || 0.85),
  avgTurnsMin: Number(process.env.TARGET_AVG_TURNS_MIN || 3),
  avgTurnsMax: Number(process.env.TARGET_AVG_TURNS_MAX || 8),
};
const EXTRA_ENEMY_SCALE = Number(process.env.EXTRA_ENEMY_SCALE || 1.35);
const DIFFICULTY_POOL = (process.env.DIFFICULTY_POOL || 'normal,elite')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

class LocalStorageMock {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function createSeededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(rng, arr) {
  if (!arr.length) return null;
  const idx = Math.floor(rng() * arr.length);
  return arr[idx];
}

function safeNumber(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

function fmtPct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

function loadScript(context, relPath) {
  const absPath = path.join(JS_DIR, relPath);
  const code = fs.readFileSync(absPath, 'utf8');
  vm.runInContext(code, context, { filename: absPath });
}

function createGameContext() {
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    Promise,
    localStorage: new LocalStorageMock(),
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);

  // 只加载回归必需模块，避免引入 UI/DOM 依赖。
  loadScript(context, 'heroes.js');
  loadScript(context, 'storage.js');
  loadScript(context, 'visuals.js');
  loadScript(context, 'dynamic-battlefield.js');
  loadScript(context, 'campaign.js');
  loadScript(context, 'war-director.js');
  loadScript(context, 'battle.js');

  return context;
}

function bootstrapProfile(ctx) {
  const Storage = ctx.Storage;

  // 统一回归基线：中期可玩队伍，避免被玩家本地档案污染。
  const roster = {
    liubei: { level: 19, stars: 3, shards: 0 },
    guanyu: { level: 22, stars: 4, shards: 0 },
    zhaoyun: { level: 21, stars: 4, shards: 0 },
    zhangfei: { level: 19, stars: 3, shards: 0 },
    zhouyu: { level: 20, stars: 4, shards: 0 },
    caocao: { level: 20, stars: 4, shards: 0 },
    sunshangxiang: { level: 18, stars: 3, shards: 0 },
    huangzhong: { level: 17, stars: 3, shards: 0 },
    archer_recruit: { level: 15, stars: 2, shards: 0 },
    soldier: { level: 15, stars: 2, shards: 0 },
  };

  Storage.saveRoster(roster);
  Storage.saveTeam(['liubei', 'guanyu', 'zhaoyun', 'zhouyu', 'caocao']);
  Storage.savePlayer({ name: '回归测试主公', level: 18, exp: 0, gold: 0, gems: 0, troops: 100 });
  Storage.saveCampaignProgress({ chapter: 1, stage: 1, choices: {} });
  Storage.saveWarState({
    version: 1,
    points: 0,
    streak: 0,
    doctrinePoints: 0,
    doctrines: { aggression: 2, resilience: 2, command: 2 },
    momentum: { wei: 0, shu: 0, wu: 0 },
    lastScenarioId: null,
    lastBattleAt: 0,
  });
}

function buildTeamVariants() {
  return [
    ['liubei', 'guanyu', 'zhaoyun', 'zhouyu', 'caocao'],
    ['liubei', 'zhangfei', 'guanyu', 'sunshangxiang', 'zhouyu'],
    ['liubei', 'zhaoyun', 'caocao', 'sunshangxiang', 'huangzhong'],
    ['zhangfei', 'guanyu', 'zhaoyun', 'archer_recruit', 'soldier'],
    ['liubei', 'sunshangxiang', 'zhouyu', 'huangzhong', 'soldier'],
  ];
}

function buildBattlePlan(Campaign, rng, count) {
  const chapters = Campaign.CHAPTERS.filter((ch) => ch && ch.id >= CHAPTER_MIN && ch.id <= CHAPTER_MAX);
  const plan = [];

  for (let i = 0; i < count; i++) {
    const chapter = pick(rng, chapters);
    const stage = pick(rng, chapter.stages);
    plan.push({
      chapterId: chapter.id,
      chapterName: chapter.name,
      stageId: stage.id,
      stageName: stage.name,
      isBoss: !!stage.boss,
      isElite: !!stage.elite,
    });
  }

  return plan;
}

function makeOutcomeBuckets(results) {
  const buckets = new Map();
  for (const r of results) {
    const key = `第${r.chapterId}章-${r.stageId} ${r.stageName}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        chapterId: r.chapterId,
        stageId: r.stageId,
        stageName: r.stageName,
        plays: 0,
        wins: 0,
        losses: 0,
        avgTurns: 0,
      });
    }
    const b = buckets.get(key);
    b.plays += 1;
    if (r.result === 'victory') b.wins += 1;
    else b.losses += 1;
    b.avgTurns += r.turns;
  }

  return Array.from(buckets.values()).map((b) => ({
    ...b,
    avgTurns: b.plays ? b.avgTurns / b.plays : 0,
    winRate: b.plays ? b.wins / b.plays : 0,
  }));
}

function calcSummary(results, finalWarState) {
  const total = results.length;
  const wins = results.filter((r) => r.result === 'victory').length;
  const losses = total - wins;
  const avgTurns = results.reduce((sum, r) => sum + r.turns, 0) / Math.max(total, 1);
  const avgGold = results.reduce((sum, r) => sum + r.gold, 0) / Math.max(total, 1);
  const avgExp = results.reduce((sum, r) => sum + r.exp, 0) / Math.max(total, 1);
  const avgWarPts = results.reduce((sum, r) => sum + r.warPoints, 0) / Math.max(total, 1);
  const bossBattles = results.filter((r) => r.isBoss).length;
  const eliteBattles = results.filter((r) => r.isElite).length;

  const momentum = finalWarState?.momentum || { wei: 0, shu: 0, wu: 0 };

  const byChapter = Array.from(new Set(results.map((r) => r.chapterId))).sort((a, b) => a - b).map((id) => {
    const arr = results.filter((r) => r.chapterId === id);
    const cw = arr.filter((r) => r.result === 'victory').length;
    return {
      chapterId: id,
      battles: arr.length,
      winRate: arr.length ? cw / arr.length : 0,
      avgTurns: arr.length ? arr.reduce((sum, r) => sum + r.turns, 0) / arr.length : 0,
    };
  });

  const heavyLossStreak = (() => {
    let best = 0;
    let curr = 0;
    for (const r of results) {
      if (r.result === 'defeat') {
        curr += 1;
        if (curr > best) best = curr;
      } else {
        curr = 0;
      }
    }
    return best;
  })();

  const warnings = [];
  if (total === 0) warnings.push('无有效战斗样本。');
  if (total > 0 && (wins / total < TARGET.winRateMin || wins / total > TARGET.winRateMax)) {
    warnings.push(`胜率 ${fmtPct(wins / total)} 超出目标区间 ${fmtPct(TARGET.winRateMin)} - ${fmtPct(TARGET.winRateMax)}。`);
  }
  if (total > 0 && (avgTurns < TARGET.avgTurnsMin || avgTurns > TARGET.avgTurnsMax)) {
    warnings.push(`平均回合 ${avgTurns.toFixed(2)} 超出目标区间 ${TARGET.avgTurnsMin} - ${TARGET.avgTurnsMax}。`);
  }

  return {
    total,
    wins,
    losses,
    winRate: total ? wins / total : 0,
    avgTurns,
    avgGold,
    avgExp,
    avgWarPoints: avgWarPts,
    bossBattles,
    eliteBattles,
    heavyLossStreak,
    byChapter,
    finalWarState,
    momentum,
    warnings,
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function buildTuningAdvice(summary, hotspots) {
  const advice = [];
  const critical = [];
  const warn = summary.warnings || [];
  const winRate = summary.winRate || 0;
  const avgTurns = summary.avgTurns || 0;

  const targetMid = (TARGET.winRateMin + TARGET.winRateMax) / 2;
  const diffToMid = winRate - targetMid;

  // 全局建议：敌方倍率微调
  if (warn.some((w) => w.includes('胜率'))) {
    if (winRate > TARGET.winRateMax) {
      const ratio = clamp(diffToMid / Math.max(targetMid, 0.01), 0.01, 0.25);
      const suggestScale = +(EXTRA_ENEMY_SCALE * (1 + ratio)).toFixed(2);
      advice.push({
        level: 'global',
        type: 'enemy_scale',
        reason: `整体胜率 ${fmtPct(winRate)} 偏高，建议提高敌方压力。`,
        action: `将 EXTRA_ENEMY_SCALE 从 x${EXTRA_ENEMY_SCALE.toFixed(2)} 调整到 x${suggestScale.toFixed(2)} 后复测。`,
      });
    } else if (winRate < TARGET.winRateMin) {
      const ratio = clamp((targetMid - winRate) / Math.max(targetMid, 0.01), 0.01, 0.25);
      const suggestScale = +(EXTRA_ENEMY_SCALE * (1 - ratio)).toFixed(2);
      advice.push({
        level: 'global',
        type: 'enemy_scale',
        reason: `整体胜率 ${fmtPct(winRate)} 偏低，建议降低敌方压力。`,
        action: `将 EXTRA_ENEMY_SCALE 从 x${EXTRA_ENEMY_SCALE.toFixed(2)} 调整到 x${suggestScale.toFixed(2)} 后复测。`,
      });
    }
  }

  // 全局建议：节奏微调（回合）
  if (warn.some((w) => w.includes('平均回合'))) {
    if (avgTurns < TARGET.avgTurnsMin) {
      advice.push({
        level: 'global',
        type: 'pace',
        reason: `平均回合 ${avgTurns.toFixed(2)} 偏短，战斗节奏过快。`,
        action: '优先下调玩家通用伤害系数（ATK相关）约 5%~10%，或上调敌方 HP/DEF 约 5%。',
      });
    } else if (avgTurns > TARGET.avgTurnsMax) {
      advice.push({
        level: 'global',
        type: 'pace',
        reason: `平均回合 ${avgTurns.toFixed(2)} 偏长，战斗节奏偏慢。`,
        action: '优先上调玩家关键输出技能倍率约 5%~10%，或下调敌方 HP/DEF 约 5%。',
      });
    }
  }

  // 章节建议：基于章节胜率偏差
  const chapterAdvice = [];
  for (const row of summary.byChapter || []) {
    if (!row.battles || row.battles < 3) continue;
    if (row.winRate > TARGET.winRateMax) {
      const over = row.winRate - TARGET.winRateMax;
      const pct = clamp(Math.round(over * 100 * 0.6), 3, 12);
      chapterAdvice.push({
        chapterId: row.chapterId,
        reason: `第${row.chapterId}章胜率 ${fmtPct(row.winRate)} 偏高。`,
        action: `建议将第${row.chapterId}章 CHAPTER_SCALING.enemyScale 上调约 ${pct}%（先小步）。`,
      });
    } else if (row.winRate < TARGET.winRateMin) {
      const under = TARGET.winRateMin - row.winRate;
      const pct = clamp(Math.round(under * 100 * 0.6), 3, 12);
      chapterAdvice.push({
        chapterId: row.chapterId,
        reason: `第${row.chapterId}章胜率 ${fmtPct(row.winRate)} 偏低。`,
        action: `建议将第${row.chapterId}章 CHAPTER_SCALING.enemyScale 下调约 ${pct}%（先小步）。`,
      });
    }
  }

  if (chapterAdvice.length) {
    advice.push({
      level: 'chapter',
      type: 'chapter_scale',
      reason: '章节间难度分布不均。',
      action: '按章节独立微调 enemyScale，避免全局一刀切。',
      items: chapterAdvice,
    });
  }

  // 热点关卡建议：优先处理失败率最高的关卡
  const weakHotspots = (hotspots || []).filter((h) => h.plays >= 2 && h.winRate < 0.5).slice(0, 3);
  for (const h of weakHotspots) {
    critical.push({
      stage: h.key,
      reason: `样本 ${h.plays} 场，胜率仅 ${fmtPct(h.winRate)}。`,
      action: '检查该关卡敌方前排防御与控制链；优先减少 1 个高压单位或下调关键技能倍率 8% 左右。',
    });
  }

  // 如果暂无明显单关崩点，但整体偏高，则给单关增强建议。
  if (!critical.length && winRate > TARGET.winRateMax) {
    const easyHotspots = (hotspots || []).filter((h) => h.plays >= 2 && h.winRate >= 1).slice(0, 3);
    for (const h of easyHotspots) {
      critical.push({
        stage: h.key,
        reason: `样本 ${h.plays} 场，胜率 ${fmtPct(h.winRate)}，疑似过易。`,
        action: '建议给该关卡增加 1 个功能型敌人（控制/回复）或提升主将技能倍率 6%~10%。',
      });
    }
  }

  return { advice, critical };
}

function toMarkdown({ generatedAt, seed, summary, hotspots, results }) {
  const tuning = buildTuningAdvice(summary, hotspots);
  const lines = [];
  lines.push('# 自动战斗平衡回归报告');
  lines.push('');
  lines.push(`- 生成时间: ${generatedAt}`);
  lines.push(`- 随机种子: ${seed}`);
  lines.push(`- 对局数量: ${summary.total}`);
  lines.push(`- 敌方额外倍率: x${EXTRA_ENEMY_SCALE.toFixed(2)}`);
  lines.push(`- 难度池: ${DIFFICULTY_POOL.join(', ')}`);
  lines.push('');
  lines.push('## 总览指标');
  lines.push(`- 胜率: ${fmtPct(summary.winRate)} (${summary.wins}/${summary.total})`);
  lines.push(`- 平均回合: ${summary.avgTurns.toFixed(2)}`);
  lines.push(`- 平均金币收益(含战争修正): ${summary.avgGold.toFixed(1)}`);
  lines.push(`- 平均经验收益(含战争修正): ${summary.avgExp.toFixed(1)}`);
  lines.push(`- 平均战争积分: ${summary.avgWarPoints.toFixed(2)}`);
  lines.push(`- Boss 场次: ${summary.bossBattles}`);
  lines.push(`- Elite 场次: ${summary.eliteBattles}`);
  lines.push(`- 最长连败: ${summary.heavyLossStreak}`);
  lines.push(`- 目标胜率区间: ${fmtPct(TARGET.winRateMin)} - ${fmtPct(TARGET.winRateMax)}`);
  lines.push(`- 目标回合区间: ${TARGET.avgTurnsMin} - ${TARGET.avgTurnsMax}`);
  lines.push('');
  lines.push('## 平衡判定');
  if (!summary.warnings.length) {
    lines.push('- 通过：关键指标在目标区间内。');
  } else {
    for (const w of summary.warnings) lines.push(`- 预警：${w}`);
  }
  lines.push('');
  lines.push('## 章节维度');
  for (const row of summary.byChapter) {
    lines.push(`- 第${row.chapterId}章: ${row.battles}场, 胜率 ${fmtPct(row.winRate)}, 平均回合 ${row.avgTurns.toFixed(2)}`);
  }
  lines.push('');
  lines.push('## 自动调参建议');
  if (!tuning.advice.length && !tuning.critical.length) {
    lines.push('- 当前无调参建议，继续观察更多样本。');
  } else {
    for (const a of tuning.advice) {
      lines.push(`- [${a.level}] ${a.reason} ${a.action}`);
      if (Array.isArray(a.items)) {
        for (const it of a.items) {
          lines.push(`- 章节建议: ${it.reason} ${it.action}`);
        }
      }
    }
    for (const c of tuning.critical) {
      lines.push(`- [hotspot] ${c.stage}: ${c.reason} ${c.action}`);
    }
  }
  lines.push('');
  lines.push('## 势力态势（结束时）');
  lines.push(`- 魏势: ${safeNumber(summary.momentum.wei)}`);
  lines.push(`- 蜀势: ${safeNumber(summary.momentum.shu)}`);
  lines.push(`- 吴势: ${safeNumber(summary.momentum.wu)}`);
  lines.push(`- 战争总积分: ${safeNumber(summary.finalWarState?.points)}`);
  lines.push(`- 当前连胜/连败修正后的连段: ${safeNumber(summary.finalWarState?.streak)}`);
  lines.push('');
  lines.push('## 关卡热点（按失败率排序）');
  if (!hotspots.length) {
    lines.push('- 无有效样本。');
  } else {
    for (const h of hotspots) {
      lines.push(`- ${h.key}: ${h.plays}场, 胜率 ${fmtPct(h.winRate)}, 平均回合 ${h.avgTurns.toFixed(2)}`);
    }
  }
  lines.push('');
  lines.push('## 最近 10 场明细');
  const tail = results.slice(-10);
  for (const r of tail) {
    lines.push(`- [${r.index}] 第${r.chapterId}章-${r.stageId} ${r.stageName} | ${r.result === 'victory' ? '胜' : '败'} | 回合 ${r.turns} | 金 ${r.gold} | 经验 ${r.exp} | 战争积分 +${r.warPoints}`);
  }
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const rng = createSeededRandom(RNG_SEED);
  const ctx = createGameContext();

  const Battle = ctx.Battle;
  const Campaign = ctx.Campaign;
  const WarDirector = ctx.WarDirector;
  const Storage = ctx.Storage;

  bootstrapProfile(ctx);

  const plan = buildBattlePlan(Campaign, rng, BATTLE_COUNT);
  const teamVariants = buildTeamVariants();
  const results = [];

  // 将 Math.random 绑定到可复现 PRNG，确保每次报告可重现。
  const originalRandom = ctx.Math.random;
  ctx.Math.random = createSeededRandom(RNG_SEED + 999);

  for (let i = 0; i < plan.length; i++) {
    const slot = plan[i];
    const chapter = Campaign.CHAPTERS.find((c) => c.id === slot.chapterId);
    const stage = chapter.stages.find((s) => s.id === slot.stageId);

    const team = pick(rng, teamVariants).slice();
    const difficulty = pick(rng, DIFFICULTY_POOL) || 'normal';
    const enemyScale = Campaign.getEnemyScale(chapter.id, difficulty) * EXTRA_ENEMY_SCALE;
    const terrain = stage.terrain || chapter.terrain || 'plains';
    const weather = stage.weather || chapter.weather || 'clear';
    const warContext = WarDirector.rollScenario(stage, chapter);

    Battle.init(
      team,
      stage.enemies,
      terrain,
      weather,
      enemyScale,
      null,
      stage.boss_enhanced || null,
      warContext,
    );

    const result = await Battle.run(9999);
    const warRes = WarDirector.onBattleComplete(result, warContext);
    const mult = WarDirector.getRewardMultiplier(warContext);

    const gold = Math.floor((stage.reward?.gold || 0) * (mult.gold || 1));
    const exp = Math.floor((stage.reward?.exp || 0) * (mult.exp || 1));

    if (result === 'victory') {
      Storage.addGold(gold);
      Storage.addExp(exp);
      Storage.recordWin();
      if (stage.boss) Storage.recordBossWin();
    } else {
      Storage.recordLoss();
    }

    results.push({
      index: i + 1,
      chapterId: chapter.id,
      chapterName: chapter.name,
      stageId: stage.id,
      stageName: stage.name,
      isBoss: !!stage.boss,
      isElite: !!stage.elite,
      result,
      turns: Battle.state?.turn || 0,
      gold,
      exp,
      warPoints: safeNumber(warRes?.gainedPoints),
      warScenario: warContext?.scenarioId || 'unknown',
      momentumTitle: warContext?._momentum?.title || '',
      team: team.join(','),
      difficulty,
    });
  }

  ctx.Math.random = originalRandom;

  const finalWarState = WarDirector.getState();
  const summary = calcSummary(results, finalWarState);

  const buckets = makeOutcomeBuckets(results);
  const hotspots = buckets
    .filter((b) => b.plays >= 2)
    .sort((a, b) => (a.winRate - b.winRate) || (b.plays - a.plays))
    .slice(0, 8);

  const generatedAt = new Date().toISOString();
  const report = {
    generatedAt,
    seed: RNG_SEED,
    battleCount: BATTLE_COUNT,
    summary,
    hotspots,
    tuning: buildTuningAdvice(summary, hotspots),
    results,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = generatedAt.replace(/[:.]/g, '-');
  const jsonPath = path.join(REPORT_DIR, `${REPORT_PREFIX}-${stamp}.json`);
  const mdPath = path.join(REPORT_DIR, `${REPORT_PREFIX}-${stamp}.md`);
  const latestJson = path.join(REPORT_DIR, `${REPORT_PREFIX}-latest.json`);
  const latestMd = path.join(REPORT_DIR, `${REPORT_PREFIX}-latest.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(latestJson, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(mdPath, toMarkdown(report), 'utf8');
  fs.writeFileSync(latestMd, toMarkdown(report), 'utf8');

  console.log(`回归完成: ${BATTLE_COUNT} 场`);
  console.log(`胜率: ${fmtPct(summary.winRate)} (${summary.wins}/${summary.total})`);
  console.log(`平均回合: ${summary.avgTurns.toFixed(2)}`);
  console.log(`平均战争积分: ${summary.avgWarPoints.toFixed(2)}`);
  if (!summary.warnings.length) {
    console.log('平衡判定: 通过');
  } else {
    console.log(`平衡判定: 预警 ${summary.warnings.length} 项`);
    for (const w of summary.warnings) console.log(`- ${w}`);
  }
  console.log(`报告: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);
  const tuningCount = (report.tuning.advice?.length || 0) + (report.tuning.critical?.length || 0);
  console.log(`自动调参建议: ${tuningCount} 条`);
}

main().catch((err) => {
  console.error('[battle-regression] 失败:', err);
  process.exit(1);
});

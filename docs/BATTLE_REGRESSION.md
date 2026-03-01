# 战斗平衡自动回归

## 目标
用真实 `Battle + Campaign + WarDirector` 逻辑自动跑多场战斗，输出平衡报告，避免手工测试只看个别样本。

## 一键运行
```bash
cd /Users/mario/.openclaw/workspace/games/sanguo-expedition
npm run regression:battle
```

运行后会生成：
- `reports/battle-regression-latest.md`
- `reports/battle-regression-latest.json`
- 带时间戳的历史报告（便于对比改动前后）

## 默认策略
- 场次：30
- 章节池：5~10 章（中后期压力场）
- 难度池：`normal,elite`
- 额外敌方倍率：`x1.35`
- 阵容：5 套轮换队伍，避免只测单一最优队

## 核心指标
- 胜率（目标区间默认 55%~85%）
- 平均回合（目标区间默认 3~8）
- 平均金币/经验收益（含战争修正）
- 平均战争积分
- 最长连败
- 章节维度胜率与回合
- 热点关卡（失败率高的关卡）
- 自动调参建议（全局/章节/热点关卡）

## 第 2 阶段：自动调参建议
脚本会根据目标区间自动生成建议：
- 全局建议：`EXTRA_ENEMY_SCALE` 调整方向与建议值
- 章节建议：针对异常章节给出 `CHAPTER_SCALING.enemyScale` 上/下调百分比
- 热点建议：针对失败率最高（或过易）的关卡给出结构性建议

建议会同时写入：
- `reports/battle-regression-latest.md`（可读版）
- `reports/battle-regression-latest.json` 的 `tuning` 字段（可被脚本二次消费）

## 常用参数
```bash
# 增加样本数量
BATTLE_COUNT=100 npm run regression:battle

# 固定随机种子（复现同一批结果）
REGRESSION_SEED=20260301 npm run regression:battle

# 调整章节范围
CHAPTER_MIN=6 CHAPTER_MAX=10 npm run regression:battle

# 仅测精英难度
DIFFICULTY_POOL=elite npm run regression:battle

# 调整敌方压力倍率
EXTRA_ENEMY_SCALE=1.5 npm run regression:battle

# 调整目标区间（用于不同版本）
TARGET_WIN_RATE_MIN=0.60 TARGET_WIN_RATE_MAX=0.88 npm run regression:battle
TARGET_AVG_TURNS_MIN=3 TARGET_AVG_TURNS_MAX=9 npm run regression:battle
```

## 建议流程
1. 每次改动战斗数值后先跑一次 30 场冒烟。
2. 合并前跑 100 场（固定种子）做基线对比。
3. 如果报告出现“平衡预警”，先执行“自动调参建议”中的全局和章节小步调整，再复测。
4. 第二轮仍异常时，再针对热点关卡做单关结构调整（敌人构成/技能倍率/控制链）。

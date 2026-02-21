# 三国远征 — 编码规范

## 继承
遵守 `../../GAME_STANDARDS.md` 通用标准

## 特有规范
- JS 模块化按系统拆分（gacha.js, battle.js, team.js 等）
- 武将数据统一配置文件，不散落在逻辑代码里
- 概率/数值不硬编码，走配置表
- localStorage 存档有版本号，支持迁移
- 战斗动画不阻塞 UI 交互

# 三国·天命 — 修复清单

## [v2.0.0] — 2026-03-01

### Bug 修复（P0/P1）
- fix: 移除 battle-pixi.js 的失效 script 标签，防止 PixiJS 引用错误
- fix: 装备库上限 500 件，防止 LocalStorage 配额超出
- fix: 离线收益防时间篡改：时间倒退时 elapsed=0，>48h 截断为24h
- fix: 天命抉择奖励 loyalty/hero_hint/troops 字段现在正确执行
- fix: 赛季 Banner 移除 comingSoon 武将
- fix: 陆逊 ID 统一为 luxun（全小写），修复10处引用
- feat: 编队前后排软约束提示（放错位置时友好提醒）

### 工程重构
- refactor: JS 文件按职责分层到 core/ systems/ ui/ extras/ config/
- refactor: 武将/关卡/装备数据抽取为独立数据文件（heroes-data.js 等）
- refactor: 所有数值常量集中在 game-balance.js（战斗/经济/抽卡参数）
- refactor: 核心函数添加 JSDoc 注释
- chore: Service Worker 缓存升级至 sanguo-v17

### 品质提升
- feat: 武将卡片品质边框系统（N灰/R蓝/SR紫/SSR金发光/UR红）
- feat: 品质角标徽章（右上角显示 N/R/SR/SSR/UR）
- feat: 离线收益弹窗"仪式感"升级（金币雨 + 数字滚动动画）
- feat: 战斗伤害数字飘出 DOM overlay（暴击加大加红，治疗绿色）
- feat: 武将出战台词系统（HERO_QUOTES 全局 + 战斗开始显示领队台词）
- feat: 天命抉择弹窗史诗感改造（切角边框 + 进场特效 + 悬停动画）
- feat: 编队界面前排/后排视觉区分（红色/蓝色色调 + 行标签）
- feat: 资源获取金币飘出正反馈动画（showGoldGain）
- fix: iPhone 安全区域适配（safe-area-inset, 100svh）
- fix: 弹窗内容不超出屏幕，支持滚动

### 文件变更
| 文件 | 变更 |
|------|------|
| `css/style.css` | 品质边框、离线弹窗、伤害飘字、金币飘出、安全区域、天命重量感、编队改进 |
| `index.html` | 新增离线收益仪式感弹窗 |
| `js/app.js` | data-rarity属性、品质角标、离线弹窗逻辑、金币雨/数字滚动动画、出战台词、金币飘出 |
| `js/ui/battle-canvas.js` | 新增 showDamageNumber DOM overlay 方法 |
| `js/extras/hero-personality.js` | 导出 window.HERO_QUOTES 全局快捷访问 |

---

## v1.1.0 — 2026-02-18 紧急修复

### 🔴 Bug #1: 战役推进不了下一关（已修复）
**根因：** `Campaign.completeStage()` 未处理天命抉择分支跳转。选择分支A后，stage推进到8，但8-9是分支B的关卡（被隐藏），导致第10关显示为锁定。

**修复：**
- `completeStage()` 现在会跳过与玩家选择不同的分支关卡
- 例：选了A路线 → 完成第7关 → 自动跳过8/9(B路线) → 第10关解锁
- 增加 `chapterId` 参数防止重玩旧章节时污染当前进度
- 确保 `choices` 对象始终初始化

### 🟡 Bug #2: SVG代码显示为文字（已修复）
**根因：** `App.toast()` 用 `textContent` 设置消息，SVG标签被当作纯文本显示。

**修复：** 改用 `innerHTML`，竞技场周奖励等包含图标的提示现在正确渲染。

### 🟢 Bug #3: 英雄视觉质感提升（已改善）
**修复：**
- 新增 `css/enhancements.css`
- 不同稀有度英雄卡有渐变背景（SSR金光/SR紫光/R蓝光）
- SSR头像有旋转发光边框
- 英雄详情页属性条有填充动画
- 详情页肖像背景光晕效果

### 🟢 Bug #4: 整体质感提升（已改善）
**修复：**
- **按钮反馈：** 所有按钮添加水波纹点击效果 (ripple)
- **页面转场：** 平滑的滑入动画替代生硬切换
- **战斗动效：** 受击闪红、治疗闪绿、技能释放金光
- **伤害数字：** 浮动弹出动画（暴击有抖动放大效果）
- **底部导航：** active状态增加金色发光线条和图标缩放
- **Boss关卡：** 序号有脉动发光效果
- **当前关卡：** 呼吸灯边框提示

### 🟡 Bug #5: 系统深度修复
**战斗技能：**
- 司马懿「鹰视狼顾」mirror技能现在正确执行（之前静默失败）
- 郭嘉「十胜十败」debuff技能现在正确降低敌方全属性
- 徐晃「大斧」等带附加减益的伤害技能现在正确施加debuff

**装备系统：**
- 新增装备**强化功能**（英雄详情 → 装备栏 → 强化按钮）
- 同类装备作为材料100%成功率，不同类型70%
- 装备穿戴/卸下功能验证正常
- 装备属性正确应用到战斗（通过 `createFighter` 中的 `Equipment.getHeroEquipmentStats`）

**兵种克制：**
- 验证确认克制系统正常工作（骑→弓→枪→盾→术→骑，1.3x/0.7x）
- 地形加成、天气效果均在战斗中正确计算

---

### 文件变更
| 文件 | 变更 |
|------|------|
| `js/campaign.js` | `completeStage()` 增加分支跳转 + 章节验证 |
| `js/app.js` | toast用innerHTML、传chapter ID、强化UI、ripple效果 |
| `js/battle.js` | 新增mirror/debuff技能类型、damage技能debuff附加 |
| `css/enhancements.css` | 全新视觉增强样式表 |
| `index.html` | 引入enhancements.css |

# 三国远征 — 技术架构

## 概述
三国题材策略 RPG 手游风格网页游戏，含抽卡/编队/战斗/远征系统。

## 技术栈
- **前端**: HTML + CSS + Vanilla JS（模块化 `js/` + `css/`）
- **PWA**: manifest.json + sw.js 离线支持
- **图片**: `img/` 目录，武将立绘等
- **部署**: GitHub Pages

## 核心系统
| 系统 | 说明 |
|------|------|
| 抽卡 (Gacha) | SSR/SR/R 概率，保底机制 |
| 编队 | 武将选择/阵型/装备 |
| 战斗 | 回合制自动战斗 |
| 远征 | 关卡推进 + Boss 战 |

## 已有文档
- `ARCHITECTURE.md` (根目录旧版 → 迁移到 docs/)
- `CHANGELOG.md`

## 约束
- 纯前端，状态存 localStorage
- 移动端触控优先
- 中文界面

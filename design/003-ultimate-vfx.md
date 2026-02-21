# Design Doc #003: 终极战斗特效 — 把天花板拉满

## 当前问题
Canvas2D 纯手搓粒子，上限就是闪光+圆圈+抖动。看着像2010年的Flash游戏。

## 技术方案: 多层渲染 + WebGL + SVG

### Layer 1: PixiJS WebGL 渲染器 (替换 Canvas2D)
- CDN 引入 PixiJS v8 (~150KB gzip)
- WebGL 硬件加速，10000粒子60fps不卡
- 内置 Filter 系统：GlowFilter, BlurFilter, ShockwaveFilter, DisplacementFilter
- 正确的 Blend Mode (SCREEN/ADD) 让光效真正发光

### Layer 2: SVG 动画覆盖层 (技能释放)
- 技能名毛笔字：SVG text + stroke-dashoffset 书写动画
- 能量环：SVG animated circles + feGaussianBlur + feTurbulence
- 技能 Cut-in：角色肖像滑入 + 斜切遮罩

### Layer 3: CSS 后处理
- 全屏 filter: blur/brightness/hue-rotate 叠加到 canvas
- CSS animation 的 @keyframes 做屏幕震动（比JS shake更流畅）
- backdrop-filter 做景深

## 核心特效清单

### ⚔️ 普攻
- 弧形斩击拖尾（渐变描边 + additive blend → 真正发光）
- 命中瞬间：冲击波扭曲（displacement shader）
- 碎片飞溅（带重力和旋转）
- 打击音效节拍闪光

### 💥 暴击
- 时间冻结 0.2秒（freeze frame）
- 十字金色斩击 + 放射状光线
- 屏幕白闪 → 色差分离 3帧
- 地面裂纹扩散

### ✨ 技能释放 (分4阶段)
1. **聚气** (0.3s): 全屏变暗，施法者脚下能量环扩散
2. **Cut-in** (0.5s): SVG 技能名毛笔书写动画 + 角色立绘闪入
3. **释放** (0.5s): 元素全屏特效
   - 火：火柱从地面升起 + 热浪扭曲
   - 水：海啸横扫 + 水面波纹
   - 雷：分形闪电 + 屏幕频闪
   - 冰：六角冰晶从中心爆发 + 霜冻边框
4. **收招** (0.2s): 冲击波 + 暗幕消散

### 💀 击杀
- 目标碎裂成30+碎片（带物理）
- 灵魂粒子升天（柔和白光，慢速上飘）
- 画面 zoom punch (1.05→1.0)
- 短暂灰阶闪烁

### 🏆 胜利
- 金色粒子喷泉 + 光柱
- 彩带粒子（物理飘落）
- "胜利" 3D 感文字（阴影+描边+缩放弹跳）
- 背景渐变成金色暖调

## 文件结构
- `js/battle-pixi.js` — PixiJS 主渲染器（替换 battle-canvas.js）
- `js/vfx-shaders.js` — 自定义 shader（冲击波/扭曲/色差）
- `css/battle-vfx.css` — CSS 动画 + SVG 样式
- `svg/skill-frames.svg` — 技能框 SVG 模板

## 降级方案
- 检测 WebGL 支持，不支持则回退到 Canvas2D 版本
- 低端设备自动降低粒子数

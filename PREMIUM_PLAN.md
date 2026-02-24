# 🎮 三国天命 - 顶级打磨计划
# 目标：用本地最强模型打造顶级视听体验
# 优先级：1️⃣ 三国 → 2️⃣ 芒果庄园 → 3️⃣ 麻将

---

## 📊 当前状态评估

### 图片资源 (武将立绘)
- **现状**: 82张JPEG, 512x512, schnell快速模式生成
- **问题**: 分辨率低，质量不够顶级
- **目标**: 1024x1024+, FLUX.1-dev模型, 精细到发丝

### 音效系统
- **现状**: 8个基础音效, numpy合成
- **问题**: 非真实采样，质感一般
- **目标**: 分层音效系统 (打击/环境/人声)

### 背景音乐
- **现状**: 无
- **目标**: 本地模型生成古风战场音乐

---

## 🎯 阶段1: 图片顶级化 (mflux FLUX.1-dev)

### 技术方案
```bash
# 最强配置
mflux-generate \
  --model dev \                    # 用dev而非schnell，质量更高
  --quantize 8 \                   # 最高精度
  --steps 20 \                     # 更多步数
  --width 1024 --height 1024 \     # 4倍分辨率
  --guidance 4.0 \                 # 更高引导
  --lora-style illustration        # 插画风格LoRA
```

### 武将分级策略
1. **五星传说** (关羽/曹操/赵云/吕布): 4K级精细度
2. **四星史诗** (刘备/张飞/貂蝉): 2K级精细度  
3. **三星及以下**: 1K级精细度

### Prompt工程 (顶级)
```
主体: [武将名], Chinese Three Kingdoms warrior
风格: anime game art style, masterpiece, best quality
细节: highly detailed face, intricate armor design
光影: dramatic lighting, cinematic composition
背景: clean gradient background, subtle battle aura
质量: 8k, sharp focus, trending on artstation
```

---

## 🎯 阶段2: 音效系统顶级化 (Kokoro + 分层合成)

### 技术方案
- **Kokoro TTS**: 生成武将语音/战吼
- **Audiogen/MusicGen**: 本地音乐生成 (需要安装)
- **分层合成**: 基础音效 + 环境 + 人声

### 音效分类
1. **战斗音效**: 刀枪碰撞、马嘶、箭矢 (Kokoro生成+合成)
2. **环境音效**: 战场风声、火焰、旗帜 (Audiogen)
3. **角色语音**: 武将战吼、技能台词 (Kokoro TTS)
4. **UI音效**: 按钮点击、菜单切换 (精细合成)

---

## 🎯 阶段3: 背景音乐 (MusicGen/AudioLDM)

### 安装本地音乐生成
```bash
pip install --break-system-packages audiocraft  # Facebook MusicGen
```

### 音乐风格
- **主界面**: 古风+电子，史诗感
- **战斗**: 紧张鼓点+弦乐
- **胜利**: 壮丽凯歌风格
- **败北**: 悲壮但激励

---

## ⚙️ 执行顺序

### 第一步：环境准备
1. 下载 Kokoro 模型 (~400MB)
2. 安装 MusicGen (audiocraft)
3. 测试 FLUX.1-dev vs schnell 质量对比

### 第二步：武将立绘重制
1. 先重制4个五星武将 (关羽/曹操/赵云/吕布)
2. 对比确认质量达标
3. 批量重制其余武将

### 第三步：音效系统
1. Kokoro生成武将语音
2. 合成战斗音效
3. 添加环境音层

### 第四步：背景音乐
1. 生成4首核心BGM
2. 无缝循环处理

### 第五步：整合测试
1. 全资源替换
2. 性能测试 (加载速度)
3. 最终调优

---

## 🔧 关键脚本

### 1. 高质量立绘生成器
`generate_portraits_premium.py`

### 2. Kokoro语音生成器  
`generate_voices_kokoro.py`

### 3. 音效分层合成器
`generate_sfx_layered.py`

### 4. BGM生成器
`generate_bgm_musicgen.py`

---

## ✅ 质量标准 (顶级)

| 资源类型 | 当前 | 目标 | 判断标准 |
|---------|------|------|---------|
| 武将立绘 | 512x512 JPEG | 1024x1024+ PNG | 放大无像素感 |
| 传说武将 | 一般 | 电影级精细度 | 发丝/铠甲细节清晰 |
| 音效 | numpy合成 | Kokoro+分层 | 真实感+沉浸感 |
| 背景音乐 | 无 | 4首循环BGM | 古风+现代融合 |
| 语音 | 无 | 武将战吼台词 | 中文语音自然 |

---

## ⚠️ 风险与备份

1. **FLUX.1-dev很慢**: 1024x1024 + 20steps 可能需要2-3分钟/张
   - 策略：先测试4张五星武将，确认质量再批量
   
2. **磁盘空间**: 高清图会占用大量空间
   - 82张 x 1024x1024 PNG ≈ 300MB
   
3. **内存**: M4 16GB应该够，但需监控

4. **备份**: 重制前备份现有资源到 `backup_v1/`

---

*计划制定: 2026-02-25*
*执行人: Claw*
*目标: 本地最强模型打造的三国游戏*

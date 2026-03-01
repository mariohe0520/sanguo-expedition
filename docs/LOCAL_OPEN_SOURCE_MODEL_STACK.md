# 三国征途：本地化开源模型栈（Mac mini 16G 可执行）

## 目标
- 把当前偏“静态关卡”的内容生产，升级为可持续 2-3 年扩展的工业化内容流水线。
- 保证离线可跑、成本可控、可逐步替换为更强模型。

## 一、推荐的最小可用组合（先跑起来）

### 1) 剧情与任务生成（LLM）
- 运行方式：`Ollama` 本地推理
- 模型建议：
  - `qwen2.5:7b-instruct`（主力，中文剧情/任务设计稳定）
  - `llama3.1:8b-instruct`（英文文案和系统化指令表现好）
- 用途：
  - 章节剧情草案
  - 日常事件文本
  - NPC 对话树
  - 关卡“机制描述 + 敌方编成说明”

### 2) 语音识别（STT）
- 模型建议：`faster-whisper`（`small` 或 `medium`）
- 用途：
  - 配音演员录音自动转字幕
  - 玩家语音输入（后续语音指挥玩法）

### 3) 语音合成（TTS）
- 模型建议：`Kokoro-82M`
- 用途：
  - NPC 语音播报
  - 战斗提示音（旁白层）

### 4) 美术生成（2D 原画 / UI 概念）
- 工作流建议：`ComfyUI + SDXL`
- 用途：
  - 阵营角色立绘草稿
  - 地图地块概念图
  - 活动海报与节日皮肤草图

## 二、升级组合（打差异化）

### 1) “战争导演”自动扩展器
- 输入：玩家近 20 场战斗日志（胜率、回合数、阵容）
- LLM 输出：
  - 下周三势力态势曲线
  - 新指令模板（如“坚壁清野”“夜袭粮道”）
  - 反重复机制（避免 3 场内出现同套路）

### 2) NPC 长记忆系统（沉浸感核心）
- 组件：
  - Embedding：`bge-m3` 或 `nomic-embed-text`
  - 向量库：`Qdrant`
- 功能：
  - NPC 记住你用过的将领和战术
  - 对话根据你历史行为变化（忠诚、猜忌、敬畏）

### 3) 旁白与战斗播报风格化
- TTS + 规则：
  - 按阵营切声音人设（魏稳、蜀烈、吴巧）
  - 连胜/连败触发特殊播报词条

## 三、Mac mini 16G 资源规划（避免卡死）

### 1) 常驻进程
- `Ollama`：只常驻一个 7B 模型
- `Qdrant`：常驻
- 游戏本体：前端 + 本地服务

### 2) 按需启动
- `ComfyUI`：仅在批量出图时启动
- `faster-whisper`：仅在转写任务时启动

### 3) 队列策略
- 文本任务（LLM）优先级最高
- 语音转写中优先
- 出图最低优先，空闲时跑

## 四、工程接入优先级（建议按周执行）

### Week 1（必须完成）
- 将 `WarDirector` 事件文本生成接口抽象为：`/api/ai/war-directive`
- 本地默认走模板，检测到 LLM 在线后自动切换模型生成
- 对所有 AI 输出加“安全回退模板”，保证永不阻塞战斗流程

### Week 2
- 做 NPC 记忆接口：`/api/ai/npc-memory`
- 战前对话、结算对话接入记忆检索

### Week 3
- 增加活动策划 Agent：
  - 每周自动给出 3 个活动方案
  - 自动生成奖励曲线和掉落建议

## 五、上线底线（工业质量红线）
- AI 模块失败时，游戏主流程必须 100% 可玩（不可白屏、不可卡关）。
- 每个 AI 接口必须有超时、重试、回退模板。
- AI 输出必须过 schema 校验（字段缺失直接丢弃并回退）。

## 参考链接（官方/开源）
- Ollama: https://ollama.com/
- llama.cpp: https://github.com/ggml-org/llama.cpp
- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- WhisperX: https://github.com/m-bain/whisperX
- Kokoro TTS: https://github.com/hexgrad/kokoro
- Qdrant: https://qdrant.tech/documentation/
- Godot (开源引擎，可用于后续重构): https://godotengine.org/license/

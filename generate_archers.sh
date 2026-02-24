#!/bin/bash
# 生成高质量弓手头像 - mflux 本地模型

cd /Users/mario/.openclaw/workspace/games/sanguo-expedition/img/heroes

echo "🎨 开始生成弓手头像..."

# fire_archer - 火弓手
mflux-generate \
  --model schnell \
  --prompt "Fire archer, Chinese warrior, holding flaming bow, red and orange armor, fierce expression, anime portrait style, masterpiece, best quality, upper body, clean background" \
  --output fire_archer_new.png \
  --steps 4 \
  --width 512 \
  --height 640 \
  --guidance 3.5 &

# archer_recruit - 基础弓手
mflux-generate \
  --model schnell \
  --prompt "Young archer, Chinese soldier, holding wooden bow, simple leather armor, determined expression, anime portrait style, masterpiece, best quality, upper body, clean background" \
  --output archer_recruit_new.png \
  --steps 4 \
  --width 512 \
  --height 640 \
  --guidance 3.5 &

# elite_archer - 精英弓手
mflux-generate \
  --model schnell \
  --prompt "Elite archer, Chinese warrior, holding golden bow, ornate armor, confident expression, anime portrait style, masterpiece, best quality, upper body, clean background" \
  --output elite_archer_new.png \
  --steps 4 \
  --width 512 \
  --height 640 \
  --guidance 3.5 &

wait

echo "✅ 生成完成！"
ls -la *_new.png
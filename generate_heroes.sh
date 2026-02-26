#!/bin/bash
# 生成三国武将立绘

HEROES=(
  "Guan Yu|关羽|red face, long beard, green robe, holding guandao|loyal warrior"
  "Zhang Fei|张飞|black face, wild beard, leopard print armor|fierce warrior"
  "Zhao Yun|赵云|white armor, silver spear, heroic pose|noble warrior"
  "Zhuge Liang|诸葛亮|white robe, feather fan, wise expression|strategist"
  "Lu Bu|吕布|golden armor, red pheasant feather, fierce gaze|strongest warrior"
  "Diao Chan|貂蝉|flowing dress, graceful pose, beautiful face|elegant beauty"
)

for hero in "${HEROES[@]}"; do
  IFS='|' read -r name cn desc style <<< "$hero"
  echo "Generating: $name ($cn)"
  
  mflux-generate \
    --base-model schnell \
    --quantize 4 \
    --height 1024 \
    --width 768 \
    --steps 4 \
    --prompt "Chinese Three Kingdoms character portrait, $desc, $style, detailed face, professional digital art, clean background, game character design, 4k quality" \
    --output "assets/heroes/${name}.png" \
    2>/dev/null && echo "✅ $name done" || echo "❌ $name failed"
done

echo "All heroes generated!"

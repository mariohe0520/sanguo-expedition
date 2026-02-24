#!/bin/bash
# 三国立绘持续生成脚本 - 后台运行
# 高标准：每个单位都要有顶级AI立绘

cd /Users/mario/.openclaw/workspace/games/sanguo-expedition
source ~/.openclaw/models/mflux-env/bin/activate

OUTPUT_DIR="img/heroes"
mkdir -p $OUTPUT_DIR

# 普通单位配置
declare -a UNITS=(
    "soldier:Chinese soldier, young warrior, simple spear, basic armor, determined expression, anime style portrait, upper body, clean background, high quality, detailed face"
    "archer_recruit:Chinese archer, young hunter, wooden bow, simple clothes, focused expression, anime style portrait, upper body, clean background, high quality"
    "shield_militia:Chinese shield bearer, wooden shield, rustic armor, village defender, determined, anime style portrait, upper body, clean background"
    "mage_acolyte:Young Chinese magic apprentice, simple robes, spellbook, magical aura, mystical, anime style portrait, upper body"
    "cavalry_recruit:Young Chinese cavalry, horse, basic lance, light armor, anime style portrait, upper body"
    "elite_cavalry:Elite Chinese cavalry warrior, horse armor, spear, helmet, experienced, anime style portrait"
    "elite_spear:Elite Chinese spearman, long spear, armor, shield, veteran warrior, anime style portrait"
    "elite_archer:Elite Chinese archer, bow, arrows, light armor, focused, anime style portrait"
    "elite_shield:Elite Chinese shield bearer, large shield, sword, heavy armor, anime style portrait"
    "elite_mage:Elite Chinese sorcerer, advanced robes, staff, powerful aura, anime style portrait"
)

for unit in "${UNITS[@]}"; do
    IFS=':' read -r id prompt <<< "$unit"
    
    if [ -f "$OUTPUT_DIR/${id}.png" ]; then
        echo "⏭️ 跳过 $id (已存在)"
        continue
    fi
    
    echo "🎨 生成 $id..."
    
    mflux-generate \
        --model schnell \
        --prompt "$prompt" \
        --output "$OUTPUT_DIR/${id}.png" \
        --steps 4 \
        --width 512 \
        --height 640 \
        --guidance 3.0 \
        --quantize 4
    
    if [ $? -eq 0 ]; then
        echo "  ✅ $id 完成"
    else
        echo "  ❌ $id 失败"
    fi
    
    # 每个之间稍作停顿，避免过热
    sleep 5
done

echo "🎉 所有单位立绘生成完成!"

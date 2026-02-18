#!/bin/bash
# Generate Three Kingdoms portraits via Stable Horde (FREE, no API key)
OUTDIR="$(cd "$(dirname "$0")" && pwd)"
APIKEY="0000000000"  # anonymous

generate() {
  local id=$1
  local prompt=$2
  local outfile="${OUTDIR}/${id}.webp"
  
  if [ -f "$outfile" ]; then echo "Skip $id (exists)"; return; fi
  
  echo "Submitting $id..."
  local job=$(curl -sL "https://stablehorde.net/api/v2/generate/async" \
    -H "Content-Type: application/json" \
    -H "apikey: $APIKEY" \
    -d "{
      \"prompt\": \"${prompt}, masterpiece, best quality, detailed face, dark background, square composition\",
      \"params\": {
        \"width\": 512,
        \"height\": 512,
        \"steps\": 25,
        \"cfg_scale\": 7,
        \"sampler_name\": \"k_euler_a\"
      },
      \"nsfw\": false,
      \"models\": [\"AlbedoBase XL (SDXL)\"],
      \"r2\": true
    }" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")
  
  if [ -z "$job" ]; then echo "  FAILED to submit $id"; return; fi
  echo "  Job: $job"
  
  # Poll until done (max 5 min)
  for i in $(seq 1 60); do
    sleep 5
    local status=$(curl -sL "https://stablehorde.net/api/v2/generate/check/$job" 2>/dev/null)
    local done=$(echo "$status" | python3 -c "import json,sys; print(json.load(sys.stdin).get('done',False))" 2>/dev/null)
    local pos=$(echo "$status" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"pos={d.get('queue_position',0)} wait={d.get('wait_time',0)}s\")" 2>/dev/null)
    
    if [ "$done" = "True" ]; then
      # Fetch result
      local result=$(curl -sL "https://stablehorde.net/api/v2/generate/status/$job" 2>/dev/null)
      local imgurl=$(echo "$result" | python3 -c "import json,sys; d=json.load(sys.stdin); gens=d.get('generations',[]); print(gens[0]['img'] if gens else '')" 2>/dev/null)
      
      if [ -n "$imgurl" ]; then
        curl -sL -o "$outfile" "$imgurl" 2>/dev/null
        echo "  ✅ $id saved ($(ls -la "$outfile" | awk '{print $5}') bytes)"
      else
        echo "  ❌ $id no image URL"
      fi
      return
    fi
    echo "  ... $id: $pos"
  done
  echo "  ⏰ $id timed out"
}

# Main heroes
generate "guanyu" "Chinese Three Kingdoms warrior Guan Yu (关羽) portrait, long flowing black beard, green robe, holding Green Dragon Crescent Blade polearm, red face, ink wash painting style, game character icon"
generate "zhangfei" "Chinese Three Kingdoms warrior Zhang Fei (张飞) portrait, wild fierce dark beard, leopard head eyes, holding serpent spear, intense expression, ink wash painting style, game icon"
generate "zhaoyun" "Chinese Three Kingdoms general Zhao Yun (赵云) portrait, young handsome warrior in silver armor, heroic pose, holding dragon spear, ink wash painting style, game icon"
generate "caocao" "Chinese Three Kingdoms warlord Cao Cao (曹操) portrait, cunning emperor in imperial dark blue robes, sharp eyes, commanding, ink wash painting style, game icon"
generate "lvbu" "Chinese Three Kingdoms warrior Lu Bu (吕布) portrait, most powerful warrior, phoenix feather headdress, menacing red armor, wielding halberd, ink wash painting style, game icon"
generate "diaochan" "Chinese Three Kingdoms beauty Diao Chan (貂蝉) portrait, ancient Chinese beauty, flowing silk robes, crescent moon hairpin, elegant, ink wash painting style, game icon"
generate "liubei" "Chinese Three Kingdoms lord Liu Bei (刘备) portrait, benevolent ruler, green emperor robes, dignified, kind eyes, ink wash painting style, game icon"
generate "zhugeLiang" "Chinese Three Kingdoms strategist Zhuge Liang (诸葛亮) portrait, holding feather fan, wearing scholar robes and tall hat, wise expression, ink wash painting style, game icon"
generate "sunshangxiang" "Chinese Three Kingdoms warrior princess Sun Shangxiang (孙尚香) portrait, fierce female warrior, red armor with bow, determined expression, ink wash painting style, game icon"
generate "zhouyu" "Chinese Three Kingdoms strategist Zhou Yu (周瑜) portrait, handsome young commander, red Wu kingdom robes, intelligent expression, ink wash painting style, game icon"
generate "simayi" "Chinese Three Kingdoms strategist Sima Yi (司马懿) portrait, cunning advisor in dark blue Wei robes, calculating eyes, ink wash painting style, game icon"
generate "huangzhong" "Chinese Three Kingdoms veteran general Huang Zhong (黄忠) portrait, elderly warrior with white beard, holding great bow, experienced, ink wash painting style, game icon"

echo ""
echo "=== BATCH 1 COMPLETE ==="
echo "Generated files:"
ls -la "$OUTDIR"/*.webp 2>/dev/null

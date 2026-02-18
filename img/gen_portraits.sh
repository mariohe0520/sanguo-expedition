#!/bin/bash
# Generate Three Kingdoms hero portraits using DALL-E
API_KEY="$OPENAI_API_KEY"

generate() {
  local id=$1
  local prompt=$2
  local outfile="${id}.png"
  
  if [ -f "$outfile" ]; then echo "Skip $id (exists)"; return; fi
  
  echo "Generating $id..."
  curl -s "https://api.openai.com/v1/images/generations" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"dall-e-3\",
      \"prompt\": \"Stylized portrait icon of ${prompt}. Chinese ink wash painting style with bold colors. Square composition, dark background, dramatic lighting. Game character portrait, high quality, no text.\",
      \"n\": 1,
      \"size\": \"1024x1024\",
      \"quality\": \"standard\"
    }" | python3 -c "
import json,sys,urllib.request,base64
d=json.load(sys.stdin)
if 'data' in d and len(d['data'])>0:
  url=d['data'][0].get('url','')
  if url:
    urllib.request.urlretrieve(url,'$outfile')
    print('  OK: $outfile')
  else: print('  No URL')
else: print('  Error:',d.get('error',{}).get('message','unknown'))
"
}

# Main heroes
generate "guanyu" "Guan Yu (关羽), legendary Chinese warrior with long black beard, green robe, holding Green Dragon Crescent Blade"
generate "zhangfei" "Zhang Fei (张飞), fierce Chinese warrior with wild dark beard, leopard head eyes, holding serpent spear"
generate "zhaoyun" "Zhao Yun (赵云), young handsome Chinese general in silver armor, holding dragon spear, heroic pose"
generate "caocao" "Cao Cao (曹操), cunning Chinese warlord-emperor in imperial dark blue robes, sharp eyes, commanding presence"
generate "lvbu" "Lu Bu (吕布), most powerful warrior in ancient China, wearing phoenix feather headdress, menacing red armor, wielding halberd"
generate "diaochan" "Diao Chan (貂蝉), stunning ancient Chinese beauty, flowing silk robes, crescent moon hairpin, elegant"
generate "liubei" "Liu Bei (刘备), benevolent Chinese lord with double swords, wearing green emperor robes, dignified"
generate "sunshangxiang" "Sun Shangxiang (孙尚香), fierce female warrior princess, red armor with bow, determined expression"

echo "Done!"

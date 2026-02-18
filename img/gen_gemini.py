#!/usr/bin/env python3
"""Generate Three Kingdoms hero portraits using Google Gemini (FREE)"""
import json, urllib.request, base64, time, os, sys

API_KEY = "AIzaSyDtb2cXMCqzaDxGhpZkGDj7EM40TTheRuQ"
MODEL = "gemini-2.0-flash-exp-image-generation"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
OUTDIR = os.path.dirname(os.path.abspath(__file__))

HEROES = {
    "guanyu": "Create a portrait icon of Chinese Three Kingdoms warrior Guan Yu (关羽). Red face, long flowing black beard, green robe armor, holding Green Dragon Crescent Blade. Ink wash painting style with bold colors, dark background, square game character portrait. High quality, detailed, no text.",
    "zhangfei": "Create a portrait icon of Chinese Three Kingdoms warrior Zhang Fei (张飞). Fierce expression, wild dark beard, dark armor, holding serpent spear. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "zhaoyun": "Create a portrait icon of Chinese Three Kingdoms general Zhao Yun (赵云). Young handsome warrior, silver armor, heroic expression, holding dragon spear. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "caocao": "Create a portrait icon of Chinese Three Kingdoms warlord Cao Cao (曹操). Cunning emperor, dark blue imperial robes, sharp eyes, commanding presence, crown. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "lvbu": "Create a portrait icon of Chinese Three Kingdoms warrior Lu Bu (吕布). Most powerful warrior, phoenix feather headdress, red armor, wielding halberd. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "diaochan": "Create a portrait icon of Chinese Three Kingdoms beauty Diao Chan (貂蝉). Stunning ancient Chinese beauty, flowing silk robes, crescent moon hairpin, elegant. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "liubei": "Create a portrait icon of Chinese Three Kingdoms lord Liu Bei (刘备). Benevolent ruler, green emperor robes, dignified kind expression. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "zhugeLiang": "Create a portrait icon of Chinese Three Kingdoms strategist Zhuge Liang (诸葛亮). Holding white feather fan, scholar robes, tall hat, wise serene expression. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "sunshangxiang": "Create a portrait icon of Chinese Three Kingdoms warrior princess Sun Shangxiang (孙尚香). Fierce female warrior, red armor with bow, determined expression. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "zhouyu": "Create a portrait icon of Chinese Three Kingdoms commander Zhou Yu (周瑜). Handsome young strategist, red Wu kingdom robes, intelligent expression. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "simayi": "Create a portrait icon of Chinese Three Kingdoms strategist Sima Yi (司马懿). Cunning cold advisor, dark blue Wei robes, calculating eyes. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "huangzhong": "Create a portrait icon of Chinese Three Kingdoms veteran Huang Zhong (黄忠). Elderly warrior, white beard, holding great bow, experienced. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "machao": "Create a portrait icon of Chinese Three Kingdoms general Ma Chao (马超). Young fierce warrior, white armor with spear, wild hair. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "dongzhuo": "Create a portrait icon of Chinese Three Kingdoms tyrant Dong Zhuo (董卓). Cruel warlord, dark ornate robes, menacing expression. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
    "zhangjiao": "Create a portrait icon of Chinese Three Kingdoms sorcerer Zhang Jiao (张角). Yellow turban leader, mystical robes, grey hair, holding staff. Ink wash painting style, dark background, square game character portrait. High quality, no text.",
}

def generate(hero_id, prompt):
    outfile = os.path.join(OUTDIR, f"{hero_id}.png")
    if os.path.exists(outfile) and os.path.getsize(outfile) > 5000:
        print(f"Skip {hero_id} (exists, {os.path.getsize(outfile)} bytes)")
        return True

    print(f"Generating {hero_id}...", flush=True)
    
    data = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"]
        }
    }).encode()
    
    req = urllib.request.Request(URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        result = json.loads(resp.read())
        
        # Extract image from response
        candidates = result.get("candidates", [])
        if not candidates:
            print(f"  ❌ No candidates: {result.get('error', {}).get('message', 'unknown')}")
            return False
        
        parts = candidates[0].get("content", {}).get("parts", [])
        for part in parts:
            if "inlineData" in part:
                img_data = part["inlineData"]["data"]
                mime = part["inlineData"].get("mimeType", "image/png")
                ext = "png" if "png" in mime else "jpg" if "jpeg" in mime or "jpg" in mime else "webp"
                outfile = os.path.join(OUTDIR, f"{hero_id}.{ext}")
                
                img_bytes = base64.b64decode(img_data)
                with open(outfile, "wb") as f:
                    f.write(img_bytes)
                
                print(f"  ✅ {hero_id}.{ext} ({len(img_bytes)} bytes)")
                return True
        
        # No image found
        text_parts = [p.get("text", "") for p in parts if "text" in p]
        if text_parts:
            print(f"  ❌ Text only: {text_parts[0][:100]}")
        else:
            print(f"  ❌ No image in response")
        return False
        
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        print(f"  ❌ HTTP {e.code}: {body}")
        if e.code == 429:
            print("  ⏳ Rate limited, waiting 30s...")
            time.sleep(30)
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

# Generate all heroes
success = 0
failed = 0
for i, (hero_id, prompt) in enumerate(HEROES.items()):
    ok = generate(hero_id, prompt)
    if ok:
        success += 1
    else:
        failed += 1
    
    # Rate limit: 15 RPM for free tier
    if i < len(HEROES) - 1:
        time.sleep(5)  # ~12 per minute, safe margin

print(f"\n=== RESULTS: {success} ✅ / {failed} ❌ ===")
for hero_id in HEROES:
    for ext in ["png", "jpg", "webp"]:
        f = os.path.join(OUTDIR, f"{hero_id}.{ext}")
        if os.path.exists(f) and os.path.getsize(f) > 1000:
            print(f"  ✅ {hero_id}.{ext} ({os.path.getsize(f)} bytes)")
            break
    else:
        print(f"  ❌ {hero_id}: missing")

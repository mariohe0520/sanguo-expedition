import subprocess
import os

HEROES = [
    ("guanyu", "关羽", "Guan Yu, legendary Chinese general, red face, long flowing black beard, green dragon crescent blade, ornate gold armor, divine aura, anime game art style, portrait, upper body, front view, clean gradient background, dramatic lighting, masterpiece, best quality, highly detailed, sharp focus, 8k resolution, trending on artstation"),
    ("caocao", "曹操", "Cao Cao, cunning Chinese warlord emperor, purple imperial robe with gold embroidery, jade crown, intense calculating eyes, pointed beard, anime game art style, portrait, upper body, dark commanding presence, clean gradient background, dramatic lighting, masterpiece, best quality, highly detailed, sharp focus"),
    ("zhaoyun", "赵云", "Zhao Yun, young handsome Chinese general, silver white armor, heroic pose, gentle but determined expression, silver spear, anime game art style, portrait, upper body, clean gradient background, soft dramatic lighting, masterpiece, best quality, highly detailed, sharp focus"),
    ("lvbu", "吕布", "Lu Bu, strongest Chinese warrior, fierce expression, red and gold armor, crown, holding Sky Piercer halberd, intimidating aura, anime game art style, portrait, upper body, clean gradient background, dramatic red lighting, masterpiece, best quality, highly detailed, sharp focus"),
]

for hero_id, name, prompt in HEROES:
    output = f"img/premium/{hero_id}.png"
    if os.path.exists(output):
        print(f"⏭️  {name} 已存在")
        continue
    
    print(f"🎨 生成 {name}...")
    cmd = [
        "mflux-generate",
        "--model", "schnell",
        "--prompt", prompt,
        "--output", output,
        "--steps", "8",  # schnell最高步数
        "--width", "1024",
        "--height", "1024",
        "--guidance", "3.5",
    ]
    subprocess.run(cmd, timeout=300)
    print(f"✅ {name} 完成")

print("🎉 五星传说武将完成!")

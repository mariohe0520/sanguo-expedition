#!/usr/bin/env python3
"""
🎨 三国天命 - 顶级立绘批量生成器 (Premium Edition)
使用 FLUX.1-dev + 1024x1024 + 高质量配置
"""

import subprocess
import os
import json
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
import time

# 五星传说武将 - 最高质量配置
LEGENDARY_HEROES = [
    {"id": "guanyu", "name": "关羽", "title": "武圣", 
     "prompt": "Guan Yu, legendary Chinese general, distinctive RED FACE, extremely long flowing black beard, holding massive Green Dragon Crescent Blade, ornate gold and green armor, divine aura, anime game art style, portrait, upper body, front view, clean gradient background, dramatic lighting, masterpiece, best quality, highly detailed, 8k, sharp focus, cinematic composition"},
    
    {"id": "caocao", "name": "曹操", "title": "乱世奸雄",
     "prompt": "Cao Cao, cunning Chinese warlord emperor, purple imperial robe with gold embroidery, jade crown, intense calculating eyes, pointed beard, anime game art style, portrait, upper body, dark commanding presence, clean gradient background, dramatic lighting, masterpiece, best quality, highly detailed, 8k"},
    
    {"id": "zhaoyun", "name": "赵云", "title": "常山赵子龙",
     "prompt": "Zhao Yun, young handsome Chinese general, silver white armor, heroic pose, gentle but determined expression, silver spear, anime game art style, portrait, upper body, clean gradient background, soft dramatic lighting, masterpiece, best quality, highly detailed, 8k"},
    
    {"id": "lvbu", "name": "吕布", "title": "飞将",
     "prompt": "Lu Bu, strongest Chinese warrior, fierce expression, red and gold armor, crown, holding Sky Piercer halberd, intimidating aura, anime game art style, portrait, upper body, clean gradient background, dramatic red lighting, masterpiece, best quality, highly detailed, 8k"},
]

# 四星史诗武将
EPIC_HEROES = [
    {"id": "liubei", "name": "刘备", "title": "仁德之主",
     "prompt": "Liu Bei, benevolent Chinese leader, green robe, kind gentle face, distinctive long ears, sword, wise compassionate eyes, anime game art style, portrait, upper body, clean gradient background, masterpiece, best quality, highly detailed"},
    
    {"id": "zhangfei", "name": "张飞", "title": "万人敌",
     "prompt": "Zhang Fei, fierce Chinese general, black face, wild black beard, serpent spear, angry intense expression, loud personality, anime game art style, portrait, upper body, clean gradient background, masterpiece, best quality, highly detailed"},
    
    {"id": "sunshangxiang", "name": "孙尚香", "title": "弓腰姬",
     "prompt": "Sun Shangxiang, Chinese female warrior princess, red outfit, bow and arrows, confident fierce expression, beautiful but deadly, anime game art style, portrait, upper body, clean gradient background, masterpiece, best quality, highly detailed"},
    
    {"id": "diaochan", "name": "貂蝉", "title": "闭月",
     "prompt": "Diao Chan, Chinese legendary beauty, elegant flowing dress, graceful pose, enchanting beauty, long flowing hair, anime game art style, portrait, upper body, clean gradient background, masterpiece, best quality, highly detailed"},
    
    {"id": "zhangjiao", "name": "张角", "title": "天公将军",
     "prompt": "Zhang Jiao, Chinese Taoist sorcerer, yellow turban, flowing robes, staff with mystical symbols, magical yellow aura, wise mystical eyes, anime game art style, portrait, upper body, clean gradient background, masterpiece, best quality, highly detailed"},
]

# 其他武将使用标准配置
STANDARD_HEROES = [
    # 三星及以下武将可以在这里添加
]

def generate_hero_portrait(hero, output_dir, quality="premium"):
    """生成单个武将立绘"""
    output_path = os.path.join(output_dir, f"{hero['id']}.png")
    
    # 如果已存在则跳过
    if os.path.exists(output_path):
        print(f"⏭️  跳过 {hero['name']} (已存在)")
        return True, hero['name'], "skipped"
    
    print(f"🎨 生成 {hero['name']} ({hero.get('title', '')}) - {quality}模式")
    
    # 根据质量等级选择配置
    if quality == "legendary":
        # 五星传说 - 最高质量
        config = {
            "model": "dev",
            "steps": "16",
            "width": "1024",
            "height": "1024",
            "guidance": "4.0",
        }
    elif quality == "epic":
        # 四星史诗 - 高质量
        config = {
            "model": "dev",
            "steps": "12",
            "width": "1024",
            "height": "1024",
            "guidance": "3.5",
        }
    else:
        # 标准 - 高质量但更快
        config = {
            "model": "dev",
            "steps": "8",
            "width": "1024",
            "height": "1024",
            "guidance": "3.0",
        }
    
    # 构建 prompt
    full_prompt = f"{hero['prompt']}, trending on artstation, pixiv"
    
    cmd = [
        "mflux-generate",
        "--model", config["model"],
        "--prompt", full_prompt,
        "--output", output_path,
        "--steps", config["steps"],
        "--width", config["width"],
        "--height", config["height"],
        "--guidance", config["guidance"],
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10分钟超时
        )
        
        if result.returncode == 0:
            file_size = os.path.getsize(output_path) / 1024  # KB
            print(f"  ✅ 完成: {output_path} ({file_size:.1f} KB)")
            return True, hero['name'], "success"
        else:
            print(f"  ❌ 失败: {result.stderr[:200]}")
            return False, hero['name'], "failed"
    except subprocess.TimeoutExpired:
        print(f"  ⏱️ 超时: {hero['name']}")
        return False, hero['name'], "timeout"
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False, hero['name", str(e)]

def main():
    output_dir = "/Users/mario/.openclaw/workspace/games/sanguo-expedition/img/heroes_premium"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🚀 开始批量生成顶级武将立绘...")
    print(f"📁 输出目录: {output_dir}\n")
    
    start_time = time.time()
    
    # 1. 先生成五星传说 (最高质量)
    print("=" * 50)
    print("⭐ 阶段1: 五星传说武将 (legendary质量)")
    print("=" * 50)
    legendary_results = []
    for hero in LEGENDARY_HEROES:
        success, name, status = generate_hero_portrait(hero, output_dir, "legendary")
        legendary_results.append((success, name, status))
    
    # 2. 生成四星史诗 (高质量)
    print("\n" + "=" * 50)
    print("⭐ 阶段2: 四星史诗武将 (epic质量)")
    print("=" * 50)
    epic_results = []
    for hero in EPIC_HEROES:
        success, name, status = generate_hero_portrait(hero, output_dir, "epic")
        epic_results.append((success, name, status))
    
    # 统计结果
    elapsed = time.time() - start_time
    
    all_results = legendary_results + epic_results
    success_count = sum(1 for r in all_results if r[0])
    failed_count = len(all_results) - success_count
    
    print("\n" + "=" * 50)
    print("📊 生成统计")
    print("=" * 50)
    print(f"总计: {len(all_results)} 个武将")
    print(f"成功: {success_count}")
    print(f"失败: {failed_count}")
    print(f"耗时: {elapsed/60:.1f} 分钟")
    print(f"平均: {elapsed/len(all_results)/60:.1f} 分钟/张")
    
    # 保存状态
    status = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total": len(all_results),
        "success": success_count,
        "failed": failed_count,
        "elapsed_minutes": elapsed/60,
        "output_dir": output_dir,
        "legendary_heroes": [h["id"] for h in LEGENDARY_HEROES],
        "epic_heroes": [h["id"] for h in EPIC_HEROES],
    }
    
    with open(os.path.join(output_dir, "_premium_status.json"), "w") as f:
        json.dump(status, f, indent=2)
    
    print(f"\n✅ 状态已保存到: {output_dir}/_premium_status.json")
    print(f"🎉 顶级立绘生成完成!")

if __name__ == "__main__":
    main()

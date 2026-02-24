#!/usr/bin/env python3
"""
🎨 三国天命 - AI武将立绘批量生成器
使用 mflux (FLUX.1-schnell) 本地生成所有武将立绘
"""

import subprocess
import os
import json
from pathlib import Path

# 武将数据库 (从 heroes.js 提取)
HEROES = [
    # 五星传说
    {"id": "guanyu", "name": "关羽", "title": "武圣", "faction": "蜀", "unit": "骑兵", 
     "prompt": "Guan Yu, legendary Chinese general, red face, long black beard, green dragon crescent blade, armor, anime style portrait, high quality, detailed"},
    {"id": "caocao", "name": "曹操", "title": "乱世奸雄", "faction": "魏", "unit": "骑兵",
     "prompt": "Cao Cao, Chinese warlord, purple imperial robe, crown, cunning expression, beard, anime style portrait, high quality, detailed"},
    {"id": "zhaoyun", "name": "赵云", "title": "常山赵子龙", "faction": "蜀", "unit": "骑兵",
     "prompt": "Zhao Yun, young Chinese general, white armor, silver spear, handsome, heroic pose, anime style portrait, high quality, detailed"},
    {"id": "lvbu", "name": "吕布", "title": "飞将", "faction": "群", "unit": "骑兵",
     "prompt": "Lu Bu, strongest Chinese warrior, red armor, halberd, fierce expression, crown, anime style portrait, high quality, detailed"},
    
    # 四星史诗
    {"id": "liubei", "name": "刘备", "title": "仁德之主", "faction": "蜀", "unit": "盾兵",
     "prompt": "Liu Bei, benevolent Chinese leader, green robe, kind face, long ears, sword, anime style portrait, high quality, detailed"},
    {"id": "zhangfei", "name": "张飞", "title": "万人敌", "faction": "蜀", "unit": "枪兵",
     "prompt": "Zhang Fei, fierce Chinese general, black face, wild beard, serpent spear, angry expression, anime style portrait, high quality, detailed"},
    {"id": "sunshangxiang", "name": "孙尚香", "title": "弓腰姬", "faction": "吴", "unit": "弓兵",
     "prompt": "Sun Shangxiang, Chinese female warrior princess, red outfit, bow and arrows, confident expression, anime style portrait, high quality, detailed"},
    {"id": "zhangjiao", "name": "张角", "title": "天公将军", "faction": "群", "unit": "术士",
     "prompt": "Zhang Jiao, Chinese Taoist sorcerer, yellow turban, robes, staff, mystical, anime style portrait, high quality, detailed"},
    {"id": "diaochan", "name": "貂蝉", "title": "闭月", "faction": "群", "unit": "术士",
     "prompt": "Diao Chan, Chinese legendary beauty, elegant dress, flowing hair, graceful, anime style portrait, high quality, detailed"},
    
    # 三星稀有
    {"id": "huangzhong", "name": "黄忠", "title": "老当益壮", "faction": "蜀", "unit": "弓兵",
     "prompt": "Huang Zhong, elderly Chinese archer general, white beard, bow, armor, wise expression, anime style portrait, high quality, detailed"},
    
    # 二星精英
    {"id": "elite_cavalry", "name": "精锐骑兵", "title": "", "faction": "群", "unit": "骑兵",
     "prompt": "Elite Chinese cavalry warrior, horse armor, spear, helmet, anime style portrait, high quality, detailed"},
    {"id": "elite_spear", "name": "精锐枪兵", "title": "", "faction": "群", "unit": "枪兵",
     "prompt": "Elite Chinese spearman, long spear, armor, shield, anime style portrait, high quality, detailed"},
    {"id": "elite_archer", "name": "精锐弓手", "title": "", "faction": "群", "unit": "弓兵",
     "prompt": "Elite Chinese archer, bow, arrows, light armor, focused expression, anime style portrait, high quality, detailed"},
    {"id": "elite_shield", "name": "精锐盾卫", "title": "", "faction": "群", "unit": "盾兵",
     "prompt": "Elite Chinese shield bearer, large shield, sword, heavy armor, anime style portrait, high quality, detailed"},
    
    # 一星普通
    {"id": "soldier", "name": "新兵", "title": "", "faction": "群", "unit": "枪兵",
     "prompt": "Young Chinese soldier recruit, simple spear, basic armor, determined expression, anime style portrait, high quality, detailed"},
    {"id": "archer_recruit", "name": "弓手", "title": "", "faction": "群", "unit": "弓兵",
     "prompt": "Young Chinese archer, wooden bow, simple clothes, hunter, anime style portrait, high quality, detailed"},
    {"id": "shield_militia", "name": "盾民兵", "title": "", "faction": "群", "unit": "盾兵",
     "prompt": "Chinese militia shieldman, wooden shield, rustic armor, village defender, anime style portrait, high quality, detailed"},
    {"id": "mage_acolyte", "name": "术士学徒", "title": "", "faction": "群", "unit": "术士",
     "prompt": "Young Chinese magic apprentice, simple robes, spellbook, magical aura, anime style portrait, high quality, detailed"},
    {"id": "cavalry_recruit", "name": "骑兵", "title": "", "faction": "群", "unit": "骑兵",
     "prompt": "Young Chinese cavalry soldier, horse, basic lance, light armor, anime style portrait, high quality, detailed"},
]

def generate_portrait(hero, output_dir):
    """使用 mflux 生成单个武将立绘"""
    output_path = os.path.join(output_dir, f"{hero['id']}.png")
    
    # 如果已存在则跳过
    if os.path.exists(output_path):
        print(f"⏭️  跳过 {hero['name']} (已存在)")
        return True
    
    print(f"🎨 生成 {hero['name']} - {hero.get('title', '')}")
    
    # 构建 prompt - 统一风格
    base_prompt = hero['prompt']
    full_prompt = f"{base_prompt}, portrait, upper body, front view, clean background, anime art style, vibrant colors, sharp focus"
    
    # mflux 参数
    cmd = [
        "mflux-generate",
        "--model", "schnell",  # 使用 schnell 快速模式
        "--prompt", full_prompt,
        "--output", output_path,
        "--steps", "4",  # 快速生成
        "--width", "512",
        "--height", "640",  # 竖版适合头像
        "--guidance", "3.0"
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120  # 2分钟超时
        )
        
        if result.returncode == 0:
            print(f"  ✅ 完成: {output_path}")
            return True
        else:
            print(f"  ❌ 失败: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  ⏱️ 超时")
        return False
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False

def main():
    output_dir = "/Users/mario/.openclaw/workspace/games/sanguo-expedition/img/heroes"
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"🚀 开始批量生成 {len(HEROES)} 个武将立绘...")
    print(f"📁 输出目录: {output_dir}\n")
    
    success_count = 0
    fail_count = 0
    
    for hero in HEROES:
        if generate_portrait(hero, output_dir):
            success_count += 1
        else:
            fail_count += 1
        print()
    
    print(f"\n🎉 完成!")
    print(f"✅ 成功: {success_count}")
    print(f"❌ 失败: {fail_count}")
    print(f"📊 成功率: {success_count/len(HEROES)*100:.1f}%")
    
    # 生成状态文件
    status = {
        "total": len(HEROES),
        "success": success_count,
        "failed": fail_count,
        "output_dir": output_dir,
        "heroes": [h["id"] for h in HEROES]
    }
    
    with open(os.path.join(output_dir, "_generation_status.json"), "w") as f:
        json.dump(status, f, indent=2)

if __name__ == "__main__":
    main()

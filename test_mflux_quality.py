#!/usr/bin/env python3
"""测试 mflux 不同参数下的立绘质量"""

import subprocess
import os

# 测试不同配置
configs = [
    # 配置1: 更高steps
    {
        "name": "high_quality",
        "steps": "8",
        "guidance": "3.5",
        "prompt": "Guan Yu, legendary Chinese general, red face, long flowing black beard, green dragon crescent blade, ornate gold armor, anime style portrait, upper body, front view, clean gradient background, vibrant colors, sharp focus, masterpiece, best quality, highly detailed"
    },
    # 配置2: 不同风格词
    {
        "name": "stylized",
        "steps": "8",
        "guidance": "3.0",
        "prompt": "Guan Yu, Chinese warrior god, crimson face, majestic beard, jade green armor with gold trim, holding Crescent Moon Blade, anime game art style, portrait, dramatic lighting, 8k, ultra detailed, pixiv trending"
    }
]

output_dir = "img/test_quality"
os.makedirs(output_dir, exist_ok=True)

for config in configs:
    output_path = f"{output_dir}/guanyu_{config['name']}.png"
    
    cmd = [
        "mflux-generate",
        "--model", "schnell",
        "--prompt", config["prompt"],
        "--output", output_path,
        "--steps", config["steps"],
        "--width", "512",
        "--height", "640",
        "--guidance", config["guidance"]
    ]
    
    print(f"🎨 测试: {config['name']} (steps={config['steps']}, guidance={config['guidance']})")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    
    if result.returncode == 0:
        print(f"  ✅ 完成: {output_path}")
    else:
        print(f"  ❌ 失败: {result.stderr}")

print("\n🎉 测试完成，请检查 img/test_quality/ 目录对比效果")

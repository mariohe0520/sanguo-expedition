#!/usr/bin/env python3
"""
🎵 三国天命 - 本地化战斗音效生成器
物理建模合成史诗级战斗音效
"""

import numpy as np
import soundfile as sf
import os

SAMPLE_RATE = 44100
OUTPUT_DIR = "/Users/mario/.openclaw/workspace/games/sanguo-expedition/assets/sounds"

def ensure_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_sound(signal, filename):
    max_val = np.max(np.abs(signal))
    if max_val > 0:
        signal = signal / max_val * 0.9
    sf.write(os.path.join(OUTPUT_DIR, filename), signal, SAMPLE_RATE)
    print(f"✅ {filename}")

def generate_sword_slash():
    """剑气斩击 - 高频呼啸"""
    duration = 0.3
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 主频率从高频快速下降
    freq = 2000 * np.exp(-t * 10)
    signal = np.sin(2 * np.pi * freq * t) * np.exp(-t * 3)
    
    # 添加金属质感噪声
    noise = np.random.randn(len(t)) * 0.3 * np.exp(-t * 5)
    
    return signal + noise

def generate_spear_thrust():
    """长枪突刺 - 锐利的破空声"""
    duration = 0.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 尖锐的爆发
    freq = 1500 + 500 * np.sin(t * 50)
    envelope = np.exp(-t * 15)
    signal = np.sin(2 * np.pi * freq * t) * envelope
    
    return signal

def generate_arrow_shot():
    """弓箭射击 - 弦震 + 破空"""
    duration = 0.25
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 弦的震动
    string_freq = 800 * np.exp(-t * 8)
    string = np.sin(2 * np.pi * string_freq * t) * np.exp(-t * 4)
    
    # 破空声
    wind = np.random.randn(len(t)) * 0.4 * np.exp(-t * 6)
    wind_filtered = np.convolve(wind, np.array([0.2, 0.6, 0.2]), mode='same')
    
    return string * 0.6 + wind_filtered * 0.4

def generate_magic_cast():
    """法术释放 - 神秘能量"""
    duration = 0.8
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 多频率合成
    signal = np.zeros_like(t)
    for freq in [400, 600, 800, 1200]:
        phase = np.random.rand() * 2 * np.pi
        signal += np.sin(2 * np.pi * freq * t + phase) * np.exp(-t * 2) * 0.25
    
    # 神秘噪声
    noise = np.random.randn(len(t)) * 0.2 * np.exp(-t * 1.5)
    
    return signal + noise

def generate_cavalry_charge():
    """骑兵冲锋 - 马蹄 + 呼啸"""
    duration = 1.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    signal = np.zeros_like(t)
    
    # 马蹄声节奏
    hoof_times = [0.1, 0.25, 0.4, 0.55, 0.7]
    for hoof_t in hoof_times:
        idx = int(hoof_t * SAMPLE_RATE)
        if idx < len(signal) - 100:
            # 低频冲击
            hoof = np.sin(2 * np.pi * 100 * np.linspace(0, 0.1, 100)) * np.exp(-np.linspace(0, 0.1, 100) * 10)
            signal[idx:idx+100] += hoof * 0.5
    
    # 呼啸声
    wind = np.random.randn(len(t)) * 0.3 * (1 - np.exp(-t * 2))
    
    return signal + wind * 0.3

def generate_shield_block():
    """盾击格挡 - 厚重的金属撞击"""
    duration = 0.3
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 低频撞击
    thump = np.sin(2 * np.pi * 200 * t) * np.exp(-t * 8)
    
    # 金属共鸣
    metal = np.sin(2 * np.pi * 800 * t) * np.exp(-t * 12) * 0.3
    
    return thump + metal

def generate_victory_fanfare():
    """胜利号角 - 史诗感"""
    duration = 2.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    signal = np.zeros_like(t)
    
    # 五声音阶号角
    base_freq = 523.25  # C5
    scale = [1.0, 1.125, 1.25, 1.5, 1.667]  # 中国传统五声音阶
    
    for i, ratio in enumerate(scale):
        freq = base_freq * ratio
        start = i * 0.3
        attack = 0.1
        
        env = np.zeros_like(t)
        start_idx = int(start * SAMPLE_RATE)
        if start_idx < len(t):
            attack_samples = int(attack * SAMPLE_RATE)
            sustain_samples = int(0.5 * SAMPLE_RATE)
            
            if start_idx + attack_samples <= len(t):
                env[start_idx:start_idx + attack_samples] = np.linspace(0, 0.3, attack_samples)
            if start_idx + attack_samples + sustain_samples <= len(t):
                decay = np.linspace(0.3, 0, sustain_samples)
                env[start_idx + attack_samples:start_idx + attack_samples + sustain_samples] = decay
        
        signal += np.sin(2 * np.pi * freq * t) * env
    
    return signal

def generate_battle_start():
    """战斗开始 - 战鼓"""
    duration = 1.5
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    signal = np.zeros_like(t)
    
    # 战鼓节奏
    drum_times = [0.0, 0.3, 0.6, 0.9, 1.2]
    for drum_t in drum_times:
        idx = int(drum_t * SAMPLE_RATE)
        if idx < len(signal) - 200:
            # 低频鼓声
            drum = np.sin(2 * np.pi * 80 * np.linspace(0, 0.2, 200)) * np.exp(-np.linspace(0, 0.2, 200) * 5)
            signal[idx:idx+200] += drum * 0.8
    
    return signal

def main():
    ensure_dir()
    print("🎵 生成三国战斗音效...")
    
    sounds = {
        "sword_slash.wav": generate_sword_slash,
        "spear_thrust.wav": generate_spear_thrust,
        "arrow_shot.wav": generate_arrow_shot,
        "magic_cast.wav": generate_magic_cast,
        "cavalry_charge.wav": generate_cavalry_charge,
        "shield_block.wav": generate_shield_block,
        "victory_fanfare.wav": generate_victory_fanfare,
        "battle_start.wav": generate_battle_start,
    }
    
    for filename, generator in sounds.items():
        signal = generator()
        save_sound(signal, filename)
    
    print(f"\n🎉 完成! 音效保存在: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

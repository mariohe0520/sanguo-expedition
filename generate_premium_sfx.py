#!/usr/bin/env python3
"""
⚔️ 三国天命 - 分层音效合成器 (Premium SFX)
Plan B: 改进版numpy合成，多层叠加达到最佳效果
"""

import numpy as np
import soundfile as sf
import os
from pathlib import Path

SAMPLE_RATE = 48000  # 提升采样率
OUTPUT_DIR = "/Users/mario/.openclaw/workspace/games/sanguo-expedition/assets/sounds_premium"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def apply_envelope(signal, attack=0.01, decay=0.3, sustain=0.5, release=0.2, total_duration=None):
    """ADSR包络 - 让声音更自然"""
    if total_duration is None:
        total_duration = len(signal) / SAMPLE_RATE
    
    samples = len(signal)
    attack_s = int(attack * SAMPLE_RATE)
    decay_s = int(decay * SAMPLE_RATE)
    release_s = int(release * SAMPLE_RATE)
    sustain_s = samples - attack_s - decay_s - release_s
    
    if sustain_s < 0:
        sustain_s = 0
    
    envelope = np.concatenate([
        np.linspace(0, 1, attack_s),  # Attack
        np.linspace(1, sustain, decay_s),  # Decay
        np.full(sustain_s, sustain),  # Sustain
        np.linspace(sustain, 0, release_s)  # Release
    ])
    
    # 确保长度匹配
    if len(envelope) < samples:
        envelope = np.pad(envelope, (0, samples - len(envelope)), mode='edge')
    else:
        envelope = envelope[:samples]
    
    return signal * envelope

def add_reverb(signal, decay=0.3, delay_ms=30):
    """简单混响效果"""
    delay_samples = int(delay_ms * SAMPLE_RATE / 1000)
    reverb = np.zeros_like(signal)
    
    # 多重延迟模拟混响
    for i in range(3):
        delay = delay_samples * (i + 1)
        if delay < len(signal):
            attenuation = decay ** (i + 1)
            reverb[delay:] += signal[:-delay] * attenuation
    
    return signal + reverb * 0.3

def generate_sword_slash():
    """剑刃挥砍 - 多层高频+中频"""
    duration = 0.4
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 层1: 高频啸叫（剑刃破空）
    freq_sweep = np.linspace(8000, 2000, len(t))
    layer1 = np.sin(2 * np.pi * np.cumsum(freq_sweep) / SAMPLE_RATE) * 0.6
    
    # 层2: 中频切割（击中感）
    freq2 = np.linspace(3000, 800, len(t))
    layer2 = np.sin(2 * np.pi * np.cumsum(freq2) / SAMPLE_RATE) * 0.4
    
    # 层3: 低频冲击（厚重感）
    layer3 = np.sin(2 * np.pi * 200 * t) * np.exp(-t * 10) * 0.3
    
    # 层4: 白噪声（空气感）
    noise = np.random.randn(len(t)) * np.exp(-t * 8) * 0.2
    
    signal = layer1 + layer2 + layer3 + noise
    signal = apply_envelope(signal, attack=0.005, decay=0.1, sustain=0.3, release=0.2)
    signal = add_reverb(signal, decay=0.4)
    
    return signal / np.max(np.abs(signal)) * 0.9

def generate_spear_thrust():
    """长枪突刺 - 快速穿透感"""
    duration = 0.35
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 层1: 快速频率上扫
    freq_sweep = np.linspace(600, 4000, len(t))
    layer1 = np.sin(2 * np.pi * np.cumsum(freq_sweep) / SAMPLE_RATE)
    
    # 层2: 冲击噪声
    noise = np.random.randn(len(t)) * np.exp(-t * 15)
    
    # 层3: 低频冲击
    layer3 = np.sin(2 * np.pi * 150 * t) * np.exp(-t * 12)
    
    signal = layer1 * 0.5 + noise * 0.3 + layer3 * 0.4
    signal = apply_envelope(signal, attack=0.002, decay=0.08, sustain=0.1, release=0.1)
    
    return signal / np.max(np.abs(signal)) * 0.9

def generate_arrow_shot():
    """弓箭射击 - 弦震+箭矢破空"""
    duration = 0.5
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 层1: 弦的震动（低频）
    string = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 3) * 0.4
    
    # 层2: 箭矢破空（高频）
    arrow = np.sin(2 * np.pi * 2500 * t) * np.exp(-t * 6) * 0.5
    
    # 层3: 嗖嗖声（噪声调制）
    noise = np.random.randn(len(t))
    # 简单低通滤波效果
    noise_filtered = np.convolve(noise, np.ones(5)/5, mode='same')
    noise_filtered *= np.exp(-t * 8) * 0.3
    
    signal = string + arrow + noise_filtered
    signal = apply_envelope(signal, attack=0.01, decay=0.15, sustain=0.2, release=0.25)
    signal = add_reverb(signal, decay=0.3)
    
    return signal / np.max(np.abs(signal)) * 0.9

def generate_cavalry_charge():
    """骑兵冲锋 - 马蹄+气势"""
    duration = 2.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    signal = np.zeros_like(t)
    
    # 马蹄声节奏
    hoof_times = np.arange(0.1, duration, 0.25)
    for hoof_t in hoof_times:
        idx = int(hoof_t * SAMPLE_RATE)
        if idx < len(signal) - 1000:
            # 单个马蹄声
            hoof_duration = 0.15
            hoof_samples = int(hoof_duration * SAMPLE_RATE)
            hoof_t_local = np.linspace(0, hoof_duration, hoof_samples)
            hoof = (
                np.sin(2 * np.pi * 80 * hoof_t_local) * 0.6 +
                np.sin(2 * np.pi * 200 * hoof_t_local) * 0.4
            ) * np.exp(-hoof_t_local * 8)
            
            end_idx = min(idx + hoof_samples, len(signal))
            signal[idx:end_idx] += hoof[:end_idx-idx]
    
    # 添加环境风声
    wind = np.random.randn(len(t)) * 0.05
    wind = np.convolve(wind, np.ones(50)/50, mode='same')
    
    signal += wind
    signal = apply_envelope(signal, attack=0.5, decay=0.3, sustain=0.7, release=0.5)
    
    return signal / np.max(np.abs(signal)) * 0.9

def generate_magic_cast():
    """法术释放 - 神秘能量感"""
    duration = 1.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # 层1: 能量聚集（低频上升）
    freq_rise = np.linspace(100, 800, len(t))
    layer1 = np.sin(2 * np.pi * np.cumsum(freq_rise) / SAMPLE_RATE) * 0.4
    
    # 层2: 魔法 sparkle（高频闪烁）
    sparkle = np.zeros_like(t)
    for _ in range(20):
        pos = np.random.randint(0, len(t) - 100)
        freq = np.random.uniform(3000, 6000)
        sparkle[pos:pos+100] += np.sin(2 * np.pi * freq * np.linspace(0, 0.01, 100)) * 0.1
    
    # 层3: 环境嗡鸣
    drone = np.sin(2 * np.pi * 220 * t) * np.sin(2 * np.pi * 2 * t) * 0.2
    
    signal = layer1 + sparkle + drone
    signal = apply_envelope(signal, attack=0.3, decay=0.4, sustain=0.5, release=0.5)
    signal = add_reverb(signal, decay=0.6)
    
    return signal / np.max(np.abs(signal)) * 0.9

def generate_victory_fanfare():
    """胜利号角 - 中国古风+壮丽"""
    duration = 3.0
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    signal = np.zeros_like(t)
    
    # 五声音阶音符 (宫商角徵羽)
    base_freq = 261.63  # C4
    pentatonic = [1.0, 1.125, 1.25, 1.5, 1.667]  # 对应 C, D, E, G, A
    
    # 胜利旋律
    melody = [
        (0.0, 2, 0.8),    # 起始音符
        (0.4, 4, 0.7),    # 徵
        (0.8, 2, 0.9),    # 角
        (1.2, 0, 1.0),    # 宫 - 主音
        (1.8, 4, 0.6),    # 徵
        (2.2, 2, 0.8),    # 角
        (2.6, 0, 1.0),    # 宫 - 结束
    ]
    
    for start_time, note_idx, amplitude in melody:
        freq = base_freq * pentatonic[note_idx]
        start_sample = int(start_time * SAMPLE_RATE)
        duration_samples = int(0.6 * SAMPLE_RATE)
        
        if start_sample + duration_samples < len(signal):
            note_t = np.linspace(0, 0.6, duration_samples)
            # 号角音色（方波+锯齿波）
            note = (
                np.sign(np.sin(2 * np.pi * freq * note_t)) * 0.5 +
                (2 * (freq * note_t % 1) - 1) * 0.3
            )
            note *= np.exp(-note_t * 1.5) * amplitude
            signal[start_sample:start_sample+duration_samples] += note
    
    # 添加鼓点
    drum_times = [0.0, 0.8, 1.6, 2.4]
    for drum_t in drum_times:
        idx = int(drum_t * SAMPLE_RATE)
        if idx < len(signal) - 500:
            drum = np.sin(2 * np.pi * 60 * np.linspace(0, 0.1, 500)) * np.exp(-np.linspace(0, 0.1, 500) * 20)
            signal[idx:idx+500] += drum * 0.5
    
    signal = add_reverb(signal, decay=0.5)
    
    return signal / np.max(np.abs(signal)) * 0.9

def save_sound(signal, filename):
    """保存音频文件"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    sf.write(filepath, signal, SAMPLE_RATE)
    print(f"✅ Generated: {filename} ({len(signal)/SAMPLE_RATE:.2f}s)")

def main():
    print("🎵 生成三国顶级音效 (分层合成版)...")
    print("=" * 50)
    
    # 生成所有音效
    save_sound(generate_sword_slash(), "sword_slash.wav")
    save_sound(generate_spear_thrust(), "spear_thrust.wav")
    save_sound(generate_arrow_shot(), "arrow_shot.wav")
    save_sound(generate_cavalry_charge(), "cavalry_charge.wav")
    save_sound(generate_magic_cast(), "magic_cast.wav")
    save_sound(generate_victory_fanfare(), "victory_fanfare.wav")
    
    print("=" * 50)
    print(f"🎉 所有音效已保存到: {OUTPUT_DIR}")
    print(f"📊 采样率: {SAMPLE_RATE}Hz (CD音质)")
    print(f"🔧 特点: ADSR包络 + 混响 + 分层合成")

if __name__ == "__main__":
    main()

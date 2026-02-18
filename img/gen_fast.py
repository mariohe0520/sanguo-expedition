#!/usr/bin/env python3
"""Generate Three Kingdoms portraits via Stable Horde (FREE, zero-queue models)"""
import json, urllib.request, urllib.error, time, os, sys

OUTDIR = os.path.dirname(os.path.abspath(__file__))
API = "https://stablehorde.net/api/v2"
# Use models with 0 queue for instant generation
MODELS = ["Animagine XL", "AAM XL", "Fustercluck"]

HEROES = {
    "guanyu": "1boy, Chinese ancient warrior Guan Yu, long flowing black beard, red face, green robe armor, holding Green Dragon Crescent Blade polearm weapon, serious expression, detailed portrait, dark background, ink wash painting style, masterpiece, best quality",
    "zhangfei": "1boy, Chinese ancient warrior Zhang Fei, wild fierce dark beard, angry fierce expression, dark armor, holding serpent spear weapon, muscular, battle-ready, dark background, ink painting style, masterpiece, best quality",
    "zhaoyun": "1boy, Chinese ancient general Zhao Yun, young handsome warrior, silver white armor, heroic noble expression, holding dragon spear, white cape, dark background, ink painting style, masterpiece, best quality",
    "caocao": "1boy, Chinese ancient emperor Cao Cao, cunning warlord, dark blue imperial robes, sharp calculating eyes, commanding presence, crown headpiece, dark background, ink painting style, masterpiece, best quality",
    "lvbu": "1boy, Chinese ancient warrior Lu Bu, most powerful warrior, phoenix feather headdress, menacing red armor, wielding halberd weapon, fierce expression, dark background, ink painting style, masterpiece, best quality",
    "diaochan": "1girl, Chinese ancient beauty Diao Chan, stunning beautiful face, flowing silk robes, crescent moon hairpin, elegant graceful pose, long black hair, dark background, ink painting style, masterpiece, best quality",
    "liubei": "1boy, Chinese ancient lord Liu Bei, benevolent ruler, green emperor robes, dignified kind expression, dual swords, noble bearing, dark background, ink painting style, masterpiece, best quality",
    "zhugeLiang": "1boy, Chinese ancient strategist Zhuge Liang, holding white feather fan, scholar robes, tall hat, wise serene expression, long beard, dark background, ink painting style, masterpiece, best quality",
    "sunshangxiang": "1girl, Chinese ancient warrior princess Sun Shangxiang, fierce beautiful female warrior, red armor, bow and arrows, determined confident expression, dark background, ink painting style, masterpiece, best quality",
    "zhouyu": "1boy, Chinese ancient commander Zhou Yu, handsome young strategist, red Wu kingdom robes, intelligent confident expression, dark background, ink painting style, masterpiece, best quality",
    "simayi": "1boy, Chinese ancient strategist Sima Yi, cunning cold advisor, dark blue Wei robes, calculating narrow eyes, dark background, ink painting style, masterpiece, best quality",
    "huangzhong": "1boy, Chinese ancient veteran general Huang Zhong, elderly warrior, white beard, holding great bow, experienced battle-hardened expression, green armor, dark background, ink painting style, masterpiece, best quality",
    "machao": "1boy, Chinese ancient general Ma Chao, young fierce warrior, white armor with spear, wild hair, dark background, ink painting style, masterpiece, best quality",
    "dongzhuo": "1boy, Chinese ancient tyrant Dong Zhuo, fat cruel warlord, dark ornate robes, menacing expression, gold accessories, dark background, ink painting style, masterpiece, best quality",
    "zhangjiao": "1boy, Chinese ancient sorcerer Zhang Jiao, yellow turban leader, mystical robes, wild grey hair, holding staff, magical aura, dark background, ink painting style, masterpiece, best quality",
}

def submit(hero_id, prompt, model_idx=0):
    model = MODELS[model_idx % len(MODELS)]
    data = json.dumps({
        "prompt": prompt,
        "params": {"width": 512, "height": 512, "steps": 20, "cfg_scale": 7, "sampler_name": "k_euler_a"},
        "nsfw": False,
        "models": [model],
        "r2": True
    }).encode()
    req = urllib.request.Request(f"{API}/generate/async", data=data,
                                 headers={"Content-Type": "application/json", "apikey": "0000000000"})
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=10).read())
        return resp.get("id")
    except Exception as e:
        print(f"  Submit error: {e}")
        return None

def check(job_id):
    try:
        resp = json.loads(urllib.request.urlopen(f"{API}/generate/check/{job_id}", timeout=10).read())
        return resp
    except:
        return {"done": False}

def fetch(job_id):
    try:
        resp = json.loads(urllib.request.urlopen(f"{API}/generate/status/{job_id}", timeout=10).read())
        gens = resp.get("generations", [])
        if gens:
            return gens[0].get("img")
    except:
        pass
    return None

def download(url, outpath):
    try:
        urllib.request.urlretrieve(url, outpath)
        return os.path.getsize(outpath) > 1000
    except:
        return False

# Submit all jobs first
jobs = {}
for i, (hero_id, prompt) in enumerate(HEROES.items()):
    outfile = os.path.join(OUTDIR, f"{hero_id}.webp")
    if os.path.exists(outfile) and os.path.getsize(outfile) > 1000:
        print(f"Skip {hero_id} (exists)")
        continue
    
    job_id = submit(hero_id, prompt, i)
    if job_id:
        jobs[hero_id] = {"job": job_id, "out": outfile}
        print(f"Submitted {hero_id}: {job_id}")
    else:
        print(f"FAILED {hero_id}")
    time.sleep(0.5)  # rate limit

print(f"\n{len(jobs)} jobs submitted. Polling...")

# Poll all jobs
max_wait = 300  # 5 minutes max
start = time.time()
while jobs and (time.time() - start) < max_wait:
    time.sleep(5)
    done_ids = []
    for hero_id, info in jobs.items():
        status = check(info["job"])
        if status.get("done"):
            img_url = fetch(info["job"])
            if img_url and download(img_url, info["out"]):
                size = os.path.getsize(info["out"])
                print(f"  ✅ {hero_id} ({size} bytes)")
            else:
                print(f"  ❌ {hero_id} (no image)")
            done_ids.append(hero_id)
        else:
            pos = status.get("queue_position", "?")
            wait = status.get("wait_time", "?")
            # If queue > 100, it's too slow - skip
            if isinstance(pos, (int, float)) and pos > 100:
                print(f"  ⏭️ {hero_id} skip (queue pos {pos})")
                done_ids.append(hero_id)
    
    for did in done_ids:
        del jobs[did]
    
    remaining = len(jobs)
    if remaining > 0:
        elapsed = int(time.time() - start)
        print(f"  ... {remaining} remaining ({elapsed}s)")

# Summary
print("\n=== RESULTS ===")
for hero_id in HEROES:
    f = os.path.join(OUTDIR, f"{hero_id}.webp")
    if os.path.exists(f) and os.path.getsize(f) > 1000:
        print(f"  ✅ {hero_id}: {os.path.getsize(f)} bytes")
    else:
        print(f"  ❌ {hero_id}: missing")

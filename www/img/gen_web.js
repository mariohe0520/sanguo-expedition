// Generate hero portraits using free web-based AI image generators
// Uses Playwright to automate Google AI Studio (free Gemini image gen)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTDIR = __dirname;

const HEROES = [
  { id: 'guanyu', prompt: 'Chinese Three Kingdoms warrior Guan Yu portrait, long black beard, red face, green robe, holding Green Dragon Crescent Blade, ink wash painting, dark background, game character icon, masterpiece' },
  { id: 'zhangfei', prompt: 'Chinese Three Kingdoms warrior Zhang Fei portrait, wild dark beard, fierce expression, dark armor, holding serpent spear, ink wash painting, dark background, game icon' },
  { id: 'zhaoyun', prompt: 'Chinese Three Kingdoms general Zhao Yun portrait, young handsome warrior, silver armor, heroic, holding dragon spear, ink wash painting, dark background, game icon' },
  { id: 'caocao', prompt: 'Chinese Three Kingdoms warlord Cao Cao portrait, cunning emperor, dark blue robes, sharp eyes, commanding, ink wash painting, dark background, game icon' },
  { id: 'lvbu', prompt: 'Chinese Three Kingdoms warrior Lu Bu portrait, phoenix feather headdress, red armor, wielding halberd, menacing, ink wash painting, dark background, game icon' },
  { id: 'diaochan', prompt: 'Chinese Three Kingdoms beauty Diao Chan portrait, elegant ancient Chinese beauty, silk robes, crescent hairpin, ink wash painting, dark background, game icon' },
  { id: 'liubei', prompt: 'Chinese Three Kingdoms lord Liu Bei portrait, benevolent ruler, green robes, dignified, kind eyes, ink wash painting, dark background, game icon' },
  { id: 'zhugeLiang', prompt: 'Chinese Three Kingdoms strategist Zhuge Liang portrait, feather fan, scholar robes, tall hat, wise expression, ink wash painting, dark background, game icon' },
];

async function generateWithBing(page, prompt, outPath) {
  try {
    await page.goto('https://www.bing.com/images/create', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Find prompt input
    const input = await page.$('#sb_form_q, input[name="q"], textarea');
    if (!input) { console.log('  No input found'); return false; }
    
    await input.fill(prompt);
    await page.waitForTimeout(500);
    
    // Click create button
    const btn = await page.$('#create_btn_c, button[type="submit"], #sb_form_go');
    if (btn) await btn.click();
    else await input.press('Enter');
    
    // Wait for images to generate
    await page.waitForTimeout(30000);
    
    // Try to find generated images
    const images = await page.$$('img.mimg, img.gir_mmimg, .imgpt img');
    if (images.length > 0) {
      const src = await images[0].getAttribute('src');
      if (src && src.startsWith('http')) {
        const response = await page.request.get(src);
        const buffer = await response.body();
        fs.writeFileSync(outPath, buffer);
        console.log(`  ✅ Saved ${path.basename(outPath)} (${buffer.length} bytes)`);
        return true;
      }
    }
    console.log('  No images found');
    return false;
  } catch (e) {
    console.log(`  Error: ${e.message}`);
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  for (const hero of HEROES) {
    const outPath = path.join(OUTDIR, `${hero.id}.png`);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      console.log(`Skip ${hero.id} (exists)`);
      continue;
    }
    
    console.log(`Generating ${hero.id}...`);
    const page = await context.newPage();
    const ok = await generateWithBing(page, hero.prompt, outPath);
    await page.close();
    
    if (!ok) {
      console.log(`  Trying alternative...`);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await browser.close();
  
  console.log('\n=== Results ===');
  for (const hero of HEROES) {
    const f = path.join(OUTDIR, `${hero.id}.png`);
    if (fs.existsSync(f) && fs.statSync(f).size > 1000) {
      console.log(`  ✅ ${hero.id}`);
    } else {
      console.log(`  ❌ ${hero.id}`);
    }
  }
})();

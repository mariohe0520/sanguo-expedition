// 三国·天命 — Idle / AFK System (Feature 4: Scaled to be meaningful)
const Idle = {
  RATES: {
    goldPerMin: 2,
    expPerMin: 1,
    lootChancePerHour: 0.1, // 10% base chance per hour for equipment drop
  },
  MAX_HOURS: 24, // Feature 4: Increased from 12 to 24

  collectRewards() {
    const state = Storage.getIdleState();
    const now = Date.now();
    const elapsed = Math.min((now - state.lastCollect) / 60000, this.MAX_HOURS * 60); // minutes, capped

    if (elapsed < 1) return null;

    // Scale rewards with player level
    const player = Storage.getPlayer();
    const levelMult = 1 + (player.level - 1) * 0.15;

    // Feature 4: Scale rates based on chapter progress
    const progress = Storage.getCampaignProgress();
    const chapter = progress.chapter || 1;
    const chapterMult = 1 + chapter * 0.5; // Ch1 = 1.5x, Ch5 = 3.5x, Ch10 = 6x

    // Feature 4: Expedition troops bonus — heroes assigned to idle earn extra
    const expeditionBonus = this._getExpeditionBonus();

    const effectiveGoldRate = this.RATES.goldPerMin * levelMult * chapterMult * (1 + expeditionBonus.goldPct / 100);
    const effectiveExpRate = this.RATES.expPerMin * levelMult * chapterMult * (1 + expeditionBonus.expPct / 100);

    const gold = Math.floor(elapsed * effectiveGoldRate);
    const exp = Math.floor(elapsed * effectiveExpRate);
    const hours = elapsed / 60;
    const lootRolls = Math.floor(hours);

    // Feature 4: Loot chance scales with chapter progress
    const scaledLootChance = Math.min(0.5, this.RATES.lootChancePerHour * (1 + chapter * 0.1));
    let loot = [];
    for (let i = 0; i < lootRolls; i++) {
      if (Math.random() < scaledLootChance) {
        loot.push(this.rollLoot(chapter));
      }
    }

    // Feature 4: Hero shard drops at higher chapters
    let shardDrops = [];
    if (chapter >= 3) {
      const shardChance = 0.05 + chapter * 0.02; // 11% at ch3, 25% at ch10
      for (let i = 0; i < lootRolls; i++) {
        if (Math.random() < shardChance) {
          const shardDrop = this._rollShardDrop(chapter);
          if (shardDrop) {
            shardDrops.push(shardDrop);
            Storage.addShards(shardDrop.heroId, shardDrop.amount);
          }
        }
      }
    }

    // Feature 4: Expedition heroes gain individual EXP
    if (expeditionBonus.heroes.length > 0) {
      const heroExp = Math.floor(exp * 0.3); // 30% of total idle exp goes to expedition heroes
      const perHeroExp = Math.floor(heroExp / expeditionBonus.heroes.length);
      for (const heroId of expeditionBonus.heroes) {
        try {
          const roster = Storage.getRoster();
          if (roster[heroId]) {
            roster[heroId].exp = (roster[heroId].exp || 0) + perHeroExp;
            // Auto-level if enough exp
            const needed = (roster[heroId].level || 1) * 100;
            while (roster[heroId].exp >= needed && roster[heroId].level < 60) {
              roster[heroId].exp -= needed;
              roster[heroId].level = (roster[heroId].level || 1) + 1;
            }
          }
          Storage.saveRoster(roster);
        } catch(e) { /* ignore individual hero exp errors */ }
      }
    }

    // Apply rewards
    Storage.addGold(gold);
    Storage.addExp(exp);

    state.lastCollect = now;
    Storage.saveIdleState(state);

    return {
      minutes: Math.floor(elapsed),
      gold,
      exp,
      loot,
      shardDrops,
      expeditionHeroes: expeditionBonus.heroes,
      chapterMult,
      message: this.getIdleMessage(elapsed)
    };
  },

  // Feature 4: Get expedition bonus from assigned heroes
  _getExpeditionBonus() {
    try {
      const state = Storage.getIdleState();
      const expeditionHeroes = state.expeditionHeroes || [];
      if (expeditionHeroes.length === 0) return { goldPct: 0, expPct: 0, heroes: [] };

      // Verify heroes are still owned
      const roster = Storage.getRoster();
      const validHeroes = expeditionHeroes.filter(id => roster[id]);

      // Each expedition hero adds 15% gold and 10% exp bonus
      return {
        goldPct: validHeroes.length * 15,
        expPct: validHeroes.length * 10,
        heroes: validHeroes,
      };
    } catch(e) {
      return { goldPct: 0, expPct: 0, heroes: [] };
    }
  },

  // Feature 4: Assign/remove heroes from expedition
  setExpeditionHeroes(heroIds) {
    const state = Storage.getIdleState();
    // Max 3 expedition heroes
    state.expeditionHeroes = (heroIds || []).slice(0, 3);
    Storage.saveIdleState(state);
  },

  getExpeditionHeroes() {
    const state = Storage.getIdleState();
    return state.expeditionHeroes || [];
  },

  // Feature 4: Scaled loot table based on chapter
  rollLoot(chapter) {
    chapter = chapter || 1;
    const items = [
      { name: '铁剑', stat: 'atk', value: 5, rarity: 1, emoji: '', minChapter: 1 },
      { name: '皮甲', stat: 'def', value: 5, rarity: 1, emoji: '', minChapter: 1 },
      { name: '草鞋', stat: 'spd', value: 3, rarity: 1, emoji: '', minChapter: 1 },
      { name: '青铜剑', stat: 'atk', value: 10, rarity: 2, emoji: '', minChapter: 1 },
      { name: '锁子甲', stat: 'def', value: 10, rarity: 2, emoji: '', minChapter: 1 },
      { name: '战马', stat: 'spd', value: 8, rarity: 2, emoji: '', minChapter: 1 },
      { name: '精钢大刀', stat: 'atk', value: 18, rarity: 3, emoji: '', minChapter: 3 },
      { name: '玄铁甲', stat: 'def', value: 18, rarity: 3, emoji: '', minChapter: 3 },
      { name: '赤兔马蹄', stat: 'spd', value: 15, rarity: 3, emoji: '', minChapter: 3 },
      { name: '兵法残卷', stat: 'int', value: 12, rarity: 3, emoji: '', minChapter: 4 },
      { name: '龙纹宝剑', stat: 'atk', value: 30, rarity: 4, emoji: '', minChapter: 6 },
      { name: '金缕战铠', stat: 'def', value: 30, rarity: 4, emoji: '', minChapter: 6 },
    ];
    const available = items.filter(i => chapter >= i.minChapter);
    // Weight higher rarity items at higher chapters
    const roll = Math.random();
    let pool;
    if (chapter >= 6 && roll < 0.1) {
      pool = available.filter(i => i.rarity === 4);
    } else if (chapter >= 3 && roll < 0.3) {
      pool = available.filter(i => i.rarity === 3);
    } else if (roll < 0.5) {
      pool = available.filter(i => i.rarity === 2);
    } else {
      pool = available.filter(i => i.rarity === 1);
    }
    if (pool.length === 0) pool = available;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  // Feature 4: Roll hero shard drops
  _rollShardDrop(chapter) {
    try {
      const heroIds = typeof HEROES !== 'undefined' ? Object.keys(HEROES) : [];
      if (heroIds.length === 0) return null;
      // Higher chapter = chance for rarer hero shards
      const candidates = heroIds.filter(id => {
        const hero = HEROES[id];
        if (!hero) return false;
        if (chapter < 5 && hero.rarity >= 5) return false; // No SSR shards before ch5
        if (chapter < 3 && hero.rarity >= 4) return false; // No SR shards before ch3
        return true;
      });
      if (candidates.length === 0) return null;
      const heroId = candidates[Math.floor(Math.random() * candidates.length)];
      const hero = HEROES[heroId];
      const amount = hero.rarity >= 5 ? 1 : hero.rarity >= 4 ? 2 : 3;
      return { heroId, heroName: hero.name, amount };
    } catch(e) {
      return null;
    }
  },

  getIdleMessage(mins) {
    if (mins < 30) return '将士们刚刚开始巡逻...';
    if (mins < 120) return '将士们在战场上奋勇拼杀！';
    if (mins < 360) return '你的军队已经征战半天了！';
    if (mins < 720) return '大军征战许久，收获颇丰！';
    return '将士们日夜征战，满载而归！';
  },

  getTimeSinceCollect() {
    const state = Storage.getIdleState();
    return Math.floor((Date.now() - state.lastCollect) / 60000);
  },

  // Feature 4: Get preview of current pending rewards
  getRewardPreview() {
    const state = Storage.getIdleState();
    const now = Date.now();
    const elapsed = Math.min((now - state.lastCollect) / 60000, this.MAX_HOURS * 60);
    if (elapsed < 1) return null;

    const player = Storage.getPlayer();
    const levelMult = 1 + (player.level - 1) * 0.15;
    const progress = Storage.getCampaignProgress();
    const chapter = progress.chapter || 1;
    const chapterMult = 1 + chapter * 0.5;
    const expeditionBonus = this._getExpeditionBonus();

    const effectiveGoldRate = this.RATES.goldPerMin * levelMult * chapterMult * (1 + expeditionBonus.goldPct / 100);
    const effectiveExpRate = this.RATES.expPerMin * levelMult * chapterMult * (1 + expeditionBonus.expPct / 100);

    return {
      minutes: Math.floor(elapsed),
      gold: Math.floor(elapsed * effectiveGoldRate),
      exp: Math.floor(elapsed * effectiveExpRate),
      chapterMult,
      expeditionCount: expeditionBonus.heroes.length,
    };
  },
};

if (typeof window !== 'undefined') window.Idle = Idle;

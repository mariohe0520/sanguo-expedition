// 三国·天命 — Arena / PvP System

const Arena = {
  MAX_DAILY_ATTEMPTS: 5,

  RANKS: {
    bronze:  { name: '青铜', emoji: '', minRating: 0,    color: '#cd7f32', weeklyGold: 500,  weeklyGems: 5 },
    silver:  { name: '白银', emoji: '', minRating: 1000, color: '#c0c0c0', weeklyGold: 1000, weeklyGems: 10 },
    gold:    { name: '黄金', emoji: '', minRating: 1500, color: '#fbbf24', weeklyGold: 2000, weeklyGems: 20 },
    diamond: { name: '钻石', emoji: '', minRating: 2000, color: '#3b82f6', weeklyGold: 3500, weeklyGems: 35 },
    legend:  { name: '传说', emoji: '', minRating: 2500, color: '#a855f7', weeklyGold: 5000, weeklyGems: 50 },
  },

  RANK_ORDER: ['bronze', 'silver', 'gold', 'diamond', 'legend'],

  getState() {
    const today = new Date().toISOString().split('T')[0];
    const week = Leaderboard.getWeekNumber();
    const state = Storage._get('arenaState', {
      rating: 800,
      wins: 0,
      losses: 0,
      streak: 0,
      bestStreak: 0,
      date: '',
      todayAttempts: 0,
      weekNumber: 0,
      weeklyRewardClaimed: false,
      history: [],
    });
    // Daily reset
    if (state.date !== today) {
      state.date = today;
      state.todayAttempts = 0;
    }
    // Weekly reset
    if (state.weekNumber !== week) {
      state.weekNumber = week;
      state.weeklyRewardClaimed = false;
    }
    return state;
  },

  saveState(s) { Storage._set('arenaState', s); },

  canFight() {
    const state = this.getState();
    return state.todayAttempts < this.MAX_DAILY_ATTEMPTS;
  },

  getRemainingAttempts() {
    const state = this.getState();
    return Math.max(0, this.MAX_DAILY_ATTEMPTS - state.todayAttempts);
  },

  getCurrentRank(rating) {
    const r = rating || this.getState().rating;
    for (let i = this.RANK_ORDER.length - 1; i >= 0; i--) {
      const rank = this.RANKS[this.RANK_ORDER[i]];
      if (r >= rank.minRating) return { id: this.RANK_ORDER[i], ...rank };
    }
    return { id: 'bronze', ...this.RANKS.bronze };
  },

  getNextRank(rating) {
    const r = rating || this.getState().rating;
    for (const rankId of this.RANK_ORDER) {
      const rank = this.RANKS[rankId];
      if (r < rank.minRating) return { id: rankId, ...rank };
    }
    return null; // Already legend
  },

  // Generate opponent based on player's roster and rating
  generateOpponent(playerRating) {
    const ratingVariance = 200;
    const opponentRating = playerRating + Math.floor(Math.random() * ratingVariance * 2 - ratingVariance);
    const rng = Math.random;

    // Pick heroes from pool, weighted by opponent rating
    const heroPool = Object.keys(HEROES).filter(id => {
      const h = HEROES[id];
      return h.rarity >= 2 && !id.startsWith('raid_') && !h.mystery && !h.locked;
    });

    const teamSize = 5;
    const team = [];
    const usedIds = new Set();

    // Higher rating = better heroes
    const minRarity = opponentRating > 2000 ? 4 : opponentRating > 1500 ? 3 : opponentRating > 1000 ? 2 : 1;

    for (let i = 0; i < teamSize; i++) {
      let heroId;
      let attempts = 0;
      do {
        heroId = heroPool[Math.floor(rng() * heroPool.length)];
        attempts++;
      } while ((usedIds.has(heroId) || HEROES[heroId].rarity < minRarity) && attempts < 50);
      usedIds.add(heroId);
      team.push(heroId);
    }

    // Generate name
    const prefixes = ['铁血', '烈焰', '寒冰', '雷霆', '暗影', '圣光', '狂风', '磐石'];
    const suffixes = ['军团', '战队', '联盟', '营', '卫', '师', '旅'];
    const name = prefixes[Math.floor(rng() * prefixes.length)] + suffixes[Math.floor(rng() * suffixes.length)];

    // Scale level based on rating
    const scaleLvl = Math.max(1, Math.floor(opponentRating / 100));

    return {
      name,
      rating: Math.max(0, opponentRating),
      team,
      scaleMult: 1 + (scaleLvl - 1) * 0.08,
      rank: this.getCurrentRank(opponentRating),
    };
  },

  // Generate 3 opponents to choose from
  generateOpponents() {
    const state = this.getState();
    return [
      this.generateOpponent(state.rating - 100), // Easier
      this.generateOpponent(state.rating),        // Equal
      this.generateOpponent(state.rating + 150),  // Harder (more rating gain)
    ];
  },

  // Record fight result
  recordFight(won, opponentRating) {
    const state = this.getState();
    state.todayAttempts++;

    if (won) {
      const ratingGain = Math.max(10, Math.floor(30 + (opponentRating - state.rating) * 0.1));
      state.rating += ratingGain;
      state.wins++;
      state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;

      state.history.unshift({
        result: 'win',
        ratingChange: ratingGain,
        timestamp: Date.now(),
      });
    } else {
      const ratingLoss = Math.max(5, Math.floor(20 - (opponentRating - state.rating) * 0.05));
      state.rating = Math.max(0, state.rating - ratingLoss);
      state.losses++;
      state.streak = 0;

      state.history.unshift({
        result: 'loss',
        ratingChange: -ratingLoss,
        timestamp: Date.now(),
      });
    }

    // Keep only last 20 entries
    if (state.history.length > 20) state.history = state.history.slice(0, 20);

    this.saveState(state);
    return state;
  },

  // Claim weekly reward
  claimWeeklyReward() {
    const state = this.getState();
    if (state.weeklyRewardClaimed) return null;

    const rank = this.getCurrentRank(state.rating);
    state.weeklyRewardClaimed = true;
    this.saveState(state);

    Storage.addGold(rank.weeklyGold);
    Storage.addGems(rank.weeklyGems);

    return {
      gold: rank.weeklyGold,
      gems: rank.weeklyGems,
      rank: rank.name,
    };
  },

  // Get arena leaderboard (simulated + player)
  getLeaderboard() {
    const week = Leaderboard.getWeekNumber();
    const rng = Leaderboard.seededRandom(week * 9973);
    const state = this.getState();

    const entries = [];
    const names = ['无双战队', '铁壁联盟', '烈焰军团', '苍龙卫', '虎豹骑', '飞鱼师', '赤壁营', '雷霆旅', '暗影师'];
    
    for (let i = 0; i < names.length; i++) {
      const rating = Math.floor(800 + rng() * 2200);
      entries.push({
        name: names[i],
        rating,
        rank: this.getCurrentRank(rating),
        wins: Math.floor(20 + rng() * 80),
        isPlayer: false,
      });
    }

    entries.push({
      name: Storage.getPlayer().name,
      rating: state.rating,
      rank: this.getCurrentRank(state.rating),
      wins: state.wins,
      isPlayer: true,
    });

    entries.sort((a, b) => b.rating - a.rating);
    entries.forEach((e, i) => e.position = i + 1);
    return entries;
  },
};

if (typeof window !== 'undefined') window.Arena = Arena;

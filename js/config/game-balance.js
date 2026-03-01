// js/config/game-balance.js -- All numeric balance constants centralized
// Modify this file to adjust game balance. Do NOT modify business logic files.
// All GAME_BALANCE references are read-only at runtime.

const GAME_BALANCE = {
  // ===== Battle Parameters =====
  BATTLE: {
    MAX_TURNS: 60,
    CRIT_RATE_BASE: 10,          // base crit chance (percentage points)
    CRIT_MULT: 1.5,              // base crit damage multiplier
    VARIANCE_MIN: 0.9,
    VARIANCE_MAX: 1.1,           // variance = 0.9 + Math.random() * 0.2
    DEF_REDUCTION: 0.5,          // base = atk - def * DEF_REDUCTION
    MIN_DAMAGE: 1,
    STALEMATE_TURN: 30,          // escalating damage starts here
    RAGE_ON_HIT: 15,             // rage gained when hit
    RAGE_ON_ATTACK: 10,          // rage gained when attacking
    RAGE_ON_MISS: 5,             // rage gained when fog miss
  },

  // ===== Unit Type Advantage =====
  UNIT_ADVANTAGE: {
    STRONG_MULT: 1.3,
    WEAK_MULT: 0.7,
    NEUTRAL_MULT: 1.0,
  },

  // ===== Terrain Multipliers =====
  TERRAIN: {
    plains:   { cavalry: 1.2, spear: 1.0, archer: 1.0, shield: 1.0, mage: 1.0 },
    mountain: { cavalry: 0.8, spear: 1.0, archer: 1.2, shield: 1.1, mage: 1.0 },
    water:    { cavalry: 0.7, spear: 0.9, archer: 1.0, shield: 0.8, mage: 1.3 },
    river:    { cavalry: 0.7, spear: 0.9, archer: 1.0, shield: 0.8, mage: 1.3 },
    forest:   { cavalry: 0.8, spear: 1.1, archer: 1.2, shield: 0.9, mage: 1.1 },
    castle:   { cavalry: 0.8, spear: 1.0, archer: 1.1, shield: 1.3, mage: 1.0 },
  },

  // ===== Idle / AFK System =====
  IDLE: {
    MAX_HOURS: 24,
    BASE_GOLD_PER_MIN: 2,
    BASE_EXP_PER_MIN: 1,
    LOOT_CHANCE_PER_HOUR: 0.1,
    LEVEL_MULT_PER_LEVEL: 0.15,
    CHAPTER_MULT_PER_CHAPTER: 0.5,
    EXPEDITION_GOLD_PCT_PER_HERO: 15,
    EXPEDITION_EXP_PCT_PER_HERO: 10,
    EXPEDITION_EXP_SHARE: 0.3,     // 30% of total idle exp goes to expedition heroes
    MAX_EXPEDITION_HEROES: 3,
    MAX_LOOT_CHANCE: 0.5,
    LOOT_CHAPTER_SCALING: 0.1,
    SHARD_BASE_CHANCE: 0.05,
    SHARD_CHAPTER_SCALING: 0.02,
  },

  // ===== Gacha / Recruitment =====
  GACHA: {
    SSR_BASE_RATE: 0.02,
    SOFT_PITY_START: 75,
    SOFT_PITY_STEP: 0.05,
    HARD_PITY: 90,
    SINCERITY_RECRUIT_THRESHOLD: 100,
  },

  // ===== Arena =====
  ARENA: {
    DAILY_ATTEMPTS: 5,
    WIN_RATING_BASE: 30,
    WIN_RATING_SCALE: 0.1,
    LOSE_RATING_BASE: 20,
    LOSE_RATING_SCALE: 0.05,
    WIN_RATING_MIN: 10,
    LOSE_RATING_MIN: 5,
    RATING_FLOOR: 0,
    HISTORY_MAX: 20,
    RATING_VARIANCE: 200,
  },

  // ===== Equipment =====
  EQUIPMENT: {
    MAX_INVENTORY: 500,
    BOSS_DROP_RATE: 1.0,
    ENHANCE_SUCCESS_RATE: 0.7,    // 70% success for non-matching templates
    SAME_TEMPLATE_GUARANTEED: true,
    SELL_GOLD_PER_RARITY: 25,
    RARITY_WEIGHT: { 1: 50, 2: 30, 3: 15, 4: 4, 5: 1 },
  },

  // ===== Hero Growth =====
  HERO_GROWTH: {
    LEVEL_MULT_PER_LEVEL: 0.08,
    STAR_MULT_PER_STAR: 0.15,
    MAX_LEVEL: 60,
    LEVEL_UP_GOLD_PER_LEVEL: 100,
    SHARD_COSTS: { 1: 10, 2: 20, 3: 40, 4: 80 },
    MAX_STARS: 5,
    EXP_PER_LEVEL_MULT: 100,      // needed exp = level * 100
  },

  // ===== Campaign Difficulty Scaling =====
  CHAPTER_SCALING: {
    1:  { enemyScale: 0.45 },
    2:  { enemyScale: 0.62 },
    3:  { enemyScale: 0.80 },
    4:  { enemyScale: 1.00 },
    5:  { enemyScale: 1.20 },
    6:  { enemyScale: 1.42 },
    7:  { enemyScale: 1.62 },
    8:  { enemyScale: 1.82 },
    9:  { enemyScale: 2.05 },
    10: { enemyScale: 2.30 },
  },

  // ===== Difficulty Modes =====
  DIFFICULTY_MODES: {
    normal: { scale: 1,   rewardMult: 1.0 },
    elite:  { scale: 2.0, rewardMult: 1.5 },
    hell:   { scale: 3.5, rewardMult: 2.0 },
  },

  // ===== Faction Synergy =====
  FACTION_BONUS: {
    3: { atkPct: 10 },
    5: { atkPct: 25, defPct: 15 },
  },
};

if (typeof window !== 'undefined') window.GAME_BALANCE = GAME_BALANCE;

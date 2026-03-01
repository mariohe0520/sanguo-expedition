// 三国·天命 — Strategy Card System (谋略系统)
// Premium collectible card system with real battle effects

const Strategy = {
  // ===== CARD DEFINITIONS =====
  CARDS: {
    // --- Common (白) ---
    inspire: {
      id: 'inspire', name: '鼓舞', nameEn: 'Inspire',
      icon: '🥁', rarity: 'common', rarityDots: 1,
      desc: '全队ATK+15%，持续3回合',
      descFull: '战鼓雷动，士气高涨。全队攻击力提升15%，持续前3回合。',
    },
    hold: {
      id: 'hold', name: '坚守', nameEn: 'Hold',
      icon: '🛡️', rarity: 'common', rarityDots: 1,
      desc: '全队DEF+20%，持续3回合',
      descFull: '严阵以待，固若金汤。全队防御力提升20%，持续前3回合。',
    },
    vanguard: {
      id: 'vanguard', name: '先锋', nameEn: 'Vanguard',
      icon: '⚡', rarity: 'common', rarityDots: 1,
      desc: '最快武将回合1行动两次',
      descFull: '先锋突击，迅雷不及掩耳。速度最高的武将在第一回合行动两次。',
    },
    // --- Rare (蓝) ---
    fire_attack: {
      id: 'fire_attack', name: '火攻', nameEn: 'Fire Attack',
      icon: '🔥', rarity: 'rare', rarityDots: 2,
      desc: '敌方灼烧5%HP/回合×3',
      descFull: '以火攻之！所有敌人灼烧3回合，每回合损失5%最大HP。水属性敌人免疫。',
    },
    ambush: {
      id: 'ambush', name: '埋伏', nameEn: 'Ambush',
      icon: '🌿', rarity: 'rare', rarityDots: 2,
      desc: '回合1先手+30%暴击',
      descFull: '十面埋伏，暗中伺机。第一回合我方全员先手行动，暴击率+30%。',
    },
    sow_discord: {
      id: 'sow_discord', name: '离间', nameEn: 'Sow Discord',
      icon: '🗣️', rarity: 'rare', rarityDots: 2,
      desc: '随机敌人攻击己方一次',
      descFull: '离间之计，反目成仇。随机一名敌人被迷惑，攻击自己的队友一次。',
    },
    // --- Epic (紫) ---
    empty_fort: {
      id: 'empty_fort', name: '空城计', nameEn: 'Empty Fort',
      icon: '🏯', rarity: 'epic', rarityDots: 3,
      desc: '40%敌逃/60%敌暴怒',
      descFull: '空城之计，虚实难辨。40%概率敌军溃逃（立即获胜，奖励减半），60%概率敌军暴怒（ATK+20%）。',
    },
    counter_intel: {
      id: 'counter_intel', name: '反间计', nameEn: 'Counter Intel',
      icon: '🪞', rarity: 'epic', rarityDots: 3,
      desc: '复制最强敌人技能',
      descFull: '以彼之道，还施彼身。复制敌方最强武将的技能，由我方主将释放。',
    },
    chain_stratagem: {
      id: 'chain_stratagem', name: '连环计', nameEn: 'Chain Stratagem',
      icon: '⛓️', rarity: 'epic', rarityDots: 3,
      desc: '敌人3回合内锁定攻击目标',
      descFull: '连环锁船，进退不得。敌方武将3回合内无法切换攻击目标，只能攻击初始目标。',
    },
    // --- Legendary (金) ---
    straw_boats: {
      id: 'straw_boats', name: '草船借箭', nameEn: 'Straw Boats',
      icon: '🚢', rarity: 'legendary', rarityDots: 4,
      desc: '前2回合吸收50%敌伤为ATK',
      descFull: '草船借箭，化敌为友。前2回合吸收敌方50%伤害，转化为我方全队ATK加成。',
    },
    east_wind: {
      id: 'east_wind', name: '借东风', nameEn: 'East Wind',
      icon: '🌬️', rarity: 'legendary', rarityDots: 4,
      desc: '火/风攻击伤害×2',
      descFull: '万事俱备，只欠东风。本场战斗所有火/风属性攻击伤害翻倍，天气变为暴风。',
    },
    seven_star_lamp: {
      id: 'seven_star_lamp', name: '七星灯', nameEn: 'Seven Star Lamp',
      icon: '⭐', rarity: 'legendary', rarityDots: 4,
      desc: '主将死亡时复活50%HP',
      descFull: '七星续命，逆天改命。若我方主将阵亡，以50%HP复活一次。',
    },
  },

  // Default starter cards
  STARTER_CARDS: ['inspire', 'hold', 'vanguard', 'fire_attack'],
  MAX_HAND_SIZE: 8,

  // ===== STATE =====
  _selectedCards: [],    // IDs of cards selected for this battle
  _battleState: null,    // Reference to battle state
  _activeEffects: {},    // Track active effects in current battle
  _confirmCallback: null,// Callback after selection confirmed

  // ===== CARD COLLECTION =====
  getOwnedCards() {
    const state = Storage.getStrategyState();
    if (!state.ownedCards || state.ownedCards.length === 0) {
      // Initialize with starters
      state.ownedCards = [...this.STARTER_CARDS];
      Storage.saveStrategyState(state);
    }
    return state.ownedCards;
  },

  addCard(cardId) {
    if (!this.CARDS[cardId]) return false;
    const state = Storage.getStrategyState();
    if (!state.ownedCards) state.ownedCards = [...this.STARTER_CARDS];
    if (state.ownedCards.includes(cardId)) return false; // Already owned
    if (state.ownedCards.length >= this.MAX_HAND_SIZE) return false;
    state.ownedCards.push(cardId);
    Storage.saveStrategyState(state);
    return true;
  },

  // ===== SELECTION UI =====
  showSelection(callback) {
    this._selectedCards = [];
    this._confirmCallback = callback;

    const overlay = document.getElementById('strategy-select-overlay');
    if (!overlay) { callback([]); return; }

    const hand = this.getOwnedCards();
    const handEl = document.getElementById('strategy-hand');
    handEl.innerHTML = '';

    // Render each card
    hand.forEach((cardId, index) => {
      const card = this.CARDS[cardId];
      if (!card) return;
      const el = this._createCardElement(card, index);
      handEl.appendChild(el);
    });

    // Reset buttons
    this._updateSelectionUI();

    overlay.style.display = 'block';
    // Force reflow for animation
    overlay.offsetHeight;
  },

  _createCardElement(card, index) {
    const el = document.createElement('div');
    el.className = 'strat-card';
    el.setAttribute('data-rarity', card.rarity);
    el.setAttribute('data-card-id', card.id);

    const dotsCount = card.rarityDots || 1;
    const rarityLabels = { common: '白', rare: '蓝', epic: '紫', legendary: '金' };
    let dotsHtml = '';
    for (let i = 0; i < dotsCount; i++) {
      dotsHtml += '<span class="strat-rarity-dot"></span>';
    }

    el.innerHTML =
      '<div class="strat-card-check">✓</div>' +
      '<div class="strat-card-inner">' +
        '<div class="strat-card-icon">' + card.icon + '</div>' +
        '<div class="strat-card-name">' + card.name + '</div>' +
        '<div class="strat-card-desc">' + card.desc + '</div>' +
        '<div class="strat-card-rarity">' +
          dotsHtml +
          '<span class="strat-rarity-label">' + (rarityLabels[card.rarity] || '') + '</span>' +
        '</div>' +
      '</div>';

    el.onclick = () => this._toggleCard(card.id);
    return el;
  },

  _toggleCard(cardId) {
    const idx = this._selectedCards.indexOf(cardId);
    if (idx >= 0) {
      // Deselect
      this._selectedCards.splice(idx, 1);
    } else {
      // Select (max 2)
      if (this._selectedCards.length >= 2) return;
      this._selectedCards.push(cardId);
    }
    this._updateSelectionUI();
  },

  _updateSelectionUI() {
    const allCards = document.querySelectorAll('#strategy-hand .strat-card');
    allCards.forEach(el => {
      const id = el.getAttribute('data-card-id');
      const isSelected = this._selectedCards.includes(id);
      el.classList.toggle('selected', isSelected);
      el.classList.toggle('dimmed', !isSelected && this._selectedCards.length >= 2);
    });

    // Update confirm button
    const confirmBtn = document.getElementById('strategy-confirm-btn');
    if (confirmBtn) {
      const hasSelection = this._selectedCards.length > 0;
      confirmBtn.disabled = !hasSelection;
      confirmBtn.classList.toggle('active', hasSelection);
      confirmBtn.textContent = hasSelection
        ? '确认出战 (' + this._selectedCards.length + '/2)'
        : '确认出战';
    }

    // Update preview slots
    const previewEl = document.getElementById('strategy-selected-preview');
    if (previewEl) {
      let html = '';
      for (let i = 0; i < 2; i++) {
        const cardId = this._selectedCards[i];
        const card = cardId ? this.CARDS[cardId] : null;
        html += '<div class="strat-preview-slot' + (card ? ' filled' : '') + '">' +
          (card ? card.icon : '') + '</div>';
      }
      previewEl.innerHTML = html;
    }
  },

  confirm() {
    const overlay = document.getElementById('strategy-select-overlay');
    if (overlay) overlay.style.display = 'none';

    const selected = [...this._selectedCards];
    const cb = this._confirmCallback;
    this._confirmCallback = null;

    if (cb) cb(selected);
  },

  skip() {
    this._selectedCards = [];
    this.confirm();
  },

  // ===== BATTLE HOOKS =====

  /**
   * Called after Battle.init(), before first turn.
   * Applies pre-battle effects from selected strategy cards.
   */
  applyPreBattle(battleState, selectedCardIds) {
    this._battleState = battleState;
    this._activeEffects = {};
    this._selectedCards = selectedCardIds || [];

    if (this._selectedCards.length === 0) return;

    for (const cardId of this._selectedCards) {
      const card = this.CARDS[cardId];
      if (!card) continue;

      switch (cardId) {
        case 'inspire': {
          // Team ATK +15% for 3 turns
          this._activeEffects.inspire = { turnsLeft: 3 };
          for (const f of battleState.player.filter(f => f && f.alive)) {
            f.buffs.push({ stat: 'atk', pct: 15, duration: 3 });
          }
          Battle.addLog('📜 【鼓舞】战鼓雷动！全队ATK+15% (3回合)');
          break;
        }
        case 'hold': {
          // Team DEF +20% for 3 turns
          this._activeEffects.hold = { turnsLeft: 3 };
          for (const f of battleState.player.filter(f => f && f.alive)) {
            f.buffs.push({ stat: 'def', pct: 20, duration: 3 });
          }
          Battle.addLog('📜 【坚守】严阵以待！全队DEF+20% (3回合)');
          break;
        }
        case 'vanguard': {
          // Fastest hero acts twice on turn 1
          this._activeEffects.vanguard = { triggered: false };
          Battle.addLog('📜 【先锋】先锋突击已就绪！');
          break;
        }
        case 'fire_attack': {
          // All enemies burn for 5% HP/turn for 3 turns (water immune)
          this._activeEffects.fire_attack = { turnsLeft: 3 };
          let immuneCount = 0;
          for (const f of battleState.enemy.filter(f => f && f.alive)) {
            if (f.element === 'water') {
              immuneCount++;
              continue;
            }
            if (!f._stratBurn) f._stratBurn = 0;
            f._stratBurn = 3;
          }
          Battle.addLog('📜 【火攻】烈焰焚天！敌方灼烧3回合' + (immuneCount > 0 ? ' (' + immuneCount + '名水属性免疫)' : ''));
          break;
        }
        case 'ambush': {
          // Turn 1: player team strikes first + 30% crit
          this._activeEffects.ambush = { turnsLeft: 1 };
          for (const f of battleState.player.filter(f => f && f.alive)) {
            f.buffs.push({ stat: 'crit', pct: 30, duration: 1 });
            // Massive speed boost to go first
            f.buffs.push({ stat: 'spd', pct: 200, duration: 1 });
          }
          Battle.addLog('📜 【埋伏】十面埋伏！回合1先手+30%暴击');
          break;
        }
        case 'sow_discord': {
          // One random enemy attacks their own team
          this._activeEffects.sow_discord = { triggered: false };
          const enemies = battleState.enemy.filter(f => f && f.alive);
          if (enemies.length > 1) {
            const traitor = enemies[Math.floor(Math.random() * enemies.length)];
            const allies = enemies.filter(f => f !== traitor);
            if (allies.length > 0) {
              const victim = allies[Math.floor(Math.random() * allies.length)];
              const dmg = Math.floor(Battle.calcDamage(traitor, victim) * 0.8);
              victim.hp = Math.max(0, victim.hp - dmg);
              if (victim.hp <= 0) victim.alive = false;
              Battle.addLog('📜 【离间】' + traitor.name + ' 被离间，攻击了 ' + victim.name + '！-' + dmg + ' HP');
              this._activeEffects.sow_discord.triggered = true;
            }
          } else {
            Battle.addLog('📜 【离间】敌军只剩一人，无法离间！');
          }
          break;
        }
        case 'empty_fort': {
          // 40% flee, 60% rage
          if (Math.random() < 0.4) {
            this._activeEffects.empty_fort = { fled: true };
            Battle.addLog('📜 【空城计】城门大开…敌军疑有伏兵，溃逃！');
            // Mark all enemies as dead for instant win
            for (const f of battleState.enemy.filter(f => f)) {
              f.alive = false;
              f.hp = 0;
            }
            // Flag reduced loot
            battleState._strategyReducedLoot = true;
          } else {
            this._activeEffects.empty_fort = { fled: false };
            for (const f of battleState.enemy.filter(f => f && f.alive)) {
              f.buffs.push({ stat: 'atk', pct: 20, duration: 99 });
            }
            Battle.addLog('📜 【空城计】计谋被识破！敌军暴怒ATK+20%！');
          }
          break;
        }
        case 'counter_intel': {
          // Copy strongest enemy's skill, player leader uses it
          this._activeEffects.counter_intel = { triggered: false };
          const enemies = battleState.enemy.filter(f => f && f.alive && f.skill);
          if (enemies.length > 0) {
            const strongest = enemies.sort((a, b) => (b.atk + b.int) - (a.atk + a.int))[0];
            const leader = battleState.player.find(f => f && f.alive);
            if (strongest && leader && strongest.skill) {
              // Store original skill to restore later if needed
              this._activeEffects.counter_intel.copiedSkill = strongest.skill;
              this._activeEffects.counter_intel.leaderId = leader.id;
              // Give leader full rage so they immediately cast
              leader.rage = leader.maxRage;
              // Temporarily set skill (will be cast naturally)
              if (!leader._origSkill) leader._origSkill = leader.skill;
              leader.skill = { ...strongest.skill, name: '反间·' + strongest.skill.name };
              Battle.addLog('📜 【反间计】复制了 ' + strongest.name + ' 的【' + strongest.skill.name + '】！');
              this._activeEffects.counter_intel.triggered = true;
            }
          }
          if (!this._activeEffects.counter_intel.triggered) {
            Battle.addLog('📜 【反间计】未找到可复制的技能！');
          }
          break;
        }
        case 'chain_stratagem': {
          // Enemies locked to initial targets for 3 turns
          this._activeEffects.chain_stratagem = { turnsLeft: 3, lockedTargets: {} };
          Battle.addLog('📜 【连环计】铁锁连环！敌方3回合内锁定攻击目标');
          break;
        }
        case 'straw_boats': {
          // Absorb 50% of enemy damage in first 2 turns as ATK buff
          this._activeEffects.straw_boats = { turnsLeft: 2, absorbedDamage: 0 };
          Battle.addLog('📜 【草船借箭】草船已备！前2回合吸收敌方伤害');
          break;
        }
        case 'east_wind': {
          // Fire/wind attacks do 2x
          this._activeEffects.east_wind = { active: true };
          battleState.weather = 'wind';
          Battle.addLog('📜 【借东风】东风已至！火/风攻击伤害×2，天气变为暴风');
          break;
        }
        case 'seven_star_lamp': {
          // Revive leader on death
          this._activeEffects.seven_star_lamp = { used: false };
          Battle.addLog('📜 【七星灯】七星灯已点燃，护佑主将！');
          break;
        }
      }
    }
  },

  /**
   * Called at the start of each turn.
   * Handles per-turn effects: burn damage, buff expiry, vanguard double action, etc.
   */
  onTurnStart(turn, battleState) {
    if (this._selectedCards.length === 0) return;

    // Fire attack: burn damage
    if (this._activeEffects.fire_attack && this._activeEffects.fire_attack.turnsLeft > 0) {
      for (const f of battleState.enemy.filter(f => f && f.alive && f._stratBurn > 0)) {
        const burnDmg = Math.floor(f.maxHp * 0.05);
        f.hp = Math.max(0, f.hp - burnDmg);
        Battle.addLog('🔥 ' + f.name + ' 灼烧伤害 -' + burnDmg + ' HP');
        if (f.hp <= 0) {
          f.alive = false;
          Battle.addLog('🔥 ' + f.name + ' 被烧死了！');
        }
        f._stratBurn--;
      }
      this._activeEffects.fire_attack.turnsLeft--;
    }

    // Straw boats: apply absorbed damage as ATK buff after turn 2
    if (this._activeEffects.straw_boats) {
      if (this._activeEffects.straw_boats.turnsLeft > 0) {
        this._activeEffects.straw_boats.turnsLeft--;
      } else if (this._activeEffects.straw_boats.absorbedDamage > 0 && !this._activeEffects.straw_boats._applied) {
        // Convert absorbed damage to ATK buff
        const atkBoost = Math.floor(this._activeEffects.straw_boats.absorbedDamage * 0.5);
        for (const f of battleState.player.filter(f => f && f.alive)) {
          const pctBoost = Math.max(5, Math.floor(atkBoost / Math.max(1, f.atk) * 100));
          f.buffs.push({ stat: 'atk', pct: Math.min(pctBoost, 50), duration: 99 });
        }
        Battle.addLog('🚢 【草船借箭】收集' + this._activeEffects.straw_boats.absorbedDamage + '伤害，转化为ATK加成！');
        this._activeEffects.straw_boats._applied = true;
      }
    }

    // Counter Intel: restore original skill after first use
    if (this._activeEffects.counter_intel && this._activeEffects.counter_intel.triggered) {
      const leader = battleState.player.find(f => f && f.id === this._activeEffects.counter_intel.leaderId);
      if (leader && leader._origSkill && leader.rage < leader.maxRage) {
        leader.skill = leader._origSkill;
        delete leader._origSkill;
        this._activeEffects.counter_intel.triggered = false;
      }
    }

    return this._getVanguardExtra(turn, battleState);
  },

  /**
   * Returns the fighter that should get an extra action on turn 1 (Vanguard card).
   */
  _getVanguardExtra(turn, battleState) {
    if (turn === 1 && this._activeEffects.vanguard && !this._activeEffects.vanguard.triggered) {
      this._activeEffects.vanguard.triggered = true;
      // Find fastest player hero
      const fastest = battleState.player
        .filter(f => f && f.alive)
        .sort((a, b) => Battle.getEffStat(b, 'spd') - Battle.getEffStat(a, 'spd'))[0];
      if (fastest) {
        Battle.addLog('⚡ 【先锋】' + fastest.name + ' 获得额外行动！');
        return fastest;
      }
    }
    return null;
  },

  /**
   * Called when damage is dealt. Can modify damage.
   * Returns modified damage value.
   */
  onAttack(attacker, defender, damage, battleState) {
    let modifiedDmg = damage;

    // Chain Stratagem: force locked target
    if (this._activeEffects.chain_stratagem && this._activeEffects.chain_stratagem.turnsLeft > 0) {
      if (attacker.side === 'enemy') {
        const key = attacker.id + '-' + attacker.pos;
        if (!this._activeEffects.chain_stratagem.lockedTargets[key]) {
          // Lock to current target
          this._activeEffects.chain_stratagem.lockedTargets[key] = defender.id;
        }
      }
    }

    // Straw boats: absorb 50% of enemy damage in first 2 turns
    if (this._activeEffects.straw_boats && this._activeEffects.straw_boats.turnsLeft > 0) {
      if (attacker.side === 'enemy') {
        const absorbed = Math.floor(modifiedDmg * 0.5);
        modifiedDmg = modifiedDmg - absorbed;
        this._activeEffects.straw_boats.absorbedDamage += absorbed;
      }
    }

    // East wind: fire/wind attacks do 2x
    if (this._activeEffects.east_wind && this._activeEffects.east_wind.active) {
      if (attacker.element === 'fire' || attacker.element === 'wind') {
        modifiedDmg = Math.floor(modifiedDmg * 2);
      }
      // Also boost skills that are fire/wind type
      if (attacker.skill && (attacker.skill.name || '').match(/火|焰|风|雷/)) {
        // Already handled through element check — this is a fallback
      }
    }

    return modifiedDmg;
  },

  /**
   * Called when a fighter dies. Handles revival (七星灯).
   * Returns true if the death was prevented.
   */
  onDeath(fighter, battleState) {
    if (fighter.side !== 'player') return false;

    // Seven Star Lamp: revive team leader
    if (this._activeEffects.seven_star_lamp && !this._activeEffects.seven_star_lamp.used) {
      // Leader is first alive player (or the one that just died if it's position 0)
      const isLeader = fighter.pos === 0 || !battleState.player.find(f => f && f.alive && f.pos < fighter.pos);
      if (isLeader) {
        this._activeEffects.seven_star_lamp.used = true;
        fighter.hp = Math.floor(fighter.maxHp * 0.5);
        fighter.alive = true;
        Battle.addLog('⭐ 【七星灯】七星续命！' + fighter.name + ' 复活，HP恢复50%！');
        Battle.vfx.push({ type: 'revive', target: fighter.side + '-' + fighter.pos });
        return true;
      }
    }
    return false;
  },

  /**
   * Get the locked target for chain stratagem.
   * Returns target fighter or null if no lock.
   */
  getChainTarget(attacker, battleState) {
    if (!this._activeEffects.chain_stratagem || this._activeEffects.chain_stratagem.turnsLeft <= 0) return null;
    if (attacker.side !== 'enemy') return null;

    const key = attacker.id + '-' + attacker.pos;
    const lockedTargetId = this._activeEffects.chain_stratagem.lockedTargets[key];
    if (!lockedTargetId) return null;

    const target = battleState.player.find(f => f && f.alive && f.id === lockedTargetId);
    return target || null; // If locked target is dead, return null to let normal targeting happen
  },

  /**
   * Decrement chain stratagem turns. Called at end of turn.
   */
  onTurnEnd(turn, battleState) {
    if (this._activeEffects.chain_stratagem) {
      this._activeEffects.chain_stratagem.turnsLeft--;
    }
  },

  /**
   * Check if loot should be reduced (empty fort flee victory).
   */
  isReducedLoot() {
    return this._battleState && this._battleState._strategyReducedLoot === true;
  },

  /**
   * Reset state after battle ends.
   */
  reset() {
    this._selectedCards = [];
    this._battleState = null;
    this._activeEffects = {};
    this._confirmCallback = null;
  },
};

if (typeof window !== 'undefined') window.Strategy = Strategy;

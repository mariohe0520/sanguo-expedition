# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Game Does

Turn-based strategy RPG set in the Three Kingdoms (三国) era. Players collect heroes (武将), form armies, and battle through campaign stages. Deployed to GitHub Pages, playable on iOS Safari.

## No Build Step

Pure vanilla JS. Multiple `<script>` tags in `index.html` load modules in dependency order. No bundler. Deploy: `git push` → GitHub Pages auto-deploys.

## Architecture

| File | Role |
|------|------|
| `battle.js` | **Core battle engine**: fighter creation, turn execution, damage calc, weather/terrain effects, win/loss detection. Dead-unit check must be at the TOP of every fighter's turn loop. |
| `battle-canvas.js` | Canvas battle renderer. Always use `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` on resize — NEVER `ctx.scale()` (it compounds on each call and distorts the canvas). |
| `app.js` | Main app controller. Has extension blocks at the bottom that override `App.init`, `App.renderRoster`, etc. Read to the end before editing. |
| `heroes.js` | Hero data and stats. Heroes with `mystery: true` or `locked: true` are placeholders — filter them out of ALL gameplay systems. |
| `campaign.js` | Chapter/stage progression, boss configs. Max 5 enemies per stage. |
| `gacha.js` | Hero pull system with pity tracking |
| `idle.js` | Offline/idle income calculation |

## Critical: Dead Unit Bug

Dead fighters (HP ≤ 0) must be skipped at the **very start** of each turn iteration. The check must be:
```js
if (fighter.hp <= 0) continue; // at TOP of fighter loop in executeTurn()
```
Also check: dead fighters removed from active array, `applyDamage()` checks if target HP ≤ 0 before applying damage.

## Storage

All `Storage.*` keys use prefix `sg-`. Never use raw keys — always use the `Storage` helper functions. `DROP_TABLES` must have entries for all chapters 1-10 or loot will break on later chapters.

## Enemy Scaling

`enemyScale` values below 1.0 apply to early chapters — do NOT skip the scaling math even if `enemyScale !== 1.0`. Early chapters must be easy.

## Deployment

```bash
git add -A && git commit -m "..." && git push
```

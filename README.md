# Memory Game

![CI](https://github.com/ErikM9/memory-game-app/actions/workflows/ci.yml/badge.svg)

Card matching game with animal pairs. Match all 6 pairs to win. Cards flip on a click, a tap, or Enter/Space when focused.

## Run it

```bash
npm install
npm run serve
```

## Testing

Unit tests with Mocha, Chai and Sinon, coverage with c8, E2E tests with Puppeteer and axe-core.

```bash
npm test               # unit tests
npm run test:coverage  # unit tests with a coverage report (fails below 90%)
npm run test:e2e       # e2e tests (starts its own server)
npm run test:all       # coverage run, then e2e
```

### Why these tools?

- **Mocha/Chai** — Mocha's flexible runner keeps the unit and e2e suites apart with one small config file each, and Chai's `expect` API gives clean, readable BDD-style assertions throughout.
- **Sinon** — Stubbing `Math.random` turns the shuffle and visual-effect helpers into deterministic tests with exact expected values at both ends of the random range.
- **c8** — Native V8 coverage that works with ES modules out of the box. The browser wiring at the bottom of `scripts.js` is excluded because the e2e suite exercises it in a real browser.
- **Puppeteer** — Direct Chrome control makes it straightforward to script a full game playthrough: read `data-animal` attributes off the DOM, click matching pairs in sequence, and verify the win state.
- **axe-core** — An automated WCAG 2.1 A/AA scan, backed up by hand-written keyboard, focus order and screen reader checks that automated scanners can't judge.

### How the tests are organised

```
tests/
├── unit/
│   ├── game-helpers.test.js       shuffling, pair generation, match and win rules
│   ├── memory-game.test.js        MemoryGame turn and scoring state machine
│   ├── visual-effects.test.js     star, sparkle and firework style generators
│   └── support/random.js          shared top-of-range value for Math.random stubs
└── e2e/
    ├── page-load.e2e.test.js      initial render and shuffling
    ├── gameplay.e2e.test.js       flipping, matching and the mismatch lock
    ├── victory.e2e.test.js        win message and automatic restart
    ├── responsive.e2e.test.js     four screen sizes and the fireworks breakpoint
    ├── accessibility.e2e.test.js  axe scan, keyboard, focus order, screen reader names
    └── support/
        ├── hooks.js               static server, browser lifecycle, screenshot on failure
        └── game-page.js           page object for the board
```

Each e2e test gets a fresh browser context, and third-party requests such as Google Fonts are blocked so results never depend on the network. A failing test saves a screenshot to `tests/e2e/screenshots/`, which CI uploads as an artifact.

### What's tested

**Unit (63 tests)**
- Card shuffling, with `Math.random` pinned to check exact permutations
- Pair generation
- Match detection and the win condition, using boundary values
- Game turn states: first pick, match, mismatch lock, unlock and restart
- Out-of-range card positions
- Visual element helpers (stars, particles, fireworks) at both ends of their random ranges

**E2E (38 specs)**
- Page load, card structure, and a fresh shuffle on every load
- Flipping, matching, and blocking a third card during a mismatch
- Victory message, automatic restart with a new layout, and no uncaught script errors
- Four screen sizes: cards fully on screen, at least 44px, and flippable by tap or click
- Fireworks on both sides of the 768/769px breakpoint
- Accessibility: axe WCAG 2.1 A/AA scan, Enter/Space activation, focus order, screen reader card names

## CI

GitHub Actions runs the unit suite with coverage thresholds and the e2e suite on every push and pull request to `main` or `master`.
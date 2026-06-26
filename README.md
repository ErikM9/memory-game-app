# Memory Game

![CI](https://github.com/ErikM9/memory-game-app/actions/workflows/ci.yml/badge.svg)

Card matching game with animal pairs. Match all 6 pairs to win.

## Run it

```bash
npm install
npm run serve
```

## Testing

Unit tests with Mocha/Chai, E2E tests with Puppeteer.

```bash
npm test           # unit tests
npm run test:e2e   # e2e tests (needs npm run serve first)
```

### Why these tools?

- **Mocha/Chai** — Mocha's flexible test runner needs no config file for this setup, and Chai's `expect` API gives clean, readable BDD-style assertions throughout.
- **Puppeteer** — Direct Chrome control makes it straightforward to script a full game playthrough: read `data-animal` attributes off the DOM, click matching pairs in sequence, and verify the win state.

### What's tested

**Unit (67 tests)**
- Card shuffling
- Pair generation
- Match detection
- Win condition
- Game state management
- Visual element helpers (stars, particles, fireworks)
- Full game simulation

**E2E (32 specs)**
- Page load and structure
- Card structure and randomization
- Card flipping
- Match/mismatch behavior
- Game completion and reset
- Visual elements
- Responsive design
- Accessibility (alt text, roles, aria-labels, heading, section element)

## CI

GitHub Actions runs both test suites on push.
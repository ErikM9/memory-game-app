# Memory Game

![CI](https://github.com/ErikM9/memory-game-app/actions/workflows/ci.yml/badge.svg)

A light-hearted card matching game with animal pairs. Find all 6 pairs to win. The cards flip on a click, a tap or Enter/Space when focused, and winning the game sets off a little celebration.

**Live demo:** [erikm9.github.io/memory-game-app](https://erikm9.github.io/memory-game-app/)

## Run it

```bash
npm install
npm run serve
```

Then open http://localhost:3000.

## Testing

Mocha and Chai run both suites. On top of them I used Sinon and c8 for the unit tests and Puppeteer with axe-core for the end-to-end tests. c8 asks for Node 20.19 or 22.12 or newer.

```bash
npm test               # unit tests
npm run test:coverage  # unit tests with a coverage report (fails below 90%)
npm run test:e2e       # e2e tests (starts its own server)
npm run test:all       # coverage run, then e2e
```

### Why these tools?

I chose the testing tools for my smaller projects so I could learn how various testing tools work, which is why each of them uses a different set. For the Memory Game I went with Mocha, Chai, Sinon, c8, Puppeteer and axe-core.

- Mocha keeps the unit and e2e suites apart with a small config file each, and its root hooks start the server and the browser once for the whole e2e run.
- Chai adds the assertions, which Mocha leaves out on purpose, and its `expect` style makes them easy to read in both suites.
- Sinon stubs `Math.random`, so I can test the shuffle and the visual effect helpers with fixed values at both ends of the random range.
- c8 gives me V8 coverage which works with ES modules out of the box and fails the run below 90%. The browser code at the bottom of `scripts.js` is excluded from it, because the e2e suite runs that part in a real browser.
- Puppeteer controls Chrome directly and downloads a matching Chrome when it's installed, so there's no driver to set up. That direct control made it easy to script a whole game: read the `data-animal` attributes off the DOM, click the matching pairs one after another and check that the game is won.
- axe-core runs an automated WCAG 2.1 A/AA scan through `@axe-core/puppeteer`. On top of that I wrote my own keyboard, focus order and screen reader checks for the things a scanner can't judge.

### How the tests are organised

```
tests/
  unit/
    game-helpers.test.js        shuffling, match and win rules
    memory-game.test.js         the turns and scoring of MemoryGame
    visual-effects.test.js      star and firework style generators
    support/random.js           top-of-range value for the Math.random stubs
  e2e/
    page-load.e2e.test.js       initial render and shuffling
    gameplay.e2e.test.js        flipping, matching and the mismatch lock
    victory.e2e.test.js         win message and automatic restart
    responsive.e2e.test.js      four screen sizes and the fireworks breakpoint
    accessibility.e2e.test.js   axe scan, keyboard, focus order, screen reader names
    support/hooks.js            static server, browser lifecycle, screenshot on failure
    support/game-page.js        page object for the board
```

Each e2e test gets a fresh browser context. Requests to other servers (such as Google Fonts) are blocked, so the results never depend on the network. A failing test saves a screenshot to `tests/e2e/screenshots/`, which CI uploads as an artifact.

### What's tested

**Unit (55 tests, 100% coverage of the game logic)**
- Card shuffling, with `Math.random` pinned to check exact permutations
- Match detection and the win condition, using boundary values
- The states of a turn: first pick, match, mismatch lock, unlock and reset
- Card positions which are out of range
- The visual effect helpers (stars and fireworks) at both ends of their random ranges

**End-to-end (38 tests)**
- Page load, the structure of the cards and a fresh shuffle on every load
- Flipping, matching and blocking a third card during a mismatch
- The victory message, the automatic restart with a new layout and no uncaught script errors
- Four screen sizes: cards fully on screen, at least 44px and flippable by tap or click
- Fireworks on both sides of the 768/769px breakpoint
- Accessibility: axe WCAG 2.1 A/AA scan, Enter/Space, focus order and the card names screen readers get

## CI

GitHub Actions runs the unit tests with coverage and the e2e suite on every push and pull request to `main`. A push to `main` which passes them is then deployed to GitHub Pages, straight from `src/`.
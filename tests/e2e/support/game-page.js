import { getBaseUrl, newPage } from './hooks.js';

export const DESKTOP = { width: 1280, height: 800 };

const CARD = '.memory-card';
const FACE_UP_CARD = '.memory-card.flip';
const WIN_NOTIFICATION = '#win-notification';
const FIREWORK_BURST = '.firework-burst';

/* Page object for the game, exposing player actions and page state while leaving every assertion to the specs */
export class GamePage {
  static async open(viewport = DESKTOP) {
    const page = await newPage(viewport);
    const game = new GamePage(page);
    await page.goto(getBaseUrl(), { waitUntil: 'load' });
    return game;
  }

  constructor(page) {
    this.page = page;
    this.pageErrors = [];
    page.on('pageerror', error => this.pageErrors.push(error.message));
  }

  async reload() {
    await this.page.reload({ waitUntil: 'load' });
  }

  headingText() {
    return this.page.$eval('h1', heading => heading.textContent);
  }

  cards() {
    return this.page.$$(CARD);
  }

  /* Animals in DOM order, which is the index order every card action on this page object uses */
  animals() {
    return this.page.$$eval(CARD, cards => cards.map(card => card.dataset.animal));
  }

  /* Animals in the order a player reads the board, sorted by card centres so hover zoom and flip rotation cannot reorder them */
  layout() {
    return this.page.$$eval(CARD, cards => cards
      .map(card => {
        const box = card.getBoundingClientRect();
        return { animal: card.dataset.animal, x: Math.round(box.left + box.width / 2), y: Math.round(box.top + box.height / 2) };
      })
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map(card => card.animal));
  }

  cardFaces() {
    return this.page.$$eval(CARD, cards => cards.map(card => ({
      hasFront: card.querySelector('img.card-front') !== null,
      hasBack: card.querySelector('img.card-back') !== null
    })));
  }

  async flip(index) {
    const cards = await this.cards();
    await cards[index].click();
  }

  async tap(index) {
    const cards = await this.cards();
    await cards[index].tap();
  }

  async pressKeyOn(index, key) {
    const cards = await this.cards();
    await cards[index].focus();
    await this.page.keyboard.press(key);
  }

  isFaceUp(index) {
    return this.page.$$eval(CARD, (cards, i) => cards[i].classList.contains('flip'), index);
  }

  faceUpCount() {
    return this.page.$$eval(FACE_UP_CARD, cards => cards.length);
  }

  /* Resolves with the live count once it reaches the expected value or the timeout passes, so the spec asserts on what really happened */
  async waitForFaceUpCount(expected, timeout = 3000) {
    await this.page
      .waitForFunction(
        (selector, count) => document.querySelectorAll(selector).length === count,
        { timeout },
        FACE_UP_CARD,
        expected
      )
      .catch(ignoreTimeout);
    return this.faceUpCount();
  }

  /* Throws instead of returning nothing, so a spec can never pass without the pair it needs */
  async findPair(excluding = []) {
    const animals = await this.animals();
    for (let first = 0; first < animals.length; first++) {
      if (excluding.includes(first)) continue;
      const second = animals.findIndex((animal, i) => i !== first && !excluding.includes(i) && animal === animals[first]);
      if (second !== -1) return [first, second];
    }
    throw new Error('No matching pair is left on the board');
  }

  async findMismatch(excluding = []) {
    const animals = await this.animals();
    const candidates = animals.map((_, index) => index).filter(index => !excluding.includes(index));
    const [first] = candidates;
    const second = candidates.find(index => animals[index] !== animals[first]);
    if (second === undefined) throw new Error('No mismatched pair is left on the board');
    return [first, second];
  }

  /* Clicks both cards of every pair in turn, which wins the game */
  async solve() {
    const positions = new Map();
    (await this.animals()).forEach((animal, index) => {
      positions.set(animal, [...(positions.get(animal) ?? []), index]);
    });
    for (const [first, second] of positions.values()) {
      await this.flip(first);
      await this.flip(second);
    }
  }

  isWinNotificationVisible() {
    return this.page.$eval(WIN_NOTIFICATION, notification => getComputedStyle(notification).display !== 'none');
  }

  winNotificationText() {
    return this.page.$eval(WIN_NOTIFICATION, notification => notification.textContent);
  }

  /* The notification hides itself when its border animation ends, which is also when the next game is dealt */
  async waitForWinNotificationToHide(timeout = 10000) {
    await this.page
      .waitForFunction(
        selector => getComputedStyle(document.querySelector(selector)).display === 'none',
        { timeout },
        WIN_NOTIFICATION
      )
      .catch(ignoreTimeout);
  }

  /* Gives the first volley up to the timeout to launch, then counts the bursts running the explode animation */
  async launchedFireworkCount(timeout = 1000) {
    await this.page
      .waitForFunction(
        selector => [...document.querySelectorAll(selector)].some(burst => burst.style.animationName === 'explode'),
        { timeout },
        FIREWORK_BURST
      )
      .catch(ignoreTimeout);
    return this.page.$$eval(FIREWORK_BURST, bursts => bursts.filter(burst => burst.style.animationName === 'explode').length);
  }

  starCount() {
    return this.page.$$eval('#bg-container .star', stars => stars.length);
  }

  titleSparkleCount() {
    return this.page.$$eval('h1 .glow-particle', sparkles => sparkles.length);
  }

  /* Card edges are measured in viewport coordinates so they can be compared with the viewport size */
  cardBoxes() {
    return this.page.$$eval(CARD, cards => cards.map(card => {
      const { top, right, bottom, left, width, height } = card.getBoundingClientRect();
      return { top, right, bottom, left, width, height };
    }));
  }

  /* Presses Tab once per card from the top of the page and records the centre of each focused element */
  async tabThroughCards() {
    const cardCount = (await this.cards()).length;
    const stops = [];
    for (let i = 0; i < cardCount; i++) {
      await this.page.keyboard.press('Tab');
      stops.push(await this.page.evaluate(() => {
        const focused = document.activeElement;
        const box = focused.getBoundingClientRect();
        return {
          isCard: focused.classList.contains('memory-card'),
          x: Math.round(box.left + box.width / 2),
          y: Math.round(box.top + box.height / 2)
        };
      }));
    }
    return stops;
  }

  /* Reads the full accessibility tree that screen readers announce, since Puppeteer's default snapshot prunes landmarks such as the board region */
  async accessibleNodes(role) {
    const nodes = [];
    const collect = node => {
      if (node.role === role) nodes.push(node);
      (node.children ?? []).forEach(collect);
    };
    collect(await this.page.accessibility.snapshot({ interestingOnly: false }));
    return nodes;
  }

  async cardAccessibleNames() {
    return (await this.accessibleNodes('button')).map(node => node.name);
  }
}

function ignoreTimeout(error) {
  if (error.name !== 'TimeoutError') throw error;
}
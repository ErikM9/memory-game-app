import puppeteer from 'puppeteer';
import { expect } from 'chai';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Memory Game E2E', function() {
  this.timeout(30000);

  let browser;
  let page;
  const baseUrl = 'http://localhost:3000';

  before(async () => {
    const browserType = process.env.PUPPETEER_BROWSER || 'chrome';
    browser = await puppeteer.launch({
      browser: browserType,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    /* networkidle2: the page pulls in Google Fonts, whose keep-alive
       socket can stay open and stop the network from ever going fully idle */
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  });

  after(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle2' });
  });

  describe('Page Load', () => {
    it('displays the page title', async () => {
      const title = await page.title();
      expect(title).to.equal('Memory Game');
    });

    it('shows main heading', async () => {
      const heading = await page.$eval('h1.title-glow', el => el.textContent);
      expect(heading).to.equal('Memory Game');
    });

    it('displays game board', async () => {
      const board = await page.$('.game-board');
      expect(board).to.not.be.null;
    });

    it('shows 12 cards', async () => {
      const cards = await page.$$('.memory-card');
      expect(cards.length).to.equal(12);
    });

    it('all cards start face down', async () => {
      const flippedCards = await page.$$('.memory-card.flip');
      expect(flippedCards.length).to.equal(0);
    });

    it('creates background stars', async () => {
      const stars = await page.$$('.star');
      expect(stars.length).to.be.greaterThan(0);
    });

    it('creates firework elements', async () => {
      const fireworks = await page.$$('.firework-burst');
      expect(fireworks.length).to.equal(32);
    });

    it('win notification is hidden initially', async () => {
      const display = await page.$eval('#win-notification', el =>
        window.getComputedStyle(el).display
      );
      expect(display).to.equal('none');
    });
  });

  describe('Card Structure', () => {
    it('each card has front and back images', async () => {
      const cardStructure = await page.$$eval('.memory-card', cards => {
        return cards.map(card => ({
          hasFront: card.querySelector('.card-front') !== null,
          hasBack: card.querySelector('.card-back') !== null
        }));
      });
      cardStructure.forEach(card => {
        expect(card.hasFront).to.be.true;
        expect(card.hasBack).to.be.true;
      });
    });

    it('each card has data-animal attribute', async () => {
      const animals = await page.$$eval('.memory-card', cards =>
        cards.map(card => card.dataset.animal)
      );
      animals.forEach(animal => {
        expect(animal).to.be.a('string').and.not.empty;
      });
    });

    it('cards have 6 unique animal types, each appearing exactly twice', async () => {
      const animals = await page.$$eval('.memory-card', cards =>
        cards.map(card => card.dataset.animal)
      );
      const counts = {};
      animals.forEach(a => counts[a] = (counts[a] || 0) + 1);
      expect(Object.keys(counts).length).to.equal(6);
      Object.values(counts).forEach(count => expect(count).to.equal(2));
    });
  });

  describe('Card Flipping', () => {
    it('clicking a card flips it', async () => {
      const card = await page.$('.memory-card');
      await card.click();
      const isFlipped = await page.$eval('.memory-card', el =>
        el.classList.contains('flip')
      );
      expect(isFlipped).to.be.true;
    });

    it('clicking two different cards flips both', async () => {
      const cards = await page.$$('.memory-card');
      await cards[0].click();
      await cards[1].click();
      const flippedCount = await page.$$eval('.memory-card.flip', els => els.length);
      expect(flippedCount).to.equal(2);
    });

    it('clicking same card twice does not unflip it', async () => {
      const card = await page.$('.memory-card');
      await card.click();
      await card.click();
      const isFlipped = await page.$eval('.memory-card', el =>
        el.classList.contains('flip')
      );
      expect(isFlipped).to.be.true;
    });

    it('flipping two non-matching cards shows both as flipped', async () => {
      const nonMatchingPair = await findNonMatchingPair(page);
      if (!nonMatchingPair) return;
      await nonMatchingPair[0].click();
      await delay(50);
      await nonMatchingPair[1].click();
      await delay(50);
      const flippedAfterTwo = await page.$$eval('.memory-card.flip', els => els.length);
      expect(flippedAfterTwo).to.equal(2);
    });
  });

  describe('Match Detection', () => {
    it('matching cards stay flipped', async () => {
      const matchingPair = await findMatchingPair(page);
      if (!matchingPair) return;
      await matchingPair[0].click();
      await matchingPair[1].click();
      await page.waitForFunction(
        () => document.querySelectorAll('.memory-card.flip').length >= 2
      );
      const flippedCount = await page.$$eval('.memory-card.flip', els => els.length);
      expect(flippedCount).to.be.at.least(2);
    });

    it('non-matching cards flip back after delay', async () => {
      const nonMatchingPair = await findNonMatchingPair(page);
      if (!nonMatchingPair) return;
      await nonMatchingPair[0].click();
      await nonMatchingPair[1].click();
      await page.waitForFunction(
        () => document.querySelectorAll('.memory-card.flip').length === 0,
        { timeout: 3000 }
      );
      const flippedCount = await page.$$eval('.memory-card.flip', els => els.length);
      expect(flippedCount).to.equal(0);
    });
  });

  describe('Game Completion', () => {
    it('shows victory message with correct text after winning', async function() {
      this.timeout(60000);
      await solveGame(page);
      const display = await page.$eval('#win-notification', el =>
        window.getComputedStyle(el).display
      );
      expect(display).to.equal('block');
      const text = await page.$eval('#win-notification', el => el.textContent);
      expect(text).to.include('Congrats');
    });
  });

  describe('Card Randomization', () => {
    it('cards have order style for positioning', async () => {
      const orders = await page.$$eval('.memory-card', cards =>
        cards.map(card => card.style.order)
      );
      expect(orders.some(o => o !== '')).to.be.true;
    });
  });

  describe('Visual Elements', () => {
    it('title has glow effect class', async () => {
      const hasGlow = await page.$('h1.title-glow');
      expect(hasGlow).to.not.be.null;
    });

    it('glow particles are added to title', async () => {
      const particles = await page.$$('.glow-particle');
      expect(particles.length).to.be.greaterThan(0);
    });

    it('background container exists', async () => {
      const container = await page.$('#bg-container');
      expect(container).to.not.be.null;
    });
  });

  describe('Responsive Design', () => {
    it('displays correctly on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload({ waitUntil: 'networkidle2' });
      const cards = await page.$$('.memory-card');
      expect(cards.length).to.equal(12);
      await page.setViewport({ width: 1280, height: 800 });
    });

    it('displays correctly on tablet viewport', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.reload({ waitUntil: 'networkidle2' });
      const board = await page.$('.game-board');
      expect(board).to.not.be.null;
      await page.setViewport({ width: 1280, height: 800 });
    });

    it('cards are clickable on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload({ waitUntil: 'networkidle2' });
      const card = await page.$('.memory-card');
      await card.click();
      const isFlipped = await page.$eval('.memory-card', el =>
        el.classList.contains('flip')
      );
      expect(isFlipped).to.be.true;
      await page.setViewport({ width: 1280, height: 800 });
    });
  });

  describe('Accessibility', () => {
    it('cards have alt text on images', async () => {
      const altTexts = await page.$$eval('.memory-card img', imgs =>
        imgs.map(img => img.alt)
      );
      altTexts.forEach(alt => {
        expect(alt).to.be.a('string').and.not.empty;
      });
    });

    it('page has proper h1 heading', async () => {
      const h1 = await page.$('h1');
      expect(h1).to.not.be.null;
    });

    it('game board has section element', async () => {
      const section = await page.$('section.game-board');
      expect(section).to.not.be.null;
    });

    it('cards have role="button" and tabindex', async () => {
      const cardAttrs = await page.$$eval('.memory-card', cards =>
        cards.map(card => ({
          role: card.getAttribute('role'),
          tabindex: card.getAttribute('tabindex')
        }))
      );
      cardAttrs.forEach(attrs => {
        expect(attrs.role).to.equal('button');
        expect(attrs.tabindex).to.equal('0');
      });
    });

    it('cards have aria-label describing the animal', async () => {
      const labels = await page.$$eval('.memory-card', cards =>
        cards.map(card => card.getAttribute('aria-label'))
      );
      labels.forEach(label => {
        expect(label).to.be.a('string').and.not.empty;
        expect(label).to.include('card');
      });
    });

    it('game board has aria-label', async () => {
      const label = await page.$eval('section.game-board', el =>
        el.getAttribute('aria-label')
      );
      expect(label).to.be.a('string').and.not.empty;
    });
  });

  describe('Game Reset', () => {
    it('game resets automatically after victory', async function() {
      this.timeout(70000);
      await solveGame(page);
      /* Poll until all cards are face-down rather than using a fixed delay */
      await page.waitForFunction(
        () => document.querySelectorAll('.memory-card.flip').length === 0,
        { timeout: 10000 }
      );
      const flippedCount = await page.$$eval('.memory-card.flip', els => els.length);
      expect(flippedCount).to.equal(0);
    });
  });
});

async function findMatchingPair(page) {
  const cardData = await page.$$eval('.memory-card', cards =>
    cards.map((card, index) => ({ index, animal: card.dataset.animal }))
  );
  const seen = {};
  for (const card of cardData) {
    if (seen[card.animal] !== undefined) {
      const cards = await page.$$('.memory-card');
      return [cards[seen[card.animal]], cards[card.index]];
    }
    seen[card.animal] = card.index;
  }
  return null;
}

async function findNonMatchingPair(page) {
  const cardData = await page.$$eval('.memory-card', cards =>
    cards.map((card, index) => ({ index, animal: card.dataset.animal }))
  );
  for (let i = 0; i < cardData.length; i++) {
    for (let j = i + 1; j < cardData.length; j++) {
      if (cardData[i].animal !== cardData[j].animal) {
        const cards = await page.$$('.memory-card');
        return [cards[i], cards[j]];
      }
    }
  }
  return null;
}

async function solveGame(page) {
  const cardData = await page.$$eval('.memory-card', cards =>
    cards.map((card, index) => ({ index, animal: card.dataset.animal }))
  );
  const pairs = {};
  cardData.forEach(card => {
    if (!pairs[card.animal]) pairs[card.animal] = [];
    pairs[card.animal].push(card.index);
  });
  for (const animal in pairs) {
    const [first, second] = pairs[animal];
    const cards = await page.$$('.memory-card');
    await cards[first].click();
    await delay(100);
    await cards[second].click();
    await delay(600);
  }
  await page.waitForFunction(
    () => window.getComputedStyle(document.getElementById('win-notification')).display === 'block',
    { timeout: 5000 }
  );
}
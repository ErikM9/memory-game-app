import { expect } from 'chai';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { GamePage } from './support/game-page.js';

const HIDDEN_CARD_NAME = 'Face-down card';

function capitalise(word) {
  return word[0].toUpperCase() + word.slice(1);
}

describe('Accessibility', () => {
  let game;

  beforeEach(async () => {
    game = await GamePage.open();
  });

  /* Automated scans only catch part of what WCAG covers, so the game-specific checks below stay hand-written */
  it('passes an automated WCAG 2.1 A and AA scan', async () => {
    const results = await new AxePuppeteer(game.page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations.map(violation => `${violation.id}: ${violation.help}`)).to.be.empty;
  });

  describe('keyboard', () => {
    ['Enter', 'Space'].forEach(key => {
      it(`flips the focused card with ${key}`, async () => {
        await game.pressKeyOn(0, key);

        expect(await game.isFaceUp(0)).to.be.true;
      });
    });

    it('moves focus through the cards in on-screen reading order', async () => {
      const stops = await game.tabThroughCards();
      const readingOrder = [...stops].sort((a, b) => a.y - b.y || a.x - b.x);

      expect(stops.every(stop => stop.isCard)).to.be.true;
      expect(stops).to.deep.equal(readingOrder);
    });
  });

  describe('screen reader output', () => {
    it('exposes the board as a labelled region', async () => {
      const regionNames = (await game.accessibleNodes('region')).map(node => node.name);

      expect(regionNames).to.include('Memory card game board');
    });

    it('announces every face-down card without revealing its animal', async () => {
      const names = await game.cardAccessibleNames();

      expect(names).to.have.lengthOf(12);
      expect(names.every(name => name === HIDDEN_CARD_NAME)).to.be.true;
    });

    it('announces the animal once a card is face up', async () => {
      const [animal] = await game.animals();

      await game.flip(0);

      expect((await game.cardAccessibleNames())[0]).to.equal(`${capitalise(animal)} card`);
    });

    it('hides the animal again when a mismatched card turns back over', async () => {
      const [first, second] = await game.findMismatch();

      await game.flip(first);
      await game.flip(second);
      await game.waitForFaceUpCount(0);

      const names = await game.cardAccessibleNames();
      expect([names[first], names[second]]).to.deep.equal([HIDDEN_CARD_NAME, HIDDEN_CARD_NAME]);
    });
  });
});
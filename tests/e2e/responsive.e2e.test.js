import { expect } from 'chai';
import { GamePage } from './support/game-page.js';

const SCREENS = [
  { name: 'phone in portrait', viewport: { width: 375, height: 667, isMobile: true, hasTouch: true } },
  { name: 'phone in landscape', viewport: { width: 667, height: 375, isMobile: true, hasTouch: true } },
  { name: 'tablet in portrait', viewport: { width: 768, height: 1024, isMobile: true, hasTouch: true } },
  { name: 'desktop', viewport: { width: 1280, height: 800 } }
];

/* WCAG 2.5.5 asks for a 44px target size, which also matches Apple's touch-target guideline */
const MIN_TOUCH_TARGET = 44;

describe('Responsive layout', () => {
  SCREENS.forEach(({ name, viewport }) => {
    describe(`on a ${name} screen (${viewport.width}x${viewport.height})`, () => {
      let game;

      beforeEach(async () => {
        game = await GamePage.open(viewport);
      });

      it('shows every card fully inside the viewport', async () => {
        const cutOff = (await game.cardBoxes())
          .map((box, index) => ({ ...box, index }))
          .filter(box => box.top < 0 || box.left < 0 || box.bottom > viewport.height || box.right > viewport.width)
          .map(box => box.index);

        expect(cutOff, 'positions of cards cut off by the viewport').to.be.empty;
      });

      it(`keeps every card at least ${MIN_TOUCH_TARGET}px in each direction`, async () => {
        const tooSmall = (await game.cardBoxes())
          .map((box, index) => ({ ...box, index }))
          .filter(box => box.width < MIN_TOUCH_TARGET || box.height < MIN_TOUCH_TARGET)
          .map(box => box.index);

        expect(tooSmall, 'positions of cards below the minimum touch target').to.be.empty;
      });

      it(`flips a card on ${viewport.hasTouch ? 'tap' : 'click'}`, async () => {
        await (viewport.hasTouch ? game.tap(0) : game.flip(0));

        expect(await game.isFaceUp(0)).to.be.true;
      });
    });
  });

  /* Fireworks only run at 769px and wider, so the specs sit on both sides of that boundary */
  describe('fireworks breakpoint', () => {
    it('launches fireworks on a 769px-wide screen', async () => {
      const game = await GamePage.open({ width: 769, height: 800 });

      await game.solve();

      expect(await game.launchedFireworkCount()).to.be.greaterThan(0);
    });

    it('skips fireworks on a 768px-wide screen', async () => {
      const game = await GamePage.open({ width: 768, height: 800 });

      await game.solve();

      expect(await game.launchedFireworkCount()).to.equal(0);
    });
  });
});
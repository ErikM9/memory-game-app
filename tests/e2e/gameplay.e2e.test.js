import { expect } from 'chai';
import { GamePage } from './support/game-page.js';

describe('Gameplay', () => {
  let game;

  beforeEach(async () => {
    game = await GamePage.open();
  });

  describe('flipping cards', () => {
    it('turns a card face up when it is clicked', async () => {
      await game.flip(0);

      expect(await game.isFaceUp(0)).to.be.true;
    });

    it('keeps a face-up card face up when it is clicked again', async () => {
      await game.flip(0);
      await game.flip(0);

      expect(await game.isFaceUp(0)).to.be.true;
      expect(await game.faceUpCount()).to.equal(1);
    });

    it('ignores a third card while a mismatched pair is face up', async () => {
      const [first, second] = await game.findMismatch();
      const third = [0, 1, 2].find(index => index !== first && index !== second);

      await game.flip(first);
      await game.flip(second);
      await game.flip(third);

      expect(await game.isFaceUp(third)).to.be.false;
      expect(await game.faceUpCount()).to.equal(2);
    });
  });

  describe('matching pairs', () => {
    it('turns a mismatched pair face down again after a short pause', async () => {
      const [first, second] = await game.findMismatch();

      await game.flip(first);
      await game.flip(second);

      expect(await game.faceUpCount()).to.equal(2);
      expect(await game.waitForFaceUpCount(0)).to.equal(0);
    });

    it('keeps a matched pair face up after a later mismatch turns back over', async () => {
      const pair = await game.findPair();
      const mismatch = await game.findMismatch(pair);

      await game.flip(pair[0]);
      await game.flip(pair[1]);
      await game.flip(mismatch[0]);
      await game.flip(mismatch[1]);

      expect(await game.waitForFaceUpCount(2)).to.equal(2);
      expect(await game.isFaceUp(pair[0])).to.be.true;
      expect(await game.isFaceUp(pair[1])).to.be.true;
    });
  });
});
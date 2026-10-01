import { expect } from 'chai';
import { GamePage } from './support/game-page.js';

describe('Victory', () => {
  let game;
  let layoutBeforeWin;

  beforeEach(async () => {
    game = await GamePage.open();
    layoutBeforeWin = await game.layout();
    await game.solve();
  });

  it('shows the congratulations message once every pair is matched', async () => {
    expect(await game.isWinNotificationVisible()).to.be.true;
    expect(await game.winNotificationText()).to.equal('Congrats! You matched all the cards!');
  });

  describe('once the celebration ends', () => {
    beforeEach(async () => {
      await game.waitForWinNotificationToHide();
    });

    it('hides the message and deals a new face-down layout', async () => {
      expect(await game.isWinNotificationVisible()).to.be.false;
      expect(await game.faceUpCount()).to.equal(0);
      expect(await game.layout()).to.not.deep.equal(layoutBeforeWin);
    });

    /* Matched cards lose their click listener, so this proves the restart attaches them again */
    it('accepts clicks in the new game', async () => {
      await game.flip(0);

      expect(await game.isFaceUp(0)).to.be.true;
    });

    it('completes the whole cycle without uncaught script errors', () => {
      expect(game.pageErrors).to.be.empty;
    });
  });
});
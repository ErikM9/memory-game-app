import { expect } from 'chai';
import { GamePage } from './support/game-page.js';

describe('Page load', () => {
  let game;

  beforeEach(async () => {
    game = await GamePage.open();
  });

  it('shows the game name in the browser tab and the main heading', async () => {
    expect(await game.page.title()).to.equal('Memory Game');
    expect(await game.headingText()).to.equal('Memory Game');
  });

  it('deals 12 cards, all face down', async () => {
    expect(await game.cards()).to.have.lengthOf(12);
    expect(await game.faceUpCount()).to.equal(0);
  });

  it('deals six animals with exactly two cards each', async () => {
    const counts = {};
    (await game.animals()).forEach(animal => {
      counts[animal] = (counts[animal] ?? 0) + 1;
    });

    expect(Object.keys(counts)).to.have.members(['squirrel', 'elk', 'jellyfish', 'whale', 'cow', 'rabbit']);
    expect(Object.values(counts)).to.deep.equal([2, 2, 2, 2, 2, 2]);
  });

  it('gives every card a picture face and a question-mark back', async () => {
    const faces = await game.cardFaces();

    expect(faces).to.have.lengthOf(12);
    expect(faces.every(face => face.hasFront && face.hasBack)).to.be.true;
  });

  it('keeps the win notification hidden', async () => {
    expect(await game.isWinNotificationVisible()).to.be.false;
  });

  it('fills the background with stars and the title with sparkles', async () => {
    expect(await game.starCount()).to.be.greaterThan(0);
    expect(await game.titleSparkleCount()).to.be.greaterThan(0);
  });

  /* Two identical shuffles of these 12 cards have odds of roughly 1 in 7.5 million */
  it('shuffles the card layout on every load', async () => {
    const firstLayout = await game.layout();

    await game.reload();

    expect(await game.layout()).to.not.deep.equal(firstLayout);
  });
});
import { expect } from 'chai';
import sinon from 'sinon';
import { MemoryGame, generateCardPairs } from '../../src/scripts.js';
import { JUST_BELOW_ONE } from './support/random.js';

/* Unshuffled deck with each pair split apart, assigned the same way the UI builds its deck from the DOM */
const DECK = ['cat', 'dog', 'cat', 'dog'];
const CAT_A = 0;
const DOG_A = 1;
const CAT_B = 2;
const DOG_B = 3;

const FRESH_TURN = { firstPick: null, secondPick: null, isFirstTurn: true, boardLocked: false };
const FRESH_GAME = { ...FRESH_TURN, pairsFound: 0, matchedPairs: [] };

function createGame(deck = DECK) {
  const game = new MemoryGame([...new Set(deck)]);
  game.cards = deck.map((animal, index) => ({ animal, id: `${animal}-${index}` }));
  return game;
}

/* Picks carry the card's position so the UI knows which element to update */
function pickAt(game, index) {
  return { ...game.cards[index], index };
}

describe('MemoryGame', () => {
  afterEach(() => sinon.restore());

  describe('constructor', () => {
    it('counts one pair per animal', () => {
      expect(new MemoryGame(['squirrel', 'elk', 'jellyfish']).totalPairs).to.equal(3);
    });

    it('starts with an empty deck and no progress', () => {
      expect(new MemoryGame(['squirrel'])).to.deep.include({ ...FRESH_GAME, cards: [] });
    });

    it('defaults to a game with no pairs when no animals are given', () => {
      const game = new MemoryGame();

      expect(game.animals).to.deep.equal([]);
      expect(game.totalPairs).to.equal(0);
    });
  });

  describe('initialize', () => {
    it('deals and stores two cards per animal in shuffled order', () => {
      sinon.stub(Math, 'random').returns(0);
      const animals = ['squirrel', 'elk', 'jellyfish'];
      const dealOrder = generateCardPairs(animals);
      const game = new MemoryGame(animals);

      const cards = game.initialize();

      expect(cards).to.equal(game.cards);
      expect(cards).to.have.deep.members(dealOrder);
      expect(cards).to.not.deep.equal(dealOrder);
    });

    it('clears the progress of a previous game', () => {
      const game = createGame();
      game.flipCard(CAT_A);
      game.flipCard(CAT_B);
      game.flipCard(DOG_A);

      game.initialize();

      expect(game).to.deep.include(FRESH_GAME);
    });
  });

  describe('canFlipCard', () => {
    let game;

    beforeEach(() => {
      game = createGame();
    });

    /* Boundary values on both edges of the 4-card deck */
    [
      { index: -1, expected: false, position: 'just before the first card' },
      { index: 0, expected: true, position: 'the first card' },
      { index: 3, expected: true, position: 'the last card' },
      { index: 4, expected: false, position: 'just past the last card' }
    ].forEach(({ index, expected, position }) => {
      it(`returns ${expected} for index ${index}, ${position}`, () => {
        expect(game.canFlipCard(index)).to.equal(expected);
      });
    });

    it('returns false for the card already face up as the first pick', () => {
      game.flipCard(CAT_A);

      expect(game.canFlipCard(CAT_A)).to.be.false;
    });

    it('returns false for both cards of a matched pair', () => {
      game.flipCard(CAT_A);
      game.flipCard(CAT_B);

      expect(game.canFlipCard(CAT_A)).to.be.false;
      expect(game.canFlipCard(CAT_B)).to.be.false;
    });

    it('returns false for every card while a mismatched pair is face up', () => {
      game.flipCard(CAT_A);
      game.flipCard(DOG_A);

      expect(DECK.map((_, index) => game.canFlipCard(index))).to.deep.equal([false, false, false, false]);
    });
  });

  describe('flipCard', () => {
    let game;

    beforeEach(() => {
      game = createGame();
    });

    describe('on the first pick of a turn', () => {
      it('reports the flipped card with its position', () => {
        expect(game.flipCard(DOG_A)).to.deep.equal({ action: 'first_flip', card: pickAt(game, DOG_A) });
      });

      it('keeps the card as the first pick and waits for a second', () => {
        game.flipCard(DOG_A);

        expect(game).to.deep.include({ firstPick: pickAt(game, DOG_A), isFirstTurn: false, boardLocked: false });
      });
    });

    describe('when the second pick matches', () => {
      let result;

      beforeEach(() => {
        game.flipCard(CAT_A);
        result = game.flipCard(CAT_B);
      });

      it('reports the match with both cards and the new score', () => {
        expect(result).to.deep.equal({
          action: 'match',
          card1: pickAt(game, CAT_A),
          card2: pickAt(game, CAT_B),
          pairsFound: 1,
          gameWon: false
        });
      });

      it('records the animal as matched', () => {
        expect(game).to.deep.include({ pairsFound: 1, matchedPairs: ['cat'] });
      });

      it('ends the turn without locking the board', () => {
        expect(game).to.deep.include(FRESH_TURN);
      });

      it('reports gameWon once the final pair is matched too', () => {
        game.flipCard(DOG_A);

        expect(game.flipCard(DOG_B).gameWon).to.be.true;
      });
    });

    describe('when the second pick does not match', () => {
      let result;

      beforeEach(() => {
        game.flipCard(CAT_A);
        result = game.flipCard(DOG_A);
      });

      it('reports the mismatch with both cards', () => {
        expect(result).to.deep.equal({ action: 'no_match', card1: pickAt(game, CAT_A), card2: pickAt(game, DOG_A) });
      });

      it('blocks a third card until the board is unlocked', () => {
        expect(game.flipCard(CAT_B)).to.deep.equal({ action: 'blocked' });
      });

      it('leaves the score unchanged', () => {
        expect(game).to.deep.include({ pairsFound: 0, matchedPairs: [] });
      });
    });

    describe('when the pick is not allowed', () => {
      it('blocks a second click on the card already face up and keeps it as the first pick', () => {
        game.flipCard(CAT_A);

        expect(game.flipCard(CAT_A)).to.deep.equal({ action: 'blocked' });
        expect(game.firstPick).to.deep.equal(pickAt(game, CAT_A));
      });

      [-1, 4].forEach(index => {
        it(`reports index ${index} as invalid because it is outside the deck`, () => {
          expect(game.flipCard(index)).to.deep.equal({ action: 'invalid' });
        });
      });
    });
  });

  describe('unlockAfterMismatch', () => {
    let game;

    beforeEach(() => {
      game = createGame();
      game.flipCard(CAT_A);
      game.flipCard(DOG_A);
    });

    it('reports that the board is unlocked', () => {
      expect(game.unlockAfterMismatch()).to.deep.equal({ action: 'unlocked' });
    });

    it('clears both picks and unlocks the board', () => {
      game.unlockAfterMismatch();

      expect(game).to.deep.include(FRESH_TURN);
    });

    it('lets the next card start a new turn', () => {
      game.unlockAfterMismatch();

      expect(game.flipCard(CAT_B).action).to.equal('first_flip');
    });
  });

  describe('restart', () => {
    it('reshuffles the same cards and returns them', () => {
      const random = sinon.stub(Math, 'random').returns(JUST_BELOW_ONE);
      const game = new MemoryGame(['squirrel', 'elk', 'jellyfish']);
      const previousDeck = [...game.initialize()];
      random.returns(0);

      const deck = game.restart();

      expect(deck).to.equal(game.cards);
      expect(deck).to.have.deep.members(previousDeck);
      expect(deck).to.not.deep.equal(previousDeck);
    });

    it('clears all progress from the previous game', () => {
      const game = createGame();
      game.flipCard(CAT_A);
      game.flipCard(CAT_B);
      game.flipCard(DOG_A);

      game.restart();

      expect(game).to.deep.include(FRESH_GAME);
    });
  });

  describe('a full game', () => {
    /* One trace through every state transition: first pick, mismatch, unlock, match and the winning match */
    it('moves through each turn state and is won once every pair is matched', () => {
      const game = createGame();

      const results = [
        game.flipCard(CAT_A),
        game.flipCard(DOG_A),
        game.unlockAfterMismatch(),
        game.flipCard(CAT_A),
        game.flipCard(CAT_B),
        game.flipCard(DOG_A),
        game.flipCard(DOG_B)
      ];

      expect(results.map(result => result.action)).to.deep.equal([
        'first_flip', 'no_match', 'unlocked', 'first_flip', 'match', 'first_flip', 'match'
      ]);
      expect(results.at(-1)).to.include({ pairsFound: 2, gameWon: true });
    });
  });
});
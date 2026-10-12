import { expect } from 'chai';
import sinon from 'sinon';
import { shuffleArray, checkMatch, isGameComplete } from '../../src/scripts.js';
import { JUST_BELOW_ONE } from './support/random.js';

describe('Game helpers', () => {
  afterEach(() => sinon.restore());

  describe('shuffleArray', () => {
    it('returns a new array holding the same elements', () => {
      const input = [1, 2, 3, 4, 5];

      const result = shuffleArray(input);

      expect(result).to.not.equal(input);
      expect(result).to.have.members(input);
    });

    it('leaves the original array untouched', () => {
      const input = [1, 2, 3, 4, 5];

      shuffleArray(input);

      expect(input).to.deep.equal([1, 2, 3, 4, 5]);
    });

    it('returns an empty array for empty input', () => {
      expect(shuffleArray([])).to.deep.equal([]);
    });

    it('returns a single element unchanged', () => {
      expect(shuffleArray(['only'])).to.deep.equal(['only']);
    });

    /* With Math.random pinned to 0 every step swaps with index 0, which gives one known permutation */
    it('swaps every position with the front when Math.random returns 0', () => {
      sinon.stub(Math, 'random').returns(0);

      expect(shuffleArray([1, 2, 3, 4])).to.deep.equal([2, 3, 4, 1]);
    });

    /* At the top of the random range each position swaps with itself, which catches off-by-one index maths */
    it('leaves every element in place when Math.random returns just below 1', () => {
      sinon.stub(Math, 'random').returns(JUST_BELOW_ONE);

      expect(shuffleArray([1, 2, 3, 4])).to.deep.equal([1, 2, 3, 4]);
    });
  });

  describe('checkMatch', () => {
    const cat = { animal: 'cat' };

    it('returns true for two cards showing the same animal', () => {
      expect(checkMatch(cat, { animal: 'cat' })).to.be.true;
    });

    it('returns false for two cards showing different animals', () => {
      expect(checkMatch(cat, { animal: 'dog' })).to.be.false;
    });

    [
      { scenario: 'the first card is null', first: null, second: cat },
      { scenario: 'the second card is null', first: cat, second: null },
      { scenario: 'both cards are null', first: null, second: null },
      { scenario: 'both cards are undefined', first: undefined, second: undefined }
    ].forEach(({ scenario, first, second }) => {
      it(`returns false when ${scenario}`, () => {
        expect(checkMatch(first, second)).to.be.false;
      });
    });
  });

  describe('isGameComplete', () => {
    /* Boundary values around a 6-pair game, plus the one-pair and empty-game edges */
    [
      { pairsFound: 5, totalPairs: 6, expected: false, scenario: 'one pair is still missing' },
      { pairsFound: 6, totalPairs: 6, expected: true, scenario: 'every pair is found' },
      { pairsFound: 7, totalPairs: 6, expected: false, scenario: 'the count overshoots the total' },
      { pairsFound: 0, totalPairs: 6, expected: false, scenario: 'no pairs are found yet' },
      { pairsFound: 1, totalPairs: 1, expected: true, scenario: 'a one-pair game is solved' },
      { pairsFound: 0, totalPairs: 0, expected: false, scenario: 'the game has no pairs at all' }
    ].forEach(({ pairsFound, totalPairs, expected, scenario }) => {
      it(`returns ${expected} when ${scenario} (${pairsFound} of ${totalPairs})`, () => {
        expect(isGameComplete(pairsFound, totalPairs)).to.equal(expected);
      });
    });
  });
});
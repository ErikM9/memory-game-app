import { expect } from 'chai';
import {
  shuffleArray,
  generateCardPairs,
  checkMatch,
  isGameComplete,
  createStarStyle,
  createParticleStyle,
  calculateFireworkPosition,
  generateFireworkStyle,
  MemoryGame
} from '../../src/scripts.js';

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).to.have.lengthOf(5);
  });

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result.sort()).to.deep.equal(input.sort());
  });

  it('does not modify original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffleArray(input);
    expect(input).to.deep.equal(original);
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).to.deep.equal([]);
  });

  it('handles single element', () => {
    expect(shuffleArray([1])).to.deep.equal([1]);
  });

  it('produces different orders over multiple runs', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(JSON.stringify(shuffleArray(input)));
    }
    expect(results.size).to.be.greaterThan(1);
  });
});

describe('generateCardPairs', () => {
  it('creates two cards per animal', () => {
    const animals = ['cat', 'dog'];
    const pairs = generateCardPairs(animals);
    expect(pairs).to.have.lengthOf(4);
  });

  it('assigns unique ids to each card', () => {
    const animals = ['cat', 'dog'];
    const pairs = generateCardPairs(animals);
    const ids = pairs.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).to.equal(4);
  });

  it('includes animal property on each card', () => {
    const animals = ['cat'];
    const pairs = generateCardPairs(animals);
    expect(pairs[0]).to.have.property('animal', 'cat');
    expect(pairs[1]).to.have.property('animal', 'cat');
  });

  it('handles empty array', () => {
    expect(generateCardPairs([])).to.deep.equal([]);
  });

  it('handles single animal', () => {
    const pairs = generateCardPairs(['squirrel']);
    expect(pairs).to.have.lengthOf(2);
    expect(pairs[0].animal).to.equal('squirrel');
  });
});

describe('checkMatch', () => {
  it('returns true for matching animals', () => {
    const card1 = { animal: 'cat', id: 'cat-1' };
    const card2 = { animal: 'cat', id: 'cat-2' };
    expect(checkMatch(card1, card2)).to.be.true;
  });

  it('returns false for different animals', () => {
    const card1 = { animal: 'cat', id: 'cat-1' };
    const card2 = { animal: 'dog', id: 'dog-1' };
    expect(checkMatch(card1, card2)).to.be.false;
  });

  it('returns false if first card is null', () => {
    expect(checkMatch(null, { animal: 'cat' })).to.be.false;
  });

  it('returns false if second card is null', () => {
    expect(checkMatch({ animal: 'cat' }, null)).to.be.false;
  });

  it('returns false if both cards are null', () => {
    expect(checkMatch(null, null)).to.be.false;
  });

  it('returns false if cards are undefined', () => {
    expect(checkMatch(undefined, undefined)).to.be.false;
  });
});

describe('isGameComplete', () => {
  it('returns true when all pairs found', () => {
    expect(isGameComplete(6, 6)).to.be.true;
  });

  it('returns false when pairs remaining', () => {
    expect(isGameComplete(3, 6)).to.be.false;
  });

  it('returns false when zero pairs found', () => {
    expect(isGameComplete(0, 6)).to.be.false;
  });

  it('returns false when total pairs is zero', () => {
    expect(isGameComplete(0, 0)).to.be.false;
  });

  it('returns true for single pair game', () => {
    expect(isGameComplete(1, 1)).to.be.true;
  });
});


describe('createStarStyle', () => {
  it('returns object with required properties', () => {
    const style = createStarStyle();
    expect(style).to.have.property('left');
    expect(style).to.have.property('top');
    expect(style).to.have.property('width');
    expect(style).to.have.property('height');
    expect(style).to.have.property('animationDuration');
    expect(style).to.have.property('animationDelay');
    expect(style).to.have.property('opacity');
  });

  it('returns percentage strings for position', () => {
    const style = createStarStyle();
    expect(style.left).to.match(/%$/);
    expect(style.top).to.match(/%$/);
  });

  it('returns pixel strings for dimensions', () => {
    const style = createStarStyle();
    expect(style.width).to.match(/px$/);
    expect(style.height).to.match(/px$/);
  });

  it('returns valid opacity between 0.3 and 1', () => {
    for (let i = 0; i < 20; i++) {
      const style = createStarStyle();
      expect(style.opacity).to.be.at.least(0.3);
      expect(style.opacity).to.be.at.most(1);
    }
  });
});

describe('createParticleStyle', () => {
  it('returns object with required properties', () => {
    const style = createParticleStyle();
    expect(style).to.have.property('left');
    expect(style).to.have.property('top');
    expect(style).to.have.property('animationDelay');
    expect(style).to.have.property('animationDuration');
  });

  it('returns percentage strings for position', () => {
    const style = createParticleStyle();
    expect(style.left).to.match(/%$/);
    expect(style.top).to.match(/%$/);
  });
});

describe('calculateFireworkPosition', () => {
  it('returns object with position properties', () => {
    const pos = calculateFireworkPosition(100, 200, 50);
    expect(pos).to.have.property('x');
    expect(pos).to.have.property('y');
    expect(pos).to.have.property('left', 100);
    expect(pos).to.have.property('top', 200);
  });

  it('x and y stay within maxSpread', () => {
    for (let i = 0; i < 20; i++) {
      const pos = calculateFireworkPosition(100, 100, 50);
      const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2);
      expect(distance).to.be.at.most(50);
    }
  });
});

describe('generateFireworkStyle', () => {
  it('returns object with required properties', () => {
    const style = generateFireworkStyle();
    expect(style).to.have.property('hue');
    expect(style).to.have.property('speed');
    expect(style).to.have.property('delay');
    expect(style).to.have.property('background');
  });

  it('hue is between 0 and 360', () => {
    for (let i = 0; i < 20; i++) {
      const style = generateFireworkStyle();
      expect(style.hue).to.be.at.least(0);
      expect(style.hue).to.be.below(360);
    }
  });

  it('speed is between 1.0 and 1.8', () => {
    for (let i = 0; i < 20; i++) {
      const style = generateFireworkStyle();
      expect(style.speed).to.be.at.least(1.0);
      expect(style.speed).to.be.at.most(1.8);
    }
  });

  it('background contains radial-gradient', () => {
    const style = generateFireworkStyle();
    expect(style.background).to.include('radial-gradient');
  });
});

describe('MemoryGame', () => {
  let game;
  const animals = ['squirrel', 'elk', 'jellyfish'];

  beforeEach(() => {
    game = new MemoryGame(animals);
  });

  describe('constructor', () => {
    it('initializes with correct number of pairs', () => {
      expect(game.totalPairs).to.equal(3);
    });

    it('starts with zero pairs found', () => {
      expect(game.pairsFound).to.equal(0);
    });

    it('starts unlocked', () => {
      expect(game.boardLocked).to.be.false;
    });

    it('starts on first turn', () => {
      expect(game.isFirstTurn).to.be.true;
    });

    it('starts with empty matched pairs', () => {
      expect(game.matchedPairs).to.be.an('array').that.is.empty;
    });
  });

  describe('initialize', () => {
    it('creates correct number of cards', () => {
      const cards = game.initialize();
      expect(cards).to.have.lengthOf(6);
    });

    it('creates pairs for each animal', () => {
      const cards = game.initialize();
      const animalCounts = {};
      cards.forEach(card => {
        animalCounts[card.animal] = (animalCounts[card.animal] || 0) + 1;
      });
      expect(animalCounts.squirrel).to.equal(2);
      expect(animalCounts.elk).to.equal(2);
      expect(animalCounts.jellyfish).to.equal(2);
    });

    it('resets game state', () => {
      game.pairsFound = 2;
      game.boardLocked = true;
      game.initialize();
      expect(game.pairsFound).to.equal(0);
      expect(game.boardLocked).to.be.false;
    });
  });

  describe('canFlipCard', () => {
    beforeEach(() => {
      game.initialize();
    });

    it('returns true for valid card', () => {
      expect(game.canFlipCard(0)).to.be.true;
    });

    it('returns false when board is locked', () => {
      game.boardLocked = true;
      expect(game.canFlipCard(0)).to.be.false;
    });

    it('returns false for already flipped first card', () => {
      game.flipCard(0);
      expect(game.canFlipCard(0)).to.be.false;
    });

    it('returns false for already matched card', () => {
      game.matchedPairs.push(game.cards[0].animal);
      expect(game.canFlipCard(0)).to.be.false;
    });

    it('returns false for a card whose animal was matched via flipCard', () => {
      const animal = game.cards[0].animal;
      const secondIdx = game.cards.findIndex((c, i) => i !== 0 && c.animal === animal);
      game.flipCard(0);
      game.flipCard(secondIdx);
      expect(game.canFlipCard(0)).to.be.false;
      expect(game.canFlipCard(secondIdx)).to.be.false;
    });
  });

  describe('flipCard', () => {
    beforeEach(() => {
      game.initialize();
    });

    it('returns first_flip on first card', () => {
      const result = game.flipCard(0);
      expect(result.action).to.equal('first_flip');
    });

    it('sets firstPick after first flip', () => {
      game.flipCard(0);
      expect(game.firstPick).to.not.be.null;
    });

    it('returns blocked for locked board', () => {
      game.boardLocked = true;
      const result = game.flipCard(0);
      expect(result.action).to.equal('blocked');
    });

    it('returns blocked for same card clicked twice', () => {
      game.flipCard(0);
      const result = game.flipCard(0);
      expect(result.action).to.equal('blocked');
    });

    it('returns invalid for out of bounds index', () => {
      const result = game.flipCard(999);
      expect(result.action).to.equal('invalid');
    });
  });

  describe('matching logic', () => {
    beforeEach(() => {
      game.cards = [
        { animal: 'cat', id: 'cat-1' },
        { animal: 'cat', id: 'cat-2' },
        { animal: 'dog', id: 'dog-1' },
        { animal: 'dog', id: 'dog-2' }
      ];
      game.totalPairs = 2;
      game.reset();
    });

    it('returns match when cards match', () => {
      game.flipCard(0);
      const result = game.flipCard(1);
      expect(result.action).to.equal('match');
    });

    it('increments pairsFound on match', () => {
      game.flipCard(0);
      game.flipCard(1);
      expect(game.pairsFound).to.equal(1);
    });

    it('adds animal to matchedPairs on match', () => {
      game.flipCard(0);
      game.flipCard(1);
      expect(game.matchedPairs).to.include('cat');
    });

    it('returns no_match when cards differ', () => {
      game.flipCard(0);
      const result = game.flipCard(2);
      expect(result.action).to.equal('no_match');
    });

    it('locks board on no match', () => {
      game.flipCard(0);
      game.flipCard(2);
      expect(game.boardLocked).to.be.true;
    });

    it('detects game won', () => {
      game.flipCard(0);
      game.flipCard(1);
      game.flipCard(2);
      const result = game.flipCard(3);
      expect(result.gameWon).to.be.true;
    });
  });

  describe('unlockAfterMismatch', () => {
    beforeEach(() => {
      game.initialize();
      game.flipCard(0);
      game.flipCard(2);
    });

    it('unlocks the board', () => {
      game.unlockAfterMismatch();
      expect(game.boardLocked).to.be.false;
    });

    it('resets picks', () => {
      game.unlockAfterMismatch();
      expect(game.firstPick).to.be.null;
      expect(game.secondPick).to.be.null;
    });

    it('returns unlocked action', () => {
      const result = game.unlockAfterMismatch();
      expect(result.action).to.equal('unlocked');
    });
  });

  describe('restart', () => {
    it('resets pairs found', () => {
      game.initialize();
      game.pairsFound = 3;
      game.restart();
      expect(game.pairsFound).to.equal(0);
    });

    it('clears matched pairs', () => {
      game.initialize();
      game.matchedPairs = ['cat', 'dog'];
      game.restart();
      expect(game.matchedPairs).to.be.empty;
    });

    it('unlocks board', () => {
      game.initialize();
      game.boardLocked = true;
      game.restart();
      expect(game.boardLocked).to.be.false;
    });

    it('returns shuffled cards', () => {
      game.initialize();
      const cards1 = JSON.stringify(game.cards);
      let different = false;
      for (let i = 0; i < 10; i++) {
        game.restart();
        if (JSON.stringify(game.cards) !== cards1) {
          different = true;
          break;
        }
      }
      expect(different).to.be.true;
    });
  });

  describe('full game simulation', () => {
    it('can complete a game by matching all pairs', () => {
      game.cards = [
        { animal: 'a', id: 'a-1' },
        { animal: 'a', id: 'a-2' },
        { animal: 'b', id: 'b-1' },
        { animal: 'b', id: 'b-2' },
        { animal: 'c', id: 'c-1' },
        { animal: 'c', id: 'c-2' }
      ];
      game.totalPairs = 3;
      game.reset();

      game.flipCard(0);
      game.flipCard(1);
      expect(game.pairsFound).to.equal(1);

      game.flipCard(2);
      game.flipCard(3);
      expect(game.pairsFound).to.equal(2);

      game.flipCard(4);
      const finalResult = game.flipCard(5);
      expect(game.pairsFound).to.equal(3);
      expect(finalResult.gameWon).to.be.true;
    });

    it('handles mismatches correctly in sequence', () => {
      game.cards = [
        { animal: 'a', id: 'a-1' },
        { animal: 'b', id: 'b-1' },
        { animal: 'a', id: 'a-2' },
        { animal: 'b', id: 'b-2' }
      ];
      game.totalPairs = 2;
      game.reset();

      game.flipCard(0);
      const mismatch = game.flipCard(1);
      expect(mismatch.action).to.equal('no_match');
      expect(game.boardLocked).to.be.true;

      game.unlockAfterMismatch();
      expect(game.boardLocked).to.be.false;

      game.flipCard(0);
      const match = game.flipCard(2);
      expect(match.action).to.equal('match');
    });
  });
});
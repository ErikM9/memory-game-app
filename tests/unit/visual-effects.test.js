import { expect } from 'chai';
import sinon from 'sinon';
import {
  createStarStyle,
  createParticleStyle,
  calculateFireworkPosition,
  generateFireworkStyle
} from '../../src/scripts.js';
import { JUST_BELOW_ONE } from './support/random.js';

/* Every generator draws from Math.random, so pinning it to either end of its range tests each boundary exactly */
describe('Visual effect generators', () => {
  afterEach(() => sinon.restore());

  describe('createStarStyle', () => {
    it('uses the bottom of every range when Math.random returns 0', () => {
      sinon.stub(Math, 'random').returns(0);

      expect(createStarStyle()).to.deep.equal({
        left: '0%',
        top: '0%',
        width: '0.5px',
        height: '0.5px',
        animationDuration: '2s',
        animationDelay: '0s',
        opacity: 0.3
      });
    });

    it('stays inside every range when Math.random returns just below 1', () => {
      sinon.stub(Math, 'random').returns(JUST_BELOW_ONE);

      const style = createStarStyle();

      expect(parseFloat(style.left)).to.be.below(100);
      expect(parseFloat(style.top)).to.be.below(100);
      expect(parseFloat(style.width)).to.be.below(2.5);
      expect(parseFloat(style.animationDuration)).to.be.below(5);
      expect(parseFloat(style.animationDelay)).to.be.below(5);
      expect(style.opacity).to.be.below(1);
    });

    /* Real randomness is used here because a pinned value would hide a second random draw for the height */
    it('draws square stars', () => {
      const style = createStarStyle();

      expect(style.height).to.equal(style.width);
    });
  });

  describe('createParticleStyle', () => {
    it('uses the bottom of every range when Math.random returns 0', () => {
      sinon.stub(Math, 'random').returns(0);

      expect(createParticleStyle()).to.deep.equal({
        left: '0%',
        top: '-20%',
        animationDelay: '0s',
        animationDuration: '2s'
      });
    });

    it('stays inside every range when Math.random returns just below 1', () => {
      sinon.stub(Math, 'random').returns(JUST_BELOW_ONE);

      const style = createParticleStyle();

      expect(parseFloat(style.left)).to.be.below(100);
      expect(parseFloat(style.top)).to.be.below(80);
      expect(parseFloat(style.animationDelay)).to.be.below(1.5);
      expect(parseFloat(style.animationDuration)).to.be.below(4);
    });
  });

  describe('calculateFireworkPosition', () => {
    it('keeps the burst anchored at the given centre point', () => {
      const position = calculateFireworkPosition(100, 200, 50);

      expect(position).to.include({ left: 100, top: 200 });
    });

    it('travels 60% of maxSpread to the right when Math.random returns 0', () => {
      sinon.stub(Math, 'random').returns(0);

      const { x, y } = calculateFireworkPosition(100, 200, 50);

      expect(x).to.equal(30);
      expect(y).to.equal(0);
    });

    it('travels just under the full maxSpread when Math.random returns just below 1', () => {
      sinon.stub(Math, 'random').returns(JUST_BELOW_ONE);

      const { x, y } = calculateFireworkPosition(100, 200, 50);

      expect(Math.hypot(x, y)).to.be.closeTo(50, 1e-9).and.at.most(50);
    });

    /* A quarter turn points straight down because the y axis grows downwards on screen */
    it('aims the burst along the random angle', () => {
      sinon.stub(Math, 'random').returns(0.25);

      const { x, y } = calculateFireworkPosition(100, 200, 50);

      expect(x).to.be.closeTo(0, 1e-9);
      expect(y).to.be.closeTo(35, 1e-9);
    });
  });

  describe('generateFireworkStyle', () => {
    it('uses the bottom of every range when Math.random returns 0', () => {
      sinon.stub(Math, 'random').returns(0);

      expect(generateFireworkStyle()).to.deep.equal({
        hue: 0,
        speed: 1,
        delay: 0,
        background: 'radial-gradient(circle, hsl(0, 100%, 80%), hsl(0, 100%, 40%))'
      });
    });

    it('stays inside every range when Math.random returns just below 1', () => {
      sinon.stub(Math, 'random').returns(JUST_BELOW_ONE);

      const style = generateFireworkStyle();

      expect(style.hue).to.equal(359);
      expect(style.speed).to.be.below(1.8);
      expect(style.delay).to.be.below(400);
    });

    it('builds the gradient from the same hue it returns', () => {
      sinon.stub(Math, 'random').returns(0.5);

      const style = generateFireworkStyle();

      expect(style.background).to.equal(
        `radial-gradient(circle, hsl(${style.hue}, 100%, 80%), hsl(${style.hue}, 100%, 40%))`
      );
    });
  });
});
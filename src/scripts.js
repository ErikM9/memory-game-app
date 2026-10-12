/* Fisher-Yates shuffle that returns a new array and leaves the original untouched */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function checkMatch(card1, card2) {
  if (!card1 || !card2) return false;
  return card1.animal === card2.animal;
}

/* totalPairs > 0 guard stops a game with no pairs from reading as won */
export function isGameComplete(pairsFound, totalPairs) {
  return pairsFound === totalPairs && totalPairs > 0;
}

/* Each star gets a randomised position, size and twinkle timing */
export function createStarStyle() {
  const size = Math.random() * 2 + 0.5;
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${Math.random() * 3 + 2}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.7 + 0.3
  };
}

/* Returns the burst's starting point (left/top) and the --dx/--dy offsets the explode animation moves it by */
export function calculateFireworkPosition(centerX, centerY, maxSpread) {
  const angle = Math.random() * Math.PI * 2;
  const distance = maxSpread * (0.6 + Math.random() * 0.4);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    left: centerX,
    top: centerY
  };
}

export function generateFireworkStyle() {
  const hue = Math.floor(Math.random() * 360);
  const speed = 1.0 + Math.random() * 0.8;
  const delay = Math.random() * 400;
  return {
    hue,
    speed,
    delay,
    background: `radial-gradient(circle, hsl(${hue}, 100%, 80%), hsl(${hue}, 100%, 40%))`
  };
}

export class MemoryGame {
  constructor(cards = []) {
    this.cards = cards;
    this.totalPairs = cards.length / 2;
    this.reset();
  }

  reset() {
    this.firstPick = null;
    this.secondPick = null;
    this.isFirstTurn = true;
    this.boardLocked = false;
    this.pairsFound = 0;
    this.matchedPairs = [];
  }

  canFlipCard(cardIndex) {
    if (!this.cards[cardIndex]) return false;
    if (this.boardLocked) return false;
    /* Prevent double-clicking the same card */
    if (this.firstPick && this.firstPick.index === cardIndex) return false;
    if (this.matchedPairs.includes(this.cards[cardIndex].animal)) return false;
    return true;
  }

  flipCard(cardIndex) {
    const card = this.cards[cardIndex];
    if (!card) return { action: 'invalid' };

    if (!this.canFlipCard(cardIndex)) return { action: 'blocked' };

    if (this.isFirstTurn) {
      this.isFirstTurn = false;
      this.firstPick = { ...card, index: cardIndex };
      return { action: 'first_flip', card: this.firstPick };
    }

    this.secondPick = { ...card, index: cardIndex };
    return this.evaluateMatch();
  }

  evaluateMatch() {
    if (!checkMatch(this.firstPick, this.secondPick)) {
      this.boardLocked = true;
      return { action: 'no_match', card1: this.firstPick, card2: this.secondPick };
    }

    this.pairsFound++;
    this.matchedPairs.push(this.firstPick.animal);
    const gameWon = isGameComplete(this.pairsFound, this.totalPairs);
    const result = { action: 'match', card1: this.firstPick, card2: this.secondPick, pairsFound: this.pairsFound, gameWon };
    this.resetTurn();
    return result;
  }

  resetTurn() {
    this.isFirstTurn = true;
    this.boardLocked = false;
    this.firstPick = null;
    this.secondPick = null;
  }

  /* Called by the UI when it turns a mismatched pair face down again */
  unlockAfterMismatch() {
    this.resetTurn();
    return { action: 'unlocked' };
  }
}

/* --- Browser UI --- */
/* c8 ignore start */
if (typeof document !== 'undefined' && document.querySelector('.memory-card')) {
  const board = document.getElementById('game-board');
  const cardElements = Array.from(document.querySelectorAll('.memory-card'));

  /* The deck is built in DOM order so that game.cards[i] always matches cardElements[i] */
  const game = new MemoryGame(cardElements.map(el => ({ animal: el.dataset.animal })));

  const winMessage = document.createElement('div');
  winMessage.id = 'win-notification';
  winMessage.textContent = 'Congrats! You matched all the cards!';
  document.body.appendChild(winMessage);

  /* Face-down cards share one neutral label so screen readers cannot announce the animal before it is revealed */
  const HIDDEN_CARD_LABEL = 'Face-down card';

  function setCardFaceUp(el, faceUp) {
    el.classList.toggle('flip', faceUp);
    el.setAttribute('aria-label', faceUp ? `${el.querySelector('.card-front').alt} card` : HIDDEN_CARD_LABEL);
  }

  /* Re-appending the shuffled cards moves them in the DOM, so tab order and screen readers follow the visual layout */
  function shuffleBoard() {
    board.append(...shuffleArray(cardElements));
  }

  function onCardClick() {
    const gameIndex = cardElements.indexOf(this);
    const result = game.flipCard(gameIndex);

    if (result.action === 'blocked') return;

    setCardFaceUp(this, true);

    if (result.action === 'match') {
      this.removeEventListener('click', onCardClick);
      cardElements[result.card1.index].removeEventListener('click', onCardClick);
      if (result.gameWon) showVictoryScreen();
    }

    if (result.action === 'no_match') {
      setTimeout(() => {
        cardElements.forEach((el, i) => {
          if (!game.matchedPairs.includes(game.cards[i].animal)) {
            setCardFaceUp(el, false);
          }
        });
        game.unlockAfterMismatch();
      }, 1200);
    }
  }

  /* Enter and Space click the card, so matched cards ignore them once their click listener is gone */
  function onCardKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.click();
  }

  function showVictoryScreen() {
    winMessage.style.display = 'block';
    requestAnimationFrame(() => winMessage.classList.add('running'));

    if (window.innerWidth >= 769) triggerFireworks();

    /* Listen for the ::before pseudo-element animation to end (the border sweep) */
    winMessage.addEventListener('animationend', function onDone(e) {
      if (e.pseudoElement !== '::before') return;
      winMessage.removeEventListener('animationend', onDone);
      winMessage.classList.remove('running');
      winMessage.style.display = 'none';
      restartGame();
    });
  }

  function restartGame() {
    game.reset();
    cardElements.forEach(el => {
      setCardFaceUp(el, false);
      el.addEventListener('click', onCardClick);
    });
    shuffleBoard();
  }

  function triggerFireworks() {
    const bursts = Array.from(document.querySelectorAll('.firework-burst'));
    const half = Math.floor(bursts.length / 2);
    const leftGroup  = bursts.slice(0, half);
    const rightGroup = bursts.slice(half);
    const centerY = window.innerHeight / 2;
    const maxSpread = Math.min(window.innerWidth / 4, centerY) * 0.8;

    /* Three volleys fire at t=0ms, t=950ms and t=1900ms */
    const volleys = [0, 950, 1900];

    function resetBurst(burst) {
      burst.style.animation = '';
      burst.style.opacity = '0';
      burst.style.transform = 'scale(0)';
    }

    function shootGroup(group, centerX, fadeOut) {
      group.forEach(burst => {
        const pos = calculateFireworkPosition(centerX, centerY, maxSpread);
        const style = generateFireworkStyle();
        burst.style.left = `${pos.left}px`;
        burst.style.top = `${pos.top}px`;
        burst.style.setProperty('--dx', `${pos.x}px`);
        burst.style.setProperty('--dy', `${pos.y}px`);
        burst.style.background = style.background;
        burst.style.opacity = '1';
        burst.style.animation = `explode ${style.speed}s ease-out forwards`;
        burst.style.animationDelay = `${style.delay}ms`;

        if (fadeOut) {
          /* The last volley fades out smoothly */
          const clearAt = style.delay + style.speed * 1000 * 0.85;
          setTimeout(() => {
            burst.style.transition = 'opacity 0.35s ease-out';
            burst.style.opacity = '0';
            setTimeout(() => {
              resetBurst(burst);
              burst.style.transition = '';
            }, 350);
          }, clearAt);
        } else {
          setTimeout(() => resetBurst(burst), style.delay + style.speed * 1000 + 100);
        }
      });
    }

    volleys.forEach((delay, i) => {
      const isLast = i === volleys.length - 1;
      setTimeout(() => {
        shootGroup(leftGroup,  window.innerWidth * 0.25, isLast);
        shootGroup(rightGroup, window.innerWidth * 0.75, isLast);
      }, delay);
    });
  }

  function addBackgroundStars(count) {
    const container = document.getElementById('bg-container');
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      Object.assign(star.style, createStarStyle());
      container.appendChild(star);
    }
  }

  shuffleBoard();
  cardElements.forEach(el => {
    el.addEventListener('click', onCardClick);
    el.addEventListener('keydown', onCardKeydown);
  });
  addBackgroundStars(300);
}
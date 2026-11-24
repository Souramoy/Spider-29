import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARD_POINTS,
  createDeck,
  createInitialRoomState,
  startRound,
  placeBid,
  passBid,
  selectTrump,
  getLegalCards,
  canRevealTrump,
  revealTrump,
  playCard,
  advanceAfterTrickPause,
  resolveTrickWinner,
  declareMarriage,
  doubleStake,
  applyRoundNetScore,
  getSixCardPipState,
  getEffectiveBid,
  getClientGameView,
  canCallSingleHand,
  callSingleHand,
  type TwentyNineState,
  type SeatIndex,
} from './twentyNine';

function createFullFourPlayerRoom(): TwentyNineState {
  let state = createInitialRoomState('SPIDER', { playerId: 'p0', name: 'Peter' });
  state.seats[1] = { seat: 1, playerId: 'p1', name: 'Miles', isBot: false, connected: true, ready: true };
  state.seats[2] = { seat: 2, playerId: 'p2', name: 'Gwen', isBot: false, connected: true, ready: true };
  state.seats[3] = { seat: 3, playerId: 'p3', name: 'Miguel', isBot: false, connected: true, ready: true };
  return state;
}

test('29 deck has 32 cards totaling 28 card points (+1 last trick = 29)', () => {
  const deck = createDeck();
  assert.equal(deck.length, 32);
  const uniqueIds = new Set(deck.map((c) => c.id));
  assert.equal(uniqueIds.size, 32);
  const totalPoints = deck.reduce((sum, c) => sum + CARD_POINTS[c.rank], 0);
  assert.equal(totalPoints, 28);
});

test('6 of Hearts and 6 of Spades tug-of-war pip scoring closes hearts and flips card order', () => {
  // Initial 0 -> both cards closed
  let score = 0;
  let pips = getSixCardPipState(score);
  assert.equal(pips.redHeartsRevealed, 0);
  assert.equal(pips.blackSpadesRevealed, 0);

  // Red team scores 2 points -> 2 red hearts revealed, 6H first
  score = applyRoundNetScore(score, 0, 2);
  assert.equal(score, 2);
  pips = getSixCardPipState(score);
  assert.equal(pips.leadingTeam, 0);
  assert.equal(pips.redHeartsRevealed, 2);
  assert.equal(pips.blackSpadesRevealed, 0);
  assert.deepEqual(pips.cardOrder, ['H', 'S']);

  // Black team scores 3 points -> 2 red hearts close, card order flips, 1 black spade revealed
  score = applyRoundNetScore(score, 1, 3);
  assert.equal(score, -1);
  pips = getSixCardPipState(score);
  assert.equal(pips.leadingTeam, 1);
  assert.equal(pips.redHeartsRevealed, 0);
  assert.equal(pips.blackSpadesRevealed, 1);
  assert.deepEqual(pips.cardOrder, ['S', 'H']);

  // Clamps at +/- 6
  score = applyRoundNetScore(score, 1, 6);
  assert.equal(score, -6);
  assert.equal(getSixCardPipState(score).blackSpadesRevealed, 6);
});

test('bidding phase handles passes, winning bid, and 4-pass redeal', () => {
  let state = startRound(createFullFourPlayerRoom(), { rng: () => 0.42 });
  assert.equal(state.phase, 'bidding');
  assert.equal(state.bidTurnSeat, 1);

  state = passBid(state, 1, () => 0.11);
  state = passBid(state, 2, () => 0.11);
  state = passBid(state, 3, () => 0.11);
  state = passBid(state, 0, () => 0.11);
  assert.equal(state.phase, 'bidding');
  assert.equal(state.roundNumber, 1);
  assert.equal(state.dealerSeat, 1);
  assert.equal(state.bidTurnSeat, 2);

  state = placeBid(state, 2, 16);
  state = placeBid(state, 3, 18);
  assert.throws(() => placeBid(state, 0, 17));
  state = passBid(state, 0);
  state = passBid(state, 1);
  state = passBid(state, 2);
  assert.equal(state.phase, 'trump_select');
  assert.equal(state.highestBidderSeat, 3);
  assert.equal(state.highestBid, 18);
});

test('trump selection deals remaining 4 cards and hides trump from opponents', () => {
  let state = startRound(createFullFourPlayerRoom(), { rng: () => 0.25 });
  state = placeBid(state, 1, 17);
  state = passBid(state, 2);
  state = passBid(state, 3);
  state = passBid(state, 0);
  assert.equal(state.phase, 'trump_select');

  state = selectTrump(state, 1, 'H');
  assert.equal(state.phase, 'playing');
  assert.equal(state.hands[0].length, 8);
  assert.equal(state.hands[1].length, 8);
  assert.equal(state.hands[2].length, 8);
  assert.equal(state.hands[3].length, 8);
  assert.equal(state.trumpRevealed, false);

  assert.equal(getClientGameView(state, 'p1').trumpSuit, 'H');
  assert.equal(getClientGameView(state, 'p0').trumpSuit, null);
  assert.equal(getClientGameView(state, 'p2').trumpSuit, null);
});

test('trick winner respects unrevealed vs revealed trump and follow-suit rules', () => {
  const unrevealedWinner = resolveTrickWinner(
    [
      { seat: 0, card: { id: 'A-S', suit: 'S', rank: 'A' } },
      { seat: 1, card: { id: 'J-H', suit: 'H', rank: 'J' } },
      { seat: 2, card: { id: '9-S', suit: 'S', rank: '9' } },
      { seat: 3, card: { id: '7-S', suit: 'S', rank: '7' } },
    ],
    'H',
    false
  );
  assert.equal(unrevealedWinner, 2);

  const revealedWinner = resolveTrickWinner(
    [
      { seat: 0, card: { id: 'A-S', suit: 'S', rank: 'A' } },
      { seat: 1, card: { id: '7-H', suit: 'H', rank: '7' } },
      { seat: 2, card: { id: '9-S', suit: 'S', rank: '9' } },
      { seat: 3, card: { id: 'J-S', suit: 'S', rank: 'J' } },
    ],
    'H',
    true
  );
  assert.equal(revealedWinner, 1);
});

test('full 8-trick round supports double stake, trump reveal, royal marriage, and updates netScore', () => {
  let state = createFullFourPlayerRoom();
  state.phase = 'playing';
  state.roundNumber = 1;
  state.dealerSeat = 0;
  state.highestBid = 17;
  state.highestBidderSeat = 1; // Team 1 (Black)
  state.trumpSuit = 'H';
  state.trumpRevealed = false;
  state.leadSeat = 1;
  state.turnSeat = 1;

  state.hands = [
    [
      { id: '7-S', suit: 'S', rank: '7' },
      { id: '8-S', suit: 'S', rank: '8' },
      { id: 'Q-S', suit: 'S', rank: 'Q' },
      { id: 'K-S', suit: 'S', rank: 'K' },
      { id: '7-D', suit: 'D', rank: '7' },
      { id: '8-D', suit: 'D', rank: '8' },
      { id: 'Q-D', suit: 'D', rank: 'Q' },
      { id: 'K-D', suit: 'D', rank: 'K' },
    ],
    [
      { id: 'J-S', suit: 'S', rank: 'J' },
      { id: '9-S', suit: 'S', rank: '9' },
      { id: 'A-S', suit: 'S', rank: 'A' },
      { id: '10-S', suit: 'S', rank: '10' },
      { id: 'J-H', suit: 'H', rank: 'J' },
      { id: '9-H', suit: 'H', rank: '9' },
      { id: 'K-H', suit: 'H', rank: 'K' },
      { id: 'Q-H', suit: 'H', rank: 'Q' },
    ],
    [
      { id: '7-C', suit: 'C', rank: '7' },
      { id: '8-C', suit: 'C', rank: '8' },
      { id: 'Q-C', suit: 'C', rank: 'Q' },
      { id: 'K-C', suit: 'C', rank: 'K' },
      { id: 'A-D', suit: 'D', rank: 'A' },
      { id: '10-D', suit: 'D', rank: '10' },
      { id: '9-D', suit: 'D', rank: '9' },
      { id: 'J-D', suit: 'D', rank: 'J' },
    ],
    [
      { id: 'A-H', suit: 'H', rank: 'A' },
      { id: '10-H', suit: 'H', rank: '10' },
      { id: '8-H', suit: 'H', rank: '8' },
      { id: '7-H', suit: 'H', rank: '7' },
      { id: 'J-C', suit: 'C', rank: 'J' },
      { id: '9-C', suit: 'C', rank: '9' },
      { id: 'A-C', suit: 'C', rank: 'A' },
      { id: '10-C', suit: 'C', rank: '10' },
    ],
  ];

  // Red defender (Seat 0) doubles stake to 2 pts during Trick 1
  state = doubleStake(state, 0);
  assert.equal(state.roundStake, 2);

  state = playCard(state, 1, 'J-S');
  assert.equal(canRevealTrump(state, 2), true);
  state = revealTrump(state, 2);
  assert.equal(state.trumpRevealed, true);

  state = playCard(state, 2, '7-C');
  state = playCard(state, 3, '7-H');
  const seat0Legal = getLegalCards(state, 0);
  assert.equal(seat0Legal.every((c) => c.suit === 'S'), true);
  state = playCard(state, 0, '7-S');

  assert.equal(state.phase, 'trick_pause');
  assert.equal(state.lastTrick?.winnerSeat, 3);
  state = advanceAfterTrickPause(state);
  assert.equal(state.phase, 'playing');

  let marriageDeclared = false;
  while (state.phase === 'playing') {
    const turn = state.turnSeat as SeatIndex;
    if (!marriageDeclared && turn === 1) {
      state = declareMarriage(state, 1);
      marriageDeclared = true;
      assert.equal(getEffectiveBid(state), 16);
    }
    const legal = getLegalCards(state, turn);
    state = playCard(state, turn, legal[0].id);
    if (state.phase === 'trick_pause') {
      state = advanceAfterTrickPause(state);
    }
  }

  assert.equal(state.phase, 'round_over');
  assert.equal(state.roundPoints[0] + state.roundPoints[1], 29);
  assert.ok(state.lastRoundSummary);
  assert.equal(Math.abs(state.netScore), 2);
});

test('single hand can be called in bidding, skips partner, and fails immediately if opponent wins a trick', () => {
  let state = startRound(createFullFourPlayerRoom(), { rng: () => 0.33 });
  assert.equal(state.phase, 'bidding');
  assert.equal(state.bidTurnSeat, 1);
  assert.equal(canCallSingleHand(state, 1), true);
  assert.equal(canCallSingleHand(state, 0), false);

  state = callSingleHand(state, 1);
  assert.equal(state.phase, 'playing');
  assert.equal(state.isSingleHand, true);
  assert.equal(state.roundStake, 3);
  assert.equal(state.trumpSuit, null);
  assert.equal(state.singleHandCallerSeat, 1);
  assert.equal(state.singleHandPartnerSeat, 3);
  assert.equal(state.hands[1].length, 8);
  assert.equal(state.hands[3].length, 0);
  assert.equal(state.hands[0].length, 8);
  assert.equal(state.hands[2].length, 8);
  assert.equal(state.turnSeat, 1);

  // Override hands so Seat 1 (Black) plays a weak 7 and Seat 2 (Red) beats it on Trick 1
  state.hands = [
    [
      { id: '8-S', suit: 'S', rank: '8' },
      { id: 'Q-S', suit: 'S', rank: 'Q' },
      { id: 'K-S', suit: 'S', rank: 'K' },
      { id: '10-S', suit: 'S', rank: '10' },
      { id: '7-H', suit: 'H', rank: '7' },
      { id: '8-H', suit: 'H', rank: '8' },
      { id: 'Q-H', suit: 'H', rank: 'Q' },
      { id: 'K-H', suit: 'H', rank: 'K' },
    ],
    [
      { id: '7-S', suit: 'S', rank: '7' },
      { id: '7-D', suit: 'D', rank: '7' },
      { id: '8-D', suit: 'D', rank: '8' },
      { id: 'Q-D', suit: 'D', rank: 'Q' },
      { id: 'K-D', suit: 'D', rank: 'K' },
      { id: '7-C', suit: 'C', rank: '7' },
      { id: '8-C', suit: 'C', rank: '8' },
      { id: 'Q-C', suit: 'C', rank: 'Q' },
    ],
    [
      { id: 'J-S', suit: 'S', rank: 'J' },
      { id: '9-S', suit: 'S', rank: '9' },
      { id: 'A-S', suit: 'S', rank: 'A' },
      { id: '9-H', suit: 'H', rank: '9' },
      { id: 'A-H', suit: 'H', rank: 'A' },
      { id: '10-H', suit: 'H', rank: '10' },
      { id: 'J-H', suit: 'H', rank: 'J' },
      { id: 'K-C', suit: 'C', rank: 'K' },
    ],
    [],
  ];

  state = playCard(state, 1, '7-S');
  assert.equal(state.turnSeat, 2);
  state = playCard(state, 2, 'J-S');
  // Seat 3 (partner) sits out, so turn skips directly from Seat 2 -> Seat 0
  assert.equal(state.turnSeat, 0);
  state = playCard(state, 0, '8-S');

  assert.equal(state.phase, 'trick_pause');
  assert.equal(state.lastTrick?.winnerSeat, 2);

  state = advanceAfterTrickPause(state);
  assert.equal(state.phase, 'round_over');
  assert.equal(state.netScore, 3); // Black (Team 1) failed Single Hand -> Red (Team 0) scores +3
  assert.equal(state.lastRoundSummary?.isSingleHand, true);
  assert.equal(state.lastRoundSummary?.contractMade, false);
  assert.equal(state.lastRoundSummary?.singleHandTricksWon, 0);
});

test('single hand called after 8 cards dealt awards +3 points when caller sweeps all 8 tricks', () => {
  let state = startRound(createFullFourPlayerRoom(), { rng: () => 0.15 });
  state = placeBid(state, 1, 16);
  state = passBid(state, 2);
  state = passBid(state, 3);
  state = passBid(state, 0);
  state = selectTrump(state, 1, 'D');

  assert.equal(state.phase, 'playing');
  assert.equal(state.tricksCompleted, 0);
  assert.equal(state.currentTrick.length, 0);
  // Any seated player can call Single Hand right after 8 cards are dealt before Trick 1 card 1
  assert.equal(canCallSingleHand(state, 0), true);

  state = callSingleHand(state, 0);
  assert.equal(state.isSingleHand, true);
  assert.equal(state.roundStake, 3);
  assert.equal(state.trumpSuit, null);
  assert.equal(state.singleHandPartnerSeat, 2);
  assert.equal(state.hands[2].length, 0);
  assert.equal(state.turnSeat, 0);

  // Give Seat 0 unbeatable Spade & Heart top cards so Seat 0 sweeps all 8 tricks
  state.hands = [
    [
      { id: 'J-S', suit: 'S', rank: 'J' },
      { id: '9-S', suit: 'S', rank: '9' },
      { id: 'A-S', suit: 'S', rank: 'A' },
      { id: '10-S', suit: 'S', rank: '10' },
      { id: 'J-H', suit: 'H', rank: 'J' },
      { id: '9-H', suit: 'H', rank: '9' },
      { id: 'A-H', suit: 'H', rank: 'A' },
      { id: '10-H', suit: 'H', rank: '10' },
    ],
    [
      { id: 'K-S', suit: 'S', rank: 'K' },
      { id: 'Q-S', suit: 'S', rank: 'Q' },
      { id: '8-S', suit: 'S', rank: '8' },
      { id: '7-S', suit: 'S', rank: '7' },
      { id: 'K-H', suit: 'H', rank: 'K' },
      { id: 'Q-H', suit: 'H', rank: 'Q' },
      { id: '8-H', suit: 'H', rank: '8' },
      { id: '7-H', suit: 'H', rank: '7' },
    ],
    [],
    [
      { id: 'J-D', suit: 'D', rank: 'J' },
      { id: '9-D', suit: 'D', rank: '9' },
      { id: 'A-D', suit: 'D', rank: 'A' },
      { id: '10-D', suit: 'D', rank: '10' },
      { id: 'J-C', suit: 'C', rank: 'J' },
      { id: '9-C', suit: 'C', rank: '9' },
      { id: 'A-C', suit: 'C', rank: 'A' },
      { id: '10-C', suit: 'C', rank: '10' },
    ],
  ];

  while (state.phase === 'playing') {
    const turn = state.turnSeat as SeatIndex;
    const legal = getLegalCards(state, turn);
    // Caller leads highest rank to sweep
    const chosen = turn === 0 ? legal[0] : legal[legal.length - 1];
    state = playCard(state, turn, chosen.id);
    if (state.phase === 'trick_pause') {
      state = advanceAfterTrickPause(state);
    }
  }

  assert.equal(state.phase, 'round_over');
  assert.equal(state.netScore, 3); // Red (Team 0) swept all 8 tricks -> +3 pts
  assert.equal(state.lastRoundSummary?.contractMade, true);
  assert.equal(state.lastRoundSummary?.singleHandTricksWon, 8);
});

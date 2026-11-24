export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 'J' | '9' | 'A' | '10' | 'K' | 'Q' | '8' | '7';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type SeatIndex = 0 | 1 | 2 | 3;
export type TeamIndex = 0 | 1; // 0 = Seats 0 & 2 (Red Team / Crimson), 1 = Seats 1 & 3 (Black Team / Obsidian)

export type GamePhase =
  | 'lobby'
  | 'bidding'
  | 'trump_select'
  | 'playing'
  | 'trick_pause'
  | 'round_over'
  | 'match_over';

export interface SeatPlayer {
  seat: SeatIndex;
  playerId: string;
  name: string;
  isBot: boolean;
  connected: boolean;
  ready: boolean;
}

export interface TrickPlay {
  seat: SeatIndex;
  card: Card;
}

export interface LastTrickSummary {
  plays: TrickPlay[];
  winnerSeat: SeatIndex;
  winnerTeam: TeamIndex;
  points: number;
  hadLastTrickBonus: boolean;
}

export type TrumpMode = 'suit' | 'seventh_card' | 'joker_no_trump' | 'single_hand';

export interface ChatMessage {
  id: string;
  playerId: string;
  senderName: string;
  seat: SeatIndex | null;
  text: string;
  createdAt: number;
}

export interface RoundSummary {
  roundNumber: number;
  bidderSeat: SeatIndex;
  bidderTeam: TeamIndex;
  baseBid: number;
  effectiveBid: number;
  roundStake: number;
  isSingleHand: boolean;
  isDraw?: boolean;
  drawReason?: string;
  isSurrender?: boolean;
  surrenderedByTeam?: TeamIndex;
  trumpMode: TrumpMode;
  singleHandTricksWon: number;
  marriageDeclaredByTeam: TeamIndex | null;
  trumpSuit: Suit | null;
  pointsByTeam: [number, number];
  contractMade: boolean;
  roundWinnerTeam: TeamIndex;
  netScoreAfter: number; // -6..+6 (+ is Red 6 of Hearts, - is Black 6 of Spades)
}

export interface TwentyNineState {
  roomCode: string;
  hostPlayerId: string;
  phase: GamePhase;
  seats: [SeatPlayer | null, SeatPlayer | null, SeatPlayer | null, SeatPlayer | null];
  roundNumber: number;
  dealerSeat: SeatIndex;
  hands: [Card[], Card[], Card[], Card[]];
  stock: [Card[], Card[], Card[], Card[]];

  // Adjacent 2-Player Bidding Duel
  bidTurnSeat: SeatIndex;
  duelDefenderSeat: SeatIndex | null;
  duelChallengerSeat: SeatIndex | null;
  highestBid: number | null;
  highestBidderSeat: SeatIndex | null;
  passedSeats: [boolean, boolean, boolean, boolean];
  bidHistory: Array<{ seat: SeatIndex; action: 'bid' | 'match' | 'pass'; amount?: number }>;

  // Trump, 7th Card, Joker No Trump, Marriage, Single Hand & Round Stake
  trumpMode: TrumpMode | null;
  trumpSuit: Suit | null;
  seventhCard: Card | null;
  trumpRevealed: boolean;
  trumpRevealedBySeat: SeatIndex | null;
  marriageDeclaredByTeam: TeamIndex | null;
  roundStake: 1 | 2 | 3 | 4;
  doubledByTeam: TeamIndex | null;
  isSingleHand: boolean;
  singleHandCallerSeat: SeatIndex | null;
  singleHandPartnerSeat: SeatIndex | null;

  // Trick play
  leadSeat: SeatIndex;
  turnSeat: SeatIndex;
  currentTrick: TrickPlay[];
  tricksCompleted: number;
  roundPoints: [number, number];
  lastTrick: LastTrickSummary | null;

  // Tug-of-war 6 of Hearts (+) / 6 of Spades (-) score (-6 to +6)
  netScore: number;
  targetMatchPoints: number;
  lastRoundSummary: RoundSummary | null;
  statusMessage: string;
}

export interface ClientGameView {
  roomCode: string;
  hostPlayerId: string;
  myPlayerId: string;
  mySeat: SeatIndex | null;
  phase: GamePhase;
  seats: [SeatPlayer | null, SeatPlayer | null, SeatPlayer | null, SeatPlayer | null];
  handCounts: [number, number, number, number];
  myHand: Card[];
  roundNumber: number;
  dealerSeat: SeatIndex;
  bidTurnSeat: SeatIndex;
  duelDefenderSeat: SeatIndex | null;
  duelChallengerSeat: SeatIndex | null;
  highestBid: number | null;
  highestBidderSeat: SeatIndex | null;
  passedSeats: [boolean, boolean, boolean, boolean];
  bidHistory: Array<{ seat: SeatIndex; action: 'bid' | 'match' | 'pass'; amount?: number }>;
  trumpMode: TrumpMode | null;
  trumpSuit: Suit | null;
  seventhCard: Card | null;
  trumpRevealed: boolean;
  trumpRevealedBySeat: SeatIndex | null;
  marriageDeclaredByTeam: TeamIndex | null;
  roundStake: 1 | 2 | 3 | 4;
  doubledByTeam: TeamIndex | null;
  isSingleHand: boolean;
  singleHandCallerSeat: SeatIndex | null;
  singleHandPartnerSeat: SeatIndex | null;
  leadSeat: SeatIndex;
  turnSeat: SeatIndex;
  currentTrick: TrickPlay[];
  tricksCompleted: number;
  roundPoints: [number, number];
  lastTrick: LastTrickSummary | null;
  netScore: number;
  targetMatchPoints: number;
  lastRoundSummary: RoundSummary | null;
  statusMessage: string;
  legalCardIds: string[];
  canRevealTrump: boolean;
  canDeclareMarriage: boolean;
  canDoubleStake: boolean;
  canCallSingleHand: boolean;
  canMatchCurrentBid: boolean;
  canSurrender: boolean;
  minBidAmount: number;
}

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];

export const SUIT_NAMES: Record<Suit, string> = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

export const RANK_NAMES: Record<Rank, string> = {
  J: 'Jack',
  '9': 'Nine',
  A: 'Ace',
  '10': 'Ten',
  K: 'King',
  Q: 'Queen',
  '8': 'Eight',
  '7': 'Seven',
};

export const CARD_POINTS: Record<Rank, number> = {
  J: 3,
  '9': 2,
  A: 1,
  '10': 1,
  K: 0,
  Q: 0,
  '8': 0,
  '7': 0,
};

export const RANK_STRENGTH: Record<Rank, number> = {
  J: 8,
  '9': 7,
  A: 6,
  '10': 5,
  K: 4,
  Q: 3,
  '8': 2,
  '7': 1,
};

export function getTeamForSeat(seat: SeatIndex): TeamIndex {
  return (seat % 2 === 0 ? 0 : 1) as TeamIndex;
}

export function getCardPoints(card: Card): number {
  return CARD_POINTS[card.rank];
}

export function getCardLabel(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;
}

export function getSixCardPipState(netScore: number): {
  leadingTeam: TeamIndex | null;
  redHeartsRevealed: number;
  blackSpadesRevealed: number;
  cardOrder: ['H' | 'S', 'H' | 'S'];
} {
  const clamped = Math.max(-6, Math.min(6, netScore));
  if (clamped > 0) {
    return {
      leadingTeam: 0,
      redHeartsRevealed: clamped,
      blackSpadesRevealed: 0,
      cardOrder: ['H', 'S'],
    };
  }
  if (clamped < 0) {
    return {
      leadingTeam: 1,
      redHeartsRevealed: 0,
      blackSpadesRevealed: Math.abs(clamped),
      cardOrder: ['S', 'H'],
    };
  }
  return {
    leadingTeam: null,
    redHeartsRevealed: 0,
    blackSpadesRevealed: 0,
    cardOrder: ['H', 'S'],
  };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}-${suit}`, suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(cards: Card[], rng: () => number = Math.random): Card[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { S: 0, H: 1, C: 2, D: 3 };
  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    return RANK_STRENGTH[b.rank] - RANK_STRENGTH[a.rank];
  });
}

export function createInitialRoomState(roomCode: string, host: { playerId: string; name: string }): TwentyNineState {
  const hostSeat: SeatPlayer = {
    seat: 0,
    playerId: host.playerId,
    name: host.name,
    isBot: false,
    connected: true,
    ready: true,
  };
  return {
    roomCode,
    hostPlayerId: host.playerId,
    phase: 'lobby',
    seats: [hostSeat, null, null, null],
    roundNumber: 0,
    dealerSeat: 0,
    hands: [[], [], [], []],
    stock: [[], [], [], []],
    bidTurnSeat: 1,
    duelDefenderSeat: 1,
    duelChallengerSeat: 2,
    highestBid: null,
    highestBidderSeat: null,
    passedSeats: [false, false, false, false],
    bidHistory: [],
    trumpMode: null,
    trumpSuit: null,
    seventhCard: null,
    trumpRevealed: false,
    trumpRevealedBySeat: null,
    marriageDeclaredByTeam: null,
    roundStake: 1,
    doubledByTeam: null,
    isSingleHand: false,
    singleHandCallerSeat: null,
    singleHandPartnerSeat: null,
    leadSeat: 1,
    turnSeat: 1,
    currentTrick: [],
    tricksCompleted: 0,
    roundPoints: [0, 0],
    lastTrick: null,
    netScore: 0,
    targetMatchPoints: 6,
    lastRoundSummary: null,
    statusMessage: 'Waiting for 4 players to take seats.',
  };
}

export function startRound(
  state: TwentyNineState,
  options?: { rng?: () => number; isRedeal?: boolean }
): TwentyNineState {
  const allSeated = state.seats.every((s) => s !== null);
  if (!allSeated) {
    throw new Error('All 4 seats must be filled before starting a round.');
  }

  const rng = options?.rng ?? Math.random;
  const deck = shuffleDeck(createDeck(), rng);

  const hands: [Card[], Card[], Card[], Card[]] = [
    sortHand(deck.slice(0, 4)),
    sortHand(deck.slice(4, 8)),
    sortHand(deck.slice(8, 12)),
    sortHand(deck.slice(12, 16)),
  ];
  const stock: [Card[], Card[], Card[], Card[]] = [
    deck.slice(16, 20),
    deck.slice(20, 24),
    deck.slice(24, 28),
    deck.slice(28, 32),
  ];

  const nextDealer: SeatIndex =
    state.roundNumber === 0 && !options?.isRedeal ? 0 : (((state.dealerSeat + 1) % 4) as SeatIndex);
  const firstBidder: SeatIndex = ((nextDealer + 1) % 4) as SeatIndex;
  const firstChallenger: SeatIndex = ((firstBidder + 1) % 4) as SeatIndex;
  const nextRoundNumber = options?.isRedeal ? state.roundNumber : state.roundNumber + 1;
  const bidderName = state.seats[firstBidder]?.name ?? `Seat ${firstBidder + 1}`;
  const challengerName = state.seats[firstChallenger]?.name ?? `Seat ${firstChallenger + 1}`;

  return {
    ...state,
    phase: 'bidding',
    roundNumber: nextRoundNumber,
    dealerSeat: nextDealer,
    hands,
    stock,
    bidTurnSeat: firstBidder,
    duelDefenderSeat: firstBidder,
    duelChallengerSeat: firstChallenger,
    highestBid: null,
    highestBidderSeat: null,
    passedSeats: [false, false, false, false],
    bidHistory: [],
    trumpMode: null,
    trumpSuit: null,
    seventhCard: null,
    trumpRevealed: false,
    trumpRevealedBySeat: null,
    marriageDeclaredByTeam: null,
    roundStake: 1,
    doubledByTeam: null,
    isSingleHand: false,
    singleHandCallerSeat: null,
    singleHandPartnerSeat: null,
    leadSeat: firstBidder,
    turnSeat: firstBidder,
    currentTrick: [],
    tricksCompleted: 0,
    roundPoints: [0, 0],
    lastTrick: null,
    lastRoundSummary: null,
    statusMessage: options?.isRedeal
      ? `Everyone passed — re-dealt! ${bidderName} vs ${challengerName} open bidding.`
      : `Round ${nextRoundNumber} dealt. ${bidderName} vs ${challengerName} open bidding (16–28).`,
  };
}

function findNextActiveSeatExcluding(
  fromSeat: SeatIndex,
  excludeSeat: SeatIndex | null,
  passedSeats: [boolean, boolean, boolean, boolean]
): SeatIndex | null {
  for (let offset = 1; offset <= 4; offset++) {
    const candidate = ((fromSeat + offset) % 4) as SeatIndex;
    if (candidate !== excludeSeat && !passedSeats[candidate]) {
      return candidate;
    }
  }
  return null;
}

export function canMatchBid(state: TwentyNineState, seat: SeatIndex): boolean {
  if (state.phase !== 'bidding') return false;
  if (state.bidTurnSeat !== seat) return false;
  if (state.highestBid === null || state.highestBidderSeat === null) return false;
  return state.duelDefenderSeat === seat && state.highestBidderSeat !== seat;
}

export function getMinimumNextBid(state: TwentyNineState, seat: SeatIndex = state.bidTurnSeat): number {
  if (state.highestBid === null) return 16;
  if (canMatchBid(state, seat)) return state.highestBid;
  return state.highestBid + 1;
}

export function placeBid(
  state: TwentyNineState,
  seat: SeatIndex,
  amount: number,
  rng: () => number = Math.random
): TwentyNineState {
  if (state.phase !== 'bidding') {
    throw new Error('Cannot bid outside bidding phase.');
  }
  if (state.bidTurnSeat !== seat) {
    throw new Error('Not your turn to bid.');
  }
  if (state.passedSeats[seat]) {
    throw new Error('You already passed this round.');
  }
  const minBid = getMinimumNextBid(state, seat);
  if (!Number.isInteger(amount) || amount < minBid || amount > 28) {
    throw new Error(`Bid must be an integer between ${minBid} and 28.`);
  }

  const isMatch = state.highestBid !== null && amount === state.highestBid && canMatchBid(state, seat);
  const playerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  const bidHistory = [
    ...state.bidHistory,
    { seat, action: (isMatch ? 'match' : 'bid') as 'bid' | 'match', amount },
  ];
  const activeCount = state.passedSeats.filter((p) => !p).length;

  // Immediate win if all others passed OR if 28 is held by defender (challenger cannot bid 29)
  const defenderExistsAndActive =
    state.duelDefenderSeat !== null && !state.passedSeats[state.duelDefenderSeat];
  const canDefenderStillMatch28 =
    amount === 28 && seat === state.duelChallengerSeat && defenderExistsAndActive;

  if (activeCount === 1 || (amount === 28 && !canDefenderStillMatch28)) {
    return {
      ...state,
      highestBid: amount,
      highestBidderSeat: seat,
      bidHistory,
      phase: 'trump_select',
      statusMessage: `${playerName} won the bid at ${amount}. Choosing hidden trump...`,
    };
  }

  let nextTurn: SeatIndex;
  if (seat === state.duelDefenderSeat && state.duelChallengerSeat !== null && !state.passedSeats[state.duelChallengerSeat]) {
    nextTurn = state.duelChallengerSeat;
  } else if (seat === state.duelChallengerSeat && defenderExistsAndActive && state.duelDefenderSeat !== null) {
    nextTurn = state.duelDefenderSeat;
  } else {
    nextTurn = findNextActiveSeatExcluding(seat, seat, state.passedSeats) ?? seat;
  }

  const nextName = state.seats[nextTurn]?.name ?? `Seat ${nextTurn + 1}`;
  void rng;
  return {
    ...state,
    highestBid: amount,
    highestBidderSeat: seat,
    bidTurnSeat: nextTurn,
    bidHistory,
    statusMessage: isMatch
      ? `${playerName} matched ${amount}! ${nextName}'s turn.`
      : `${playerName} bid ${amount}. ${nextName}'s turn.`,
  };
}

export function passBid(
  state: TwentyNineState,
  seat: SeatIndex,
  rng: () => number = Math.random
): TwentyNineState {
  if (state.phase !== 'bidding') {
    throw new Error('Cannot pass outside bidding phase.');
  }
  if (state.bidTurnSeat !== seat) {
    throw new Error('Not your turn to bid.');
  }
  if (state.passedSeats[seat]) {
    throw new Error('Already passed.');
  }

  const playerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  const nextPassed: [boolean, boolean, boolean, boolean] = [...state.passedSeats] as [
    boolean,
    boolean,
    boolean,
    boolean,
  ];
  nextPassed[seat] = true;
  const bidHistory = [...state.bidHistory, { seat, action: 'pass' as const }];

  const remainingSeats = ([0, 1, 2, 3] as SeatIndex[]).filter((s) => !nextPassed[s]);

  if (remainingSeats.length === 0) {
    return startRound(state, { rng, isRedeal: true });
  }

  if (remainingSeats.length === 1 && state.highestBidderSeat !== null && state.highestBid !== null) {
    const winnerName = state.seats[state.highestBidderSeat]?.name ?? `Seat ${state.highestBidderSeat + 1}`;
    return {
      ...state,
      passedSeats: nextPassed,
      bidHistory,
      phase: 'trump_select',
      statusMessage: `${playerName} passed — ${winnerName} won the bid at ${state.highestBid}. Choosing hidden trump...`,
    };
  }

  // Nobody has bid yet: advance the opening duel pair to the next adjacent players in the circle
  if (state.highestBid === null || state.highestBidderSeat === null) {
    const nextOpener = findNextActiveSeatExcluding(seat, null, nextPassed) ?? remainingSeats[0];
    const nextChallenger = findNextActiveSeatExcluding(nextOpener, nextOpener, nextPassed);
    const openerName = state.seats[nextOpener]?.name ?? `Seat ${nextOpener + 1}`;
    return {
      ...state,
      passedSeats: nextPassed,
      bidHistory,
      duelDefenderSeat: nextOpener,
      duelChallengerSeat: nextChallenger,
      bidTurnSeat: nextOpener,
      statusMessage: `${playerName} passed. ${openerName}'s turn to open bidding.`,
    };
  }

  // A duel had an active bid: surviving bidder becomes defender and next unpassed player in circle challenges
  const survivingDefender: SeatIndex =
    seat === state.duelDefenderSeat && state.duelChallengerSeat !== null && !nextPassed[state.duelChallengerSeat]
      ? state.duelChallengerSeat
      : state.highestBidderSeat;

  // If surviving defender already holds 28, no challenger can beat 28
  if (state.highestBid === 28 && state.highestBidderSeat === survivingDefender) {
    const winnerName = state.seats[survivingDefender]?.name ?? `Seat ${survivingDefender + 1}`;
    return {
      ...state,
      passedSeats: nextPassed,
      bidHistory,
      phase: 'trump_select',
      statusMessage: `${winnerName} won the bid at 28. Choosing hidden trump...`,
    };
  }

  const circleFrom = state.duelChallengerSeat ?? seat;
  const nextChallenger =
    findNextActiveSeatExcluding(circleFrom, survivingDefender, nextPassed) ??
    findNextActiveSeatExcluding(survivingDefender, survivingDefender, nextPassed);

  if (nextChallenger === null) {
    const winnerName = state.seats[survivingDefender]?.name ?? `Seat ${survivingDefender + 1}`;
    return {
      ...state,
      passedSeats: nextPassed,
      bidHistory,
      phase: 'trump_select',
      statusMessage: `${playerName} passed — ${winnerName} won the bid at ${state.highestBid}. Choosing hidden trump...`,
    };
  }

  const defenderName = state.seats[survivingDefender]?.name ?? `Seat ${survivingDefender + 1}`;
  const challengerName = state.seats[nextChallenger]?.name ?? `Seat ${nextChallenger + 1}`;
  return {
    ...state,
    passedSeats: nextPassed,
    bidHistory,
    duelDefenderSeat: survivingDefender,
    duelChallengerSeat: nextChallenger,
    bidTurnSeat: nextChallenger,
    statusMessage: `${playerName} passed. ${challengerName} now challenges ${defenderName} (Bid ${state.highestBid}).`,
  };
}

function dealRemainingStock(state: TwentyNineState): [Card[], Card[], Card[], Card[]] {
  return [
    sortHand([...state.hands[0], ...state.stock[0]]),
    sortHand([...state.hands[1], ...state.stock[1]]),
    sortHand([...state.hands[2], ...state.stock[2]]),
    sortHand([...state.hands[3], ...state.stock[3]]),
  ];
}

export function selectTrump(state: TwentyNineState, seat: SeatIndex, suit: Suit): TwentyNineState {
  if (state.phase !== 'trump_select') {
    throw new Error('Not in trump selection phase.');
  }
  if (state.highestBidderSeat !== seat) {
    throw new Error('Only the winning bidder can select the trump suit.');
  }

  const fullHands = dealRemainingStock(state);
  const firstLead = ((state.dealerSeat + 1) % 4) as SeatIndex;
  const leadName = state.seats[firstLead]?.name ?? `Seat ${firstLead + 1}`;
  const bidderName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;

  return {
    ...state,
    phase: 'playing',
    trumpMode: 'suit',
    trumpSuit: suit,
    seventhCard: null,
    trumpRevealed: false,
    hands: fullHands,
    stock: [[], [], [], []],
    leadSeat: firstLead,
    turnSeat: firstLead,
    statusMessage: `${bidderName} locked hidden trump (Bid ${state.highestBid}). ${leadName} leads Trick 1.`,
  };
}

export function selectSeventhCardTrump(state: TwentyNineState, seat: SeatIndex): TwentyNineState {
  if (state.phase !== 'trump_select') {
    throw new Error('Not in trump selection phase.');
  }
  if (state.highestBidderSeat !== seat) {
    throw new Error('Only the winning bidder can choose 7th card trump.');
  }

  const seventhCard = state.stock[seat][2] ?? state.stock[seat][0] ?? state.hands[seat][0];
  if (!seventhCard) {
    throw new Error('7th card not available.');
  }

  const fullHands = dealRemainingStock(state);
  const firstLead = ((state.dealerSeat + 1) % 4) as SeatIndex;
  const leadName = state.seats[firstLead]?.name ?? `Seat ${firstLead + 1}`;
  const bidderName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;

  return {
    ...state,
    phase: 'playing',
    trumpMode: 'seventh_card',
    trumpSuit: seventhCard.suit,
    seventhCard,
    trumpRevealed: false,
    hands: fullHands,
    stock: [[], [], [], []],
    leadSeat: firstLead,
    turnSeat: firstLead,
    statusMessage: `${bidderName} chose the 7th Card as blind trump (Bid ${state.highestBid}). ${leadName} leads Trick 1.`,
  };
}

export function selectJokerNoTrump(state: TwentyNineState, seat: SeatIndex): TwentyNineState {
  if (state.phase !== 'trump_select') {
    throw new Error('Not in trump selection phase.');
  }
  if (state.highestBidderSeat !== seat) {
    throw new Error('Only the winning bidder can place the Joker (No Trump).');
  }

  const fullHands = dealRemainingStock(state);
  const firstLead = ((state.dealerSeat + 1) % 4) as SeatIndex;
  const leadName = state.seats[firstLead]?.name ?? `Seat ${firstLead + 1}`;
  const bidderName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;

  return {
    ...state,
    phase: 'playing',
    trumpMode: 'joker_no_trump',
    trumpSuit: null,
    seventhCard: null,
    trumpRevealed: false,
    hands: fullHands,
    stock: [[], [], [], []],
    leadSeat: firstLead,
    turnSeat: firstLead,
    statusMessage: `${bidderName} set hidden Joker (No Trump · Bid ${state.highestBid}). ${leadName} leads Trick 1.`,
  };
}

export function canCallSingleHand(state: TwentyNineState, seat: SeatIndex): boolean {
  if (state.isSingleHand) return false;
  if (state.phase === 'bidding') {
    return state.bidTurnSeat === seat;
  }
  if (state.phase === 'playing') {
    return state.tricksCompleted === 0 && state.currentTrick.length === 0;
  }
  return false;
}

export function callSingleHand(state: TwentyNineState, seat: SeatIndex): TwentyNineState {
  if (!canCallSingleHand(state, seat)) {
    throw new Error('Cannot call Single Hand right now.');
  }

  const partnerSeat = ((seat + 2) % 4) as SeatIndex;
  const callerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  const partnerName = state.seats[partnerSeat]?.name ?? `Seat ${partnerSeat + 1}`;

  const nextHands: [Card[], Card[], Card[], Card[]] = [
    state.phase === 'bidding' ? sortHand([...state.hands[0], ...state.stock[0]]) : [...state.hands[0]],
    state.phase === 'bidding' ? sortHand([...state.hands[1], ...state.stock[1]]) : [...state.hands[1]],
    state.phase === 'bidding' ? sortHand([...state.hands[2], ...state.stock[2]]) : [...state.hands[2]],
    state.phase === 'bidding' ? sortHand([...state.hands[3], ...state.stock[3]]) : [...state.hands[3]],
  ];
  // Partner sits out for Single Hand
  nextHands[partnerSeat] = [];

  return {
    ...state,
    phase: 'playing',
    hands: nextHands,
    stock: [[], [], [], []],
    highestBid: 29,
    highestBidderSeat: seat,
    trumpMode: 'single_hand',
    trumpSuit: null,
    seventhCard: null,
    trumpRevealed: false,
    trumpRevealedBySeat: null,
    marriageDeclaredByTeam: null,
    roundStake: 3,
    doubledByTeam: null,
    isSingleHand: true,
    singleHandCallerSeat: seat,
    singleHandPartnerSeat: partnerSeat,
    leadSeat: seat,
    turnSeat: seat,
    currentTrick: [],
    tricksCompleted: 0,
    roundPoints: [0, 0],
    lastTrick: null,
    statusMessage: `${callerName} called SINGLE HAND (3 pts)! ${partnerName} sits out — ${callerName} leads (No Trump).`,
  };
}

export function canDoubleStake(state: TwentyNineState, seat: SeatIndex): boolean {
  if (state.isSingleHand) return false;
  if (state.phase !== 'playing' || state.tricksCompleted > 0) return false;
  if (state.highestBidderSeat === null) return false;
  const myTeam = getTeamForSeat(seat);
  const bidderTeam = getTeamForSeat(state.highestBidderSeat);

  // Defenders can Double from 1 -> 2 during Trick 1
  if (state.roundStake === 1 && myTeam !== bidderTeam) {
    return true;
  }
  // Bidding team can Redouble from 2 -> 4 during Trick 1
  if (state.roundStake === 2 && myTeam === bidderTeam) {
    return true;
  }
  return false;
}

export function doubleStake(state: TwentyNineState, seat: SeatIndex): TwentyNineState {
  if (!canDoubleStake(state, seat)) {
    throw new Error('Cannot double the round stake right now.');
  }
  const myTeam = getTeamForSeat(seat);
  const playerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  const nextStake: 2 | 4 = state.roundStake === 1 ? 2 : 4;
  return {
    ...state,
    roundStake: nextStake,
    doubledByTeam: myTeam,
    statusMessage:
      nextStake === 2
        ? `${playerName} Doubled the round! (Worth 2 pts)`
        : `${playerName} Redoubled the round! (Worth 4 pts)`,
  };
}

export function getLegalCards(state: TwentyNineState, seat: SeatIndex): Card[] {
  if (state.phase !== 'playing' || state.turnSeat !== seat) {
    return [];
  }
  const hand = state.hands[seat];
  if (state.currentTrick.length === 0) {
    return hand;
  }
  const ledSuit = state.currentTrick[0].card.suit;
  const followSuitCards = hand.filter((c) => c.suit === ledSuit);
  if (followSuitCards.length > 0) {
    return followSuitCards;
  }
  return hand;
}

export function canRevealTrump(state: TwentyNineState, seat: SeatIndex): boolean {
  if (state.isSingleHand) return false;
  if (state.phase !== 'playing' || state.turnSeat !== seat) return false;
  if (state.trumpRevealed) return false;
  if (!state.trumpSuit && state.trumpMode !== 'joker_no_trump') return false;
  if (state.currentTrick.length === 0) return false;
  const ledSuit = state.currentTrick[0].card.suit;
  const hasLedSuit = state.hands[seat].some((c) => c.suit === ledSuit);
  return !hasLedSuit;
}

export function revealTrump(state: TwentyNineState, seat: SeatIndex): TwentyNineState {
  if (!canRevealTrump(state, seat)) {
    throw new Error('Cannot reveal trump right now.');
  }
  const playerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  let statusMessage: string;
  if (state.trumpMode === 'joker_no_trump') {
    statusMessage = `${playerName} flipped Joker — No Trump this round!`;
  } else {
    const suitLabel = state.trumpSuit ? `${SUIT_SYMBOLS[state.trumpSuit]} ${SUIT_NAMES[state.trumpSuit]}` : '';
    statusMessage =
      state.trumpMode === 'seventh_card'
        ? `${playerName} flipped 7th Card Trump: ${suitLabel}!`
        : `${playerName} revealed Trump: ${suitLabel}!`;
  }
  return {
    ...state,
    trumpRevealed: true,
    trumpRevealedBySeat: seat,
    statusMessage,
  };
}

export function canDeclareMarriage(state: TwentyNineState, seat: SeatIndex): boolean {
  if (state.isSingleHand) return false;
  if (state.phase !== 'playing' || state.turnSeat !== seat) return false;
  if (!state.trumpRevealed || !state.trumpSuit) return false;
  if (state.marriageDeclaredByTeam !== null) return false;
  const hand = state.hands[seat];
  const hasKing = hand.some((c) => c.suit === state.trumpSuit && c.rank === 'K');
  const hasQueen = hand.some((c) => c.suit === state.trumpSuit && c.rank === 'Q');
  return hasKing && hasQueen;
}

export function declareMarriage(state: TwentyNineState, seat: SeatIndex): TwentyNineState {
  if (!canDeclareMarriage(state, seat)) {
    throw new Error('You must hold both K & Q of the revealed trump suit on your turn.');
  }
  const team = getTeamForSeat(seat);
  const bidderTeam = state.highestBidderSeat !== null ? getTeamForSeat(state.highestBidderSeat) : 0;
  const playerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  const adjustmentText = team === bidderTeam ? 'Target reduced by 4' : 'Target raised by 4';
  return {
    ...state,
    marriageDeclaredByTeam: team,
    statusMessage: `${playerName} showed Royal Pair (K+Q of Trump)! ${adjustmentText}.`,
  };
}

export function getEffectiveBid(state: Pick<TwentyNineState, 'highestBid' | 'highestBidderSeat' | 'marriageDeclaredByTeam'>): number {
  const base = state.highestBid ?? 16;
  if (state.marriageDeclaredByTeam === null || state.highestBidderSeat === null) {
    return base;
  }
  const bidderTeam = getTeamForSeat(state.highestBidderSeat);
  if (state.marriageDeclaredByTeam === bidderTeam) {
    return Math.max(16, base - 4);
  }
  return Math.min(28, base + 4);
}

export function resolveTrickWinner(
  plays: TrickPlay[],
  trumpSuit: Suit | null,
  trumpRevealed: boolean
): SeatIndex {
  if (plays.length === 0) {
    throw new Error('Cannot resolve empty trick.');
  }
  const ledSuit = plays[0].card.suit;
  const activeTrump = trumpRevealed ? trumpSuit : null;

  const trumpPlays = activeTrump ? plays.filter((p) => p.card.suit === activeTrump) : [];
  const contenders = trumpPlays.length > 0 ? trumpPlays : plays.filter((p) => p.card.suit === ledSuit);

  let best = contenders[0];
  for (let i = 1; i < contenders.length; i++) {
    if (RANK_STRENGTH[contenders[i].card.rank] > RANK_STRENGTH[best.card.rank]) {
      best = contenders[i];
    }
  }
  return best.seat;
}

export function playCard(state: TwentyNineState, seat: SeatIndex, cardId: string): TwentyNineState {
  if (state.phase !== 'playing') {
    throw new Error('Cannot play a card right now.');
  }
  if (state.turnSeat !== seat) {
    throw new Error('Not your turn.');
  }
  if (state.isSingleHand && state.singleHandPartnerSeat === seat) {
    throw new Error('Partner sits out during Single Hand.');
  }
  const legalCards = getLegalCards(state, seat);
  const chosenCard = legalCards.find((c) => c.id === cardId);
  if (!chosenCard) {
    throw new Error('Illegal card play: you must follow the led suit if possible.');
  }

  const updatedHands = [...state.hands] as [Card[], Card[], Card[], Card[]];
  updatedHands[seat] = state.hands[seat].filter((c) => c.id !== cardId);
  const updatedTrick: TrickPlay[] = [...state.currentTrick, { seat, card: chosenCard }];
  const playerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  const requiredPlays = state.isSingleHand ? 3 : 4;

  if (updatedTrick.length < requiredPlays) {
    let nextSeat = ((seat + 1) % 4) as SeatIndex;
    if (state.isSingleHand && nextSeat === state.singleHandPartnerSeat) {
      nextSeat = ((nextSeat + 1) % 4) as SeatIndex;
    }
    const nextName = state.seats[nextSeat]?.name ?? `Seat ${nextSeat + 1}`;
    return {
      ...state,
      hands: updatedHands,
      currentTrick: updatedTrick,
      turnSeat: nextSeat,
      statusMessage: `${playerName} played ${getCardLabel(chosenCard)}. ${nextName}'s turn.`,
    };
  }

  const winnerSeat = resolveTrickWinner(
    updatedTrick,
    state.isSingleHand ? null : state.trumpSuit,
    state.isSingleHand ? false : state.trumpRevealed
  );
  const winnerTeam = getTeamForSeat(winnerSeat);
  const cardPts = updatedTrick.reduce((sum, p) => sum + getCardPoints(p.card), 0);
  const isLastTrick = state.tricksCompleted === 7;
  const trickPoints = cardPts + (!state.isSingleHand && isLastTrick ? 1 : 0);

  const nextRoundPoints: [number, number] = [
    state.roundPoints[0] + (winnerTeam === 0 ? trickPoints : 0),
    state.roundPoints[1] + (winnerTeam === 1 ? trickPoints : 0),
  ];

  const winnerName = state.seats[winnerSeat]?.name ?? `Seat ${winnerSeat + 1}`;
  const bonusLabel = !state.isSingleHand && isLastTrick ? ' (+1 last trick)' : '';

  let statusMessage = `${winnerName} won Trick ${state.tricksCompleted + 1} (+${trickPoints} pts${bonusLabel}).`;
  if (state.isSingleHand) {
    statusMessage =
      winnerSeat === state.singleHandCallerSeat
        ? `${winnerName} swept Trick ${state.tricksCompleted + 1}/8!`
        : `${winnerName} broke the Single Hand!`;
  } else if (state.tricksCompleted === 6 && !state.trumpRevealed) {
    statusMessage = '2nd-last cards played with trump still hidden — Round Drawn!';
  }

  return {
    ...state,
    phase: 'trick_pause',
    hands: updatedHands,
    currentTrick: updatedTrick,
    roundPoints: nextRoundPoints,
    lastTrick: {
      plays: updatedTrick,
      winnerSeat,
      winnerTeam,
      points: trickPoints,
      hadLastTrickBonus: !state.isSingleHand && isLastTrick,
    },
    statusMessage,
  };
}

export function canSurrender(state: TwentyNineState, seat: SeatIndex): boolean {
  if (state.phase !== 'trump_select' && state.phase !== 'playing') {
    return false;
  }
  if (state.isSingleHand && state.singleHandPartnerSeat === seat) {
    return false;
  }
  const team = getTeamForSeat(seat);
  const bidderTeam = state.highestBidderSeat !== null ? getTeamForSeat(state.highestBidderSeat) : null;
  if (bidderTeam !== null && team === bidderTeam) {
    return true;
  }
  const oppTeam = (1 - team) as TeamIndex;
  if (state.roundPoints[team] < state.roundPoints[oppTeam]) {
    return true;
  }
  if (state.netScore > 0 && team === 1) return true;
  if (state.netScore < 0 && team === 0) return true;
  return false;
}

export function surrenderRound(state: TwentyNineState, seat: SeatIndex): TwentyNineState {
  if (!canSurrender(state, seat)) {
    throw new Error('You cannot surrender right now.');
  }
  const surrenderingTeam = getTeamForSeat(seat);
  const winningTeam = (1 - surrenderingTeam) as TeamIndex;
  const stake = state.roundStake;
  const nextNetScore = applyRoundNetScore(
    state.netScore,
    winningTeam,
    stake,
    state.targetMatchPoints
  );
  const matchFinished = Math.abs(nextNetScore) >= state.targetMatchPoints;

  const playerName = state.seats[seat]?.name ?? `Seat ${seat + 1}`;
  const surrenderTeamLabel = surrenderingTeam === 0 ? 'Red Team' : 'Black Team';
  const winningTeamLabel = winningTeam === 0 ? 'Red Team (Crimson)' : 'Black Team (Obsidian)';
  const bidderSeat = state.highestBidderSeat ?? seat;

  const pipState = getSixCardPipState(nextNetScore);
  const pipSummary =
    pipState.leadingTeam === 0
      ? `${pipState.redHeartsRevealed}♥ revealed`
      : pipState.leadingTeam === 1
        ? `${pipState.blackSpadesRevealed}♠ revealed`
        : 'Cards tied at 0';

  const summary: RoundSummary = {
    roundNumber: Math.max(1, state.roundNumber),
    bidderSeat,
    bidderTeam: getTeamForSeat(bidderSeat),
    baseBid: state.highestBid ?? 16,
    effectiveBid: state.highestBid !== null ? getEffectiveBid(state) : 16,
    roundStake: stake,
    isSingleHand: state.isSingleHand,
    isSurrender: true,
    surrenderedByTeam: surrenderingTeam,
    trumpMode: state.trumpMode ?? 'suit',
    singleHandTricksWon: state.tricksCompleted,
    marriageDeclaredByTeam: state.marriageDeclaredByTeam,
    trumpSuit: state.trumpSuit,
    pointsByTeam: state.roundPoints,
    contractMade: false,
    roundWinnerTeam: winningTeam,
    netScoreAfter: nextNetScore,
  };

  return {
    ...state,
    phase: matchFinished ? 'match_over' : 'round_over',
    currentTrick: [],
    trumpRevealed: true,
    netScore: nextNetScore,
    lastRoundSummary: summary,
    statusMessage: matchFinished
      ? `${playerName} (${surrenderTeamLabel}) surrendered! ${winningTeamLabel} wins the Match (${pipSummary})!`
      : `${playerName} (${surrenderTeamLabel}) surrendered! ${winningTeamLabel} takes ${stake} pt${stake > 1 ? 's' : ''} (${pipSummary}).`,
  };
}

export function applyRoundNetScore(
  currentNetScore: number,
  roundWinnerTeam: TeamIndex,
  stake: number,
  targetMatchPoints = 6
): number {
  const delta = roundWinnerTeam === 0 ? stake : -stake;
  return Math.max(-targetMatchPoints, Math.min(targetMatchPoints, currentNetScore + delta));
}

export function advanceAfterTrickPause(state: TwentyNineState): TwentyNineState {
  if (state.phase !== 'trick_pause' || !state.lastTrick) {
    return state;
  }

  const nextTricksCompleted = state.tricksCompleted + 1;

  if (state.isSingleHand && state.singleHandCallerSeat !== null) {
    const callerSeat = state.singleHandCallerSeat;
    const callerWonTrick = state.lastTrick.winnerSeat === callerSeat;

    if (callerWonTrick && nextTricksCompleted < 8) {
      const winnerName = state.seats[callerSeat]?.name ?? `Seat ${callerSeat + 1}`;
      return {
        ...state,
        phase: 'playing',
        currentTrick: [],
        tricksCompleted: nextTricksCompleted,
        leadSeat: callerSeat,
        turnSeat: callerSeat,
        statusMessage: `${winnerName} leads Trick ${nextTricksCompleted + 1}/8 (Single Hand).`,
      };
    }

    // Single Hand either succeeded (8/8 tricks) or failed immediately when an opponent won a trick!
    const callerTeam = getTeamForSeat(callerSeat);
    const contractMade = callerWonTrick && nextTricksCompleted === 8;
    const roundWinnerTeam: TeamIndex = contractMade ? callerTeam : ((1 - callerTeam) as TeamIndex);
    const nextNetScore = applyRoundNetScore(
      state.netScore,
      roundWinnerTeam,
      state.roundStake,
      state.targetMatchPoints
    );
    const matchFinished = Math.abs(nextNetScore) >= state.targetMatchPoints;
    const tricksWonByCaller = callerWonTrick ? nextTricksCompleted : nextTricksCompleted - 1;

    const summary: RoundSummary = {
      roundNumber: state.roundNumber,
      bidderSeat: callerSeat,
      bidderTeam: callerTeam,
      baseBid: 29,
      effectiveBid: 29,
      roundStake: state.roundStake,
      isSingleHand: true,
      trumpMode: 'single_hand',
      singleHandTricksWon: tricksWonByCaller,
      marriageDeclaredByTeam: null,
      trumpSuit: null,
      pointsByTeam: state.roundPoints,
      contractMade,
      roundWinnerTeam,
      netScoreAfter: nextNetScore,
    };

    const winningTeamLabel = roundWinnerTeam === 0 ? 'Red Team (Crimson)' : 'Black Team (Obsidian)';
    const pipState = getSixCardPipState(nextNetScore);
    const pipSummary =
      pipState.leadingTeam === 0
        ? `${pipState.redHeartsRevealed}♥ revealed`
        : pipState.leadingTeam === 1
          ? `${pipState.blackSpadesRevealed}♠ revealed`
          : 'Cards tied at 0';

    return {
      ...state,
      phase: matchFinished ? 'match_over' : 'round_over',
      currentTrick: [],
      tricksCompleted: nextTricksCompleted,
      netScore: nextNetScore,
      lastRoundSummary: summary,
      statusMessage: matchFinished
        ? `${winningTeamLabel} wins the Match (${pipSummary})!`
        : `${winningTeamLabel} takes ${state.roundStake} pts (${pipSummary}).`,
    };
  }

  // Last-2-card rule: if no one viewed the trump card before everyone played their 2nd-last card (Trick 7), the round is a draw (0 pts).
  if (nextTricksCompleted === 7 && !state.isSingleHand && !state.trumpRevealed) {
    const bidderSeat = state.highestBidderSeat ?? 0;
    const bidderTeam = getTeamForSeat(bidderSeat);
    const effectiveBid = getEffectiveBid(state);
    const summary: RoundSummary = {
      roundNumber: state.roundNumber,
      bidderSeat,
      bidderTeam,
      baseBid: state.highestBid ?? 16,
      effectiveBid,
      roundStake: 0,
      isSingleHand: false,
      isDraw: true,
      drawReason: 'No one viewed the trump card before the 2nd-last card was played.',
      trumpMode: state.trumpMode ?? 'suit',
      singleHandTricksWon: 0,
      marriageDeclaredByTeam: state.marriageDeclaredByTeam,
      trumpSuit: state.trumpSuit,
      pointsByTeam: state.roundPoints,
      contractMade: false,
      roundWinnerTeam: bidderTeam,
      netScoreAfter: state.netScore,
    };
    return {
      ...state,
      phase: 'round_over',
      currentTrick: [],
      tricksCompleted: 7,
      trumpRevealed: true,
      lastRoundSummary: summary,
      statusMessage: 'Round Drawn (0 pts) — No one saw the trump card before the 2nd-last card.',
    };
  }

  if (nextTricksCompleted < 8) {
    const winnerSeat = state.lastTrick.winnerSeat;
    const winnerName = state.seats[winnerSeat]?.name ?? `Seat ${winnerSeat + 1}`;
    const hiddenWarning =
      nextTricksCompleted === 6 && !state.trumpRevealed
        ? ' (Last 2 cards · reveal trump or round draws!)'
        : '';
    return {
      ...state,
      phase: 'playing',
      currentTrick: [],
      tricksCompleted: nextTricksCompleted,
      leadSeat: winnerSeat,
      turnSeat: winnerSeat,
      statusMessage: `${winnerName} leads Trick ${nextTricksCompleted + 1}${hiddenWarning}.`,
    };
  }

  // Standard 4-player Round completed!
  const bidderSeat = state.highestBidderSeat ?? 0;
  const bidderTeam = getTeamForSeat(bidderSeat);
  const effectiveBid = getEffectiveBid(state);
  const contractMade = state.roundPoints[bidderTeam] >= effectiveBid;
  const roundWinnerTeam: TeamIndex = contractMade ? bidderTeam : ((1 - bidderTeam) as TeamIndex);

  const nextNetScore = applyRoundNetScore(
    state.netScore,
    roundWinnerTeam,
    state.roundStake,
    state.targetMatchPoints
  );

  const matchFinished = Math.abs(nextNetScore) >= state.targetMatchPoints;

  const summary: RoundSummary = {
    roundNumber: state.roundNumber,
    bidderSeat,
    bidderTeam,
    baseBid: state.highestBid ?? 16,
    effectiveBid,
    roundStake: state.roundStake,
    isSingleHand: false,
    trumpMode: state.trumpMode ?? 'suit',
    singleHandTricksWon: 0,
    marriageDeclaredByTeam: state.marriageDeclaredByTeam,
    trumpSuit: state.trumpSuit,
    pointsByTeam: state.roundPoints,
    contractMade,
    roundWinnerTeam,
    netScoreAfter: nextNetScore,
  };

  const winningTeamLabel = roundWinnerTeam === 0 ? 'Red Team (Crimson)' : 'Black Team (Obsidian)';
  const pipState = getSixCardPipState(nextNetScore);
  const pipSummary =
    pipState.leadingTeam === 0
      ? `${pipState.redHeartsRevealed}♥ revealed`
      : pipState.leadingTeam === 1
        ? `${pipState.blackSpadesRevealed}♠ revealed`
        : 'Cards tied at 0';

  return {
    ...state,
    phase: matchFinished ? 'match_over' : 'round_over',
    currentTrick: [],
    tricksCompleted: 8,
    trumpRevealed: true,
    netScore: nextNetScore,
    lastRoundSummary: summary,
    statusMessage: matchFinished
      ? `${winningTeamLabel} wins the Match (${pipSummary})!`
      : `${winningTeamLabel} takes ${state.roundStake} pt${state.roundStake > 1 ? 's' : ''} (${pipSummary}).`,
  };
}

export function resetMatch(state: TwentyNineState): TwentyNineState {
  const cleared: TwentyNineState = {
    ...state,
    roundNumber: 0,
    dealerSeat: 0,
    netScore: 0,
    lastRoundSummary: null,
  };
  return startRound(cleared);
}

// ---------- Bot Decision Heuristics ----------

export function chooseBotBid(state: TwentyNineState, seat: SeatIndex): { action: 'bid'; amount: number } | { action: 'pass' } {
  const hand = state.hands[seat];
  const minBid = getMinimumNextBid(state, seat);
  const totalPts = hand.reduce((acc, c) => acc + getCardPoints(c), 0);
  const suitCounts: Record<Suit, number> = { S: 0, H: 0, D: 0, C: 0 };
  for (const c of hand) suitCounts[c.suit]++;
  const maxSuitCount = Math.max(...Object.values(suitCounts));

  let maxWilling = 15;
  if (totalPts >= 4 || maxSuitCount >= 3) maxWilling = 17;
  if (totalPts >= 6 && maxSuitCount >= 2) maxWilling = 19;
  if (totalPts >= 8 && maxSuitCount >= 3) maxWilling = 21;

  if (minBid <= maxWilling) {
    return { action: 'bid', amount: minBid };
  }
  return { action: 'pass' };
}

export function chooseBotTrump(state: TwentyNineState, seat: SeatIndex): Suit {
  const hand = state.hands[seat];
  let bestSuit: Suit = 'S';
  let bestScore = -1;
  for (const suit of SUITS) {
    const suitCards = hand.filter((c) => c.suit === suit);
    const score = suitCards.length * 4 + suitCards.reduce((s, c) => s + getCardPoints(c) + (c.rank === 'J' ? 3 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSuit = suit;
    }
  }
  return bestSuit;
}

export function chooseBotAction(
  state: TwentyNineState,
  seat: SeatIndex
): { revealFirst: boolean; declareMarriageFirst: boolean; cardId: string } {
  const hand = state.hands[seat];
  const legal = getLegalCards(state, seat);
  const myTeam = getTeamForSeat(seat);
  const declareMarriageFirst = canDeclareMarriage(state, seat);

  if (state.currentTrick.length === 0) {
    const jacks = legal.filter((c) => c.rank === 'J');
    if (jacks.length > 0) {
      return { revealFirst: false, declareMarriageFirst, cardId: jacks[0].id };
    }
    const sorted = [...legal].sort((a, b) => getCardPoints(a) - getCardPoints(b) || RANK_STRENGTH[a.rank] - RANK_STRENGTH[b.rank]);
    return { revealFirst: false, declareMarriageFirst, cardId: sorted[0].id };
  }

  const effectiveTrump = state.isSingleHand ? null : state.trumpSuit;
  const effectiveTrumpRevealed = state.isSingleHand ? false : state.trumpRevealed;
  const lastCardIdx = state.isSingleHand ? 2 : 3;

  const curWinnerSeat = resolveTrickWinner(state.currentTrick, effectiveTrump, effectiveTrumpRevealed);
  const partnerWinning = getTeamForSeat(curWinnerSeat) === myTeam;
  const trickPointsSoFar = state.currentTrick.reduce((s, p) => s + getCardPoints(p.card), 0);

  let revealFirst = false;
  if (canRevealTrump(state, seat)) {
    if (state.trumpMode === 'joker_no_trump') {
      if (!partnerWinning && (trickPointsSoFar >= 2 || state.currentTrick.length === lastCardIdx)) {
        revealFirst = true;
      }
    } else if (effectiveTrump) {
      const hasTrump = hand.some((c) => c.suit === effectiveTrump);
      if (hasTrump && !partnerWinning && (trickPointsSoFar >= 2 || state.currentTrick.length === lastCardIdx)) {
        revealFirst = true;
      }
    }
  }

  const effectiveRevealed = effectiveTrumpRevealed || revealFirst;

  if (partnerWinning) {
    if (state.currentTrick.length === lastCardIdx && legal.some((c) => c.rank === '10' || c.rank === 'A')) {
      const feed = legal.find((c) => c.rank === '10') ?? legal.find((c) => c.rank === 'A')!;
      return { revealFirst: false, declareMarriageFirst, cardId: feed.id };
    }
    const lowest = [...legal].sort((a, b) => getCardPoints(a) - getCardPoints(b) || RANK_STRENGTH[a.rank] - RANK_STRENGTH[b.rank]);
    return { revealFirst: false, declareMarriageFirst, cardId: lowest[0].id };
  }

  const winningCandidates = legal.filter((card) => {
    const simulated = [...state.currentTrick, { seat, card }];
    return resolveTrickWinner(simulated, effectiveTrump, effectiveRevealed) === seat;
  });

  if (winningCandidates.length > 0) {
    const cheapestWin = [...winningCandidates].sort(
      (a, b) => RANK_STRENGTH[a.rank] - RANK_STRENGTH[b.rank]
    );
    return { revealFirst, declareMarriageFirst, cardId: cheapestWin[0].id };
  }

  const discard = [...legal].sort(
    (a, b) => getCardPoints(a) - getCardPoints(b) || RANK_STRENGTH[a.rank] - RANK_STRENGTH[b.rank]
  );
  return { revealFirst: false, declareMarriageFirst, cardId: discard[0].id };
}

// ---------- Sanitized Client Projection ----------

export function getClientGameView(state: TwentyNineState, playerId: string): ClientGameView {
  const seatObj = state.seats.find((s) => s?.playerId === playerId) ?? null;
  const mySeat: SeatIndex | null = seatObj ? seatObj.seat : null;
  const myHand = mySeat !== null ? state.hands[mySeat] : [];

  const canSeeTrump =
    state.trumpRevealed ||
    (state.trumpMode !== 'seventh_card' &&
      mySeat !== null &&
      state.highestBidderSeat === mySeat &&
      (state.trumpSuit !== null || state.trumpMode === 'joker_no_trump'));

  const legalCardIds =
    mySeat !== null && state.phase === 'playing' && state.turnSeat === mySeat
      ? getLegalCards(state, mySeat).map((c) => c.id)
      : [];

  return {
    roomCode: state.roomCode,
    hostPlayerId: state.hostPlayerId,
    myPlayerId: playerId,
    mySeat,
    phase: state.phase,
    seats: state.seats,
    handCounts: [
      state.hands[0].length,
      state.hands[1].length,
      state.hands[2].length,
      state.hands[3].length,
    ],
    myHand,
    roundNumber: state.roundNumber,
    dealerSeat: state.dealerSeat,
    bidTurnSeat: state.bidTurnSeat,
    duelDefenderSeat: state.duelDefenderSeat,
    duelChallengerSeat: state.duelChallengerSeat,
    highestBid: state.highestBid,
    highestBidderSeat: state.highestBidderSeat,
    passedSeats: state.passedSeats,
    bidHistory: state.bidHistory,
    trumpMode: state.trumpMode,
    trumpSuit: canSeeTrump ? state.trumpSuit : null,
    seventhCard: state.trumpRevealed ? state.seventhCard : null,
    trumpRevealed: state.trumpRevealed,
    trumpRevealedBySeat: state.trumpRevealedBySeat,
    marriageDeclaredByTeam: state.marriageDeclaredByTeam,
    roundStake: state.roundStake,
    doubledByTeam: state.doubledByTeam,
    isSingleHand: state.isSingleHand,
    singleHandCallerSeat: state.singleHandCallerSeat,
    singleHandPartnerSeat: state.singleHandPartnerSeat,
    leadSeat: state.leadSeat,
    turnSeat: state.turnSeat,
    currentTrick: state.currentTrick,
    tricksCompleted: state.tricksCompleted,
    roundPoints: state.roundPoints,
    lastTrick: state.lastTrick,
    netScore: state.netScore,
    targetMatchPoints: state.targetMatchPoints,
    lastRoundSummary: state.lastRoundSummary,
    statusMessage: state.statusMessage,
    legalCardIds,
    canRevealTrump: mySeat !== null ? canRevealTrump(state, mySeat) : false,
    canDeclareMarriage: mySeat !== null ? canDeclareMarriage(state, mySeat) : false,
    canDoubleStake: mySeat !== null ? canDoubleStake(state, mySeat) : false,
    canCallSingleHand: mySeat !== null ? canCallSingleHand(state, mySeat) : false,
    canMatchCurrentBid: mySeat !== null ? canMatchBid(state, mySeat) : false,
    canSurrender: mySeat !== null ? canSurrender(state, mySeat) : false,
    minBidAmount: mySeat !== null ? getMinimumNextBid(state, mySeat) : getMinimumNextBid(state),
  };
}

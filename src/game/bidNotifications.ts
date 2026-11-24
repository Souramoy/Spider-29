import { getTeamForSeat, type ClientGameView, type GamePhase, type SeatIndex, type TeamIndex } from './twentyNine';

export type BidNotificationKind = 'bid' | 'match' | 'pass' | 'won' | 'single_hand';

export interface BidNotificationEvent {
  id: string;
  roundNumber: number;
  seat: SeatIndex;
  playerName: string;
  team: TeamIndex;
  kind: BidNotificationKind;
  amount?: number;
  title: string;
  body: string;
  badgeText: string;
  createdAt: number;
}

export interface BidStateSnapshot {
  roomCode: string;
  roundNumber: number;
  bidHistoryLength: number;
  phase: GamePhase;
  isSingleHand: boolean;
}

export function createBidSnapshot(view: ClientGameView): BidStateSnapshot {
  return {
    roomCode: view.roomCode,
    roundNumber: view.roundNumber,
    bidHistoryLength: view.bidHistory.length,
    phase: view.phase,
    isSingleHand: view.isSingleHand,
  };
}

function getSeatDisplayName(view: ClientGameView, seat: SeatIndex): string {
  return view.seats[seat]?.name ?? `Seat ${seat + 1}`;
}

function getTeamShortLabel(team: TeamIndex): string {
  return team === 0 ? 'Red 6♥' : 'Black 6♠';
}

export function formatBidEntry(
  view: ClientGameView,
  entry: ClientGameView['bidHistory'][number],
  index: number,
  now = Date.now()
): BidNotificationEvent {
  const playerName = getSeatDisplayName(view, entry.seat);
  const team = getTeamForSeat(entry.seat);
  const teamLabel = getTeamShortLabel(team);

  if (entry.action === 'bid') {
    const amount = entry.amount ?? 16;
    return {
      id: `${view.roomCode}-r${view.roundNumber}-b${index}-${entry.seat}`,
      roundNumber: view.roundNumber,
      seat: entry.seat,
      playerName,
      team,
      kind: 'bid',
      amount,
      title: `${playerName} bid ${amount}`,
      body: `${playerName} (${teamLabel}) bid ${amount}`,
      badgeText: `BID ${amount}`,
      createdAt: now,
    };
  }

  if (entry.action === 'match') {
    const amount = entry.amount ?? view.highestBid ?? 16;
    return {
      id: `${view.roomCode}-r${view.roundNumber}-m${index}-${entry.seat}`,
      roundNumber: view.roundNumber,
      seat: entry.seat,
      playerName,
      team,
      kind: 'match',
      amount,
      title: `${playerName} matched ${amount}`,
      body: `${playerName} (${teamLabel}) matched ${amount}`,
      badgeText: `MATCH ${amount}`,
      createdAt: now,
    };
  }

  return {
    id: `${view.roomCode}-r${view.roundNumber}-p${index}-${entry.seat}`,
    roundNumber: view.roundNumber,
    seat: entry.seat,
    playerName,
    team,
    kind: 'pass',
    title: `${playerName} passed`,
    body: `${playerName} (${teamLabel}) passed`,
    badgeText: 'PASS',
    createdAt: now,
  };
}

export function diffBidNotifications(
  prevSnapshot: BidStateSnapshot | null,
  nextView: ClientGameView,
  now = Date.now()
): { events: BidNotificationEvent[]; nextSnapshot: BidStateSnapshot } {
  const nextSnapshot = createBidSnapshot(nextView);

  if (!prevSnapshot || prevSnapshot.roomCode !== nextView.roomCode) {
    return { events: [], nextSnapshot };
  }

  const isNewRoundOrRedeal =
    nextView.roundNumber !== prevSnapshot.roundNumber ||
    nextView.bidHistory.length < prevSnapshot.bidHistoryLength;

  const startIndex = isNewRoundOrRedeal ? 0 : prevSnapshot.bidHistoryLength;
  const events: BidNotificationEvent[] = [];

  for (let i = startIndex; i < nextView.bidHistory.length; i++) {
    events.push(formatBidEntry(nextView, nextView.bidHistory[i], i, now));
  }

  const enteredSingleHand = nextView.isSingleHand && (isNewRoundOrRedeal || !prevSnapshot.isSingleHand);
  if (enteredSingleHand && nextView.singleHandCallerSeat !== null) {
    const seat = nextView.singleHandCallerSeat;
    const playerName = getSeatDisplayName(nextView, seat);
    const team = getTeamForSeat(seat);
    events.push({
      id: `${nextView.roomCode}-r${nextView.roundNumber}-sh-${seat}`,
      roundNumber: nextView.roundNumber,
      seat,
      playerName,
      team,
      kind: 'single_hand',
      amount: 29,
      title: `${playerName} called Single Hand!`,
      body: `${playerName} (${getTeamShortLabel(team)}) called Single Hand (3 pts)`,
      badgeText: 'SINGLE HAND',
      createdAt: now,
    });
  } else if (
    nextView.phase === 'trump_select' &&
    (isNewRoundOrRedeal || prevSnapshot.phase === 'bidding') &&
    nextView.highestBidderSeat !== null &&
    nextView.highestBid !== null
  ) {
    const seat = nextView.highestBidderSeat;
    const playerName = getSeatDisplayName(nextView, seat);
    const team = getTeamForSeat(seat);
    const amount = nextView.highestBid;
    events.push({
      id: `${nextView.roomCode}-r${nextView.roundNumber}-won-${seat}-${amount}`,
      roundNumber: nextView.roundNumber,
      seat,
      playerName,
      team,
      kind: 'won',
      amount,
      title: `${playerName} won bid at ${amount}`,
      body: `${playerName} (${getTeamShortLabel(team)}) won the bid at ${amount}`,
      badgeText: `WON ${amount}`,
      createdAt: now,
    });
  }

  return { events, nextSnapshot };
}

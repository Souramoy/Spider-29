import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialRoomState,
  getClientGameView,
  passBid,
  placeBid,
  callSingleHand,
  startRound,
  type SeatIndex,
} from './twentyNine';
import { createBidSnapshot, diffBidNotifications } from './bidNotifications';

function makePlayingRoom() {
  let state = createInitialRoomState('PUSH99', { playerId: 'p0', name: 'Arjun' });
  state.seats[1] = { seat: 1, playerId: 'p1', name: 'Miles', isBot: false, connected: true, ready: true };
  state.seats[2] = { seat: 2, playerId: 'p2', name: 'Gwen', isBot: false, connected: true, ready: true };
  state.seats[3] = { seat: 3, playerId: 'p3', name: 'Miguel', isBot: false, connected: true, ready: true };
  state = startRound(state);
  return state;
}

test('diffBidNotifications emits bid, match, pass, and bid-won notifications accurately', () => {
  let state = makePlayingRoom();
  const s0 = state.bidTurnSeat;
  const s1 = ((s0 + 1) % 4) as SeatIndex;
  const s2 = ((s0 + 2) % 4) as SeatIndex;
  const s3 = ((s0 + 3) % 4) as SeatIndex;

  let snap = createBidSnapshot(getClientGameView(state, 'p0'));

  // 1. Opener bids 17
  state = placeBid(state, s0, 17);
  let res = diffBidNotifications(snap, getClientGameView(state, 'p0'), 1000);
  snap = res.nextSnapshot;
  assert.equal(res.events.length, 1);
  assert.equal(res.events[0].kind, 'bid');
  assert.equal(res.events[0].amount, 17);
  assert.match(res.events[0].title, /bid 17/);

  // 2. Challenger bids 18
  state = placeBid(state, s1, 18);
  res = diffBidNotifications(snap, getClientGameView(state, 'p0'), 2000);
  snap = res.nextSnapshot;
  assert.equal(res.events.length, 1);
  assert.equal(res.events[0].kind, 'bid');
  assert.equal(res.events[0].amount, 18);

  // 3. Defender matches 18
  state = placeBid(state, s0, 18);
  res = diffBidNotifications(snap, getClientGameView(state, 'p0'), 3000);
  snap = res.nextSnapshot;
  assert.equal(res.events.length, 1);
  assert.equal(res.events[0].kind, 'match');
  assert.equal(res.events[0].amount, 18);
  assert.match(res.events[0].title, /matched 18/);

  // 4. Challenger passes -> circle moves to s2
  state = passBid(state, s1);
  res = diffBidNotifications(snap, getClientGameView(state, 'p0'), 4000);
  snap = res.nextSnapshot;
  assert.equal(res.events.length, 1);
  assert.equal(res.events[0].kind, 'pass');

  // 5. Remaining two players pass -> s0 wins bid at 18
  state = passBid(state, s2);
  res = diffBidNotifications(snap, getClientGameView(state, 'p0'), 5000);
  snap = res.nextSnapshot;
  assert.equal(res.events.length, 1);

  state = passBid(state, s3);
  res = diffBidNotifications(snap, getClientGameView(state, 'p0'), 6000);
  snap = res.nextSnapshot;
  assert.equal(res.events.length, 2);
  assert.equal(res.events[0].kind, 'pass');
  assert.equal(res.events[1].kind, 'won');
  assert.equal(res.events[1].amount, 18);
  assert.match(res.events[1].title, /won bid at 18/);
});

test('diffBidNotifications emits single_hand event and resets cleanly on redeal', () => {
  let state = makePlayingRoom();
  const s0 = state.bidTurnSeat;
  let snap = createBidSnapshot(getClientGameView(state, 'p0'));

  state = callSingleHand(state, s0);
  const res = diffBidNotifications(snap, getClientGameView(state, 'p0'), 1000);
  assert.equal(res.events.length, 1);
  assert.equal(res.events[0].kind, 'single_hand');
  assert.match(res.events[0].title, /Single Hand/);
});

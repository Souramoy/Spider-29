import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  advanceAfterTrickPause,
  callSingleHand,
  chooseBotAction,
  chooseBotBid,
  chooseBotTrump,
  createInitialRoomState,
  declareMarriage,
  doubleStake,
  getClientGameView,
  passBid,
  placeBid,
  playCard,
  resetMatch,
  revealTrump,
  selectTrump,
  startRound,
  SUITS,
  type SeatIndex,
  type Suit,
  type TwentyNineState,
} from './src/game/twentyNine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const BOT_NAMES = ['Miles (Bot)', 'Gwen (Bot)', 'Miguel (Bot)', 'Hobie (Bot)'];

interface VoicePeerState {
  playerId: string;
  name: string;
  muted: boolean;
}

interface ServerRoom {
  code: string;
  state: TwentyNineState;
  clients: Map<string, WebSocket>;
  voicePeers: Map<string, VoicePeerState>;
  pendingTimer: NodeJS.Timeout | null;
  lastActivityAt: number;
}

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function sanitizeName(raw: unknown, fallback = 'Player'): string {
  if (typeof raw !== 'string') return fallback;
  const cleaned = raw.replace(/\s+/g, ' ').trim().slice(0, 20);
  return cleaned.length > 0 ? cleaned : fallback;
}

function sendJson(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastRoomState(room: ServerRoom): void {
  room.lastActivityAt = Date.now();
  for (const [playerId, ws] of room.clients.entries()) {
    sendJson(ws, {
      type: 'room:state',
      state: getClientGameView(room.state, playerId),
    });
  }
}

function broadcastVoicePeers(room: ServerRoom): void {
  const peers = Array.from(room.voicePeers.values());
  for (const ws of room.clients.values()) {
    sendJson(ws, {
      type: 'voice:peers',
      peers,
    });
  }
}

function clearRoomTimer(room: ServerRoom): void {
  if (room.pendingTimer) {
    clearTimeout(room.pendingTimer);
    room.pendingTimer = null;
  }
}

function scheduleAutomation(room: ServerRoom): void {
  clearRoomTimer(room);

  if (room.state.phase === 'trick_pause') {
    room.pendingTimer = setTimeout(() => {
      room.pendingTimer = null;
      room.state = advanceAfterTrickPause(room.state);
      broadcastRoomState(room);
      scheduleAutomation(room);
    }, 1350);
    return;
  }

  let activeSeat: SeatIndex | null = null;
  if (room.state.phase === 'bidding') activeSeat = room.state.bidTurnSeat;
  else if (room.state.phase === 'trump_select') activeSeat = room.state.highestBidderSeat;
  else if (room.state.phase === 'playing') activeSeat = room.state.turnSeat;

  if (activeSeat === null) return;
  if (room.state.isSingleHand && activeSeat === room.state.singleHandPartnerSeat) return;
  const seatPlayer = room.state.seats[activeSeat];
  if (!seatPlayer || !seatPlayer.isBot) return;

  const hasHuman = room.state.seats.some((s) => s && !s.isBot);
  const isTrick1Opener =
    room.state.phase === 'playing' &&
    room.state.tricksCompleted === 0 &&
    room.state.currentTrick.length === 0 &&
    !room.state.isSingleHand;
  const botDelayMs = hasHuman && isTrick1Opener ? 1800 : 650;

  room.pendingTimer = setTimeout(() => {
    room.pendingTimer = null;
    try {
      if (room.state.phase === 'bidding' && room.state.bidTurnSeat === activeSeat) {
        const decision = chooseBotBid(room.state, activeSeat);
        room.state =
          decision.action === 'bid'
            ? placeBid(room.state, activeSeat, decision.amount)
            : passBid(room.state, activeSeat);
      } else if (room.state.phase === 'trump_select' && room.state.highestBidderSeat === activeSeat) {
        const suit = chooseBotTrump(room.state, activeSeat);
        room.state = selectTrump(room.state, activeSeat, suit);
      } else if (room.state.phase === 'playing' && room.state.turnSeat === activeSeat) {
        const action = chooseBotAction(room.state, activeSeat);
        if (action.revealFirst) {
          room.state = revealTrump(room.state, activeSeat);
        }
        if (action.declareMarriageFirst) {
          room.state = declareMarriage(room.state, activeSeat);
        }
        room.state = playCard(room.state, activeSeat, action.cardId);
      }
      broadcastRoomState(room);
      scheduleAutomation(room);
    } catch (err) {
      console.error('Bot automation error:', err);
    }
  }, botDelayMs);
}

function fillSeatsWithBots(room: ServerRoom): void {
  const nextSeats = [...room.state.seats] as TwentyNineState['seats'];
  let botIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (!nextSeats[i]) {
      const seat = i as SeatIndex;
      nextSeats[i] = {
        seat,
        playerId: `bot-${room.code}-${seat}`,
        name: BOT_NAMES[botIdx % BOT_NAMES.length],
        isBot: true,
        connected: true,
        ready: true,
      };
      botIdx++;
    }
  }
  room.state = {
    ...room.state,
    seats: nextSeats,
    statusMessage: 'All 4 seats filled. Ready to deal!',
  };
}

// Cleanup stale rooms every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (room.clients.size === 0 && room.lastActivityAt < cutoff) {
      clearRoomTimer(room);
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        sendJson(ws, { type: 'error', message: 'Invalid message format.' });
        return;
      }

      const type = typeof msg.type === 'string' ? msg.type : '';

      try {
        if (type === 'room:create') {
          const playerId = typeof msg.playerId === 'string' && msg.playerId.trim() ? msg.playerId.trim() : `p-${Date.now()}`;
          const name = sanitizeName(msg.name, 'Spider Host');
          const quickBots = msg.quickBots === true;

          const code = generateRoomCode();
          const state = createInitialRoomState(code, { playerId, name });
          const room: ServerRoom = {
            code,
            state,
            clients: new Map([[playerId, ws]]),
            voicePeers: new Map(),
            pendingTimer: null,
            lastActivityAt: Date.now(),
          };
          rooms.set(code, room);
          currentRoomCode = code;
          currentPlayerId = playerId;

          if (quickBots) {
            fillSeatsWithBots(room);
            room.state = startRound(room.state);
          }

          broadcastRoomState(room);
          broadcastVoicePeers(room);
          scheduleAutomation(room);
          return;
        }

        if (type === 'room:join') {
          const roomCode = typeof msg.roomCode === 'string' ? msg.roomCode.trim().toUpperCase() : '';
          const playerId = typeof msg.playerId === 'string' && msg.playerId.trim() ? msg.playerId.trim() : '';
          const name = sanitizeName(msg.name, 'Player');

          if (!roomCode || !playerId) {
            sendJson(ws, { type: 'error', message: 'Room code and player ID are required.' });
            return;
          }

          const room = rooms.get(roomCode);
          if (!room) {
            sendJson(ws, { type: 'error', message: `Room "${roomCode}" not found. Check the code and try again.` });
            return;
          }

          const existingSeat = room.state.seats.find((s) => s?.playerId === playerId);
          if (existingSeat) {
            const nextSeats = [...room.state.seats] as TwentyNineState['seats'];
            nextSeats[existingSeat.seat] = {
              ...existingSeat,
              name,
              connected: true,
            };
            room.state = { ...room.state, seats: nextSeats };
          } else {
            const emptyIndex = room.state.seats.findIndex((s) => s === null);
            if (emptyIndex === -1) {
              sendJson(ws, { type: 'error', message: `Room "${roomCode}" is already full (4/4 players).` });
              return;
            }
            const seatIdx = emptyIndex as SeatIndex;
            const nextSeats = [...room.state.seats] as TwentyNineState['seats'];
            nextSeats[seatIdx] = {
              seat: seatIdx,
              playerId,
              name,
              isBot: false,
              connected: true,
              ready: true,
            };
            room.state = {
              ...room.state,
              seats: nextSeats,
              statusMessage: `${name} joined Seat ${seatIdx + 1}.`,
            };
          }

          room.clients.set(playerId, ws);
          currentRoomCode = roomCode;
          currentPlayerId = playerId;

          broadcastRoomState(room);
          broadcastVoicePeers(room);
          return;
        }

        if (type === 'room:leave') {
          if (currentRoomCode && currentPlayerId) {
            const room = rooms.get(currentRoomCode);
            if (room) {
              room.clients.delete(currentPlayerId);
              if (room.voicePeers.has(currentPlayerId)) {
                room.voicePeers.delete(currentPlayerId);
                broadcastVoicePeers(room);
              }
              if (room.state.phase === 'lobby') {
                const nextSeats = [...room.state.seats] as TwentyNineState['seats'];
                const seatIdx = nextSeats.findIndex((s) => s?.playerId === currentPlayerId);
                if (seatIdx !== -1) {
                  nextSeats[seatIdx] = null;
                  room.state = { ...room.state, seats: nextSeats };
                }
              } else {
                const nextSeats = [...room.state.seats] as TwentyNineState['seats'];
                const seatIdx = nextSeats.findIndex((s) => s?.playerId === currentPlayerId);
                if (seatIdx !== -1 && nextSeats[seatIdx]) {
                  nextSeats[seatIdx] = { ...nextSeats[seatIdx]!, connected: false };
                  room.state = { ...room.state, seats: nextSeats };
                }
              }
              broadcastRoomState(room);
            }
          }
          currentRoomCode = null;
          currentPlayerId = null;
          return;
        }

        if (!currentRoomCode || !currentPlayerId) {
          sendJson(ws, { type: 'error', message: 'You must join a room first.' });
          return;
        }

        const room = rooms.get(currentRoomCode);
        if (!room) {
          sendJson(ws, { type: 'error', message: 'Room no longer exists.' });
          return;
        }

        const mySeatObj = room.state.seats.find((s) => s?.playerId === currentPlayerId) ?? null;
        const mySeat = mySeatObj ? mySeatObj.seat : null;

        // Voice Signaling
        if (type === 'voice:join') {
          const playerName = mySeatObj?.name ?? 'Player';
          room.voicePeers.set(currentPlayerId, {
            playerId: currentPlayerId,
            name: playerName,
            muted: msg.muted === true,
          });
          broadcastVoicePeers(room);
          return;
        }

        if (type === 'voice:leave') {
          room.voicePeers.delete(currentPlayerId);
          broadcastVoicePeers(room);
          return;
        }

        if (type === 'voice:mute_state') {
          const existing = room.voicePeers.get(currentPlayerId);
          if (existing) {
            room.voicePeers.set(currentPlayerId, { ...existing, muted: msg.muted === true });
            broadcastVoicePeers(room);
          }
          return;
        }

        if (type === 'voice:signal') {
          const targetPlayerId = typeof msg.targetPlayerId === 'string' ? msg.targetPlayerId : '';
          const targetWs = room.clients.get(targetPlayerId);
          if (targetWs && msg.signal) {
            sendJson(targetWs, {
              type: 'voice:signal',
              fromPlayerId: currentPlayerId,
              signal: msg.signal,
            });
          }
          return;
        }

        // Lobby Actions
        if (type === 'room:take_seat') {
          if (room.state.phase !== 'lobby' || mySeat === null) return;
          const targetSeat = Number(msg.seat);
          if (![0, 1, 2, 3].includes(targetSeat)) return;
          if (room.state.seats[targetSeat] !== null) {
            sendJson(ws, { type: 'error', message: 'That seat is already occupied.' });
            return;
          }
          const nextSeats = [...room.state.seats] as TwentyNineState['seats'];
          const mover = nextSeats[mySeat]!;
          nextSeats[mySeat] = null;
          nextSeats[targetSeat] = { ...mover, seat: targetSeat as SeatIndex };
          room.state = { ...room.state, seats: nextSeats };
          broadcastRoomState(room);
          return;
        }

        if (type === 'room:fill_bots') {
          if (room.state.hostPlayerId !== currentPlayerId || room.state.phase !== 'lobby') return;
          fillSeatsWithBots(room);
          broadcastRoomState(room);
          return;
        }

        if (type === 'room:clear_bots') {
          if (room.state.hostPlayerId !== currentPlayerId || room.state.phase !== 'lobby') return;
          const nextSeats = room.state.seats.map((s) => (s && s.isBot ? null : s)) as TwentyNineState['seats'];
          room.state = { ...room.state, seats: nextSeats, statusMessage: 'Bots removed from open seats.' };
          broadcastRoomState(room);
          return;
        }

        if (type === 'room:start') {
          if (room.state.hostPlayerId !== currentPlayerId || room.state.phase !== 'lobby') return;
          room.state = startRound(room.state);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }

        // Gameplay Actions
        if (mySeat === null) {
          sendJson(ws, { type: 'error', message: 'You are not seated at this table.' });
          return;
        }

        if (type === 'game:bid') {
          const amount = Number(msg.amount);
          room.state = placeBid(room.state, mySeat, amount);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }

        if (type === 'game:pass') {
          room.state = passBid(room.state, mySeat);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }

        if (type === 'game:select_trump') {
          const suit = msg.suit as Suit;
          if (!SUITS.includes(suit)) {
            sendJson(ws, { type: 'error', message: 'Invalid suit.' });
            return;
          }
          room.state = selectTrump(room.state, mySeat, suit);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }

        if (type === 'game:reveal_trump') {
          room.state = revealTrump(room.state, mySeat);
          broadcastRoomState(room);
          return;
        }

        if (type === 'game:declare_marriage') {
          room.state = declareMarriage(room.state, mySeat);
          broadcastRoomState(room);
          return;
        }

        if (type === 'game:double') {
          room.state = doubleStake(room.state, mySeat);
          broadcastRoomState(room);
          return;
        }

        if (type === 'game:single_hand') {
          room.state = callSingleHand(room.state, mySeat);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }

        if (type === 'game:play_card') {
          const cardId = typeof msg.cardId === 'string' ? msg.cardId : '';
          room.state = playCard(room.state, mySeat, cardId);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }

        if (type === 'game:next_round') {
          if (room.state.phase !== 'round_over') return;
          room.state = startRound(room.state);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }

        if (type === 'game:rematch') {
          if (room.state.phase !== 'match_over') return;
          room.state = resetMatch(room.state);
          broadcastRoomState(room);
          scheduleAutomation(room);
          return;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Action rejected.';
        sendJson(ws, { type: 'error', message });
      }
    });

    ws.on('close', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      if (room.clients.get(currentPlayerId) === ws) {
        room.clients.delete(currentPlayerId);
        if (room.voicePeers.has(currentPlayerId)) {
          room.voicePeers.delete(currentPlayerId);
          broadcastVoicePeers(room);
        }
        const nextSeats = [...room.state.seats] as TwentyNineState['seats'];
        const seatIdx = nextSeats.findIndex((s) => s?.playerId === currentPlayerId);
        if (seatIdx !== -1 && nextSeats[seatIdx]) {
          if (room.state.phase === 'lobby') {
            const leftName = nextSeats[seatIdx]!.name;
            nextSeats[seatIdx] = null;
            let nextHost = room.state.hostPlayerId;
            if (nextHost === currentPlayerId) {
              const firstHuman = nextSeats.find((s) => s && !s.isBot);
              if (firstHuman) nextHost = firstHuman.playerId;
            }
            room.state = {
              ...room.state,
              hostPlayerId: nextHost,
              seats: nextSeats,
              statusMessage: `${leftName} left the lobby.`,
            };
          } else {
            nextSeats[seatIdx] = { ...nextSeats[seatIdx]!, connected: false };
            room.state = { ...room.state, seats: nextSeats };
          }
          broadcastRoomState(room);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`29 Spider-Edition server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

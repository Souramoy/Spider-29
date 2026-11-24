import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, ClientGameView } from '../game/twentyNine';
import type { VoicePeerInfo } from './useVoiceChat';

function getOrCreateTabPlayerId(): string {
  if (typeof window === 'undefined') return 'server-player';
  const existing = window.sessionStorage.getItem('tn_player_id');
  if (existing) return existing;
  const generated = `sp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  window.sessionStorage.setItem('tn_player_id', generated);
  return generated;
}

export function useRoomSocket() {
  const [myPlayerId] = useState<string>(() => getOrCreateTabPlayerId());
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameView | null>(null);
  const [voicePeers, setVoicePeers] = useState<VoicePeerInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<{
    fromPlayerId: string;
    signal: Record<string, unknown>;
    seq: number;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingQueueRef = useRef<string[]>([]);
  const signalSeqRef = useRef(0);
  const lastRoomRef = useRef<{ roomCode: string; name: string } | null>(null);

  const sendMessage = useCallback((payload: Record<string, unknown>) => {
    const raw = JSON.stringify(payload);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(raw);
    } else {
      pendingQueueRef.current.push(raw);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (!active) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setConnected(true);
        // Flush any queued messages
        while (pendingQueueRef.current.length > 0) {
          const item = pendingQueueRef.current.shift();
          if (item) ws.send(item);
        }
        // Re-sync room if disconnected mid-session
        if (lastRoomRef.current) {
          ws.send(
            JSON.stringify({
              type: 'room:join',
              roomCode: lastRoomRef.current.roomCode,
              playerId: myPlayerId,
              name: lastRoomRef.current.name,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const msg = JSON.parse(event.data as string) as Record<string, unknown>;
          if (msg.type === 'room:state' && msg.state) {
            const view = msg.state as ClientGameView;
            setGameState(view);
            setErrorMessage(null);
            const me = view.seats.find((s) => s?.playerId === myPlayerId);
            lastRoomRef.current = {
              roomCode: view.roomCode,
              name: me?.name ?? 'Player',
            };
          } else if (msg.type === 'voice:peers' && Array.isArray(msg.peers)) {
            setVoicePeers(msg.peers as VoicePeerInfo[]);
          } else if (msg.type === 'chat:history' && Array.isArray(msg.messages)) {
            setChatMessages(msg.messages as ChatMessage[]);
          } else if (msg.type === 'chat:message' && msg.message) {
            const incoming = msg.message as ChatMessage;
            setChatMessages((prev) => [...prev.slice(-59), incoming]);
          } else if (msg.type === 'voice:signal' && typeof msg.fromPlayerId === 'string' && msg.signal) {
            signalSeqRef.current += 1;
            setIncomingSignal({
              fromPlayerId: msg.fromPlayerId,
              signal: msg.signal as Record<string, unknown>,
              seq: signalSeqRef.current,
            });
          } else if (msg.type === 'error' && typeof msg.message === 'string') {
            setErrorMessage(msg.message);
          }
        } catch {
          // Ignore malformed payloads
        }
      };

      ws.onclose = () => {
        if (!active) return;
        setConnected(false);
        reconnectTimer = setTimeout(connect, 1500);
      };
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [myPlayerId]);

  const createRoom = useCallback(
    (name: string, quickBots = false) => {
      setErrorMessage(null);
      lastRoomRef.current = null;
      sendMessage({
        type: 'room:create',
        playerId: myPlayerId,
        name,
        quickBots,
      });
    },
    [myPlayerId, sendMessage]
  );

  const joinRoom = useCallback(
    (roomCode: string, name: string) => {
      setErrorMessage(null);
      lastRoomRef.current = null;
      sendMessage({
        type: 'room:join',
        roomCode: roomCode.trim().toUpperCase(),
        playerId: myPlayerId,
        name,
      });
    },
    [myPlayerId, sendMessage]
  );

  const leaveRoom = useCallback(() => {
    lastRoomRef.current = null;
    sendMessage({ type: 'room:leave' });
    setGameState(null);
    setVoicePeers([]);
    setChatMessages([]);
    setErrorMessage(null);
  }, [sendMessage]);

  const sendChatMessage = useCallback(
    (text: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;
      sendMessage({ type: 'chat:send', text: cleaned });
    },
    [sendMessage]
  );

  return {
    myPlayerId,
    connected,
    gameState,
    voicePeers,
    chatMessages,
    errorMessage,
    incomingSignal,
    sendMessage,
    sendChatMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError: () => setErrorMessage(null),
  };
}

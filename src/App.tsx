import { useEffect, useRef, useState } from 'react';
import { GameTable } from './components/GameTable';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RoomLobby } from './components/RoomLobby';
import { RulesModal } from './components/RulesModal';
import { TitleScreen } from './components/TitleScreen';
import { useBidNotifications } from './hooks/useBidNotifications';
import { useRoomSocket } from './hooks/useRoomSocket';
import { useVoiceChat } from './hooks/useVoiceChat';
import { playTone } from './utils/soundFx';

export default function App() {
  const {
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
    clearError,
  } = useRoomSocket();

  const voice = useVoiceChat({
    myPlayerId,
    roomCode: gameState?.roomCode ?? null,
    voicePeers,
    sendMessage,
    incomingSignal,
  });

  const bidNoti = useBidNotifications(gameState);

  const [rulesOpen, setRulesOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [initialRoomCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('room')?.toUpperCase() ?? '';
  });

  const autostartTriggeredRef = useRef(false);
  const prevTrickLenRef = useRef(0);
  const prevTrumpRevealedRef = useRef(false);
  const prevPhaseRef = useRef<string | null>(null);

  // ?autostart=1 support for direct verification / solo jump-in
  useEffect(() => {
    if (!connected || autostartTriggeredRef.current || gameState) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      autostartTriggeredRef.current = true;
      createRoom('Peter', true);
    }
  }, [connected, createRoom, gameState]);

  // Keep document.body.dataset.state synced with the game shell state
  useEffect(() => {
    if (!gameState) {
      document.body.dataset.state = 'title';
    } else if (gameState.phase === 'match_over' || gameState.phase === 'round_over') {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [gameState]);

  // Sync ?room=CODE in URL cleanly for easy sharing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (gameState?.roomCode) {
      if (url.searchParams.get('room') !== gameState.roomCode) {
        url.searchParams.set('room', gameState.roomCode);
        url.searchParams.delete('autostart');
        window.history.replaceState({}, '', url.toString());
      }
    } else if (url.searchParams.has('room') && !initialRoomCode) {
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  }, [gameState?.roomCode, initialRoomCode]);

  // Subtle Web Audio cues on state changes
  useEffect(() => {
    if (!gameState) {
      prevTrickLenRef.current = 0;
      prevTrumpRevealedRef.current = false;
      prevPhaseRef.current = null;
      return;
    }

    if (gameState.currentTrick.length > prevTrickLenRef.current) {
      playTone('card', soundEnabled);
    }
    prevTrickLenRef.current = gameState.currentTrick.length;

    if (gameState.trumpRevealed && !prevTrumpRevealedRef.current && gameState.phase === 'playing') {
      playTone('trump', soundEnabled);
    }
    prevTrumpRevealedRef.current = gameState.trumpRevealed;

    if (gameState.phase !== prevPhaseRef.current) {
      if (gameState.phase === 'trick_pause') {
        playTone('trickWin', soundEnabled);
      } else if (gameState.phase === 'round_over' || gameState.phase === 'match_over') {
        playTone('roundWin', soundEnabled);
      }
      prevPhaseRef.current = gameState.phase;
    }
  }, [gameState, soundEnabled]);

  const handleLeaveRoom = () => {
    voice.leaveVoice();
    leaveRoom();
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.searchParams.delete('autostart');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <>
      {!gameState ? (
        <TitleScreen
          connected={connected}
          initialRoomCode={initialRoomCode}
          errorMessage={errorMessage}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onOpenRules={() => setRulesOpen(true)}
          onClearError={clearError}
        />
      ) : gameState.phase === 'lobby' ? (
        <RoomLobby
          gameState={gameState}
          voicePeers={voicePeers}
          chatMessages={chatMessages}
          inVoice={voice.inVoice}
          isMuted={voice.isMuted}
          isDeafened={voice.isDeafened}
          voiceError={voice.voiceError}
          speakingMap={voice.speakingMap}
          errorMessage={errorMessage}
          onTakeSeat={(seat) => sendMessage({ type: 'room:take_seat', seat })}
          onFillBots={() => sendMessage({ type: 'room:fill_bots' })}
          onClearBots={() => sendMessage({ type: 'room:clear_bots' })}
          onStartMatch={() => sendMessage({ type: 'room:start' })}
          onLeaveRoom={handleLeaveRoom}
          onOpenRules={() => setRulesOpen(true)}
          onSendChat={sendChatMessage}
          onJoinVoice={() => void voice.joinVoice()}
          onLeaveVoice={voice.leaveVoice}
          onToggleMute={voice.toggleMute}
          onToggleDeafen={voice.toggleDeafen}
          onClearVoiceError={voice.clearVoiceError}
          pushPermission={bidNoti.permission}
          isPushActive={bidNoti.isPushActive}
          bidFeed={bidNoti.bidFeed}
          onToggleOsPush={bidNoti.toggleOsPush}
        />
      ) : (
        <GameTable
          gameState={gameState}
          voicePeers={voicePeers}
          chatMessages={chatMessages}
          inVoice={voice.inVoice}
          isMuted={voice.isMuted}
          isDeafened={voice.isDeafened}
          voiceError={voice.voiceError}
          speakingMap={voice.speakingMap}
          soundEnabled={soundEnabled}
          errorMessage={errorMessage}
          pushPermission={bidNoti.permission}
          isPushActive={bidNoti.isPushActive}
          bidFeed={bidNoti.bidFeed}
          activeBidBanner={bidNoti.activeBanner}
          onToggleOsPush={bidNoti.toggleOsPush}
          onDismissBidBanner={bidNoti.dismissBanner}
          onBid={(amount) => {
            playTone('bid', soundEnabled);
            sendMessage({ type: 'game:bid', amount });
          }}
          onPass={() => sendMessage({ type: 'game:pass' })}
          onSelectTrump={(suit) => {
            playTone('trump', soundEnabled);
            sendMessage({ type: 'game:select_trump', suit });
          }}
          onSelectSeventhCard={() => {
            playTone('trump', soundEnabled);
            sendMessage({ type: 'game:select_seventh_card' });
          }}
          onSelectJokerNoTrump={() => {
            playTone('trump', soundEnabled);
            sendMessage({ type: 'game:select_joker_no_trump' });
          }}
          onRevealTrump={() => sendMessage({ type: 'game:reveal_trump' })}
          onDeclareMarriage={() => sendMessage({ type: 'game:declare_marriage' })}
          onDoubleStake={() => sendMessage({ type: 'game:double' })}
          onCallSingleHand={() => {
            playTone('bid', soundEnabled);
            sendMessage({ type: 'game:single_hand' });
          }}
          onPlayCard={(cardId) => sendMessage({ type: 'game:play_card', cardId })}
          onNextRound={() => sendMessage({ type: 'game:next_round' })}
          onRematch={() => sendMessage({ type: 'game:rematch' })}
          onSurrender={() => sendMessage({ type: 'game:surrender' })}
          onLeaveRoom={handleLeaveRoom}
          onOpenRules={() => setRulesOpen(true)}
          onSendChat={sendChatMessage}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onJoinVoice={() => void voice.joinVoice()}
          onLeaveVoice={voice.leaveVoice}
          onToggleMute={voice.toggleMute}
          onToggleDeafen={voice.toggleDeafen}
          onClearVoiceError={voice.clearVoiceError}
        />
      )}

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <OfflineIndicator />
    </>
  );
}

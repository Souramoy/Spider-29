import { useState } from 'react';
import { Bot, Check, Copy, LogOut, Play, UserPlus, BookOpen, Mic, MicOff } from 'lucide-react';
import type { ClientGameView, SeatIndex } from '../game/twentyNine';
import type { VoicePeerInfo } from '../hooks/useVoiceChat';
import { VoiceBar } from './VoiceBar';

interface RoomLobbyProps {
  gameState: ClientGameView;
  voicePeers: VoicePeerInfo[];
  inVoice: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  voiceError: string | null;
  speakingMap: Record<string, boolean>;
  errorMessage: string | null;
  onTakeSeat: (seat: SeatIndex) => void;
  onFillBots: () => void;
  onClearBots: () => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onOpenRules: () => void;
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onClearVoiceError: () => void;
}

export function RoomLobby({
  gameState,
  voicePeers,
  inVoice,
  isMuted,
  isDeafened,
  voiceError,
  speakingMap,
  errorMessage,
  onTakeSeat,
  onFillBots,
  onClearBots,
  onStartMatch,
  onLeaveRoom,
  onOpenRules,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onToggleDeafen,
  onClearVoiceError,
}: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);

  const isHost = gameState.hostPlayerId === gameState.myPlayerId;
  const filledSeatsCount = gameState.seats.filter((s) => s !== null).length;
  const hasBots = gameState.seats.some((s) => s?.isBot);
  const canStart = isHost && filledSeatsCount === 4;

  const copyInvite = async () => {
    const shareUrl = `${window.location.origin}/?room=${gameState.roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0B0C10] text-zinc-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Strip */}
      <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161820] hover:bg-[#1E212C] border border-white/10 text-xs font-medium text-zinc-300 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
          <div>
            <div className="text-xs text-zinc-400">Custom Room</div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono-nums text-2xl font-bold tracking-widest text-white">
                {gameState.roomCode}
              </span>
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/8 hover:bg-white/14 text-xs font-medium text-zinc-200 transition-colors whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#F87171]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied' : 'Copy Invite Link'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <VoiceBar
            inVoice={inVoice}
            isMuted={isMuted}
            isDeafened={isDeafened}
            voiceError={voiceError}
            voicePeers={voicePeers}
            speakingMap={speakingMap}
            onJoinVoice={onJoinVoice}
            onLeaveVoice={onLeaveVoice}
            onToggleMute={onToggleMute}
            onToggleDeafen={onToggleDeafen}
            onClearError={onClearVoiceError}
          />
          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161820] hover:bg-[#1E212C] border border-white/10 text-xs font-medium text-zinc-300 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Main 4-Seat Table Staging */}
      <main className="w-full max-w-5xl mx-auto my-auto py-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Squad Table Setup
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Share the room code with 3 friends, or fill empty seats with bots to start immediately. Opposite seats play as partners.
            </p>
          </div>
          <div className="font-mono-nums text-sm text-zinc-300">
            {filledSeatsCount} / 4 Seats Filled
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="px-4 py-3 rounded-xl bg-[#2A1418] border border-[#D92B3A]/50 text-sm text-[#FCA5A5]"
          >
            {errorMessage}
          </div>
        )}

        {/* Two Partnership Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Crimson: Seats 0 & 2 */}
          <section className="bg-[#14161F] border border-[#D92B3A]/35 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[#F87171] tracking-wide">
                Red Team (6♥)
              </h2>
              <span className="text-xs text-zinc-400">Seats 1 &amp; 3</span>
            </div>

            <div className="space-y-3">
              {([0, 2] as SeatIndex[]).map((seatIdx) => (
                <LobbySeatRow
                  key={seatIdx}
                  seatIdx={seatIdx}
                  player={gameState.seats[seatIdx]}
                  isMe={gameState.seats[seatIdx]?.playerId === gameState.myPlayerId}
                  voicePeer={voicePeers.find((vp) => vp.playerId === gameState.seats[seatIdx]?.playerId)}
                  isSpeaking={Boolean(
                    gameState.seats[seatIdx] && speakingMap[gameState.seats[seatIdx]!.playerId]
                  )}
                  onTakeSeat={() => onTakeSeat(seatIdx)}
                />
              ))}
            </div>
          </section>

          {/* Team Obsidian: Seats 1 & 3 */}
          <section className="bg-[#14161F] border border-white/12 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-zinc-100 tracking-wide">
                Black Team (6♠)
              </h2>
              <span className="text-xs text-zinc-400">Seats 2 &amp; 4</span>
            </div>

            <div className="space-y-3">
              {([1, 3] as SeatIndex[]).map((seatIdx) => (
                <LobbySeatRow
                  key={seatIdx}
                  seatIdx={seatIdx}
                  player={gameState.seats[seatIdx]}
                  isMe={gameState.seats[seatIdx]?.playerId === gameState.myPlayerId}
                  voicePeer={voicePeers.find((vp) => vp.playerId === gameState.seats[seatIdx]?.playerId)}
                  isSpeaking={Boolean(
                    gameState.seats[seatIdx] && speakingMap[gameState.seats[seatIdx]!.playerId]
                  )}
                  onTakeSeat={() => onTakeSeat(seatIdx)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Host Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            {isHost && filledSeatsCount < 4 && (
              <button
                type="button"
                onClick={onFillBots}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D202C] hover:bg-[#272B3B] border border-white/12 text-sm font-semibold text-zinc-100 transition-colors whitespace-nowrap"
              >
                <Bot className="w-4 h-4 text-[#F87171]" />
                <span>Fill Empty Seats with Bots</span>
              </button>
            )}
            {isHost && hasBots && (
              <button
                type="button"
                onClick={onClearBots}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/6 border border-white/10 text-sm font-medium text-zinc-300 transition-colors whitespace-nowrap"
              >
                <span>Remove Bots</span>
              </button>
            )}
            {!isHost && (
              <span className="text-sm text-zinc-400">
                Waiting for the room host to start the match...
              </span>
            )}
          </div>

          {isHost && (
            <button
              type="button"
              data-start="true"
              disabled={!canStart}
              onClick={onStartMatch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              <span>Start Match</span>
            </button>
          )}
        </div>
      </main>

      <div className="w-full max-w-5xl mx-auto text-xs text-zinc-500 flex items-center justify-between pt-4 border-t border-white/6">
        <span>Room Code: {gameState.roomCode}</span>
        <span>First team to 6 Match Points wins</span>
      </div>
    </div>
  );
}

interface LobbySeatRowProps {
  seatIdx: SeatIndex;
  player: ClientGameView['seats'][number];
  isMe: boolean;
  voicePeer: VoicePeerInfo | undefined;
  isSpeaking: boolean;
  onTakeSeat: () => void;
}

function LobbySeatRow({
  seatIdx,
  player,
  isMe,
  voicePeer,
  isSpeaking,
  onTakeSeat,
}: LobbySeatRowProps) {
  if (!player) {
    return (
      <button
        type="button"
        onClick={onTakeSeat}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#0E1016] hover:bg-[#191C26] border border-dashed border-white/15 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-300">Open Seat {seatIdx + 1}</div>
            <div className="text-xs text-zinc-500">Click to move here</div>
          </div>
        </div>
        <span className="text-xs font-medium text-zinc-400">Switch</span>
      </button>
    );
  }

  return (
    <div
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#191C26] border transition-colors ${
        isSpeaking ? 'border-[#EF4444] ring-1 ring-[#EF4444]/60' : 'border-white/10'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-base shrink-0 ${
            seatIdx % 2 === 0 ? 'bg-[#D92B3A]/20 text-[#FCA5A5]' : 'bg-white/10 text-zinc-200'
          }`}
        >
          {player.isBot ? <Bot className="w-4 h-4" /> : player.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-100 truncate">
            {player.name} {isMe && <span className="text-[#F87171] font-normal">(You)</span>}
          </div>
          <div className="text-xs text-zinc-400">
            Seat {seatIdx + 1} · {player.isBot ? 'Bot Player' : player.connected ? 'Connected' : 'Reconnecting'}
          </div>
        </div>
      </div>

      {voicePeer && (
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {voicePeer.muted ? (
            <MicOff className="w-4 h-4 text-zinc-500" aria-label="Mic muted" />
          ) : (
            <Mic
              className={`w-4 h-4 ${isSpeaking ? 'text-[#EF4444]' : 'text-zinc-300'}`}
              aria-label={isSpeaking ? 'Speaking' : 'In voice chat'}
            />
          )}
        </div>
      )}
    </div>
  );
}

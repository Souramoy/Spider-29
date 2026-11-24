import { useState } from 'react';
import {
  BookOpen,
  Bot,
  Check,
  Copy,
  Crown,
  Eye,
  Flag,
  Flame,
  History,
  LogOut,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  getEffectiveBid,
  getTeamForSeat,
  SUIT_NAMES,
  SUIT_SYMBOLS,
  SUITS,
  type ChatMessage,
  type ClientGameView,
  type SeatIndex,
  type Suit,
} from '../game/twentyNine';
import type { BidNotificationEvent } from '../game/bidNotifications';
import type { PushPermissionState } from '../hooks/useBidNotifications';
import type { VoicePeerInfo } from '../hooks/useVoiceChat';
import { BidAlertControl, BidToastBanner } from './BidNotifications';
import { SpiderCard } from './SpiderCard';
import { VoiceBar } from './VoiceBar';
import { RoomChat } from './RoomChat';
import { PWAInstallButton } from './PWAInstallButton';
import { RoundModal } from './RoundModal';
import { ScoreCardsWidget } from './ScoreCardsWidget';

interface GameTableProps {
  gameState: ClientGameView;
  voicePeers: VoicePeerInfo[];
  chatMessages: ChatMessage[];
  inVoice: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  voiceError: string | null;
  speakingMap: Record<string, boolean>;
  soundEnabled: boolean;
  errorMessage: string | null;
  onBid: (amount: number) => void;
  onPass: () => void;
  onSelectTrump: (suit: Suit) => void;
  onSelectSeventhCard: () => void;
  onSelectJokerNoTrump: () => void;
  onRevealTrump: () => void;
  onDeclareMarriage: () => void;
  onDoubleStake: () => void;
  onCallSingleHand: () => void;
  onPlayCard: (cardId: string) => void;
  onNextRound: () => void;
  onRematch: () => void;
  onLeaveRoom: () => void;
  onOpenRules: () => void;
  onSendChat: (text: string) => void;
  onToggleSound: () => void;
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onClearVoiceError: () => void;
  pushPermission: PushPermissionState;
  isPushActive: boolean;
  bidFeed: BidNotificationEvent[];
  activeBidBanner: BidNotificationEvent | null;
  onToggleOsPush: () => void;
  onDismissBidBanner: () => void;
  onSurrender: () => void;
}

function getTeamPlateClasses(
  seat: SeatIndex,
  isActive: boolean,
  isSpeaking: boolean,
  isSittingOut?: boolean
): string {
  const isRedTeam = getTeamForSeat(seat) === 0;
  const teamSurface = isRedTeam
    ? 'bg-gradient-to-b from-[#45131C]/95 to-[#22090E]/95 border-[#D92B3A]/75'
    : 'bg-gradient-to-b from-[#171923]/95 to-[#0B0C11]/95 border-zinc-500/55';

  const highlight = isActive
    ? 'animate-turn-flash border-white ring-2 ring-white/85'
    : isSpeaking
      ? 'border-[#EF4444] ring-1 ring-[#EF4444]/70'
      : '';

  const dimmed = isSittingOut ? 'opacity-55' : '';
  return `${teamSurface} ${highlight} ${dimmed}`;
}

export function GameTable({
  gameState,
  voicePeers,
  chatMessages,
  inVoice,
  isMuted,
  isDeafened,
  voiceError,
  speakingMap,
  soundEnabled,
  errorMessage,
  onBid,
  onPass,
  onSelectTrump,
  onSelectSeventhCard,
  onSelectJokerNoTrump,
  onRevealTrump,
  onDeclareMarriage,
  onDoubleStake,
  onCallSingleHand,
  onPlayCard,
  onNextRound,
  onRematch,
  onLeaveRoom,
  onOpenRules,
  onSendChat,
  onToggleSound,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onToggleDeafen,
  onClearVoiceError,
  pushPermission,
  isPushActive,
  bidFeed,
  activeBidBanner,
  onToggleOsPush,
  onDismissBidBanner,
  onSurrender,
}: GameTableProps) {
  const [copied, setCopied] = useState(false);
  const [showLastPlay, setShowLastPlay] = useState(false);
  const [confirmSurrenderOpen, setConfirmSurrenderOpen] = useState(false);

  const baseSeat: SeatIndex = gameState.mySeat ?? 0;
  const bottomSeat = baseSeat;
  const leftSeat = ((baseSeat + 1) % 4) as SeatIndex;
  const topSeat = ((baseSeat + 2) % 4) as SeatIndex;
  const rightSeat = ((baseSeat + 3) % 4) as SeatIndex;

  const isMyBidTurn = gameState.phase === 'bidding' && gameState.bidTurnSeat === bottomSeat;
  const isMyTrumpSelect = gameState.phase === 'trump_select' && gameState.highestBidderSeat === bottomSeat;
  const isMyPlayTurn = gameState.phase === 'playing' && gameState.turnSeat === bottomSeat;
  const isMyInteractiveCenter = isMyBidTurn || isMyTrumpSelect;

  const minBid = gameState.minBidAmount ?? (gameState.highestBid === null ? 16 : Math.min(28, gameState.highestBid + 1));
  const effectiveBid =
    gameState.highestBid !== null
      ? getEffectiveBid({
          highestBid: gameState.highestBid,
          highestBidderSeat: gameState.highestBidderSeat,
          marriageDeclaredByTeam: gameState.marriageDeclaredByTeam,
        })
      : null;

  const copyInvite = async () => {
    const shareUrl = `${window.location.origin}/?room=${gameState.roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const getPlayedCardForSeat = (seat: SeatIndex) => {
    return gameState.currentTrick.find((p) => p.seat === seat)?.card ?? null;
  };

  const activeSeat =
    gameState.phase === 'bidding'
      ? gameState.bidTurnSeat
      : gameState.phase === 'trump_select'
        ? gameState.highestBidderSeat
        : gameState.phase === 'playing'
          ? gameState.turnSeat
          : null;

  const lastTrickWinnerName = gameState.lastTrick
    ? gameState.seats[gameState.lastTrick.winnerSeat]?.name ?? `Seat ${gameState.lastTrick.winnerSeat + 1}`
    : null;

  const canShowJokerInSlot =
    gameState.trumpMode === 'joker_no_trump' &&
    (gameState.trumpRevealed ||
      (gameState.mySeat !== null && gameState.highestBidderSeat === gameState.mySeat));

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0B0C10] text-zinc-100 flex flex-col select-none">
      {/* Table Felt Surface */}
      <img
        src="/src/assets/images/card_table_felt_1795527386646.jpg"
        alt=""
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,20,26,0.32)_0%,rgba(9,10,14,0.9)_100%)] pointer-events-none"
      />

      {/* Unified Top Perimeter HUD Strip */}
      <header className="relative z-40 flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 short:py-1 bg-[#101218]/95 border-b border-white/10">
        {/* Left: Room Code + Round */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void copyInvite()}
            aria-label={`Copy invite link for room ${gameState.roomCode}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-[11px] sm:text-xs font-mono-nums text-zinc-200 transition-colors whitespace-nowrap"
          >
            <span>{gameState.roomCode}</span>
            {copied ? <Check className="w-3 h-3 text-[#F87171]" /> : <Copy className="w-3 h-3 text-zinc-400" />}
          </button>
          <span className="hidden lg:inline text-xs text-zinc-400 font-mono-nums whitespace-nowrap">
            R{gameState.roundNumber} · T{Math.min(8, gameState.tricksCompleted + 1)}/8 ·{' '}
            {gameState.isSingleHand ? 'Single 3pt' : `Stake ${gameState.roundStake}pt`}
          </span>
        </div>

        {/* Center: 6♥ & 6♠ Tug-of-War Scoreboard + Round Card Points */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ScoreCardsWidget netScore={gameState.netScore} size="compact" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono-nums text-zinc-400 whitespace-nowrap">
            <span className="text-[#F87171]">Red {gameState.roundPoints[0]}</span>
            <span>/</span>
            <span className="text-zinc-200">Black {gameState.roundPoints[1]}</span>
          </div>
        </div>

        {/* Right: Voice + Chat + Last Play + Sound + Rules + PWA + Leave */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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
            compact
          />
          <RoomChat
            messages={chatMessages}
            myPlayerId={gameState.myPlayerId}
            onSendMessage={onSendChat}
            compact
          />
          <BidAlertControl
            permission={pushPermission}
            isPushActive={isPushActive}
            bidFeed={bidFeed}
            onToggleOsPush={onToggleOsPush}
            compact
          />
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-1.5 sm:p-2 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-zinc-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />}
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            aria-label="Open rules"
            className="p-1.5 sm:p-2 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-zinc-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EF4444]" />
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave room"
            className="p-1.5 sm:p-2 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      <BidToastBanner event={activeBidBanner} onDismiss={onDismissBidBanner} />

      {/* Main 4-Seat Table Playfield (North / West-Center-East / South across ALL viewports) */}
      <main className="relative z-10 flex-1 min-h-0 grid grid-rows-[auto_1fr_auto] p-1.5 sm:p-4 short:p-1.5 gap-1 sm:gap-2 short:gap-1 overflow-hidden">
        {/* NORTH: Top Partner */}
        <div className="flex items-center justify-center shrink-0">
          <SeatPlate
            seat={topSeat}
            player={gameState.seats[topSeat]}
            cardCount={gameState.handCounts[topSeat]}
            isActive={activeSeat === topSeat}
            isDealer={gameState.dealerSeat === topSeat}
            isBidder={gameState.highestBidderSeat === topSeat}
            bidAmount={gameState.highestBidderSeat === topSeat ? effectiveBid : null}
            passed={gameState.phase === 'bidding' && gameState.passedSeats[topSeat]}
            isSittingOut={gameState.isSingleHand && gameState.singleHandPartnerSeat === topSeat}
            voicePeer={voicePeers.find((vp) => vp.playerId === gameState.seats[topSeat]?.playerId)}
            isSpeaking={Boolean(
              gameState.seats[topSeat] && speakingMap[gameState.seats[topSeat]!.playerId]
            )}
            placement="top"
          />
        </div>

        {/* MIDDLE CROSS: West Opponent | Center Felt & Controls | East Opponent */}
        <div className="relative min-h-0 grid grid-cols-[68px_1fr_68px] sm:grid-cols-[152px_1fr_152px] lg:grid-cols-[185px_1fr_185px] short:grid-cols-[118px_1fr_118px] items-center gap-1 sm:gap-2">
          {/* WEST: Left Opponent */}
          <div className="flex items-center justify-start min-w-0">
            <SeatPlate
              seat={leftSeat}
              player={gameState.seats[leftSeat]}
              cardCount={gameState.handCounts[leftSeat]}
              isActive={activeSeat === leftSeat}
              isDealer={gameState.dealerSeat === leftSeat}
              isBidder={gameState.highestBidderSeat === leftSeat}
              bidAmount={gameState.highestBidderSeat === leftSeat ? effectiveBid : null}
              passed={gameState.phase === 'bidding' && gameState.passedSeats[leftSeat]}
              isSittingOut={gameState.isSingleHand && gameState.singleHandPartnerSeat === leftSeat}
              voicePeer={voicePeers.find((vp) => vp.playerId === gameState.seats[leftSeat]?.playerId)}
              isSpeaking={Boolean(
                gameState.seats[leftSeat] && speakingMap[gameState.seats[leftSeat]!.playerId]
              )}
              placement="side"
            />
          </div>

          {/* CENTER FELT ZONE */}
          <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 short:gap-1 min-w-0 max-h-full overflow-y-auto py-0.5">
            {/* Live Status Line + Last Play Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-full shrink-0">
              <div
                data-testid="table-status"
                className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-[#12141B]/90 border border-white/10 text-[11px] sm:text-sm short:text-[11px] text-zinc-200 text-center max-w-[205px] sm:max-w-lg short:max-w-md truncate"
              >
                {errorMessage ? (
                  <span className="text-[#FCA5A5]">{errorMessage}</span>
                ) : (
                  gameState.statusMessage
                )}
              </div>

              {gameState.lastTrick && (
                <button
                  type="button"
                  data-testid="last-play-btn"
                  onClick={() => setShowLastPlay((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    showLastPlay
                      ? 'bg-[#D92B3A] border-[#EF4444] text-white'
                      : 'bg-[#151822]/90 hover:bg-[#1E2230] border-white/12 text-zinc-200'
                  }`}
                >
                  <History className="w-3 h-3 text-[#F87171]" />
                  <span>Last: {lastTrickWinnerName?.split(' ')[0]}</span>
                </button>
              )}
            </div>

            {/* Expandable Last Play Card Breakdown */}
            {showLastPlay && gameState.lastTrick && (
              <div
                data-testid="last-play-panel"
                className="relative z-30 bg-[#13151F]/98 border border-white/15 rounded-xl p-2 sm:p-3 shadow-2xl max-w-md w-full shrink-0"
              >
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold text-zinc-100">
                    Last Play · Won by{' '}
                    <span className={gameState.lastTrick.winnerTeam === 0 ? 'text-[#F87171]' : 'text-white'}>
                      {lastTrickWinnerName}
                    </span>{' '}
                    (+{gameState.lastTrick.points} pts)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLastPlay(false)}
                    aria-label="Close last play"
                    className="p-0.5 rounded text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  {gameState.lastTrick.plays.map((play) => {
                    const pName = gameState.seats[play.seat]?.name ?? `S${play.seat + 1}`;
                    const isWinner = play.seat === gameState.lastTrick!.winnerSeat;
                    const isRed = getTeamForSeat(play.seat) === 0;
                    return (
                      <div
                        key={play.seat}
                        className={`flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg border ${
                          isWinner
                            ? 'border-white bg-white/10'
                            : 'border-white/10 bg-black/20'
                        }`}
                      >
                        <SpiderCard card={play.card} size="xs" />
                        <span
                          className={`text-[10px] font-medium truncate max-w-[60px] ${
                            isRed ? 'text-[#FCA5A5]' : 'text-zinc-300'
                          }`}
                        >
                          {isWinner ? `★ ${pName.split(' ')[0]}` : pName.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4-Way Trick Arena + Trump Slot (hidden on mobile portrait/short only when bidding/trump picker needs center room) */}
            <div
              className={`${
                isMyInteractiveCenter ? 'hidden sm:flex short:hidden' : 'flex'
              } items-center justify-center gap-2 sm:gap-7 short:gap-4 shrink-0`}
            >
              <div
                data-testid="trick-arena"
                className="relative w-32 h-28 sm:w-64 sm:h-52 short:w-36 short:h-26 flex items-center justify-center"
              >
                {/* Top Card */}
                {!(gameState.isSingleHand && gameState.singleHandPartnerSeat === topSeat) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    {getPlayedCardForSeat(topSeat) ? (
                      <div className="animate-card-enter">
                        <SpiderCard card={getPlayedCardForSeat(topSeat)!} size="sm" />
                      </div>
                    ) : (
                      <div className="w-10 h-14 sm:w-14 sm:h-20 short:w-9 short:h-12 rounded-lg border border-dashed border-white/12 bg-black/20" />
                    )}
                  </div>
                )}

                {/* Left Card */}
                {!(gameState.isSingleHand && gameState.singleHandPartnerSeat === leftSeat) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    {getPlayedCardForSeat(leftSeat) ? (
                      <div className="animate-card-enter">
                        <SpiderCard card={getPlayedCardForSeat(leftSeat)!} size="sm" />
                      </div>
                    ) : (
                      <div className="w-10 h-14 sm:w-14 sm:h-20 short:w-9 short:h-12 rounded-lg border border-dashed border-white/12 bg-black/20" />
                    )}
                  </div>
                )}

                {/* Right Card */}
                {!(gameState.isSingleHand && gameState.singleHandPartnerSeat === rightSeat) && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    {getPlayedCardForSeat(rightSeat) ? (
                      <div className="animate-card-enter">
                        <SpiderCard card={getPlayedCardForSeat(rightSeat)!} size="sm" />
                      </div>
                    ) : (
                      <div className="w-10 h-14 sm:w-14 sm:h-20 short:w-9 short:h-12 rounded-lg border border-dashed border-white/12 bg-black/20" />
                    )}
                  </div>
                )}

                {/* Bottom Card */}
                {!(gameState.isSingleHand && gameState.singleHandPartnerSeat === bottomSeat) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                    {getPlayedCardForSeat(bottomSeat) ? (
                      <div className="animate-card-enter">
                        <SpiderCard card={getPlayedCardForSeat(bottomSeat)!} size="sm" />
                      </div>
                    ) : (
                      <div className="w-10 h-14 sm:w-14 sm:h-20 short:w-9 short:h-12 rounded-lg border border-dashed border-white/12 bg-black/20" />
                    )}
                  </div>
                )}
              </div>

              {/* Hidden / Revealed Trump Indicator (Standard, 7th Card, Joker No Trump, Single Hand) */}
              <div
                data-testid="trump-slot"
                className="flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2.5 short:py-1 rounded-xl bg-[#13151D]/92 border border-white/12 shrink-0"
              >
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 whitespace-nowrap">
                  {gameState.isSingleHand
                    ? 'Single Hand'
                    : gameState.trumpMode === 'seventh_card'
                      ? gameState.trumpRevealed
                        ? '7th Open'
                        : '7th Card'
                      : gameState.trumpMode === 'joker_no_trump' && gameState.trumpRevealed
                        ? 'Joker Open'
                        : gameState.trumpRevealed
                          ? 'Trump Open'
                          : 'Trump'}
                </span>

                {gameState.isSingleHand ? (
                  <div className="w-10 h-12 sm:w-14 sm:h-16 short:w-11 short:h-12 rounded-lg border border-[#D92B3A] bg-[#1C1E28] flex flex-col items-center justify-center px-1 text-center">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EF4444]" />
                    <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-100 leading-tight mt-0.5">
                      No Trump
                    </span>
                  </div>
                ) : canShowJokerInSlot ? (
                  <div
                    className={`w-10 h-12 sm:w-14 sm:h-16 short:w-11 short:h-12 rounded-lg border flex flex-col items-center justify-center px-1 text-center ${
                      gameState.trumpRevealed
                        ? 'bg-[#1C1E28] border-[#D92B3A]'
                        : 'bg-[#161822] border-dashed border-zinc-500'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F87171]" />
                    <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-100 leading-tight mt-0.5">
                      Joker
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-zinc-400 leading-none">
                      No Trump
                    </span>
                  </div>
                ) : gameState.trumpSuit ? (
                  <div
                    className={`w-10 h-12 sm:w-12 sm:h-16 short:w-10 short:h-12 rounded-lg border flex flex-col items-center justify-center ${
                      gameState.trumpRevealed
                        ? 'bg-[#1C1E28] border-[#D92B3A]'
                        : 'bg-[#161822] border-dashed border-zinc-500'
                    }`}
                  >
                    <span
                      className={`text-lg sm:text-2xl short:text-base leading-none ${
                        gameState.trumpSuit === 'H' || gameState.trumpSuit === 'D'
                          ? 'text-[#EF4444]'
                          : 'text-zinc-100'
                      }`}
                    >
                      {SUIT_SYMBOLS[gameState.trumpSuit]}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5">
                      {gameState.trumpRevealed ? SUIT_NAMES[gameState.trumpSuit] : 'Secret'}
                    </span>
                  </div>
                ) : (
                  <SpiderCard faceDown size="xs" ariaLabel="Hidden trump card" />
                )}

                {gameState.isSingleHand ? (
                  <span className="text-[10px] sm:text-[11px] font-mono-nums text-[#F87171] whitespace-nowrap">
                    8T · 3pt
                  </span>
                ) : (
                  effectiveBid !== null && (
                    <span className="text-[10px] sm:text-[11px] font-mono-nums text-zinc-300 whitespace-nowrap">
                      Bid {effectiveBid} · {gameState.roundStake}pt
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Contextual Play Actions: Reveal Trump / Declare Pair / Double / Single Hand */}
            {gameState.phase === 'playing' &&
              ((isMyPlayTurn && (gameState.canRevealTrump || gameState.canDeclareMarriage)) ||
                gameState.canDoubleStake ||
                gameState.canCallSingleHand) && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shrink-0">
                  {isMyPlayTurn && gameState.canRevealTrump && (
                    <button
                      type="button"
                      onClick={onRevealTrump}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 short:py-1 short:px-2.5 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] text-white text-[11px] sm:text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Trump</span>
                    </button>
                  )}
                  {isMyPlayTurn && gameState.canDeclareMarriage && (
                    <button
                      type="button"
                      onClick={onDeclareMarriage}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 short:py-1 short:px-2.5 rounded-xl bg-[#1F222E] hover:bg-[#292D3D] border border-[#D92B3A]/60 text-[#FCA5A5] text-[11px] sm:text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Pair (K+Q)</span>
                    </button>
                  )}
                  {gameState.canDoubleStake && (
                    <button
                      type="button"
                      onClick={onDoubleStake}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 short:py-1 short:px-2.5 rounded-xl bg-[#1F222E] hover:bg-[#292D3D] border border-[#D92B3A]/60 text-zinc-100 text-[11px] sm:text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span>{gameState.roundStake === 1 ? 'Double (2pt)' : 'Redouble (4pt)'}</span>
                    </button>
                  )}
                  {gameState.canCallSingleHand && (
                    <button
                      type="button"
                      data-testid="single-hand-btn"
                      onClick={onCallSingleHand}
                      className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 short:py-1 short:px-2.5 rounded-xl bg-[#D92B3A]/20 hover:bg-[#D92B3A] border border-[#D92B3A] text-white text-[11px] sm:text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Single Hand (3pt)</span>
                    </button>
                  )}
                </div>
              )}

            {/* Interactive Bidding Panel inside CENTER FELT ZONE */}
            {isMyBidTurn && (
              <div
                data-testid="bidding-panel"
                className="relative z-20 bg-[#151720]/96 border border-[#D92B3A]/75 rounded-xl p-2 sm:p-4 short:p-1.5 shadow-2xl max-w-lg short:max-w-xl w-full space-y-1.5 sm:space-y-2 short:space-y-1 shrink-0"
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs gap-2">
                  <span className="font-semibold text-white">
                    {gameState.canMatchCurrentBid ? 'Match or Raise Bid' : 'Your Turn to Bid'}
                  </span>
                  <span className="font-mono-nums text-zinc-400">
                    {gameState.highestBid !== null
                      ? `Bid: ${gameState.highestBid} · Min: ${minBid}`
                      : 'Bid 16–28'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 short:gap-1">
                  {Array.from({ length: 13 }, (_, idx) => 16 + idx).map((amount) => {
                    const disabled = amount < minBid;
                    const isMatchVal =
                      gameState.canMatchCurrentBid && gameState.highestBid === amount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        disabled={disabled}
                        onClick={() => onBid(amount)}
                        className={`w-[38px] sm:w-[40px] short:w-[35px] py-1 sm:py-1.5 short:py-0.5 rounded-lg font-mono-nums text-[11px] sm:text-xs font-semibold border transition-colors ${
                          isMatchVal
                            ? 'bg-white text-[#0B0C10] border-white hover:bg-zinc-200'
                            : 'bg-[#1E212D] hover:bg-[#D92B3A] disabled:opacity-30 disabled:hover:bg-[#1E212D] border-white/10 text-zinc-100'
                        }`}
                      >
                        {amount}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 short:pt-0">
                  {gameState.canMatchCurrentBid && gameState.highestBid !== null && (
                    <button
                      type="button"
                      data-testid="match-bid-btn"
                      onClick={() => onBid(gameState.highestBid!)}
                      className="flex-1 sm:flex-initial px-3 py-1 sm:py-1.5 short:py-0.5 rounded-lg text-xs font-bold bg-white hover:bg-zinc-200 text-[#0B0C10] transition-colors whitespace-nowrap"
                    >
                      Match {gameState.highestBid}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onPass}
                    className="flex-1 sm:flex-initial px-3 py-1 sm:py-1.5 short:py-0.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/18 border border-white/15 text-zinc-100 transition-colors whitespace-nowrap"
                  >
                    Pass
                  </button>
                  {gameState.canCallSingleHand && (
                    <button
                      type="button"
                      data-testid="single-hand-btn"
                      onClick={onCallSingleHand}
                      className="flex-1 sm:flex-initial sm:ml-auto inline-flex items-center justify-center gap-1 px-2.5 py-1 sm:py-1.5 short:py-0.5 rounded-lg text-xs font-semibold bg-[#D92B3A]/25 hover:bg-[#D92B3A] border border-[#D92B3A] text-white transition-colors whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Single Hand (3pt)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Trump Picker inside CENTER FELT ZONE */}
            {isMyTrumpSelect && (
              <div
                data-testid="trump-picker"
                className="relative z-20 bg-[#151720]/96 border border-[#D92B3A]/75 rounded-xl p-2 sm:p-4 short:p-1.5 shadow-2xl space-y-2 short:space-y-1 text-center max-w-md short:max-w-lg w-full shrink-0"
              >
                <div className="text-[11px] sm:text-sm font-semibold text-white">
                  Won Bid ({gameState.highestBid}) — Choose Hidden Trump
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  {SUITS.map((suit) => {
                    const isRed = suit === 'H' || suit === 'D';
                    return (
                      <button
                        key={suit}
                        type="button"
                        onClick={() => onSelectTrump(suit)}
                        aria-label={`Select ${SUIT_NAMES[suit]} as trump`}
                        className="flex flex-col items-center justify-center px-1 py-1.5 sm:py-2.5 short:py-1 rounded-xl bg-[#1E202B] hover:bg-[#2A2D3D] border border-white/12 hover:border-[#D92B3A] transition-colors"
                      >
                        <span className={`text-base sm:text-2xl short:text-base leading-none ${isRed ? 'text-[#EF4444]' : 'text-zinc-100'}`}>
                          {SUIT_SYMBOLS[suit]}
                        </span>
                        <span className="text-[9px] sm:text-xs text-zinc-300 mt-0.5 truncate max-w-full">
                          {SUIT_NAMES[suit]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <button
                    type="button"
                    data-testid="select-seventh-card-btn"
                    onClick={onSelectSeventhCard}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 short:py-1 rounded-xl bg-[#1E202B] hover:bg-[#2A2D3D] border border-white/15 hover:border-[#D92B3A] text-[11px] sm:text-xs font-semibold text-zinc-100 transition-colors"
                  >
                    <span className="text-[#F87171] font-mono-nums">7th</span>
                    <span>7th Card</span>
                  </button>
                  <button
                    type="button"
                    data-testid="select-joker-no-trump-btn"
                    onClick={onSelectJokerNoTrump}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 short:py-1 rounded-xl bg-[#291319] hover:bg-[#3A1922] border border-[#D92B3A]/60 text-[11px] sm:text-xs font-semibold text-zinc-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F87171]" />
                    <span>Joker (No Trump)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* EAST: Right Opponent */}
          <div className="flex items-center justify-end min-w-0">
            <SeatPlate
              seat={rightSeat}
              player={gameState.seats[rightSeat]}
              cardCount={gameState.handCounts[rightSeat]}
              isActive={activeSeat === rightSeat}
              isDealer={gameState.dealerSeat === rightSeat}
              isBidder={gameState.highestBidderSeat === rightSeat}
              bidAmount={gameState.highestBidderSeat === rightSeat ? effectiveBid : null}
              passed={gameState.phase === 'bidding' && gameState.passedSeats[rightSeat]}
              isSittingOut={gameState.isSingleHand && gameState.singleHandPartnerSeat === rightSeat}
              voicePeer={voicePeers.find((vp) => vp.playerId === gameState.seats[rightSeat]?.playerId)}
              isSpeaking={Boolean(
                gameState.seats[rightSeat] && speakingMap[gameState.seats[rightSeat]!.playerId]
              )}
              placement="side"
            />
          </div>
        </div>

        {/* SOUTH: Bottom Player Info + Hand */}
        <div className="flex flex-col items-center gap-1 sm:gap-1.5 pb-0.5 shrink-0">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span
              data-testid={`seat-plate-${bottomSeat}`}
              className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border font-semibold whitespace-nowrap transition-all ${getTeamPlateClasses(
                bottomSeat,
                activeSeat === bottomSeat,
                false,
                gameState.isSingleHand && gameState.singleHandPartnerSeat === bottomSeat
              )} text-zinc-100`}
            >
              {gameState.seats[bottomSeat]?.name ?? 'You'} (You ·{' '}
              {getTeamForSeat(bottomSeat) === 0 ? 'Red 6♥' : 'Black 6♠'})
              {gameState.dealerSeat === bottomSeat ? ' · D' : ''}
              {gameState.isSingleHand && gameState.singleHandPartnerSeat === bottomSeat
                ? ' · Sitting Out'
                : activeSeat === bottomSeat
                  ? ' · Your Turn'
                  : ''}
            </span>
            <span className="sm:hidden font-mono-nums text-zinc-400 whitespace-nowrap">
              R{gameState.roundPoints[0]} / B{gameState.roundPoints[1]}
            </span>
            {gameState.canSurrender &&
              gameState.phase !== 'round_over' &&
              gameState.phase !== 'match_over' && (
                <button
                  type="button"
                  data-testid="surrender-btn"
                  onClick={() => setConfirmSurrenderOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#2A1116] hover:bg-[#D92B3A] border border-[#D92B3A]/70 text-[#FCA5A5] hover:text-white text-[10px] sm:text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Flag className="w-3 h-3" />
                  <span>Surrender</span>
                </button>
              )}
          </div>

          <div
            data-testid="player-hand"
            className="flex items-center justify-center gap-1 sm:gap-2 short:gap-1 max-w-full px-1 py-0.5"
          >
            {gameState.isSingleHand && gameState.singleHandPartnerSeat === bottomSeat ? (
              <div className="px-4 py-2.5 rounded-xl bg-[#14161F]/90 border border-white/10 text-xs text-zinc-400">
                Your partner called Single Hand — you sit out this round.
              </div>
            ) : (
              gameState.myHand.map((card) => {
                const isLegal = isMyPlayTurn && gameState.legalCardIds.includes(card.id);
                const isDimmed = isMyPlayTurn && !isLegal;
                return (
                  <SpiderCard
                    key={card.id}
                    card={card}
                    size="hand"
                    playable={isLegal}
                    dimmed={isDimmed}
                    onClick={isMyPlayTurn ? () => onPlayCard(card.id) : undefined}
                  />
                );
              })
            )}
          </div>
        </div>
      </main>

      <RoundModal
        gameState={gameState}
        onNextRound={onNextRound}
        onRematch={onRematch}
        onSurrender={() => setConfirmSurrenderOpen(true)}
        onLeaveRoom={onLeaveRoom}
      />

      {confirmSurrenderOpen && (
        <div
          data-testid="surrender-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          role="dialog"
          aria-modal="true"
          aria-labelledby="surrender-confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#151720] border border-[#D92B3A]/60 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#D92B3A]/15 border border-[#D92B3A]/40 flex items-center justify-center text-[#EF4444]">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <h3 id="surrender-confirm-title" className="font-display text-xl font-bold text-white">
                  Surrender This Round?
                </h3>
                <p className="text-xs text-zinc-400">
                  Concede Round {gameState.roundNumber} · Worth {gameState.roundStake} pt{gameState.roundStake > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Surrendering ends only this round and awards{' '}
              <span className="font-mono-nums font-semibold text-white">
                {gameState.roundStake} pt{gameState.roundStake > 1 ? 's' : ''}
              </span>{' '}
              ({gameState.roundStake}♥ / {gameState.roundStake}♠) to the opposing team.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSurrenderOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 text-xs font-semibold text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-surrender-btn"
                onClick={() => {
                  setConfirmSurrenderOpen(false);
                  onSurrender();
                }}
                className="px-4 py-2 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] text-white text-xs font-semibold transition-colors"
              >
                Confirm Surrender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SeatPlateProps {
  seat: SeatIndex;
  player: ClientGameView['seats'][number];
  cardCount: number;
  isActive: boolean;
  isDealer: boolean;
  isBidder: boolean;
  bidAmount: number | null;
  passed: boolean;
  isSittingOut?: boolean;
  voicePeer: VoicePeerInfo | undefined;
  isSpeaking: boolean;
  placement: 'top' | 'side';
}

function SeatPlate({
  seat,
  player,
  cardCount,
  isActive,
  isDealer,
  isBidder,
  bidAmount,
  passed,
  isSittingOut,
  voicePeer,
  isSpeaking,
  placement,
}: SeatPlateProps) {
  const team = getTeamForSeat(seat);
  const teamTextColor = team === 0 ? 'text-[#FCA5A5]' : 'text-zinc-300';
  const plateClasses = getTeamPlateClasses(seat, isActive, isSpeaking, isSittingOut);

  if (placement === 'top') {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          data-testid={`seat-plate-${seat}`}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 short:py-0.5 rounded-xl border transition-all min-w-[128px] sm:min-w-[148px] ${plateClasses}`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-100 truncate flex items-center gap-1">
              {player?.isBot && <Bot className="w-3 h-3 text-zinc-300 shrink-0" />}
              <span className="truncate">{player?.name ?? `Seat ${seat + 1}`}</span>
            </span>
            {voicePeer &&
              (voicePeer.muted ? (
                <MicOff className="w-3 h-3 text-zinc-400 shrink-0" />
              ) : (
                <Mic className={`w-3 h-3 shrink-0 ${isSpeaking ? 'text-white' : 'text-zinc-300'}`} />
              ))}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono-nums text-zinc-300/85 whitespace-nowrap">
            <span className={teamTextColor}>{team === 0 ? 'Red 6♥' : 'Black 6♠'}</span>
            <span>·</span>
            <span>{isSittingOut ? 'Out' : `${cardCount}c`}</span>
            {isDealer && <span className="text-zinc-100">· D</span>}
            {isBidder && bidAmount !== null && (
              <span className="text-white font-semibold">· {bidAmount === 29 ? 'Solo' : `B${bidAmount}`}</span>
            )}
            {passed && !isBidder && !isSittingOut && <span>· Pass</span>}
          </div>
        </div>

        {cardCount > 0 && !isSittingOut && (
          <div className="hidden md:flex short:hidden items-center -space-x-6">
            {Array.from({ length: Math.min(cardCount, 4) }).map((_, i) => (
              <SpiderCard key={i} faceDown size="xs" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div
        data-testid={`seat-plate-${seat}`}
        className={`w-full px-1.5 sm:px-3 py-1.5 sm:py-2 short:py-1 rounded-xl border transition-all ${plateClasses}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-semibold text-zinc-100 truncate flex items-center gap-1">
            {player?.isBot && <Bot className="hidden sm:inline w-3 h-3 text-zinc-300 shrink-0" />}
            <span className="truncate">{player?.name ?? `S${seat + 1}`}</span>
          </span>
          {voicePeer &&
            (voicePeer.muted ? (
              <MicOff className="w-3 h-3 text-zinc-400 shrink-0" />
            ) : (
              <Mic className={`w-3 h-3 shrink-0 ${isSpeaking ? 'text-white' : 'text-zinc-300'}`} />
            ))}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[9px] sm:text-[11px] font-mono-nums text-zinc-300/85 leading-tight">
          <span className={teamTextColor}>{team === 0 ? 'Red' : 'Blk'}</span>
          <span>·</span>
          <span>{isSittingOut ? 'Out' : `${cardCount}c`}</span>
          {isDealer && <span className="text-zinc-100">· D</span>}
          {isBidder && bidAmount !== null && (
            <span className="text-white font-semibold">· {bidAmount === 29 ? 'Solo' : `B${bidAmount}`}</span>
          )}
          {passed && !isBidder && !isSittingOut && <span>· Pass</span>}
        </div>
      </div>

      {cardCount > 0 && !isSittingOut && (
        <div className="hidden md:flex short:hidden items-center -space-x-6">
          {Array.from({ length: Math.min(cardCount, 4) }).map((_, i) => (
            <SpiderCard key={i} faceDown size="xs" />
          ))}
        </div>
      )}
    </div>
  );
}

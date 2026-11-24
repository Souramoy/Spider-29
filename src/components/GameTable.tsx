import { useState } from 'react';
import {
  BookOpen,
  Bot,
  Check,
  Copy,
  Crown,
  Eye,
  Flame,
  LogOut,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  getEffectiveBid,
  getTeamForSeat,
  SUIT_NAMES,
  SUIT_SYMBOLS,
  SUITS,
  type ClientGameView,
  type SeatIndex,
  type Suit,
} from '../game/twentyNine';
import type { VoicePeerInfo } from '../hooks/useVoiceChat';
import { SpiderCard } from './SpiderCard';
import { VoiceBar } from './VoiceBar';
import { RoundModal } from './RoundModal';
import { ScoreCardsWidget } from './ScoreCardsWidget';

interface GameTableProps {
  gameState: ClientGameView;
  voicePeers: VoicePeerInfo[];
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
  onRevealTrump: () => void;
  onDeclareMarriage: () => void;
  onDoubleStake: () => void;
  onCallSingleHand: () => void;
  onPlayCard: (cardId: string) => void;
  onNextRound: () => void;
  onRematch: () => void;
  onLeaveRoom: () => void;
  onOpenRules: () => void;
  onToggleSound: () => void;
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onClearVoiceError: () => void;
}

export function GameTable({
  gameState,
  voicePeers,
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
  onRevealTrump,
  onDeclareMarriage,
  onDoubleStake,
  onCallSingleHand,
  onPlayCard,
  onNextRound,
  onRematch,
  onLeaveRoom,
  onOpenRules,
  onToggleSound,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onToggleDeafen,
  onClearVoiceError,
}: GameTableProps) {
  const [copied, setCopied] = useState(false);

  const baseSeat: SeatIndex = gameState.mySeat ?? 0;
  const bottomSeat = baseSeat;
  const leftSeat = ((baseSeat + 1) % 4) as SeatIndex;
  const topSeat = ((baseSeat + 2) % 4) as SeatIndex;
  const rightSeat = ((baseSeat + 3) % 4) as SeatIndex;

  const isMyBidTurn = gameState.phase === 'bidding' && gameState.bidTurnSeat === bottomSeat;
  const isMyTrumpSelect = gameState.phase === 'trump_select' && gameState.highestBidderSeat === bottomSeat;
  const isMyPlayTurn = gameState.phase === 'playing' && gameState.turnSeat === bottomSeat;
  const isBiddingOrTrump = gameState.phase === 'bidding' || gameState.phase === 'trump_select';

  const minBid =
    gameState.highestBid === null ? 16 : Math.min(28, gameState.highestBid + 1);
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
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,20,26,0.35)_0%,rgba(9,10,14,0.88)_100%)] pointer-events-none"
      />

      {/* Unified Top Perimeter HUD Strip */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-[#101218]/95 border-b border-white/10">
        {/* Left: Room Code + Round */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void copyInvite()}
            aria-label={`Copy invite link for room ${gameState.roomCode}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-xs font-mono-nums text-zinc-200 transition-colors whitespace-nowrap"
          >
            <span>{gameState.roomCode}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-[#F87171]" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          <span className="hidden md:inline text-xs text-zinc-400 font-mono-nums whitespace-nowrap">
            R{gameState.roundNumber} · T{Math.min(8, gameState.tricksCompleted + 1)}/8 ·{' '}
            {gameState.isSingleHand ? 'Single 3pt' : `Stake ${gameState.roundStake}pt`}
          </span>
        </div>

        {/* Center: 6♥ & 6♠ Tug-of-War Scoreboard + Round Card Points */}
        <div className="flex items-center gap-3 sm:gap-5">
          <ScoreCardsWidget netScore={gameState.netScore} size="compact" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono-nums text-zinc-400 whitespace-nowrap">
            <span className="text-[#F87171]">Red {gameState.roundPoints[0]}</span>
            <span>/</span>
            <span className="text-zinc-200">Black {gameState.roundPoints[1]}</span>
          </div>
        </div>

        {/* Right: Voice + Sound + Rules + Leave */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-1.5 sm:p-2 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-zinc-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            aria-label="Open rules"
            className="p-1.5 sm:p-2 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-zinc-300 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#EF4444]" />
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave room"
            className="p-1.5 sm:p-2 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-zinc-300 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Playfield Grid */}
      <main className="relative z-10 flex-1 min-h-0 grid grid-rows-[auto_1fr_auto] p-2 sm:p-5 gap-1.5 sm:gap-2 overflow-hidden">
        {/* Top Row: Mobile shows all 3 opponents in a compact grid; Desktop shows Top Partner only */}
        <div className="sm:hidden grid grid-cols-3 gap-1.5 w-full shrink-0">
          <OpponentSeatPlate
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
            orientation="compact"
          />
          <OpponentSeatPlate
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
            orientation="compact"
          />
          <OpponentSeatPlate
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
            orientation="compact"
          />
        </div>

        <div className="hidden sm:flex flex-col items-center justify-center gap-1.5">
          <OpponentSeatPlate
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
            orientation="horizontal"
          />
        </div>

        {/* Middle Row: Scrollable on tiny screens so bidding/trump panels are NEVER clipped under cards */}
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_160px] lg:grid-cols-[185px_1fr_185px] items-center gap-2 min-h-0">
          {/* Left Opponent (Desktop+) */}
          <div className="hidden sm:flex items-center justify-start">
            <OpponentSeatPlate
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
              orientation="vertical"
            />
          </div>

          {/* Center Battle Zone + Trump Slot + Contextual Bidding/Trump UI */}
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 min-w-0 max-h-full overflow-y-auto py-1">
            {/* Live Status Line */}
            <div
              data-testid="table-status"
              className="px-3 py-1 rounded-lg bg-[#12141B]/90 border border-white/10 text-xs sm:text-sm text-zinc-200 text-center max-w-full sm:max-w-xl truncate shrink-0"
            >
              {errorMessage ? (
                <span className="text-[#FCA5A5]">{errorMessage}</span>
              ) : (
                gameState.statusMessage
              )}
            </div>

            {/* Center Trick & Trump Display (hidden on mobile during active bidding/trump selection so controls stay front-and-center) */}
            <div
              className={`${
                isBiddingOrTrump ? 'hidden sm:flex' : 'flex'
              } items-center justify-center gap-3 sm:gap-8 shrink-0`}
            >
              {/* 4-Way Trick Slots (Partner slot hidden when Single Hand active) */}
              <div
                data-testid="trick-arena"
                className="relative w-44 h-36 sm:w-64 sm:h-52 flex items-center justify-center"
              >
                {/* Top Card */}
                {!(gameState.isSingleHand && gameState.singleHandPartnerSeat === topSeat) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    {getPlayedCardForSeat(topSeat) ? (
                      <div className="animate-card-enter">
                        <SpiderCard card={getPlayedCardForSeat(topSeat)!} size="sm" />
                      </div>
                    ) : (
                      <div className="w-11 h-16 sm:w-14 sm:h-20 rounded-lg border border-dashed border-white/10 bg-black/15" />
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
                      <div className="w-11 h-16 sm:w-14 sm:h-20 rounded-lg border border-dashed border-white/10 bg-black/15" />
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
                      <div className="w-11 h-16 sm:w-14 sm:h-20 rounded-lg border border-dashed border-white/10 bg-black/15" />
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
                      <div className="w-11 h-16 sm:w-14 sm:h-20 rounded-lg border border-dashed border-white/10 bg-black/15" />
                    )}
                  </div>
                )}
              </div>

              {/* Hidden / Revealed Trump Indicator OR Single Hand Mode */}
              <div
                data-testid="trump-slot"
                className="flex flex-col items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-[#13151D]/90 border border-white/10 shrink-0"
              >
                <span className="text-[11px] font-medium text-zinc-400 whitespace-nowrap">
                  {gameState.isSingleHand
                    ? 'Single Hand'
                    : gameState.trumpRevealed
                      ? 'Trump Open'
                      : 'Trump'}
                </span>
                {gameState.isSingleHand ? (
                  <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg border border-[#D92B3A] bg-[#1C1E28] flex flex-col items-center justify-center px-1 text-center">
                    <Zap className="w-4 h-4 text-[#EF4444]" />
                    <span className="text-[10px] font-semibold text-zinc-100 leading-tight mt-1">
                      No Trump
                    </span>
                  </div>
                ) : gameState.trumpSuit ? (
                  <div
                    className={`w-11 h-14 sm:w-12 sm:h-16 rounded-lg border flex flex-col items-center justify-center ${
                      gameState.trumpRevealed
                        ? 'bg-[#1C1E28] border-[#D92B3A]'
                        : 'bg-[#161822] border-dashed border-zinc-500'
                    }`}
                  >
                    <span
                      className={`text-xl sm:text-2xl leading-none ${
                        gameState.trumpSuit === 'H' || gameState.trumpSuit === 'D'
                          ? 'text-[#EF4444]'
                          : 'text-zinc-100'
                      }`}
                    >
                      {SUIT_SYMBOLS[gameState.trumpSuit]}
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      {gameState.trumpRevealed ? SUIT_NAMES[gameState.trumpSuit] : 'Secret'}
                    </span>
                  </div>
                ) : (
                  <SpiderCard faceDown size="xs" ariaLabel="Hidden trump card" />
                )}
                {gameState.isSingleHand ? (
                  <span className="text-[11px] font-mono-nums text-[#F87171] whitespace-nowrap">
                    8 Tricks · 3pt
                  </span>
                ) : (
                  effectiveBid !== null && (
                    <span className="text-[11px] font-mono-nums text-zinc-300 whitespace-nowrap">
                      Bid {effectiveBid} · {gameState.roundStake}pt
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Contextual Controls: Bidding Panel */}
            {isMyBidTurn && (
              <div
                data-testid="bidding-panel"
                className="bg-[#151720]/95 border border-[#D92B3A]/60 rounded-xl p-3 sm:p-4 shadow-2xl max-w-lg w-full space-y-2 shrink-0"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Your Turn to Bid</span>
                  <span className="font-mono-nums text-zinc-400">
                    {gameState.highestBid ? `Current: ${gameState.highestBid} · Min: ${minBid}` : 'Bid 16–28'}
                  </span>
                </div>
                <div className="grid grid-cols-7 sm:flex sm:flex-wrap gap-1.5">
                  {Array.from({ length: 13 }, (_, idx) => 16 + idx).map((amount) => {
                    const disabled = amount < minBid;
                    return (
                      <button
                        key={amount}
                        type="button"
                        disabled={disabled}
                        onClick={() => onBid(amount)}
                        className="py-2 sm:px-2.5 sm:py-1.5 rounded-lg font-mono-nums text-xs font-semibold bg-[#1E212D] hover:bg-[#D92B3A] disabled:opacity-30 disabled:hover:bg-[#1E212D] border border-white/10 text-zinc-100 transition-colors"
                      >
                        {amount}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={onPass}
                    className="col-span-3 sm:col-span-1 sm:ml-auto px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/16 border border-white/15 text-zinc-100 transition-colors whitespace-nowrap"
                  >
                    Pass
                  </button>
                  {gameState.canCallSingleHand && (
                    <button
                      type="button"
                      data-testid="single-hand-btn"
                      onClick={onCallSingleHand}
                      className="col-span-4 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-[#D92B3A]/20 hover:bg-[#D92B3A] border border-[#D92B3A] text-white transition-colors whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Single Hand (3 pts)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Contextual Controls: Trump Picker */}
            {isMyTrumpSelect && (
              <div
                data-testid="trump-picker"
                className="bg-[#151720]/95 border border-[#D92B3A]/60 rounded-xl p-3.5 sm:p-4 shadow-2xl space-y-3 text-center max-w-full shrink-0"
              >
                <div className="text-xs sm:text-sm font-semibold text-white">
                  You Won the Bid ({gameState.highestBid}) — Select Hidden Trump Suit
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SUITS.map((suit) => {
                    const isRed = suit === 'H' || suit === 'D';
                    return (
                      <button
                        key={suit}
                        type="button"
                        onClick={() => onSelectTrump(suit)}
                        aria-label={`Select ${SUIT_NAMES[suit]} as trump`}
                        className="flex flex-col items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#1E202B] hover:bg-[#2A2D3D] border border-white/12 hover:border-[#D92B3A] transition-colors"
                      >
                        <span className={`text-xl sm:text-2xl ${isRed ? 'text-[#EF4444]' : 'text-zinc-100'}`}>
                          {SUIT_SYMBOLS[suit]}
                        </span>
                        <span className="text-[11px] sm:text-xs text-zinc-300 mt-1">{SUIT_NAMES[suit]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contextual Controls: Reveal Trump / Declare Pair / Double Stake / Single Hand */}
            {gameState.phase === 'playing' &&
              ((isMyPlayTurn && (gameState.canRevealTrump || gameState.canDeclareMarriage)) ||
                gameState.canDoubleStake ||
                gameState.canCallSingleHand) && (
                <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
                  {isMyPlayTurn && gameState.canRevealTrump && (
                    <button
                      type="button"
                      onClick={onRevealTrump}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] text-white text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal Hidden Trump</span>
                    </button>
                  )}
                  {isMyPlayTurn && gameState.canDeclareMarriage && (
                    <button
                      type="button"
                      onClick={onDeclareMarriage}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F222E] hover:bg-[#292D3D] border border-[#D92B3A]/60 text-[#FCA5A5] text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Declare Pair (K+Q)</span>
                    </button>
                  )}
                  {gameState.canDoubleStake && (
                    <button
                      type="button"
                      onClick={onDoubleStake}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F222E] hover:bg-[#292D3D] border border-[#D92B3A]/60 text-zinc-100 text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span>
                        {gameState.roundStake === 1 ? 'Double (2 pts)' : 'Redouble (4 pts)'}
                      </span>
                    </button>
                  )}
                  {gameState.canCallSingleHand && (
                    <button
                      type="button"
                      data-testid="single-hand-btn"
                      onClick={onCallSingleHand}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D92B3A]/20 hover:bg-[#D92B3A] border border-[#D92B3A] text-white text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Single Hand (3 pts)</span>
                    </button>
                  )}
                </div>
              )}
          </div>

          {/* Right Opponent (Desktop+) */}
          <div className="hidden sm:flex items-center justify-end">
            <OpponentSeatPlate
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
              orientation="vertical"
            />
          </div>
        </div>

        {/* Bottom Row: Player Info + Hand */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 pb-1 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-3 py-1 rounded-lg border font-semibold whitespace-nowrap ${
                activeSeat === bottomSeat
                  ? 'bg-[#D92B3A]/20 border-[#D92B3A] text-white'
                  : 'bg-[#151720]/90 border-white/10 text-zinc-300'
              }`}
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
          </div>

          <div
            data-testid="player-hand"
            className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 sm:gap-2.5 max-w-full px-1 py-0.5"
          >
            {gameState.isSingleHand && gameState.singleHandPartnerSeat === bottomSeat ? (
              <div className="px-4 py-3 rounded-xl bg-[#14161F]/90 border border-white/10 text-xs text-zinc-400">
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
        onLeaveRoom={onLeaveRoom}
      />
    </div>
  );
}

interface OpponentSeatPlateProps {
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
  orientation: 'horizontal' | 'vertical' | 'compact';
}

function OpponentSeatPlate({
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
  orientation,
}: OpponentSeatPlateProps) {
  const team = getTeamForSeat(seat);
  const teamColor = team === 0 ? 'text-[#F87171]' : 'text-zinc-300';

  if (orientation === 'compact') {
    return (
      <div
        className={`px-2 py-1.5 rounded-lg bg-[#14161F]/95 border transition-colors min-w-0 ${
          isSittingOut ? 'opacity-60 border-white/10' : ''
        } ${
          isSpeaking
            ? 'border-[#EF4444] ring-1 ring-[#EF4444]/60'
            : isActive
              ? 'border-[#D92B3A]'
              : 'border-white/10'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-semibold text-zinc-100 truncate">
            {player?.name ?? `Seat ${seat + 1}`}
          </span>
          {voicePeer &&
            (voicePeer.muted ? (
              <MicOff className="w-3 h-3 text-zinc-500 shrink-0" />
            ) : (
              <Mic className={`w-3 h-3 shrink-0 ${isSpeaking ? 'text-[#EF4444]' : 'text-zinc-300'}`} />
            ))}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono-nums text-zinc-400 truncate">
          <span className={teamColor}>{team === 0 ? 'Red' : 'Blk'}</span>
          <span>·</span>
          <span>{isSittingOut ? 'Out' : `${cardCount}c`}</span>
          {isBidder && bidAmount !== null && (
            <span className="text-[#F87171]">· {bidAmount === 29 ? 'Solo' : `B${bidAmount}`}</span>
          )}
          {passed && !isBidder && !isSittingOut && <span>· Pass</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${
        orientation === 'horizontal' ? 'flex-row items-center gap-3' : 'flex-col items-center gap-2'
      } ${isSittingOut ? 'opacity-65' : ''}`}
    >
      <div
        className={`px-3 py-2 rounded-xl bg-[#14161F]/95 border transition-colors min-w-[112px] sm:min-w-[138px] ${
          isSpeaking
            ? 'border-[#EF4444] ring-2 ring-[#EF4444]/60'
            : isActive
              ? 'border-[#D92B3A]'
              : 'border-white/10'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-semibold text-zinc-100 truncate flex items-center gap-1">
            {player?.isBot && <Bot className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
            <span className="truncate">{player?.name ?? `Seat ${seat + 1}`}</span>
          </span>
          {voicePeer &&
            (voicePeer.muted ? (
              <MicOff className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            ) : (
              <Mic className={`w-3.5 h-3.5 shrink-0 ${isSpeaking ? 'text-[#EF4444]' : 'text-zinc-300'}`} />
            ))}
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-mono-nums text-zinc-400 whitespace-nowrap">
          <span className={teamColor}>{team === 0 ? 'Red 6♥' : 'Black 6♠'}</span>
          <span aria-hidden="true">·</span>
          <span>{isSittingOut ? 'Sitting out' : `${cardCount} cards`}</span>
          {isDealer && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-zinc-200">D</span>
            </>
          )}
          {isBidder && bidAmount !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#F87171]">{bidAmount === 29 ? 'Single' : `Bid ${bidAmount}`}</span>
            </>
          )}
          {passed && !isBidder && !isSittingOut && (
            <>
              <span aria-hidden="true">·</span>
              <span>Pass</span>
            </>
          )}
        </div>
      </div>

      {/* Compact face-down card fan */}
      {cardCount > 0 && !isSittingOut && (
        <div className="hidden sm:flex items-center -space-x-6">
          {Array.from({ length: Math.min(cardCount, 4) }).map((_, i) => (
            <SpiderCard key={i} faceDown size="xs" />
          ))}
        </div>
      )}
    </div>
  );
}

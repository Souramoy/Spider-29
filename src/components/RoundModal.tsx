import { Trophy, RotateCw } from 'lucide-react';
import { getSixCardPipState, SUIT_NAMES, SUIT_SYMBOLS, type ClientGameView } from '../game/twentyNine';
import { ScoreCardsWidget } from './ScoreCardsWidget';

interface RoundModalProps {
  gameState: ClientGameView;
  onNextRound: () => void;
  onRematch: () => void;
  onLeaveRoom: () => void;
}

export function RoundModal({
  gameState,
  onNextRound,
  onRematch,
  onLeaveRoom,
}: RoundModalProps) {
  if (gameState.phase !== 'round_over' && gameState.phase !== 'match_over') {
    return null;
  }

  const summary = gameState.lastRoundSummary;
  if (!summary) return null;

  const isMatchOver = gameState.phase === 'match_over';
  const winnerLabel = summary.roundWinnerTeam === 0 ? 'Red Team (Crimson)' : 'Black Team (Obsidian)';
  const bidderTeamLabel = summary.bidderTeam === 0 ? 'Red Team' : 'Black Team';
  const bidderName = gameState.seats[summary.bidderSeat]?.name ?? `Seat ${summary.bidderSeat + 1}`;
  const pipState = getSixCardPipState(gameState.netScore);
  const matchWinnerLabel = pipState.leadingTeam === 0 ? 'Red Team (6♥)' : 'Black Team (6♠)';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-outcome-title"
    >
      <div className="w-full max-w-md bg-[#14161E] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">
              {isMatchOver ? 'Match Complete' : `Round ${summary.roundNumber} Complete`}
            </div>
            <h2 id="round-outcome-title" className="font-display text-2xl sm:text-3xl font-bold text-white mt-0.5">
              {isMatchOver
                ? `${matchWinnerLabel} Wins!`
                : `${winnerLabel} +${summary.roundStake} pt${summary.roundStake > 1 ? 's' : ''}`}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D92B3A]/15 border border-[#D92B3A]/35 flex items-center justify-center text-[#EF4444]">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* 6♥ & 6♠ Tug-of-War Card Indicator */}
          <div className="bg-[#181A24] border border-white/8 rounded-xl p-4">
            <ScoreCardsWidget netScore={gameState.netScore} size="full" />
          </div>

          {/* Contract Result */}
          <div className="bg-[#1B1D27] border border-white/8 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-400">Contract</span>
              <span className="text-zinc-100 font-medium text-right">
                {summary.isSingleHand ? (
                  <>
                    {bidderName} ({bidderTeamLabel}) · <span className="text-[#F87171]">Single Hand</span>
                  </>
                ) : (
                  <>
                    {bidderName} ({bidderTeamLabel}) · Bid{' '}
                    <span className="font-mono-nums">{summary.effectiveBid}</span>
                    {summary.marriageDeclaredByTeam !== null && (
                      <span className="text-xs text-[#F87171]"> (from {summary.baseBid})</span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Trump Suit</span>
              <span className="text-zinc-100 font-medium">
                {summary.isSingleHand || !summary.trumpSuit
                  ? 'No Trump (Single Hand)'
                  : `${SUIT_SYMBOLS[summary.trumpSuit]} ${SUIT_NAMES[summary.trumpSuit]}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Round Stake</span>
              <span className="font-mono-nums text-zinc-100 font-medium">
                {summary.roundStake} pt{summary.roundStake > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Outcome</span>
              <span className={summary.contractMade ? 'text-emerald-400 font-semibold' : 'text-[#F87171] font-semibold'}>
                {summary.isSingleHand
                  ? summary.contractMade
                    ? `Swept 8/8 Tricks (+3 to ${bidderTeamLabel})`
                    : `Broken on Trick ${summary.singleHandTricksWon + 1} (+3 to Defenders)`
                  : summary.contractMade
                    ? `Made (+${summary.roundStake} to ${bidderTeamLabel})`
                    : `Failed (+${summary.roundStake} to Defenders)`}
              </span>
            </div>
          </div>

          {/* Round Card Points */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#1B1D27] border border-[#D92B3A]/30 rounded-xl p-3">
              <div className="text-xs text-[#F87171] font-medium">Red Team (6♥)</div>
              <div className="font-mono-nums text-xl font-bold text-white mt-1">
                {summary.pointsByTeam[0]} <span className="text-xs font-normal text-zinc-400">card pts</span>
              </div>
            </div>

            <div className="bg-[#1B1D27] border border-white/10 rounded-xl p-3">
              <div className="text-xs text-zinc-300 font-medium">Black Team (6♠)</div>
              <div className="font-mono-nums text-xl font-bold text-white mt-1">
                {summary.pointsByTeam[1]} <span className="text-xs font-normal text-zinc-400">card pts</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/6 border border-white/10 text-sm font-medium text-zinc-300 transition-colors whitespace-nowrap"
            >
              Leave Room
            </button>

            {isMatchOver ? (
              <button
                type="button"
                data-start="true"
                onClick={onRematch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <RotateCw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            ) : (
              <button
                type="button"
                data-start="true"
                onClick={onNextRound}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>Deal Next Round</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { getSixCardPipState } from '../game/twentyNine';

interface ScoreCardsWidgetProps {
  netScore: number;
  size?: 'compact' | 'full';
}

/**
 * Classic 29 Score Indicator using the 6 of Hearts (Red Team) & 6 of Spades (Black Team).
 * - Positive netScore (+1..+6): 6♥ leads in front & slides open to reveal N Red Hearts; 6♠ stays closed.
 * - Negative netScore (-1..-6): 6♥ closes completely, card order flips so 6♠ moves in front & reveals |N| Black Spades.
 */
export function ScoreCardsWidget({ netScore, size = 'compact' }: ScoreCardsWidgetProps) {
  const { leadingTeam, redHeartsRevealed, blackSpadesRevealed, cardOrder } =
    getSixCardPipState(netScore);

  const renderCard = (suit: 'H' | 'S') => {
    const isRed = suit === 'H';
    const revealedCount = isRed ? redHeartsRevealed : blackSpadesRevealed;
    const isLeading = (isRed && leadingTeam === 0) || (!isRed && leadingTeam === 1);
    const revealedRows = Math.ceil(revealedCount / 2); // 0, 1, 2, or 3 rows uncovered
    const coverSlidePercent = revealedCount === 0 ? 0 : Math.min(105, revealedRows * 33 + 6);

    if (size === 'compact') {
      return (
        <div
          key={suit}
          data-testid={`score-card-${suit}`}
          aria-label={
            isRed
              ? `Red Team 6 of Hearts: ${revealedCount} of 6 hearts revealed`
              : `Black Team 6 of Spades: ${revealedCount} of 6 spades revealed`
          }
          className={`relative w-10 h-14 rounded-md border overflow-hidden transition-transform duration-200 flex flex-col p-1 ${
            isLeading
              ? isRed
                ? 'bg-[#1D1519] border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.28)] scale-105 z-10'
                : 'bg-[#1B1D26] border-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.14)] scale-105 z-10'
              : 'bg-[#121319] border-white/15 opacity-75'
          }`}
        >
          {/* Pip Area */}
          <div className="relative flex-1 w-full grid grid-cols-2 grid-rows-3 place-items-center overflow-hidden rounded-sm">
            {Array.from({ length: 6 }).map((_, pipIdx) => {
              const isVisible = pipIdx < revealedCount;
              return (
                <span
                  key={pipIdx}
                  className={`relative z-20 text-[10px] leading-none transition-opacity duration-200 ${
                    isVisible
                      ? isRed
                        ? 'text-[#EF4444] opacity-100'
                        : 'text-zinc-100 opacity-100'
                      : 'text-zinc-700 opacity-15'
                  }`}
                >
                  {isRed ? '♥' : '♠'}
                </span>
              );
            })}

            {/* Sliding Spider Cover Sleeve */}
            <div
              aria-hidden="true"
              style={{
                transform: `translateY(${coverSlidePercent}%)`,
              }}
              className="absolute inset-0 z-10 bg-[#14161F] border-t border-[#D92B3A]/70 transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none"
            >
              {revealedCount === 0 && (
                <span className="font-display text-[10px] font-bold text-zinc-500">
                  {isRed ? '6♥' : '6♠'}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Full-size 6♥ / 6♠ card pair for Round & Match modal
    return (
      <div
        key={suit}
        data-testid={`modal-score-card-${suit}`}
        className={`relative w-22 h-30 rounded-xl border overflow-hidden transition-transform duration-200 flex flex-col justify-between p-2 ${
          isLeading
            ? isRed
              ? 'bg-[#1D1418] border-[#EF4444] shadow-lg scale-105 z-10'
              : 'bg-[#1B1D27] border-zinc-300 shadow-lg scale-105 z-10'
            : 'bg-[#121319] border-white/15 opacity-75'
        }`}
      >
        <div className="flex items-center justify-between leading-none">
          <span className={`text-xs font-display font-bold ${isRed ? 'text-[#F87171]' : 'text-zinc-200'}`}>
            6{isRed ? '♥' : '♠'}
          </span>
          <span className={`text-[10px] font-mono-nums ${isRed ? 'text-[#FCA5A5]' : 'text-zinc-400'}`}>
            {revealedCount}/6
          </span>
        </div>

        {/* 2x3 Pip Area with Sliding Cover */}
        <div className="relative flex-1 my-1 grid grid-cols-2 grid-rows-3 place-items-center overflow-hidden rounded-md">
          {Array.from({ length: 6 }).map((_, pipIdx) => {
            const isVisible = pipIdx < revealedCount;
            return (
              <span
                key={pipIdx}
                className={`relative z-20 text-base leading-none transition-opacity duration-200 ${
                  isVisible
                    ? isRed
                      ? 'text-[#EF4444] opacity-100 drop-shadow-[0_1px_4px_rgba(239,68,68,0.4)]'
                      : 'text-zinc-100 opacity-100 drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]'
                    : 'text-zinc-700 opacity-15'
                }`}
              >
                {isRed ? '♥' : '♠'}
              </span>
            );
          })}

          {/* Sliding Spider-Crest Cover Card */}
          <div
            aria-hidden="true"
            style={{
              transform: `translateY(${coverSlidePercent}%)`,
            }}
            className="absolute inset-0 z-10 bg-[#14161F] border-t-2 border-[#D92B3A]/75 transition-transform duration-300 ease-out flex flex-col items-center justify-center pointer-events-none"
          >
            {revealedCount === 0 && (
              <>
                <span className={`font-display text-sm font-bold ${isRed ? 'text-[#F87171]/75' : 'text-zinc-400'}`}>
                  {isRed ? '6♥' : '6♠'}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Closed</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const label =
    leadingTeam === 0
      ? `Red +${redHeartsRevealed}♥`
      : leadingTeam === 1
        ? `Black +${blackSpadesRevealed}♠`
        : 'Tied 0';

  if (size === 'compact') {
    return (
      <div className="flex items-center gap-2" data-testid="six-card-scoreboard">
        <div className="flex items-center gap-1">
          {cardOrder.map((suit) => renderCard(suit))}
        </div>
        <span
          className={`text-xs font-mono-nums font-semibold whitespace-nowrap ${
            leadingTeam === 0
              ? 'text-[#F87171]'
              : leadingTeam === 1
                ? 'text-zinc-100'
                : 'text-zinc-400'
          }`}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3" data-testid="modal-six-card-scoreboard">
      <div className="flex items-center justify-center gap-4">
        {cardOrder.map((suit) => renderCard(suit))}
      </div>
      <div className="text-xs font-mono-nums text-zinc-300 text-center">
        {leadingTeam === 0
          ? `Red Team leads · ${redHeartsRevealed} of 6 Hearts revealed`
          : leadingTeam === 1
            ? `Black Team leads · ${blackSpadesRevealed} of 6 Spades revealed (order flipped)`
            : 'Even · Both 6-cards closed (0)'}
      </div>
    </div>
  );
}

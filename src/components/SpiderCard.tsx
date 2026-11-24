import { CARD_POINTS, getCardLabel, SUIT_SYMBOLS, type Card } from '../game/twentyNine';

interface SpiderCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hand';
  playable?: boolean;
  dimmed?: boolean;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

const SIZE_CLASSES: Record<NonNullable<SpiderCardProps['size']>, string> = {
  xs: 'w-9 h-13 rounded-md',
  sm: 'w-14 h-20 rounded-lg',
  md: 'w-20 h-28 rounded-xl',
  lg: 'w-22 h-32 sm:w-24 sm:h-34 rounded-xl',
  hand: 'w-16 h-24 sm:w-22 sm:h-32 md:w-24 md:h-34 rounded-xl',
};

export function SpiderCard({
  card,
  faceDown = false,
  size = 'md',
  playable = false,
  dimmed = false,
  selected = false,
  onClick,
  ariaLabel,
}: SpiderCardProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (faceDown || !card) {
    return (
      <div
        aria-label={ariaLabel ?? 'Face-down Spider card'}
        className={`${sizeClass} relative overflow-hidden bg-[#121318] border border-[#D92B3A]/45 shadow-md select-none shrink-0`}
      >
        <img
          src="/src/assets/images/spider_crest_emblem_1795527387509.jpg"
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Crisp geometric web frame overlay */}
        <svg
          viewBox="0 0 80 112"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="4"
            width="72"
            height="104"
            rx="6"
            fill="none"
            stroke="rgba(217, 43, 58, 0.45)"
            strokeWidth="1"
          />
          <path
            d="M4 4 L22 22 M76 4 L58 22 M4 108 L22 90 M76 108 L58 90"
            stroke="rgba(217, 43, 58, 0.3)"
            strokeWidth="0.9"
          />
        </svg>
      </div>
    );
  }

  const isRedSuit = card.suit === 'H' || card.suit === 'D';
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const points = CARD_POINTS[card.rank];

  const rankSize =
    size === 'xs'
      ? 'text-[10px]'
      : size === 'sm'
        ? 'text-xs'
        : size === 'md'
          ? 'text-base'
          : 'text-lg sm:text-xl';

  const centerSuitSize =
    size === 'xs'
      ? 'text-sm'
      : size === 'sm'
        ? 'text-xl'
        : size === 'md'
          ? 'text-3xl'
          : 'text-4xl';

  const borderStyle = selected
    ? 'border-[#EF4444] ring-2 ring-[#EF4444]/60 -translate-y-2'
    : playable
      ? isRedSuit
        ? 'border-[#D92B3A]/85 hover:border-[#EF4444] hover:-translate-y-2.5 shadow-[0_8px_20px_-6px_rgba(217,43,58,0.45)] cursor-pointer'
        : 'border-zinc-400/75 hover:border-[#EF4444] hover:-translate-y-2.5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.65)] cursor-pointer'
      : isRedSuit
        ? 'border-[#D92B3A]/35'
        : 'border-zinc-700/80';

  const interactiveClasses = onClick
    ? playable
      ? 'transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]'
      : 'cursor-not-allowed'
    : '';

  const content = (
    <>
      {/* Subtle Spider-web vector corner & center lines */}
      <svg
        viewBox="0 0 100 140"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
        aria-hidden="true"
      >
        <path
          d="M0 0 L38 38 M0 20 L28 28 M20 0 L28 28 M100 140 L62 102 M100 120 L72 112 M80 140 L72 112"
          stroke={isRedSuit ? '#D92B3A' : '#52525B'}
          strokeWidth="0.9"
          fill="none"
        />
        <circle
          cx="50"
          cy="70"
          r="26"
          fill="none"
          stroke={isRedSuit ? 'rgba(217,43,58,0.22)' : 'rgba(161,161,170,0.14)'}
          strokeWidth="0.8"
          strokeDasharray="3 3"
        />
      </svg>

      {/* Top-Left Rank & Suit */}
      <div
        className={`relative z-10 flex flex-col items-center leading-[0.95] self-start ${
          isRedSuit ? 'text-[#F87171]' : 'text-zinc-100'
        }`}
      >
        <span className={`font-display font-bold tracking-tight ${rankSize}`}>{card.rank}</span>
        <span className={size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[10px]' : 'text-xs'}>
          {suitSymbol}
        </span>
      </div>

      {/* Center Suit Crest */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <span
          className={`${centerSuitSize} leading-none ${
            isRedSuit
              ? 'text-[#EF4444] drop-shadow-[0_1px_6px_rgba(239,68,68,0.35)]'
              : 'text-zinc-100 drop-shadow-[0_1px_6px_rgba(255,255,255,0.18)]'
          }`}
        >
          {suitSymbol}
        </span>
        {points > 0 && (size === 'md' || size === 'lg') && (
          <span
            className={`mt-1 text-[10px] font-mono-nums tracking-tight ${
              isRedSuit ? 'text-[#FCA5A5]/80' : 'text-zinc-400'
            }`}
          >
            +{points}
          </span>
        )}
      </div>

      {/* Bottom-Right Rank & Suit (mirrored) */}
      <div
        className={`relative z-10 flex flex-col items-center leading-[0.95] self-end rotate-180 ${
          isRedSuit ? 'text-[#F87171]' : 'text-zinc-100'
        }`}
      >
        <span className={`font-display font-bold tracking-tight ${rankSize}`}>{card.rank}</span>
        <span className={size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[10px]' : 'text-xs'}>
          {suitSymbol}
        </span>
      </div>
    </>
  );

  const paddingClass = size === 'sm' || size === 'xs' ? 'p-1.5' : 'p-2 sm:p-2.5';
  const sharedClasses = `${sizeClass} relative flex flex-col justify-between ${paddingClass} bg-gradient-to-b from-[#1A1B23] to-[#111217] border shadow-lg select-none shrink-0 overflow-hidden ${borderStyle} ${
    dimmed ? 'opacity-45 saturate-75' : 'opacity-100'
  } ${interactiveClasses}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!playable}
        aria-label={ariaLabel ?? getCardLabel(card)}
        className={sharedClasses}
      >
        {content}
      </button>
    );
  }

  return (
    <div aria-label={ariaLabel ?? getCardLabel(card)} className={sharedClasses}>
      {content}
    </div>
  );
}

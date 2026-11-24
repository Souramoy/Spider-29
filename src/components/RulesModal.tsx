import { X } from 'lucide-react';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      <div className="w-full max-w-xl bg-[#15171F] border border-white/12 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="rules-modal-title" className="font-display text-2xl font-bold tracking-wide text-zinc-100">
            How to Play 29
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-zinc-300 leading-relaxed max-h-[75vh] overflow-y-auto">
          <div>
            <h3 className="text-zinc-100 font-semibold mb-1.5">Teams &amp; Deck (32 Cards · 29 Points)</h3>
            <p className="text-zinc-400">
              Four players form two opposite partnerships: <span className="text-[#F87171] font-medium">Red Team (6♥)</span> in Seats 1 &amp; 3 against <span className="text-zinc-200 font-medium">Black Team (6♠)</span> in Seats 2 &amp; 4. Only ranks <span className="font-mono-nums text-zinc-200">J, 9, A, 10, K, Q, 8, 7</span> are used.
            </p>
            <div className="mt-2.5 grid grid-cols-4 gap-2 text-center font-mono-nums text-xs">
              <div className="bg-[#1C1E28] border border-white/8 rounded-lg py-2">
                <div className="text-[#F87171] font-bold">Jack (J)</div>
                <div className="text-zinc-400">3 pts</div>
              </div>
              <div className="bg-[#1C1E28] border border-white/8 rounded-lg py-2">
                <div className="text-[#F87171] font-bold">Nine (9)</div>
                <div className="text-zinc-400">2 pts</div>
              </div>
              <div className="bg-[#1C1E28] border border-white/8 rounded-lg py-2">
                <div className="text-zinc-100 font-bold">Ace &amp; 10</div>
                <div className="text-zinc-400">1 pt each</div>
              </div>
              <div className="bg-[#1C1E28] border border-white/8 rounded-lg py-2">
                <div className="text-zinc-300 font-bold">Last Trick</div>
                <div className="text-zinc-400">+1 pt</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-1">1. Deal, Adjacent Duel Bidding &amp; Match</h3>
            <p className="text-zinc-400">
              Each player receives 4 cards first. Bidding runs between two adjacent players at a time (16–28 or Pass). The player who started/holds priority can <span className="text-[#F87171] font-medium">Match</span> the challenger&apos;s bid without raising! When one duelist passes, bidding moves clockwise to the next player in the circle.
            </p>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-1">2. Hidden Trump, 7th Card, Joker &amp; Royal Pair</h3>
            <p className="text-zinc-400">
              The winning bidder sets a suit, places the blind <span className="text-zinc-200 font-medium">7th Card</span> (secret even to the bidder until revealed), or sets the <span className="text-[#F87171] font-medium">Joker (No Trump)</span>. Defenders may <span className="text-zinc-200 font-medium">Double (×2)</span> during Trick 1. When void, click <span className="text-[#F87171] font-medium">Reveal Hidden Trump</span>; once open, holding K &amp; Q of Trump lets you <span className="text-zinc-200 font-medium">Declare Pair</span> (±4 bid).
            </p>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-1">3. Single Hand (3 pts · No Trump)</h3>
            <p className="text-zinc-400">
              During your bid turn (or right after all 8 cards are dealt before Trick 1 begins), any player may call <span className="text-[#F87171] font-medium">Single Hand</span>. Your partner sits out, there is <span className="text-zinc-200 font-medium">No Trump</span>, and you lead Trick 1. Winning all 8 tricks earns <span className="font-mono-nums text-zinc-200">+3 pts</span>; losing even 1 trick awards <span className="font-mono-nums text-zinc-200">+3 pts</span> to the defenders.
            </p>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-1">4. Last-2-Card Draw &amp; Surrender</h3>
            <p className="text-zinc-400">
              If everyone reaches their last 2 cards (Trick 7) and no one views the hidden trump card before the 2nd-last card finishes, the round ends in a <span className="text-zinc-200 font-medium">Draw</span> and neither team scores points. If a team overbids or wants to concede the current hand, they may press <span className="text-[#F87171] font-medium">Surrender</span> to award that round&apos;s points (<span className="font-mono-nums text-zinc-200">1 pt</span>, or <span className="font-mono-nums text-zinc-200">2 pts</span> if Doubled / <span className="font-mono-nums text-zinc-200">4 pts</span> if Redoubled) to the opponents.
            </p>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-1">5. 6 of Hearts (6♥) &amp; 6 of Spades (6♠) Scoring</h3>
            <p className="text-zinc-400">
              If the bidding team makes their bid, they score the round&apos;s points; if they fail, the opposing team scores the same points. Points work as a tug-of-war on the <span className="text-[#F87171] font-medium">6♥</span> and <span className="text-zinc-200 font-medium">6♠</span> cards: for example, if Red leads with 2♥ revealed and Black scores 3 points, 2♥ close, the cards flip order, and 1♠ reveals. First team to reveal all <span className="font-mono-nums text-zinc-200">6</span> pips wins!
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#D92B3A] hover:bg-[#E03947] text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

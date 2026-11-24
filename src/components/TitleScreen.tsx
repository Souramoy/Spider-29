import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, Users, Zap, ArrowRight } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  connected: boolean;
  initialRoomCode: string;
  errorMessage: string | null;
  onCreateRoom: (name: string, quickBots?: boolean) => void;
  onJoinRoom: (roomCode: string, name: string) => void;
  onOpenRules: () => void;
  onClearError: () => void;
}

export function TitleScreen({
  connected,
  initialRoomCode,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
  onOpenRules,
  onClearError,
}: TitleScreenProps) {
  const [playerName, setPlayerName] = useState('Peter');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const validateName = (): string | null => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setLocalError('Please enter your player name first.');
      return null;
    }
    setLocalError(null);
    onClearError();
    return trimmed;
  };

  const handleQuickPractice = () => {
    const validName = validateName();
    if (!validName) return;
    onCreateRoom(validName, true);
  };

  const handleCreateCustom = () => {
    const validName = validateName();
    if (!validName) return;
    onCreateRoom(validName, false);
  };

  const handleJoinSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validName = validateName();
    if (!validName) return;
    const cleanedCode = roomCode.trim().toUpperCase();
    if (cleanedCode.length < 4) {
      setLocalError('Enter the 6-character room code from your friend.');
      return;
    }
    onJoinRoom(cleanedCode, validName);
  };

  // Allow Enter / Space to trigger Quick Practice when not focused in an input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON')) {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const trimmed = playerName.trim();
        if (trimmed) {
          onCreateRoom(trimmed, true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCreateRoom, playerName]);

  const displayError = localError || errorMessage;

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#0B0C10] flex flex-col justify-between">
      {/* Key-Art Backdrop */}
      <img
        src="/src/assets/images/title_bg_1795527386397.jpg"
        alt="Dark obsidian architectural backdrop with crimson web lines"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-85 pointer-events-none"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/88 to-[#0B0C10]/45 pointer-events-none"
      />

      {/* Main Content Split inside Left Negative Space */}
      <main className="relative z-10 flex-1 flex items-center px-6 sm:px-12 lg:px-20 py-10">
        <div className="w-full max-w-lg space-y-8">
          {/* Bespoke SVG Title Lockup */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <svg
                viewBox="0 0 88 88"
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                aria-hidden="true"
              >
                <rect
                  x="2"
                  y="2"
                  width="84"
                  height="84"
                  rx="18"
                  fill="#14151C"
                  stroke="#D92B3A"
                  strokeWidth="2"
                />
                <path
                  d="M44 10 L44 78 M10 44 L78 44 M18 18 L70 70 M70 18 L18 70"
                  stroke="rgba(217,43,58,0.22)"
                  strokeWidth="1.2"
                />
                <path
                  d="M44 25 L48 31 L44 37 L40 31 Z M44 37 L52 46 L44 61 L36 46 Z"
                  fill="#D92B3A"
                />
                <path
                  d="M39 36 L25 22 L22 33 M49 36 L63 22 L66 33 M37 42 L20 42 L18 53 M51 42 L68 42 L70 53 M38 48 L24 62 L27 72 M50 48 L64 62 L61 72"
                  fill="none"
                  stroke="#D92B3A"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
                  TWENTY-NINE
                </h1>
                <p className="mt-1.5 text-sm sm:text-base text-zinc-400">
                  4-Player Partnership Card Game · Live Voice
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Card */}
          <div className="bg-[#14161E]/95 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            <div>
              <label htmlFor="player-name-input" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Your Player Name
              </label>
              <input
                id="player-name-input"
                type="text"
                maxLength={20}
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="Enter your name"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0D0E14] border border-white/12 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-[#D92B3A] focus:ring-1 focus:ring-[#D92B3A]"
              />
            </div>

            {displayError && (
              <div
                role="alert"
                className="px-3.5 py-2.5 rounded-lg bg-[#2A1418] border border-[#D92B3A]/50 text-xs text-[#FCA5A5]"
              >
                {displayError}
              </div>
            )}

            {/* Primary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCreateCustom}
                disabled={!connected}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] disabled:opacity-50 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                <span>Create Custom Room</span>
              </button>

              <button
                type="button"
                data-start="true"
                onClick={handleQuickPractice}
                disabled={!connected}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1F222D] hover:bg-[#2A2E3D] disabled:opacity-50 border border-white/12 text-zinc-100 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Zap className="w-4 h-4 text-[#F87171]" />
                <span>Quick Practice (vs Bots)</span>
              </button>
            </div>

            {/* Join Room by Code */}
            <form onSubmit={handleJoinSubmit} className="pt-4 border-t border-white/8 space-y-2">
              <label htmlFor="room-code-input" className="block text-xs font-medium text-zinc-400">
                Join a Friend&apos;s Room
              </label>
              <div className="flex gap-2">
                <input
                  id="room-code-input"
                  type="text"
                  maxLength={8}
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    if (localError) setLocalError(null);
                  }}
                  placeholder="Room Code (e.g. SPIDER)"
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-[#0D0E14] border border-white/12 text-zinc-100 placeholder-zinc-500 font-mono-nums text-sm uppercase tracking-wider focus:outline-none focus:border-[#D92B3A]"
                />
                <button
                  type="submit"
                  disabled={!connected}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/16 disabled:opacity-50 text-zinc-100 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Join</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Quiet Bottom Safe Margin Control Hint */}
      <footer className="relative z-10 px-5 sm:px-12 lg:px-20 pb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <span>32-Card Deck · Hidden Trump · Bid 16–28 · WebRTC Room Voice</span>
        <div className="flex items-center gap-3">
          <PWAInstallButton />
          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>How to Play 29</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

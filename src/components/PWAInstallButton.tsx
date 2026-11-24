import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        aria-label="Install 29 Spider-Edition app"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-[#D92B3A]/20 hover:bg-[#D92B3A] border border-[#D92B3A]/70 text-zinc-100 font-semibold transition-colors whitespace-nowrap ${
          compact ? 'px-2 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 text-[#F87171]" />
        <span className={compact ? 'hidden sm:inline' : ''}>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label="Install app on iOS"
          className={`inline-flex items-center gap-1.5 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/12 text-zinc-200 font-medium transition-colors whitespace-nowrap ${
            compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-[#EF4444]" />
          <span className={compact ? 'hidden sm:inline' : ''}>Install</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#14161F] border border-white/12 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 id="ios-install-title" className="font-display text-xl font-bold text-white">
                  Install 29 Spider-Edition
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="font-mono-nums text-[#F87171] font-bold">1.</span>
                  <span>
                    Tap the <Share className="inline w-4 h-4 mx-0.5 text-zinc-100" /> <strong>Share</strong> button in Safari.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono-nums text-[#F87171] font-bold">2.</span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#D92B3A] hover:bg-[#E23645] text-white text-sm font-semibold transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

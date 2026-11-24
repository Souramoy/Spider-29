import { useState } from 'react';
import { Bell, BellOff, BellRing, Check, X } from 'lucide-react';
import type { BidNotificationEvent } from '../game/bidNotifications';
import type { PushPermissionState } from '../hooks/useBidNotifications';

interface BidAlertControlProps {
  permission: PushPermissionState;
  isPushActive: boolean;
  bidFeed: BidNotificationEvent[];
  onToggleOsPush: () => void;
  compact?: boolean;
}

export function BidAlertControl({
  permission,
  isPushActive,
  bidFeed,
  onToggleOsPush,
  compact = false,
}: BidAlertControlProps) {
  const [open, setOpen] = useState(false);

  const Icon =
    permission === 'denied' || (permission === 'granted' && !isPushActive)
      ? BellOff
      : isPushActive
        ? BellRing
        : Bell;

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="bid-noti-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Bid notifications and history"
        aria-expanded={open}
        className={`relative inline-flex items-center gap-1.5 rounded-lg border transition-colors ${
          open || isPushActive
            ? 'bg-[#291319] border-[#D92B3A]/75 text-white'
            : 'bg-[#1A1C25] hover:bg-[#232632] border-white/10 text-zinc-300'
        } ${compact ? 'p-1.5 sm:px-2.5 sm:py-1.5' : 'px-3 py-1.5'} text-xs font-medium`}
      >
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPushActive ? 'text-[#F87171]' : ''}`} />
        {!compact && <span>Bid Alerts</span>}
        {isPushActive && (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"
          />
        )}
      </button>

      {open && (
        <div
          data-testid="bid-noti-panel"
          className="fixed sm:absolute top-[88px] sm:top-11 right-2.5 sm:right-0 w-[calc(100vw-20px)] max-w-[310px] sm:w-80 bg-[#13151F]/98 border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-[#181B27]">
            <div className="flex items-center gap-2">
              <BellRing className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="text-xs font-semibold text-white">Bid Push Alerts</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close bid alerts"
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 border-b border-white/10 bg-[#10121B] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-300 leading-snug">
                {permission === 'unsupported'
                  ? 'Browser push unsupported here. Live in-game banners are active.'
                  : permission === 'denied'
                    ? 'Notifications blocked in browser settings. In-game banners remain active.'
                    : isPushActive
                      ? 'Push alerts are ON for every bid, match, pass & win.'
                      : 'Enable push alerts to see who bid what on your device.'}
              </span>
            </div>

            {permission !== 'unsupported' && permission !== 'denied' && (
              <button
                type="button"
                data-testid="enable-bid-push-btn"
                onClick={() => void onToggleOsPush()}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isPushActive
                    ? 'bg-[#1F2230] hover:bg-[#2A2E40] border border-white/15 text-zinc-100'
                    : 'bg-[#D92B3A] hover:bg-[#E23645] text-white'
                }`}
              >
                {isPushActive ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#F87171]" />
                    <span>Push Alerts On (Tap to Mute)</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Enable Push Notifications</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="px-3 py-2 max-h-52 short:max-h-36 overflow-y-auto space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Round Bid Log (Who Bid What)
            </div>
            {bidFeed.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                No bids placed yet this round.
              </p>
            ) : (
              bidFeed.map((ev) => {
                const isRed = ev.team === 0;
                return (
                  <div
                    key={ev.id}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                      isRed
                        ? 'bg-[#2A0E14]/70 border-[#D92B3A]/40'
                        : 'bg-[#171923]/80 border-white/10'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isRed ? 'bg-[#EF4444]' : 'bg-zinc-300'
                        }`}
                      />
                      <span className="truncate font-medium text-zinc-100">{ev.playerName}</span>
                    </div>
                    <span
                      className={`font-mono-nums text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        ev.kind === 'won' || ev.kind === 'single_hand'
                          ? 'bg-[#D92B3A] text-white'
                          : ev.kind === 'match'
                            ? 'bg-white text-[#0B0C10]'
                            : ev.kind === 'pass'
                              ? 'bg-white/10 text-zinc-400'
                              : 'bg-white/15 text-white'
                      }`}
                    >
                      {ev.badgeText}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface BidToastBannerProps {
  event: BidNotificationEvent | null;
  onDismiss: () => void;
}

export function BidToastBanner({ event, onDismiss }: BidToastBannerProps) {
  if (!event) return null;

  const isRed = event.team === 0;
  return (
    <div
      data-testid="bid-toast-banner"
      role="status"
      aria-live="polite"
      className={`pointer-events-auto absolute z-20 top-[168px] left-1/2 -translate-x-1/2 sm:left-3 sm:translate-x-0 sm:top-14 short:top-[52px] short:left-2.5 short:translate-x-0 max-w-[270px] sm:max-w-[300px] flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-2xl backdrop-blur-md animate-card-enter ${
        isRed
          ? 'bg-[#2B0E14]/95 border-[#D92B3A]/85 text-white'
          : 'bg-[#141722]/95 border-white/25 text-zinc-100'
      }`}
    >
      <BellRing className="w-3.5 h-3.5 text-[#F87171] shrink-0" />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[11px] font-semibold truncate">{event.playerName}</div>
        <div className="text-[9px] text-zinc-400">
          {isRed ? 'Red 6♥' : 'Black 6♠'}
        </div>
      </div>
      <span
        className={`font-mono-nums text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
          event.kind === 'match'
            ? 'bg-white text-[#0B0C10]'
            : event.kind === 'pass'
              ? 'bg-white/10 text-zinc-300'
              : 'bg-[#D92B3A] text-white'
        }`}
      >
        {event.badgeText}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss bid notification"
        className="p-0.5 rounded text-zinc-400 hover:text-white shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

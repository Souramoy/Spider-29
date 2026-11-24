import { useCallback, useEffect, useRef, useState } from 'react';
import {
  diffBidNotifications,
  type BidNotificationEvent,
  type BidStateSnapshot,
} from '../game/bidNotifications';
import type { ClientGameView } from '../game/twentyNine';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const STORAGE_KEY = 'tn_bid_push_enabled';

function readStoredEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

function writeStoredEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore storage errors
  }
}

function readNotificationPermission(): PushPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

async function dispatchSystemNotification(
  title: string,
  options: NotificationOptions
): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch {
    // Fallback to window Notification API below
  }

  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  } catch {
    // Ignore environments where window.Notification constructor is disallowed
  }
}

export function useBidNotifications(gameState: ClientGameView | null) {
  const [permission, setPermission] = useState<PushPermissionState>(() => readNotificationPermission());
  const [osPushEnabled, setOsPushEnabled] = useState<boolean>(() => readStoredEnabled());
  const [activeBanner, setActiveBanner] = useState<BidNotificationEvent | null>(null);
  const [bidFeed, setBidFeed] = useState<BidNotificationEvent[]>([]);

  const prevSnapRef = useRef<BidStateSnapshot | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync permission if user changes browser settings externally
  useEffect(() => {
    const sync = () => setPermission(readNotificationPermission());
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  const clearBannerTimer = () => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  };

  const dismissBanner = useCallback(() => {
    clearBannerTimer();
    setActiveBanner(null);
  }, []);

  const showBanner = useCallback((event: BidNotificationEvent) => {
    clearBannerTimer();
    setActiveBanner(event);
    bannerTimerRef.current = setTimeout(() => {
      setActiveBanner(null);
      bannerTimerRef.current = null;
    }, 3800);
  }, []);

  useEffect(() => {
    if (!gameState) {
      prevSnapRef.current = null;
      setBidFeed([]);
      dismissBanner();
      return;
    }

    const prevSnap = prevSnapRef.current;
    const isRoundReset =
      prevSnap !== null &&
      (prevSnap.roomCode !== gameState.roomCode ||
        prevSnap.roundNumber !== gameState.roundNumber ||
        gameState.bidHistory.length < prevSnap.bidHistoryLength);

    const { events, nextSnapshot } = diffBidNotifications(prevSnap, gameState);
    prevSnapRef.current = nextSnapshot;

    if (isRoundReset) {
      setBidFeed(events);
    } else if (events.length > 0) {
      setBidFeed((prev) => [...prev, ...events].slice(-24));
    }

    if (events.length > 0) {
      const latest = events[events.length - 1];
      showBanner(latest);

      if (permission === 'granted' && osPushEnabled) {
        for (const ev of events) {
          void dispatchSystemNotification(`29 Spider (${gameState.roomCode}) · ${ev.title}`, {
            body: ev.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: ev.id,
            data: { url: `/?room=${gameState.roomCode}` },
          });
        }
      }
    }
  }, [gameState, osPushEnabled, permission, dismissBanner, showBanner]);

  useEffect(() => {
    return () => {
      clearBannerTimer();
    };
  }, []);

  const requestAndEnablePush = useCallback(async (): Promise<PushPermissionState> => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setPermission('unsupported');
      return 'unsupported';
    }

    let nextPerm: NotificationPermission = Notification.permission;
    if (nextPerm === 'default') {
      try {
        nextPerm = await Notification.requestPermission();
      } catch {
        nextPerm = Notification.permission;
      }
    }

    setPermission(nextPerm);
    if (nextPerm === 'granted') {
      setOsPushEnabled(true);
      writeStoredEnabled(true);
      void dispatchSystemNotification('29 Spider · Bid Push Alerts On', {
        body: "You'll get live notifications showing who bid what each round.",
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: '29-bid-alerts-enabled',
      });
    }
    return nextPerm;
  }, []);

  const toggleOsPush = useCallback(async () => {
    const current = readNotificationPermission();
    setPermission(current);

    if (current === 'unsupported' || current === 'denied') {
      return;
    }
    if (current === 'default') {
      await requestAndEnablePush();
      return;
    }

    const next = !osPushEnabled;
    setOsPushEnabled(next);
    writeStoredEnabled(next);
  }, [osPushEnabled, requestAndEnablePush]);

  const isPushActive = permission === 'granted' && osPushEnabled;

  return {
    permission,
    osPushEnabled,
    isPushActive,
    activeBanner,
    bidFeed,
    dismissBanner,
    requestAndEnablePush,
    toggleOsPush,
  };
}

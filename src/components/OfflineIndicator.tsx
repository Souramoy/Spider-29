import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-lg bg-[#2A1418]/95 border border-[#D92B3A]/70 px-3 py-1.5 text-xs font-medium text-[#FCA5A5] shadow-xl"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#EF4444]" />
      <span>Offline — Waiting to reconnect</span>
    </div>
  );
}

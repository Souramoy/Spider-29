import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { getTeamForSeat, type ChatMessage } from '../game/twentyNine';

interface RoomChatProps {
  messages: ChatMessage[];
  myPlayerId: string;
  onSendMessage: (text: string) => void;
  compact?: boolean;
}

const QUICK_PHRASES = ['Nice play!', 'Well bid', 'Good luck', 'Your lead!'];

export function RoomChat({ messages, myPlayerId, onSendMessage, compact = false }: RoomChatProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setLastSeenCount(messages.length);
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }
  }, [open, messages.length]);

  const unreadCount = open ? 0 : Math.max(0, messages.length - lastSeenCount);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned) return;
    onSendMessage(cleaned);
    setDraft('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="chat-toggle-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close room chat' : 'Open room chat'}
        className={`relative inline-flex items-center gap-1.5 rounded-lg bg-[#1A1C25] hover:bg-[#232632] border border-white/10 text-zinc-200 transition-colors whitespace-nowrap ${
          compact ? 'p-1.5 sm:p-2' : 'px-3 py-2 text-xs font-medium'
        }`}
      >
        <MessageSquare className="w-4 h-4 text-[#F87171]" />
        {!compact && <span>Chat</span>}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D92B3A] text-white text-[10px] font-mono-nums font-bold flex items-center justify-center shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="room-chat-panel"
          role="dialog"
          aria-label="Room chat"
          className="fixed sm:absolute right-2 sm:right-0 top-[88px] sm:top-full sm:mt-2 z-50 w-[min(320px,calc(100vw-16px))] bg-[#12141C]/98 border border-white/15 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-[#171923]">
            <span className="text-xs font-semibold text-white">Table Chat</span>
            <button
              type="button"
              data-testid="chat-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="h-48 sm:h-56 overflow-y-auto p-3 space-y-2 text-xs"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-center px-4">
                No messages yet. Say hi to the table!
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.playerId === myPlayerId;
                const isRed = msg.seat !== null ? getTeamForSeat(msg.seat) === 0 : false;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <span
                      className={`text-[10px] font-medium mb-0.5 ${
                        isRed ? 'text-[#F87171]' : 'text-zinc-400'
                      }`}
                    >
                      {msg.senderName}
                      {isMine ? ' (You)' : ''}
                    </span>
                    <div
                      className={`px-2.5 py-1.5 rounded-lg max-w-[85%] break-words ${
                        isMine
                          ? 'bg-[#D92B3A]/25 border border-[#D92B3A]/50 text-zinc-100'
                          : 'bg-[#1C1F2B] border border-white/10 text-zinc-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick table phrases */}
          <div className="px-2.5 pb-2 flex items-center gap-1 overflow-x-auto">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => onSendMessage(phrase)}
                className="px-2 py-1 rounded-md bg-[#1C1F2B] hover:bg-[#262A39] border border-white/10 text-[10px] text-zinc-300 whitespace-nowrap shrink-0 transition-colors"
              >
                {phrase}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1.5 p-2 border-t border-white/10 bg-[#151720]"
          >
            <input
              type="text"
              data-testid="chat-input"
              maxLength={220}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message table..."
              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#0D0E14] border border-white/12 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D92B3A]"
            />
            <button
              type="submit"
              data-testid="chat-send-btn"
              aria-label="Send message"
              className="p-2 rounded-lg bg-[#D92B3A] hover:bg-[#E23645] text-white transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

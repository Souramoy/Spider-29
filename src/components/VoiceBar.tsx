import { Headphones, HeadphoneOff, Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import type { VoicePeerInfo } from '../hooks/useVoiceChat';

interface VoiceBarProps {
  inVoice: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  voiceError: string | null;
  voicePeers: VoicePeerInfo[];
  speakingMap: Record<string, boolean>;
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onClearError: () => void;
  compact?: boolean;
}

export function VoiceBar({
  inVoice,
  isMuted,
  isDeafened,
  voiceError,
  voicePeers,
  speakingMap,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onToggleDeafen,
  onClearError,
  compact = false,
}: VoiceBarProps) {
  const activeSpeakers = voicePeers.filter((p) => speakingMap[p.playerId]).map((p) => p.name);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!inVoice ? (
        <button
          type="button"
          onClick={onJoinVoice}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1E202B] hover:bg-[#272A38] border border-[#D92B3A]/45 text-zinc-100 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Mic className="w-3.5 h-3.5 text-[#EF4444]" />
          <span>Join Voice Chat</span>
          {voicePeers.length > 0 && (
            <span className="font-mono-nums text-zinc-400">· {voicePeers.length} live</span>
          )}
        </button>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1A1C25] border border-white/10">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isMuted
                ? 'bg-[#D92B3A]/20 text-[#FCA5A5] border border-[#D92B3A]/40'
                : 'bg-white/8 text-zinc-100 hover:bg-white/14'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#EF4444]" />}
            <span>{isMuted ? 'Muted' : 'Mic On'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleDeafen}
            aria-label={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
            className={`p-1.5 rounded-md transition-colors shrink-0 ${
              isDeafened ? 'bg-[#D92B3A]/20 text-[#FCA5A5]' : 'text-zinc-300 hover:bg-white/10'
            }`}
          >
            {isDeafened ? <HeadphoneOff className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
          </button>

          {!compact && (
            <span className="px-2 text-xs text-zinc-400 whitespace-nowrap font-mono-nums">
              {activeSpeakers.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[#F87171]">
                  <Volume2 className="w-3.5 h-3.5" />
                  {activeSpeakers[0]}
                </span>
              ) : (
                `${voicePeers.length} in voice`
              )}
            </span>
          )}

          <button
            type="button"
            onClick={onLeaveVoice}
            aria-label="Leave voice chat"
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {voiceError && (
        <div
          role="alert"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2A1519] border border-[#D92B3A]/50 text-xs text-[#FCA5A5]"
        >
          <span>{voiceError}</span>
          <button
            type="button"
            onClick={onClearError}
            className="text-zinc-300 hover:text-white underline ml-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

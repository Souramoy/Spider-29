import { useCallback, useEffect, useRef, useState } from 'react';

export interface VoicePeerInfo {
  playerId: string;
  name: string;
  muted: boolean;
}

interface UseVoiceChatArgs {
  myPlayerId: string;
  roomCode: string | null;
  voicePeers: VoicePeerInfo[];
  sendMessage: (payload: Record<string, unknown>) => void;
  incomingSignal: { fromPlayerId: string; signal: Record<string, unknown>; seq: number } | null;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useVoiceChat({
  myPlayerId,
  roomCode,
  voicePeers,
  sendMessage,
  incomingSignal,
}: UseVoiceChatArgs) {
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingMap, setSpeakingMap] = useState<Record<string, boolean>>({});

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, { analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>>(new Map());
  const inVoiceRef = useRef(false);
  const isDeafenedRef = useRef(false);

  useEffect(() => {
    inVoiceRef.current = inVoice;
  }, [inVoice]);

  useEffect(() => {
    isDeafenedRef.current = isDeafened;
    for (const audio of remoteAudiosRef.current.values()) {
      audio.muted = isDeafened;
    }
  }, [isDeafened]);

  const attachAnalyser = useCallback((peerId: string, stream: MediaStream) => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        audioCtxRef.current = new Ctor();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {});
      }
      const existing = analysersRef.current.get(peerId);
      if (existing) {
        existing.source.disconnect();
        analysersRef.current.delete(peerId);
      }
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current.set(peerId, { analyser, source });
    } catch {
      // Ignore analyser errors in unsupported headless environments
    }
  }, []);

  const cleanupPeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    const audio = remoteAudiosRef.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      remoteAudiosRef.current.delete(peerId);
    }
    const an = analysersRef.current.get(peerId);
    if (an) {
      an.source.disconnect();
      analysersRef.current.delete(peerId);
    }
  }, []);

  const leaveVoice = useCallback(() => {
    if (inVoiceRef.current && roomCode) {
      sendMessage({ type: 'voice:leave' });
    }
    for (const peerId of Array.from(peerConnectionsRef.current.keys())) {
      cleanupPeer(peerId);
    }
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
      localStreamRef.current = null;
    }
    const localAn = analysersRef.current.get(myPlayerId);
    if (localAn) {
      localAn.source.disconnect();
      analysersRef.current.delete(myPlayerId);
    }
    setInVoice(false);
    setIsMuted(false);
    setSpeakingMap({});
  }, [cleanupPeer, myPlayerId, roomCode, sendMessage]);

  const createPeerConnection = useCallback(
    (targetPlayerId: string) => {
      const existing = peerConnectionsRef.current.get(targetPlayerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(targetPlayerId, pc);

      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'voice:signal',
            targetPlayerId,
            signal: { kind: 'ice', candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        let audio = remoteAudiosRef.current.get(targetPlayerId);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          remoteAudiosRef.current.set(targetPlayerId, audio);
        }
        audio.srcObject = stream;
        audio.muted = isDeafenedRef.current;
        void audio.play().catch(() => {});
        attachAnalyser(targetPlayerId, stream);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          cleanupPeer(targetPlayerId);
        }
      };

      return pc;
    },
    [attachAnalyser, cleanupPeer, sendMessage]
  );

  const joinVoice = useCallback(async () => {
    if (!roomCode) return;
    setVoiceError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone API is unavailable in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      attachAnalyser(myPlayerId, stream);
      setInVoice(true);
      setIsMuted(false);
      sendMessage({ type: 'voice:join', muted: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone permission denied.';
      setVoiceError(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
          ? 'Mic permission blocked — allow microphone access to talk with friends.'
          : 'No microphone detected or mic access unavailable.'
      );
    }
  }, [attachAnalyser, myPlayerId, roomCode, sendMessage]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMuted;
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = !nextMuted;
    }
    setIsMuted(nextMuted);
    sendMessage({ type: 'voice:mute_state', muted: nextMuted });
  }, [isMuted, sendMessage]);

  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => !prev);
  }, []);

  // Reconcile WebRTC peer connections with room voicePeers
  useEffect(() => {
    if (!inVoice) return;
    const activeIds = new Set(voicePeers.map((p) => p.playerId));

    // Close removed peers
    for (const existingId of Array.from(peerConnectionsRef.current.keys())) {
      if (!activeIds.has(existingId)) {
        cleanupPeer(existingId);
      }
    }

    // Initiate offers deterministically where myPlayerId < peer.playerId
    for (const peer of voicePeers) {
      if (peer.playerId === myPlayerId) continue;
      if (!peerConnectionsRef.current.has(peer.playerId) && myPlayerId < peer.playerId) {
        const pc = createPeerConnection(peer.playerId);
        void pc
          .createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) => {
            sendMessage({
              type: 'voice:signal',
              targetPlayerId: peer.playerId,
              signal: { kind: 'offer', sdp: offer },
            });
          })
          .catch(() => {});
      }
    }
  }, [cleanupPeer, createPeerConnection, inVoice, myPlayerId, sendMessage, voicePeers]);

  // Handle incoming WebRTC signaling messages
  useEffect(() => {
    if (!incomingSignal || !inVoiceRef.current) return;
    const { fromPlayerId, signal } = incomingSignal;
    const kind = signal.kind;

    if (kind === 'offer' && signal.sdp) {
      const pc = createPeerConnection(fromPlayerId);
      void pc
        .setRemoteDescription(new RTCSessionDescription(signal.sdp as RTCSessionDescriptionInit))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer).then(() => answer))
        .then((answer) => {
          sendMessage({
            type: 'voice:signal',
            targetPlayerId: fromPlayerId,
            signal: { kind: 'answer', sdp: answer },
          });
        })
        .catch(() => {});
    } else if (kind === 'answer' && signal.sdp) {
      const pc = peerConnectionsRef.current.get(fromPlayerId);
      if (pc) {
        void pc
          .setRemoteDescription(new RTCSessionDescription(signal.sdp as RTCSessionDescriptionInit))
          .catch(() => {});
      }
    } else if (kind === 'ice' && signal.candidate) {
      const pc = peerConnectionsRef.current.get(fromPlayerId);
      if (pc) {
        void pc.addIceCandidate(new RTCIceCandidate(signal.candidate as RTCIceCandidateInit)).catch(() => {});
      }
    }
  }, [createPeerConnection, incomingSignal, sendMessage]);

  // Poll voice activity levels at 10Hz when in voice
  useEffect(() => {
    if (!inVoice) return;
    const buffer = new Uint8Array(128);
    const id = setInterval(() => {
      const next: Record<string, boolean> = {};
      for (const [peerId, entry] of analysersRef.current.entries()) {
        if (peerId === myPlayerId && isMuted) {
          next[peerId] = false;
          continue;
        }
        entry.analyser.getByteTimeDomainData(buffer);
        let sumSq = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / buffer.length);
        next[peerId] = rms > 0.028;
      }
      setSpeakingMap(next);
    }, 100);
    return () => clearInterval(id);
  }, [inVoice, isMuted, myPlayerId]);

  // Leave voice cleanly on room exit or unmount
  useEffect(() => {
    if (!roomCode && inVoiceRef.current) {
      leaveVoice();
    }
  }, [leaveVoice, roomCode]);

  useEffect(() => {
    return () => {
      leaveVoice();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [leaveVoice]);

  return {
    inVoice,
    isMuted,
    isDeafened,
    voiceError,
    speakingMap,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
    clearVoiceError: () => setVoiceError(null),
  };
}

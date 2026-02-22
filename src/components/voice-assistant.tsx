import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Volume2, VolumeX, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ---- Types ----
export type VoiceState = "idle" | "listening" | "processing" | "speaking";

// ---- Fibonacci Sphere Point Distribution ----
/**
 * Generates points on a sphere using the Fibonacci spiral algorithm.
 * @param count - Number of points to generate
 * @param radius - Radius of the sphere
 * @returns Array of 3D coordinates
 */
function generateSpherePoints(count: number, radius: number) {
  const points: { x: number; y: number; z: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({
      x: Math.cos(theta) * radiusAtY * radius,
      y: y * radius,
      z: Math.sin(theta) * radiusAtY * radius,
    });
  }
  return points;
}

// ---- Canvas Dot Globe ----
interface DotGlobeProps {
  voiceState: VoiceState;
  amplitude: number; // 0-1 from audio analysis
  size?: number;
}

/**
 *
 * @param root0
 * @param root0.voiceState
 * @param root0.amplitude
 * @param root0.size
 */
export function DotGlobe({ voiceState, amplitude, size = 180 }: DotGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const timeRef = useRef(0);
  const smoothAmpRef = useRef(0);
  const pointsRef = useRef(generateSpherePoints(160, size * 0.35));

  /* Use a ref for amplitude to avoid re-triggering the effect on every frame */
  const amplitudeRef = useRef(amplitude);

  useEffect(() => {
    amplitudeRef.current = amplitude;
  }, [amplitude]);

  useEffect(() => {
    pointsRef.current = generateSpherePoints(160, size * 0.35);
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // HiDPI support
    const dpr = window.devicePixelRatio || 1;
    // ... (rest of setup)
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const focalLength = size * 1.2;
    // ...
    // ...

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      timeRef.current += 0.016;

      // Smooth amplitude - READ FROM REF
      const targetAmp = amplitudeRef.current;
      smoothAmpRef.current += (targetAmp - smoothAmpRef.current) * 0.15;
      const amp = smoothAmpRef.current;

      // Rotation speed based on state
      let rotSpeed = 0.003; // idle
      if (voiceState === "listening") rotSpeed = 0.008 + amp * 0.02;
      if (voiceState === "processing") rotSpeed = 0.025;
      if (voiceState === "speaking") rotSpeed = 0.006 + amp * 0.015;
      rotationRef.current += rotSpeed;

      const cosA = Math.cos(rotationRef.current);
      const sinA = Math.sin(rotationRef.current);
      // Slight tilt on X axis
      const tiltAngle = 0.3;
      const cosT = Math.cos(tiltAngle);
      const sinT = Math.sin(tiltAngle); // This was missing, added for completeness based on usage below

      const points = pointsRef.current; // access ref here

      // Sort points by z-depth for proper rendering
      const projected = points.map((p, idx) => {
        // ... (rest of points logic is same)
        // Displacement based on state and amplitude
        let dx = p.x, dy = p.y, dz = p.z;

        if (voiceState === "listening" || voiceState === "speaking") {
          // Expand/contract with amplitude
          const expand = 1 + amp * 0.4;
          // Add organic noise displacement
          const noise = Math.sin(timeRef.current * 3 + idx * 0.5) * amp * 8;
          dx = p.x * expand + noise * (p.x / (size * 0.35)) * 0.3;
          dy = p.y * expand + noise * (p.y / (size * 0.35)) * 0.3;
          dz = p.z * expand + noise * (p.z / (size * 0.35)) * 0.3;
        } else if (voiceState === "processing") {
          // Compress and wobble
          const compress = 0.85 + Math.sin(timeRef.current * 5 + idx * 0.2) * 0.1;
          dx = p.x * compress;
          dy = p.y * compress;
          dz = p.z * compress;
        }

        // Rotate Y
        const rx = dx * cosA - dz * sinA;
        const rz = dx * sinA + dz * cosA;
        // Tilt X
        const ry = dy * cosT - rz * sinT;
        const rz2 = dy * sinT + rz * cosT;

        const scale = focalLength / (focalLength + rz2);
        return {
          sx: centerX + rx * scale,
          sy: centerY + ry * scale,
          scale,
          depth: rz2,
          idx,
        };
      });

      // Sort back to front
      projected.sort((a, b) => a.depth - b.depth);

      // Draw dots
      for (const p of projected) {
        const baseSize = 1.8;
        let dotSize = baseSize * p.scale;
        let alpha = 0.2 + 0.6 * p.scale;

        if (voiceState === "listening") {
          dotSize += amp * 2 * p.scale;
          alpha = 0.3 + 0.7 * p.scale;
        } else if (voiceState === "speaking") {
          // Pulse individual dots with staggered timing
          const pulse = Math.sin(timeRef.current * 4 + p.idx * 0.15) * 0.5 + 0.5;
          dotSize += amp * pulse * 2 * p.scale;
          alpha = 0.25 + 0.75 * p.scale * (0.7 + pulse * 0.3);
        } else if (voiceState === "processing") {
          // Shimmer effect
          const shimmer = Math.sin(timeRef.current * 8 + p.idx * 0.3) * 0.5 + 0.5;
          alpha = 0.15 + shimmer * 0.5 * p.scale;
          dotSize *= 0.8 + shimmer * 0.4;
        }

        // Color based on state
        let r = 99, g = 102, b = 241; // indigo
        if (voiceState === "listening") {
          // Shift toward red-pink when listening
          const mix = 0.3 + amp * 0.4;
          r = Math.round(99 + (239 - 99) * mix);
          g = Math.round(102 + (68 - 102) * mix);
          b = Math.round(241 + (68 - 241) * mix);
        } else if (voiceState === "speaking") {
          // Shift toward teal-green when speaking
          const mix = 0.3;
          r = Math.round(99 + (16 - 99) * mix);
          g = Math.round(102 + (185 - 102) * mix);
          b = Math.round(241 + (129 - 241) * mix);
        } else if (voiceState === "processing") {
          // Purple shimmer
          r = 139; g = 92; b = 246;
        }

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(0.5, dotSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha)})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [voiceState, size]); // REMOVED amplitude from dependency array

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none"
    />
  );
}

// ---- Voice Engine Hook ----
/**
 *
 * @param onTranscript
 */
/**
 * Custom hook to manage the voice interaction engine (Speech Recognition + Synthesis).
 * @param onTranscript - Callback function to handle the final transcript
 * @returns Object containing voice state, transcript, and control methods
 */
export function useVoiceEngine(onTranscript: (text: string, context?: Record<string, unknown>, history?: Array<{ role: "user" | "assistant"; content: string }>) => Promise<string>) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Keep a ref that always holds the latest history to avoid stale closures
  // in processTranscript (which is captured in setTimeout callbacks)
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  useEffect(() => { historyRef.current = history; }, [history]);

  // Keep a ref to the latest voiceState for use inside recognition callbacks
  const voiceStateRef = useRef<VoiceState>("idle");
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);

  // Keep a ref to the latest isMuted for use in speak callback
  const isMutedRef = useRef(false);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Continuous Mode State
  const [_continuousMode, setContinuousModeState] = useState(false);
  const continuousModeRef = useRef(false);

  const setContinuousMode = useCallback((active: boolean) => {
    setContinuousModeState(active);
    continuousModeRef.current = active;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ampFrameRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    cancelAnimationFrame(ampFrameRef.current);
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    // Load voices early
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Just trigger a re-render or ensure voices are loaded
      };
    }
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    utteranceRef.current = null;
  }, []);

  // Audio amplitude monitoring
  const startAmplitudeMonitoring = useCallback((stream: MediaStream) => {
    try {
      // CLEAR PREVIOUS LOOP
      cancelAnimationFrame(ampFrameRef.current);

      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      // ...
      // ...
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAmplitude = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        setAmplitude(avg);
        ampFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();
    } catch {
      // Audio analysis not available, use synthetic amplitude
    }
  }, []);

  // Forward declaration for startListening to be used in speak callback
  const startListeningRef = useRef<() => void>(() => { });

  const speak = useCallback((text: string) => {
    // Always update aiResponse so text chat shows the reply even when muted
    setAiResponse(text);

    if (!synthRef.current || isMutedRef.current) {
      // Muted: skip TTS but still transition state correctly
      setVoiceState(continuousModeRef.current ? "listening" : "idle");
      if (continuousModeRef.current) {
        // Small delay so the UI shows Idle briefly before re-listening
        setTimeout(() => startListeningRef.current(), 300);
      }
      return;
    }

    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    setVoiceState("speaking");

    // Synthetic amplitude for speaking
    let speakFrame = 0;
    const animateSpeakAmp = () => {
      speakFrame++;
      const syntheticAmp = 0.3 + Math.sin(speakFrame * 0.08) * 0.2 + Math.sin(speakFrame * 0.13) * 0.15;
      setAmplitude(Math.max(0, Math.min(1, syntheticAmp)));
      if (utteranceRef.current) {
        ampFrameRef.current = requestAnimationFrame(animateSpeakAmp);
      }
    };

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Google") && v.lang.startsWith("en")
    ) || voices.find(v =>
      v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Moira")
    ) || voices.find(v => v.lang.startsWith("en") && v.localService);
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      setAmplitude(0);
      cancelAnimationFrame(ampFrameRef.current);
      utteranceRef.current = null;

      if (continuousModeRef.current && !isMuted) {
        // Auto-restart listening after speaking
        startListeningRef.current();
      } else {
        setVoiceState("idle");
      }
    };
    utterance.onerror = () => {
      setAmplitude(0);
      cancelAnimationFrame(ampFrameRef.current);
      utteranceRef.current = null;
      setVoiceState("idle");
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    animateSpeakAmp();
  }, [isMuted]);

  const processTranscript = useCallback(async (text: string, isTextChat: boolean = false) => {
    if (!text.trim()) return;

    // Check for exit commands
    if (text.toLowerCase().match(/^(stop|cancel|exit|goodbye|bye)$/)) {
      stopSpeaking();
      setVoiceState("idle");
      setContinuousMode(false);
      setAiResponse("Voice mode ended.");
      return;
    }

    setVoiceState("processing");
    if (!isTextChat) {
      setTranscript(text);
      setInterimTranscript("");
    }

    // Use the ref so we always get the freshest history even inside a stale closure
    const latestHistory = historyRef.current;
    setHistory(prev => [...prev.slice(-19), { role: "user", content: text }]);

    // Stop mic audio analysis
    cancelAnimationFrame(ampFrameRef.current);
    setAmplitude(0);

    // Clean up mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;

    try {
      // Build history from ref (never stale) + the current user message
      const currentHistory = [...latestHistory, { role: "user" as const, content: text }];
      const response = await onTranscript(text, {
        url: window.location.pathname,
        title: document.title
      }, currentHistory);
      setHistory(prev => [...prev.slice(-19), { role: "assistant", content: response }]);

      if (!isTextChat) {
        speak(response);
      } else {
        setAiResponse(response);
        if (continuousModeRef.current && !isMutedRef.current) {
          startListeningRef.current();
        } else {
          setVoiceState("idle");
        }
      }
    } catch (err) {
      console.error("Voice processTranscript error:", err);
      setError("Failed to get AI response.");
      setVoiceState("idle");
    }
  }, [onTranscript, speak, stopSpeaking, setContinuousMode]);

  const startListening = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Use Chrome.");
      return;
    }

    // Stop speaking if currently speaking (interrupt)
    stopSpeaking();

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    // Keep AI response visible until new one
    // setAiResponse(""); 

    // Get mic stream for amplitude analysis
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startAmplitudeMonitoring(stream);
    } catch {
      // Mic access denied — still allow speech recognition
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Accumulate final results across multiple onresult events
    // (Resetting to "" on each event was the bug — Chrome fires multiple onresult events
    //  and only the latest isFinal segments would be kept)
    let accumulatedFinal = "";

    recognition.onstart = () => setVoiceState("listening");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      accumulatedFinal = "";
      // event.results is the full running list since recognition started
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulatedFinal += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (accumulatedFinal) setTranscript(accumulatedFinal);

      // Reset silence timer on every speech event
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = accumulatedFinal || interim;
        if (text.trim()) {
          stopListening();
          processTranscript(text.trim());
        }
      }, 1800); // 1.8s silence detection
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // no-speech in continuous mode: just restart recognition
      if (event.error === "no-speech") {
        if (continuousModeRef.current && voiceStateRef.current === "listening") {
          try { recognition.start(); } catch { /* already started */ }
        }
        return;
      }
      if (event.error === "aborted") return;

      setError(`Mic error: ${event.error}`);
      setVoiceState("idle");
      setContinuousMode(false);
    };

    recognition.onend = () => {
      // If we're still supposed to be listening (recognition ended unexpectedly),
      // restart it — this handles browser killing recognition after ~60s or on network hiccups
      if (
        continuousModeRef.current &&
        (voiceStateRef.current === "listening" || voiceStateRef.current === "idle") &&
        recognitionRef.current === recognition // only restart if we haven't already created a new one
      ) {
        try {
          recognition.start();
        } catch {
          // Recognition couldn't restart — fall back gracefully
          setVoiceState("idle");
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [stopSpeaking, stopListening, processTranscript, startAmplitudeMonitoring, setContinuousMode]);

  // Assign to ref for use in speak callback
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const handleMicClick = useCallback(() => {
    if (voiceState === "listening") {
      // User manually stopped listening
      const text = transcript || interimTranscript;
      stopListening();
      if (text.trim()) processTranscript(text.trim());
      else {
        setVoiceState("idle");
        setContinuousMode(false); // Manual stop exits continuous mode
      }
    } else if (voiceState === "speaking") {
      // Interrupt speaking
      stopSpeaking();
      startListening(); // Immediately start listening again (interrupt to talk)
      setContinuousMode(true);
    } else if (voiceState === "idle") {
      startListening();
      setContinuousMode(true); // Explicit start enables continuous mode
    }
  }, [voiceState, transcript, interimTranscript, stopListening, stopSpeaking, startListening, processTranscript, setContinuousMode]);

  const stop = useCallback(() => {
    stopListening();
    stopSpeaking();
    cleanup();
    setVoiceState("idle");
    setContinuousMode(false);
    setTranscript("");
    setInterimTranscript("");
    setAiResponse("");
    setAmplitude(0);
    setError(null);
  }, [stopListening, stopSpeaking, cleanup, setContinuousMode]);

  return {
    voiceState,
    transcript,
    interimTranscript,
    aiResponse,
    isMuted,
    amplitude,
    error,
    history,
    isChatOpen,
    setIsChatOpen,
    handleMicClick,
    sendMessage: processTranscript,
    setIsMuted: (m: boolean) => { setIsMuted(m); if (m) stopSpeaking(); },
    stop,
    clearHistory: () => {
      setHistory([]);
      setAiResponse("");
      setTranscript("");
    },
    // Expose speak manually for greetings
    speak,
    setContinuousMode
  };
}

// ---- Inline Voice Mode (for embedding inside chat panel) ----
interface InlineVoiceModeProps {
  onTranscript: (text: string) => Promise<string>;
  onClose: () => void;
  className?: string;
  autoStart?: boolean;
  initialGreeting?: string;
}

/**
 *
 * @param root0
 * @param root0.onTranscript
 * @param root0.onClose
 * @param root0.className
 * @param root0.autoStart
 * @param root0.initialGreeting
 */
export function InlineVoiceMode({ onTranscript, onClose, className, autoStart = true, initialGreeting }: InlineVoiceModeProps) {
  const {
    voiceState, interimTranscript,
    isMuted, amplitude, error, history, handleMicClick, setIsMuted, stop,
    speak, setContinuousMode, sendMessage
  } = useVoiceEngine(onTranscript);

  // Auto-start and Greet
  const hasStartedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, interimTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText.trim(), true);
      setInputText("");
    }
  };

  useEffect(() => {
    if (!hasStartedRef.current && autoStart) {
      hasStartedRef.current = true;

      // Slight delay to ensure components are ready
      setTimeout(() => {
        if (initialGreeting) {
          speak(initialGreeting);
          // The engine's speak method will auto-trigger listening after speech ends if continuous mode is on.
          // So we set continuous mode to true here.
          setContinuousMode(true);
        } else {
          // Just start listening
          handleMicClick();
        }
      }, 500);
    }
  }, [autoStart, initialGreeting, speak, handleMicClick, setContinuousMode]);

  const handleClose = () => {
    stop();
    onClose();
  };

  return (
    <div className={cn("flex flex-col items-center justify-between h-full", className)}>
      {/* Top bar */}
      <div className="flex items-center justify-between w-full px-2 pt-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            voiceState === "idle" && "bg-muted/50",
            voiceState === "listening" && "bg-red-500 voice-status-pulse",
            voiceState === "processing" && "bg-purple-500 animate-pulse",
            voiceState === "speaking" && "bg-emerald-500 voice-status-pulse",
          )} />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {voiceState === "idle" && "Ready"}
            {voiceState === "listening" && "Listening"}
            {voiceState === "processing" && "Thinking"}
            {voiceState === "speaking" && "Speaking"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-full hover:bg-muted/30 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" /> : <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-muted/30 transition-colors"
            title="Back to chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Dot Globe */}
      <div className="flex-1 flex items-center justify-center relative min-h-[140px]">
        <button
          onClick={handleMicClick}
          disabled={voiceState === "processing"}
          className="cursor-pointer relative group"
          title={voiceState === "idle" ? "Click to speak" : voiceState === "listening" ? "Click to stop" : ""}
        >
          <DotGlobe voiceState={voiceState} amplitude={amplitude} size={140} />
          {/* Center mic icon overlay */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            voiceState === "idle" ? "opacity-60 group-hover:opacity-100" : "opacity-0"
          )}>
            <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Mic className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          {/* Stop icon when listening */}
          {voiceState === "listening" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <MicOff className="w-3.5 h-3.5 text-white/80" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Chat History area */}
      <div
        ref={scrollRef}
        className="w-full px-3 py-4 flex-1 overflow-y-auto space-y-4 min-h-0 border-t border-border/40 bg-background"
      >
        {history.map((msg, idx) => (
          <div key={idx} className={cn(
            "flex gap-2",
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          )}>
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
              msg.role === "user" ? "bg-indigo-600" : "bg-muted/30"
            )}>
              <span className={cn(
                "text-[8px] font-bold",
                msg.role === "user" ? "text-white" : "text-muted-foreground"
              )}>
                {msg.role === "user" ? "YOU" : "AI"}
              </span>
            </div>
            <div className={cn(
              "max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed",
              msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-muted/30 text-muted-foreground rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {interimTranscript && (
          <div className="flex flex-row-reverse gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[8px] font-bold text-white">YOU</span>
            </div>
            <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-indigo-400/10 text-muted-foreground text-[11px] italic rounded-tr-none border border-indigo-100">
              {interimTranscript}
            </div>
          </div>
        )}
        {error && (
          <p className="text-[10px] text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* Chat Input Region */}
      <div className="w-full px-3 py-3 border-t border-border/40 bg-muted/30/50 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={handleMicClick}
            className={cn(
              "p-1.5 rounded-full transition-all",
              voiceState === "listening"
                ? "bg-red-500 text-white animate-pulse"
                : "bg-background border border-border/40 text-muted-foreground hover:text-indigo-600"
            )}
          >
            <Mic size={14} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background border border-border/40 rounded-full px-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || voiceState === "processing"}
            className={cn(
              "p-1.5 rounded-full transition-all",
              inputText.trim() && voiceState !== "processing"
                ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                : "bg-muted/30 text-muted-foreground"
            )}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}


// ---- Floating Action Button ----
/**
 *
 * @param root0
 * @param root0.onClick
 * @param root0.isOpen
 * @param root0.pulse
 */
export function VoiceAssistantFAB({
  onClick,
  isOpen = false,
  pulse = false
}: {
  onClick: () => void;
  isOpen?: boolean;
  pulse?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-300 group text-white border-2 border-white/20"
      style={{ right: '24px', bottom: '24px', left: 'auto' }}
    >
      {pulse && (
        <span className="absolute inset-0 rounded-full bg-indigo-400/40 animate-ping" />
      )}
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}






// ---- Global Voice Overlay ----
interface GlobalVoiceOverlayProps {
  voiceState: VoiceState;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  amplitude: number;
  onClose: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  onSendMessage: (text: string, isTextChat?: boolean) => void;
  onMicClick: () => void;
  isChatOpen: boolean;
}

/**
 *
 * @param root0
 * @param root0.voiceState
 * @param root0.transcript
 * @param root0.interimTranscript
 * @param root0.aiResponse
 * @param root0.history
 * @param root0.amplitude
 * @param root0.onClose
 * @param root0.isMuted
 * @param root0.toggleMute
 * @param root0.onSendMessage
 * @param root0.onMicClick
 * @param root0.isChatOpen
 */
export function GlobalVoiceOverlay({
  voiceState,
  transcript: _transcript, // Rename prop to unused local variable
  interimTranscript,
  aiResponse: _aiResponse, // Rename prop to unused local variable
  history,
  amplitude,
  onClose,
  isMuted,
  toggleMute,
  onSendMessage,
  onMicClick,
  isChatOpen
}: GlobalVoiceOverlayProps) {
  // Show if explicitly open
  const isVisible = isChatOpen;
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, interimTranscript, isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim(), true);
      setInputText("");
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[600px] h-[500px]"
          style={{ right: '24px', bottom: '96px', left: 'auto' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100/50 shrink-0">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                voiceState === "listening" && "bg-red-500 animate-pulse",
                voiceState === "processing" && "bg-purple-500 animate-pulse",
                voiceState === "speaking" && "bg-emerald-500 animate-pulse",
                voiceState === "idle" && "bg-muted"
              )} />
              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                {voiceState === "listening" ? "Listening..." :
                  voiceState === "processing" ? "Thinking..." :
                    voiceState === "speaking" ? "Speaking..." : "CareOps AI"}
              </span>
            </div>
            <div className="flex gap-1">
              <button onClick={toggleMute} className="p-1.5 hover:bg-background/50 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors">
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-red-50 rounded-full text-muted-foreground hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Visualizer Region */}
          <div className="h-20 bg-gradient-to-b from-white to-indigo-50/30 flex items-center justify-center relative shrink-0 border-b border-gray-50">
            <DotGlobe voiceState={voiceState} amplitude={amplitude} size={90} />
          </div>

          {/* Transcript/History Region */}
          <div
            ref={scrollRef}
            className="px-4 py-4 overflow-y-auto space-y-4 bg-background flex-1 min-h-0"
          >
            {history.length === 0 && !interimTranscript && (
              <p className="text-xs text-center text-muted-foreground py-4">
                How can I help you today?
              </p>
            )}

            {history.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === "user" ? "bg-indigo-600" : "bg-muted/30"
                )}>
                  <span className={cn(
                    "text-[8px] font-bold",
                    msg.role === "user" ? "text-white" : "text-muted-foreground"
                  )}>
                    {msg.role === "user" ? "YOU" : "AI"}
                  </span>
                </div>
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-[85%]",
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-muted/30 text-muted-foreground rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {interimTranscript && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-row-reverse gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] font-bold text-white">YOU</span>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-indigo-400/10 text-muted-foreground text-sm italic rounded-tr-none border border-indigo-100">
                  {interimTranscript}
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat Input Region */}
          <div className="p-3 border-t border-border/40 bg-muted/30/50 shrink-0">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={onMicClick}
                className={cn(
                  "p-2 rounded-full transition-all",
                  voiceState === "listening"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-background border border-border/40 text-muted-foreground hover:text-indigo-600"
                )}
              >
                <Mic size={16} />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-background border border-border/40 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || voiceState === "processing"}
                className={cn(
                  "p-2 rounded-full transition-all",
                  inputText.trim() && voiceState !== "processing"
                    ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                    : "bg-muted/30 text-muted-foreground"
                )}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

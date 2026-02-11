"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Types ----
export type VoiceState = "idle" | "listening" | "processing" | "speaking";

// ---- Fibonacci Sphere Point Distribution ----
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

export function DotGlobe({ voiceState, amplitude, size = 180 }: DotGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const pointsRef = useRef(generateSpherePoints(300, size * 0.35));
  const smoothAmpRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // HiDPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const focalLength = size * 1.2;
    const points = pointsRef.current;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      timeRef.current += 0.016;

      // Smooth amplitude
      const targetAmp = amplitude;
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
      const sinT = Math.sin(tiltAngle);

      // Sort points by z-depth for proper rendering
      const projected = points.map((p, idx) => {
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
  }, [voiceState, amplitude, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none"
    />
  );
}

// ---- Voice Engine Hook ----
export function useVoiceEngine(onTranscript: (text: string) => Promise<string>) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ampFrameRef = useRef<number>(0);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
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

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel();
    utteranceRef.current = null;
  }, []);

  // Audio amplitude monitoring
  const startAmplitudeMonitoring = useCallback((stream: MediaStream) => {
    try {
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
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

  const speak = useCallback((text: string) => {
    if (!synthRef.current || isMuted) {
      setVoiceState("idle");
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
      setVoiceState("idle");
      setAmplitude(0);
      cancelAnimationFrame(ampFrameRef.current);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setVoiceState("idle");
      setAmplitude(0);
      cancelAnimationFrame(ampFrameRef.current);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    animateSpeakAmp();
  }, [isMuted]);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setVoiceState("processing");
    setTranscript(text);
    setInterimTranscript("");
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
      const response = await onTranscript(text);
      setAiResponse(response);
      speak(response);
    } catch {
      setError("Failed to get AI response.");
      setVoiceState("idle");
    }
  }, [onTranscript, speak]);

  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Use Chrome.");
      return;
    }

    stopSpeaking();
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setAiResponse("");

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

    let finalTranscript = "";

    recognition.onstart = () => setVoiceState("listening");

    recognition.onresult = (event: any) => {
      let interim = "";
      finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (finalTranscript) setTranscript(finalTranscript);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = finalTranscript || interim;
        if (text.trim()) {
          stopListening();
          processTranscript(text.trim());
        }
      }, 1500);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(`Mic error: ${event.error}`);
      setVoiceState("idle");
    };

    recognition.onend = () => {
      // handled by silence timer
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [stopSpeaking, stopListening, processTranscript, startAmplitudeMonitoring]);

  const handleMicClick = useCallback(() => {
    if (voiceState === "listening") {
      const text = transcript || interimTranscript;
      stopListening();
      if (text.trim()) processTranscript(text.trim());
      else setVoiceState("idle");
    } else if (voiceState === "speaking") {
      stopSpeaking();
      setVoiceState("idle");
      setAmplitude(0);
    } else if (voiceState === "idle") {
      startListening();
    }
  }, [voiceState, transcript, interimTranscript, stopListening, stopSpeaking, startListening, processTranscript]);

  const stop = useCallback(() => {
    stopListening();
    stopSpeaking();
    cleanup();
    setVoiceState("idle");
    setTranscript("");
    setInterimTranscript("");
    setAiResponse("");
    setAmplitude(0);
    setError(null);
  }, [stopListening, stopSpeaking, cleanup]);

  return {
    voiceState,
    transcript,
    interimTranscript,
    aiResponse,
    isMuted,
    amplitude,
    error,
    handleMicClick,
    setIsMuted: (m: boolean) => { setIsMuted(m); if (m) stopSpeaking(); },
    stop,
  };
}

// ---- Inline Voice Mode (for embedding inside chat panel) ----
interface InlineVoiceModeProps {
  onTranscript: (text: string) => Promise<string>;
  onClose: () => void;
  className?: string;
}

export function InlineVoiceMode({ onTranscript, onClose, className }: InlineVoiceModeProps) {
  const {
    voiceState, transcript, interimTranscript, aiResponse,
    isMuted, amplitude, error, handleMicClick, setIsMuted, stop,
  } = useVoiceEngine(onTranscript);

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
            voiceState === "idle" && "bg-gray-300",
            voiceState === "listening" && "bg-red-500 voice-status-pulse",
            voiceState === "processing" && "bg-purple-500 animate-pulse",
            voiceState === "speaking" && "bg-emerald-500 voice-status-pulse",
          )} />
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {voiceState === "idle" && "Ready"}
            {voiceState === "listening" && "Listening"}
            {voiceState === "processing" && "Thinking"}
            {voiceState === "speaking" && "Speaking"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-gray-400" /> : <Volume2 className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title="Back to chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Dot Globe */}
      <div className="flex-1 flex items-center justify-center relative">
        <button
          onClick={handleMicClick}
          disabled={voiceState === "processing"}
          className="cursor-pointer relative group"
          title={voiceState === "idle" ? "Click to speak" : voiceState === "listening" ? "Click to stop" : ""}
        >
          <DotGlobe voiceState={voiceState} amplitude={amplitude} size={160} />
          {/* Center mic icon overlay */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            voiceState === "idle" ? "opacity-60 group-hover:opacity-100" : "opacity-0"
          )}>
            <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Mic className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          {/* Stop icon when listening */}
          {voiceState === "listening" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MicOff className="w-4 h-4 text-white/80" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Transcript area */}
      <div className="w-full px-3 pb-2 shrink-0 space-y-1.5 max-h-[100px] overflow-y-auto">
        {error && (
          <p className="text-[11px] text-red-500 text-center">{error}</p>
        )}
        {(transcript || interimTranscript) && (
          <div className="voice-text-reveal">
            <p className="text-[11px] text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
              <span className="text-[9px] text-gray-400 font-semibold uppercase">You: </span>
              {transcript}
              {interimTranscript && <span className="text-gray-400 italic"> {interimTranscript}</span>}
            </p>
          </div>
        )}
        {aiResponse && (
          <div className="voice-text-reveal">
            <p className="text-[11px] text-gray-600 bg-indigo-50 rounded-lg px-3 py-2 leading-relaxed">
              <span className="text-[9px] text-indigo-400 font-semibold uppercase">AI: </span>
              {aiResponse}
            </p>
          </div>
        )}
        {voiceState === "idle" && !transcript && !aiResponse && !error && (
          <p className="text-[10px] text-gray-400 text-center py-1">
            Tap the globe to start speaking
          </p>
        )}
      </div>
    </div>
  );
}

// ---- Floating Action Button ----
export function VoiceAssistantFAB({ onClick, pulse = false }: { onClick: () => void; pulse?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
        "bg-gradient-to-br from-indigo-500 to-purple-600",
        "flex items-center justify-center shadow-lg",
        "hover:shadow-xl hover:scale-105 transition-all duration-300",
        "group"
      )}
    >
      {pulse && (
        <>
          <span className="absolute inset-0 rounded-full bg-indigo-400/30 voice-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-indigo-400/20 voice-pulse-ring-delay" />
        </>
      )}
      <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
    </button>
  );
}

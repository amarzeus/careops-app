"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  useVoiceEngine,
  VoiceState,
  VoiceAssistantFAB,
  GlobalVoiceOverlay,
} from "@/components/voice-assistant";
import { usePathname, useRouter } from "next/navigation";
import { VoiceActionService } from "@/lib/voice-actions";

interface VoiceHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface VoiceApiResponse {
  message?: string;
  action?: {
    type: string;
    path?: string;
    [key: string]: any;
  };
}

interface VoiceContextType {
  voiceState: VoiceState;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  isMuted: boolean;
  amplitude: number;
  error: string | null;
  handleMicClick: () => void;
  setIsMuted: (muted: boolean) => void;
  stop: () => void;
  clearHistory: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

/**
 *
 */
export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}

/**
 * VoiceProvider component that wraps the app with voice capabilities.
 * @param props - Component props
 * @param props.children - Child components
 */
export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasGreeted, setHasGreeted] = useState(false);

  // Define the API handler
  const handleTranscript = async (
    text: string,
    clientContext?: Record<string, unknown>,
    history?: VoiceHistoryItem[]
  ) => {
    try {
      const response = await fetch("/api/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          clientContext: {
            ...clientContext,
            pathname,
          },
          conversationHistory: history,
        }),
      });

      // Prevent SyntaxError: Unexpected end of JSON input
      const contentType = response.headers.get("content-type");
      let data: VoiceApiResponse = {};

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.warn("Failed to parse Voice API response:", parseError);
          return "I received an invalid response from the AI. Please try again.";
        }
      } else {
        // Not JSON (e.g., 502 Bad Gateway text, or empty response)
        const textResponse = await response.text();
        console.warn("Voice API returned non-JSON response:", response.status, textResponse);
        return "The AI service is temporarily unavailable. Please try again in a moment.";
      }

      if (!response.ok) {
        // API returned error status
        if (response.status === 429) {
          console.warn("Voice API non-ok response:", response.status, data);
          return data.message || "The AI is currently at capacity. Please try again in a moment.";
        }
        console.warn("Voice API non-ok response:", response.status, data);
        return data.message || "I'm having trouble processing your request right now.";
      }

      // Handle structured actions
      if (data.action) {
        // If it's a simple navigation action from legacy format
        if (data.action.type === "navigate" && data.action.path) {
          router.push(data.action.path);
        }
        // Enhanced Voice Actions
        else {
          VoiceActionService.execute(data.action as any, router);
        }
      }

      return data.message || "I've processed your request.";
    } catch (error) {
      console.warn("Voice API Connectivity Error:", error);
      return "I'm having trouble connecting to the server. Please check your connection and try again.";
    }
  };

  const engine = useVoiceEngine(handleTranscript);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Extract stable refs from engine to avoid `engine` object identity causing
  // useEffect to re-run every render (engine object is recreated each render)
  const clearHistory = engine.clearHistory;

  // Watch for Auth changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const currentId = data.user?.id || null;
          if (currentId !== lastUserId) {
            // User changed (logged in or swapped accounts)
            clearHistory();
            setLastUserId(currentId);
            setHasGreeted(false); // Allow fresh greeting for new user
          }
        } else if (lastUserId !== null) {
          // Logged out
          clearHistory();
          setLastUserId(null);
        }
      } catch (err) {
        console.error("Auth check error in VoiceProvider:", err);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, lastUserId]); // Intentionally omit clearHistory — it changes identity each render

  // Proactive Greeting on Mount (once per session ideally)
  useEffect(() => {
    if (!hasGreeted) {
      // Small delay to allow page to load
      const timer = setTimeout(() => {
        // We don't auto-speak to avoid annoying users, but we could play a sound
        // or if the user enabled "Auto-Greet" in settings.
        // For now, let's just set the state to ready.
        setHasGreeted(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasGreeted]);

  const isInlinePage = pathname?.startsWith("/onboarding") || pathname?.startsWith("/inbox");

  return (
    <VoiceContext.Provider value={engine}>
      {children}
      {!isInlinePage && (
        <>
          <VoiceAssistantFAB
            onClick={() => engine.setIsChatOpen(!engine.isChatOpen)}
            isOpen={engine.isChatOpen}
            pulse={engine.voiceState === "listening" || engine.voiceState === "speaking"}
          />
          <GlobalVoiceOverlay
            voiceState={engine.voiceState}
            transcript={engine.transcript}
            interimTranscript={engine.interimTranscript}
            aiResponse={engine.aiResponse}
            history={engine.history}
            amplitude={engine.amplitude}
            onClose={() => {
              engine.stop();
              engine.setIsChatOpen(false);
            }}
            isMuted={engine.isMuted}
            toggleMute={() => engine.setIsMuted(!engine.isMuted)}
            onSendMessage={engine.sendMessage}
            onMicClick={engine.handleMicClick}
            isChatOpen={engine.isChatOpen}
          />
        </>
      )}
    </VoiceContext.Provider>
  );
}

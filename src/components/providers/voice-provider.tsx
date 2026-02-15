"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useVoiceEngine, VoiceState, VoiceAssistantFAB, GlobalVoiceOverlay } from "@/components/voice-assistant";
import { usePathname, useRouter } from "next/navigation";
import { VoiceActionService } from "@/lib/voice-actions";

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
 *
 * @param root0
 * @param root0.children
 */
export function VoiceProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [hasGreeted, setHasGreeted] = useState(false);

    // Define the API handler
    const handleTranscript = async (text: string, clientContext?: any, history?: any[]) => {
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
            const data = await response.json();

            // Handle structured actions
            if (data.action) {
                // If it's a simple navigation action from legacy format
                if (data.action.type === "navigate" && data.action.path) {
                    router.push(data.action.path);
                }
                // Enhanced Voice Actions
                else {
                    VoiceActionService.execute(data.action, router);
                }
            }

            return data.message;
        } catch (error) {
            console.error("Voice API Error:", error);
            return "I'm having trouble connecting to the server.";
        }
    };

    const engine = useVoiceEngine(handleTranscript);
    const [lastUserId, setLastUserId] = useState<string | null>(null);

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
                        engine.clearHistory();
                        setLastUserId(currentId);
                        setHasGreeted(false); // Allow fresh greeting for new user
                    }
                } else if (lastUserId !== null) {
                    // Logged out
                    engine.clearHistory();
                    setLastUserId(null);
                }
            } catch (err) {
                console.error("Auth check error in VoiceProvider:", err);
            }
        };

        checkAuth();
    }, [pathname, lastUserId, engine]);

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
                        onClose={() => { engine.stop(); engine.setIsChatOpen(false); }}
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

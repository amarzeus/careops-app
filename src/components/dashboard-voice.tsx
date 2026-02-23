"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { InlineVoiceMode, VoiceAssistantFAB } from "@/components/voice-assistant";

/**
 * DashboardVoice component that provides a floating voice assistant.
 */
export function DashboardVoice() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleTranscript = useCallback(
    async (text: string, context?: unknown, history?: unknown[]): Promise<string> => {
      try {
        const res = await fetch("/api/ai/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            conversationHistory: history,
            clientContext: context,
          }),
        });

        const data = await res.json();
        const aiMessage = data.message || "I'm here to help with your business.";

        // Handle navigation actions
        if (data.action?.type === "navigate" && data.action?.path) {
          setTimeout(() => {
            router.push(data.action.path);
            setIsOpen(false);
          }, 2000);
        }

        return aiMessage;
      } catch {
        return "Sorry, I couldn't process that right now. Please try again.";
      }
    },
    [router]
  );

  return (
    <>
      <VoiceAssistantFAB onClick={() => setIsOpen(true)} pulse />

      {/* Floating voice panel */}
      {isOpen && (
        <div className="animate-in slide-in-from-bottom-4 fade-in fixed right-6 bottom-24 z-50 h-[380px] w-80 duration-300">
          <div className="bg-background border-border/40/80 relative flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2.5">
              <span className="text-muted-foreground text-xs font-semibold">Voice Assistant</span>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-muted/50/60 rounded-full p-1 transition-colors"
              >
                <X className="text-muted-foreground h-3.5 w-3.5" />
              </button>
            </div>

            {/* Inline voice mode fills the rest */}
            <div className="flex-1 overflow-hidden">
              <InlineVoiceMode
                onTranscript={handleTranscript}
                onClose={() => setIsOpen(false)}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

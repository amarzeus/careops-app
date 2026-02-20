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

  const handleTranscript = useCallback(async (text: string, context?: unknown, history?: unknown[]): Promise<string> => {
    try {
      const res = await fetch("/api/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: history,
          clientContext: context
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
  }, [router]);

  return (
    <>
      <VoiceAssistantFAB onClick={() => setIsOpen(true)} pulse />

      {/* Floating voice panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[380px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="relative w-full h-full bg-background rounded-2xl shadow-2xl border border-border/40/80 overflow-hidden flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <span className="text-xs font-semibold text-muted-foreground">Voice Assistant</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-muted/50/60 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
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

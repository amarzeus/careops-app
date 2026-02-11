"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { InlineVoiceMode, VoiceAssistantFAB } from "@/components/voice-assistant";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function DashboardVoice() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const historyRef = useRef<ChatMsg[]>([]);

  const handleTranscript = useCallback(async (text: string): Promise<string> => {
    historyRef.current = [...historyRef.current, { role: "user", content: text }];

    try {
      const res = await fetch("/api/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: historyRef.current.slice(-10),
        }),
      });

      const data = await res.json();
      const aiMessage = data.message || "I'm here to help with your business.";
      historyRef.current = [...historyRef.current, { role: "assistant", content: aiMessage }];

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
          <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <span className="text-xs font-semibold text-gray-700">Voice Assistant</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200/60 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
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

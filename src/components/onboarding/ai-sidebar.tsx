"use client";

import { useRef, useEffect } from "react";
import { Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { InlineVoiceMode } from "@/components/voice-assistant";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AISidebarProps {
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: () => void;
  voiceMode: boolean;
  setVoiceMode: (val: boolean) => void;
  onVoiceTranscript: (text: string) => Promise<string>;
}

/**
 *
 * @param root0
 * @param root0.chatMessages
 * @param root0.chatLoading
 * @param root0.chatInput
 * @param root0.setChatInput
 * @param root0.onSendMessage
 * @param root0.voiceMode
 * @param root0.setVoiceMode
 * @param root0.onVoiceTranscript
 */
export function AISidebar({
  chatMessages,
  chatLoading,
  chatInput,
  setChatInput,
  onSendMessage,
  voiceMode,
  setVoiceMode,
  onVoiceTranscript,
}: AISidebarProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div className="w-80 border-l bg-white flex flex-col h-[calc(100vh-64px)] sticky top-16 hidden lg:flex shadow-sm">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-900">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          CareOps Assistant
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          I can help you fill forms and set up your workspace.
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "p-3 rounded-lg text-sm max-w-[90%]",
                msg.role === "assistant"
                  ? "bg-gray-100 text-gray-800 rounded-tl-none"
                  : "bg-blue-600 text-white ml-auto rounded-tr-none"
              )}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-1 p-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-gray-50">
        {voiceMode ? (
          <InlineVoiceMode
            onTranscript={onVoiceTranscript}
            onClose={() => setVoiceMode(false)}
          />
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full h-10 w-10 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setVoiceMode(true)}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
                placeholder="Type or speak..."
                className="pr-8 rounded-full border-gray-300 focus-visible:ring-blue-500"
              />
              <button
                onClick={onSendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="absolute right-1 top-1 h-8 w-8 flex items-center justify-center text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

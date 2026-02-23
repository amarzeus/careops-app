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
    <div className="bg-background sticky top-16 flex hidden h-[calc(100vh-64px)] w-80 flex-col border-l shadow-sm lg:flex">
      <div className="border-b bg-gradient-to-r from-blue-50 to-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          CareOps Assistant
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          I can help you fill forms and set up your workspace.
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[90%] rounded-lg p-3 text-sm",
                msg.role === "assistant"
                  ? "bg-muted/30 text-muted-foreground rounded-tl-none"
                  : "bg-primary ml-auto rounded-tr-none text-white"
              )}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-1 p-2">
              <div className="bg-muted/50 h-2 w-2 animate-bounce rounded-full" />
              <div
                className="bg-muted/50 h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="bg-muted/50 h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="bg-muted/30 border-t p-4">
        {voiceMode ? (
          <InlineVoiceMode onTranscript={onVoiceTranscript} onClose={() => setVoiceMode(false)} />
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="text-primary hover:text-primary/90 h-10 w-10 shrink-0 rounded-full border-blue-200 hover:bg-blue-50"
              onClick={() => setVoiceMode(true)}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <div className="relative flex-1">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
                placeholder="Type or speak..."
                className="border-border/40 rounded-full pr-8 focus-visible:ring-blue-500"
              />
              <button
                onClick={onSendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="text-primary absolute top-1 right-1 flex h-8 w-8 items-center justify-center hover:text-blue-800 disabled:opacity-50"
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

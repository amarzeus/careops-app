"use client";

import { useRef, useEffect } from "react";
import { Mic, Send, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineVoiceMode } from "@/components/voice-assistant";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatCardProps {
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
export function AIChatCard({
  chatMessages,
  chatLoading,
  chatInput,
  setChatInput,
  onSendMessage,
  voiceMode,
  setVoiceMode,
  onVoiceTranscript,
}: AIChatCardProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <Card className="flex h-[400px] flex-col sm:h-[450px] lg:h-[500px]">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm">AI Setup Assistant</CardTitle>
            <CardDescription className="text-xs">Powered by Gemini — Text or Voice</CardDescription>
          </div>
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className="from-primary hover:from-primary flex items-center gap-1.5 rounded-full bg-gradient-to-r to-purple-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:scale-105 hover:to-purple-700"
          >
            {voiceMode ? (
              <MessageSquare className="h-3.5 w-3.5" />
            ) : (
              <Mic className="h-3.5 w-3.5" />
            )}
            {voiceMode ? "Chat" : "Voice"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {voiceMode ? (
          <InlineVoiceMode
            onTranscript={onVoiceTranscript}
            onClose={() => setVoiceMode(false)}
            className="h-full"
            initialGreeting="Hi! I'm ready to help you set up your business."
          />
        ) : (
          <div className="h-full space-y-3 overflow-y-auto p-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "animate-fade-in max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === "user"
                      ? "bg-primary rounded-br-md text-white"
                      : "bg-muted/30 text-muted-foreground rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted/30 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="bg-muted h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="bg-muted h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="bg-muted h-2 w-2 animate-bounce rounded-full"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </CardContent>
      {!voiceMode && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about setup..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => setVoiceMode(true)}
              className="text-primary hover:text-primary/90 shrink-0 border-indigo-200 hover:bg-indigo-50"
              title="Voice mode"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={onSendMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

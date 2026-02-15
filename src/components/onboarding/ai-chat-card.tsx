"use client";

import { useRef, useEffect } from "react";
import { Mic, Send, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="h-[400px] sm:h-[450px] lg:h-[500px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm">AI Setup Assistant</CardTitle>
            <CardDescription className="text-xs">
              Powered by Gemini — Text or Voice
            </CardDescription>
          </div>
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[11px] font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-105 shadow-sm"
          >
            {voiceMode ? (
              <MessageSquare className="w-3.5 h-3.5" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
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
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm animate-fade-in",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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
        <div className="p-4 border-t">
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
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 shrink-0"
              title="Voice mode"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={onSendMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

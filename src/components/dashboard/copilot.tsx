"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedActions?: Array<{ label: string; action: string }>;
};

/**
 * Dashboard Co-pilot — a floating AI assistant panel available across all dashboard routes.
 */
export function DashboardCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm your CareOps Co-pilot. Ask me anything about your bookings, inventory, messages, or daily operations.",
      suggestedActions: [
        { label: "Today's schedule", action: "What's on my schedule today?" },
        { label: "Low stock items", action: "Is anything low in stock?" },
        { label: "Unread messages", action: "How many unread messages do I have?" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  /**
   * Sends a message to the co-pilot API.
   * @param messageText - The message to send
   */
  async function handleSend(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: history,
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "I couldn't process that. Please try again.",
        suggestedActions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Connection error. Please check your network and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-6 bottom-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-primary hover:bg-primary/90 group shadow-primary/25 relative h-14 w-14 rounded-full shadow-lg"
              aria-label="Open AI Co-pilot"
            >
              <Sparkles className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="bg-primary absolute inset-0 animate-ping rounded-full opacity-20" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-background border-border fixed right-6 bottom-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          >
            {/* Header */}
            <div className="from-primary/10 to-primary/5 flex items-center justify-between border-b bg-gradient-to-r px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-bold">CareOps Co-pilot</h3>
                  <p className="text-muted-foreground text-[10px]">
                    AI-powered operations assistant
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full"
                aria-label="Close Co-pilot"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Suggested actions */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((action, i) =>
                          action.action.startsWith("/") ? (
                            <Link key={i} href={action.action}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/30 text-primary h-7 rounded-full px-3 text-[11px] font-semibold"
                              >
                                {action.label}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="border-primary/30 text-primary h-7 rounded-full px-3 text-[11px] font-semibold"
                              onClick={() => handleSend(action.action)}
                            >
                              {action.label}
                            </Button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="text-primary h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground text-xs">Analyzing your data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t px-3 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your operations..."
                  className="bg-muted text-foreground placeholder:text-muted-foreground focus:ring-primary/30 flex-1 rounded-full border-0 px-4 py-2.5 text-sm outline-none focus:ring-2"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="bg-primary h-10 w-10 shrink-0 rounded-full"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-muted-foreground mt-1.5 text-center text-[10px]">
                <MessageCircle className="mr-0.5 inline h-3 w-3" />
                Powered by CareOps AI — uses your real workspace data
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

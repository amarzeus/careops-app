"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  ArrowLeft,
  Phone,
  MoreVertical,
  MessageSquare,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ConversationDTO, MessageDTO } from "@/types/dto";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageThread } from "@/components/inbox/message-thread";
import { ChatInput } from "@/components/inbox/chat-input";
import { OutboundCallDialog } from "@/components/inbox/outbound-call-dialog";
import { toast } from "@/hooks/use-toast";

/**
 *
 */
export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [inputText, setInputText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // 1. Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/inbox/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
          if (data.length > 0) {
            setActiveId((prev) => prev || data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load inbox", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Messages when Active ID changes
  useEffect(() => {
    if (!activeId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/inbox/messages?conversationId=${activeId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
          // Mark read locally
          setConversations((prev) =>
            prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
          );

          // Fetch Smart Replies
          fetchSmartReplies(activeId);
        }
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeId]);

  const fetchSmartReplies = async (conversationId: string) => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const aiRes = await fetch(`/api/ai/smart-reply?conversationId=${conversationId}`);
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setSuggestions(aiData.replies || []);
      }
    } catch (e) {
      console.error("AI Reply error", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSend = async (channel?: string) => {
    if (!inputText.trim() || !activeId) return;

    const tempId = Date.now().toString();
    const msgChannel = channel?.toUpperCase() || "EMAIL";
    const tempMsg: MessageDTO = {
      id: tempId,
      content: inputText,
      direction: "OUTBOUND",
      channel: msgChannel as MessageDTO["channel"],
      isAutomated: false,
      createdAt: new Date().toISOString(),
      status: "SENT",
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText("");
    setSuggestions([]);
    setSending(true);

    try {
      const res = await fetch("/api/inbox/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          content: tempMsg.content,
          channel: channel || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const realMsg = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === tempId ? realMsg : m)));

      setConversations((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((c) => c.id === activeId);
        if (idx > -1) {
          const [moved] = updated.splice(idx, 1);
          updated.unshift({
            ...moved,
            lastMessage: tempMsg.content,
            lastMessageAt: new Date().toISOString(),
          });
        }
        return updated;
      });

      // Trigger automation
      try {
        await fetch("/api/automation/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trigger: "STAFF_REPLY",
            data: { conversationId: activeId },
          }),
        });
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "FAILED" } : m)));
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setMobileShowChat(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div
        className={cn(
          "w-full flex-col border-r border-border/40 md:w-80",
          mobileShowChat ? "hidden md:flex" : "flex"
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalUnread={totalUnread}
        />
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-muted/30/30",
          mobileShowChat ? "flex" : "hidden md:flex"
        )}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border/40 bg-background px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden"
                  onClick={() => setMobileShowChat(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-primary/90">
                    {activeConversation.contactName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground">{activeConversation.contactName}</h2>
                  <p className="text-xs text-muted-foreground">{activeConversation.contactEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setCallDialogOpen(true)}
                  title="Call contact"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <MessageThread
                messages={messages}
                loading={loadingMessages}
                contactName={activeConversation.contactName}
              />
              {suggestions.length > 0 && (
                <div className="border-t border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-[11px] font-medium text-violet-700">AI Suggestions</span>
                    <Badge
                      variant="outline"
                      className="h-4 border-violet-200 bg-background px-1 text-[9px]"
                    >
                      Tap to use
                    </Badge>
                  </div>
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInputText(s)}
                        className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-background px-3 py-2 text-xs whitespace-nowrap text-violet-800 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:shadow-md"
                      >
                        <Wand2 className="h-3 w-3 shrink-0 text-violet-400" />
                        <span className="line-clamp-2">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {loadingSuggestions && (
                <div className="flex items-center gap-2 border-t border-border/40 bg-muted/30 px-4 py-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Generating suggestions...</span>
                </div>
              )}
              <ChatInput
                inputText={inputText}
                setInputText={setInputText}
                onSend={handleSend}
                sending={sending}
                contactHasEmail={!!activeConversation.contactEmail}
                contactHasPhone={!!activeConversation.contactPhone}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-muted/30/50 px-6 text-muted-foreground">
            <div className="flex max-w-7xl flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <MessageSquare className="h-10 w-10 text-blue-300" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-muted-foreground">No conversation selected</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the sidebar to view messages and start replying.
              </p>
            </div>
          </div>
        )}
      </div>

      <OutboundCallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        contact={
          activeConversation
            ? {
                id: activeConversation.contactId,
                name: activeConversation.contactName,
                phone: activeConversation.contactPhone,
                email: activeConversation.contactEmail,
              }
            : null
        }
      />
    </div>
  );
}

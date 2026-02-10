"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare, Send, Sparkles, Mail, Smartphone,
  Search, Clock, User, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Message {
  id: string;
  content: string;
  channel: string;
  direction: string;
  isAutomated: boolean;
  createdAt: string;
  sender?: { name: string };
}

interface Conversation {
  id: string;
  subject: string;
  lastMessageAt: string;
  unreadCount: number;
  contact: Contact;
  messages: Message[];
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConvo, setSelectedConvo] = useState<{ conversation: Conversation & { messages: Message[] } } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [channel, setChannel] = useState("EMAIL");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedId) fetchMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConvo]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/inbox");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/inbox/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConvo(data);
        // Update unread in list
        setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/inbox/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage, channel }),
      });
      if (res.ok) {
        setNewMessage("");
        setShowSmartReplies(false);
        fetchMessages(selectedId);
        fetchConversations();
      }
    } catch {} finally { setSending(false); }
  };

  const fetchSmartReplies = async () => {
    if (!selectedId) return;
    setShowSmartReplies(true);
    try {
      const res = await fetch("/api/ai/smart-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSmartReplies(data.replies);
      }
    } catch {}
  };

  const filteredConversations = conversations.filter(c =>
    c.contact.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.email?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div>
      <Header title="Inbox" subtitle="All customer communication in one place" />
      <div className="flex h-[calc(100vh-73px)]">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input className="pl-9 bg-gray-50" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredConversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedId(convo.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                      selectedId === convo.id && "bg-blue-50 border-l-2 border-l-blue-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                        {convo.contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{convo.contact.name}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">{formatTime(convo.lastMessageAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate">{convo.messages?.[0]?.content || convo.subject}</p>
                          {convo.unreadCount > 0 && (
                            <span className="ml-2 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConvo ? (
            <>
              {/* Thread Header */}
              <div className="px-6 py-4 bg-white border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                    {selectedConvo.conversation.contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedConvo.conversation.contact.name}</p>
                    <p className="text-xs text-gray-500">{selectedConvo.conversation.contact.email || selectedConvo.conversation.contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={channel === "EMAIL" ? "default" : "outline"} size="sm" onClick={() => setChannel("EMAIL")}>
                    <Mail className="w-3 h-3 mr-1" /> Email
                  </Button>
                  <Button variant={channel === "SMS" ? "default" : "outline"} size="sm" onClick={() => setChannel("SMS")}>
                    <Smartphone className="w-3 h-3 mr-1" /> SMS
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {selectedConvo.conversation.messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        msg.direction === "OUTBOUND"
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 shadow-sm rounded-bl-md"
                      )}>
                        <p className="text-sm">{msg.content}</p>
                        <div className={cn("flex items-center gap-2 mt-1", msg.direction === "OUTBOUND" ? "text-blue-200" : "text-gray-400")}>
                          <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                          {msg.isAutomated && <Badge variant="secondary" className="text-[9px] px-1 py-0">Auto</Badge>}
                          {msg.sender && <span className="text-[10px]">{msg.sender.name}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Smart Replies */}
              {showSmartReplies && smartReplies.length > 0 && (
                <div className="px-6 py-2 bg-purple-50 border-t border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {smartReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => { setNewMessage(reply); setShowSmartReplies(false); }}
                        className="text-xs bg-white border border-purple-200 rounded-full px-3 py-1.5 hover:bg-purple-100 transition-colors text-purple-800"
                      >
                        {reply.substring(0, 60)}{reply.length > 60 ? "..." : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Compose */}
              <div className="px-6 py-4 bg-white border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={fetchSmartReplies} title="AI Smart Reply">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </Button>
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="flex-1 min-h-[40px] max-h-32 resize-none"
                    rows={1}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500">Select a conversation</h3>
                <p className="text-sm text-gray-400">Choose a conversation from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

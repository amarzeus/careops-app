"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
    MessageSquare, User, Search, Send,
    MoreVertical, Phone, Mail, Clock, Loader2, ArrowLeft,
    Inbox as InboxIcon, SmartphoneIcon, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
interface Conversation {
    id: string;
    contactName: string;
    contactEmail: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    direction: "INBOUND" | "OUTBOUND";
    channel?: "EMAIL" | "SMS";
    isAutomated: boolean;
    createdAt: string;
    status: "SENT" | "DELIVERED" | "READ" | "FAILED";
}

export default function InboxPage() {
    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filtered conversations based on search
    const filteredConversations = conversations.filter((c) =>
        c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    // 1. Fetch Conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await fetch("/api/inbox/conversations");
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                    if (data.length > 0 && !activeId) {
                        setActiveId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to load inbox", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
        // Poll every 30s for new messages (MVP Real-time)
        const interval = setInterval(fetchConversations, 30000);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                        prev.map((c) =>
                            c.id === activeId ? { ...c, unreadCount: 0 } : c
                        )
                    );
                }
            } catch (error) {
                console.error("Failed to load messages", error);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Handlers
    const handleSend = async () => {
        if (!inputText.trim() || !activeId) return;

        const tempId = Date.now().toString();
        const tempMsg: Message = {
            id: tempId,
            content: inputText,
            direction: "OUTBOUND",
            channel: "EMAIL",
            isAutomated: false,
            createdAt: new Date().toISOString(),
            status: "SENT",
        };

        // Optimistic Update
        setMessages((prev) => [...prev, tempMsg]);
        setInputText("");
        setSending(true);


        try {
            const res = await fetch("/api/inbox/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: activeId,
                    content: tempMsg.content,
                }),
            });

            if (!res.ok) throw new Error("Failed to send");

            // Update with real message from server
            const realMsg = await res.json();
            setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? realMsg : m))
            );

            // Move conversation to top
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

            // After successful send, trigger STAFF_REPLY automation
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
                /* non-blocking */
            }
        } catch (err) {
            console.error(err);
            // Revert or mark failed
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId ? { ...m, status: "FAILED" } : m
                )
            );
        } finally {
            setSending(false);
        }
    };

    const activeConversation = conversations.find((c) => c.id === activeId);



    // Select conversation (with mobile handling)
    const handleSelectConversation = (id: string) => {
        setActiveId(id);
        setMobileShowChat(true);
    };

    const handleMobileBack = () => {
        setMobileShowChat(false);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" />
            </div>
        );
    }

    // ----- Conversation List Sidebar -----
    const conversationList = (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                <h1 className="font-semibold text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" /> Inbox
                    {totalUnread > 0 && (
                        <Badge
                            variant="destructive"
                            className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                        >
                            {totalUnread}
                        </Badge>
                    )}
                </h1>
            </div>
            <div className="p-2">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search messages..."
                        className="pl-9 bg-gray-50 border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-2.5"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {filteredConversations.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => handleSelectConversation(c.id)}
                            className={cn(
                                "w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors",
                                activeId === c.id
                                    ? "bg-blue-50"
                                    : "hover:bg-gray-100"
                            )}
                        >
                            <div className="relative">
                                <Avatar className="w-10 h-10 border border-gray-200">
                                    <AvatarFallback className="bg-white text-blue-600">
                                        {c.contactName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {c.unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                                        {c.unreadCount > 9
                                            ? "9+"
                                            : c.unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span
                                        className={cn(
                                            "font-medium truncate",
                                            c.unreadCount > 0
                                                ? "text-gray-900"
                                                : "text-gray-700"
                                        )}
                                    >
                                        {c.contactName}
                                    </span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                        {format(
                                            new Date(c.lastMessageAt),
                                            "MMM d"
                                        )}
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-xs truncate",
                                        c.unreadCount > 0
                                            ? "font-medium text-gray-900"
                                            : "text-gray-500"
                                    )}
                                >
                                    {c.lastMessage}
                                </p>
                            </div>
                        </button>
                    ))}
                    {filteredConversations.length === 0 &&
                        conversations.length > 0 && (
                            <div className="text-center p-8 text-gray-400 text-sm">
                                No conversations match &quot;{searchQuery}&quot;
                            </div>
                        )}
                    {conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                            <InboxIcon className="w-12 h-12 mb-3 opacity-30" />
                            <p className="font-medium text-gray-500 mb-1">
                                Inbox is empty
                            </p>
                            <p className="text-xs text-center">
                                Conversations will appear here when contacts
                                send messages or you start new ones.
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );

    // ----- Chat Panel -----
    const chatPanel = activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30">
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 bg-white">
                <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-8 w-8"
                        onClick={handleMobileBack}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                            {activeConversation.contactName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            {activeConversation.contactName}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {activeConversation.contactEmail}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
                ref={scrollRef}
            >
                {loadingMessages ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin text-gray-400" />
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const showAvatar =
                            i === 0 ||
                            messages[i - 1].direction !== msg.direction;
                        const channel = msg.channel || "EMAIL";
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full mb-2",
                                    msg.direction === "OUTBOUND"
                                        ? "justify-end"
                                        : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex items-end max-w-[85%] sm:max-w-[70%] gap-2",
                                        msg.direction === "OUTBOUND"
                                            ? "flex-row-reverse"
                                            : "flex-row"
                                    )}
                                >
                                    {msg.direction === "INBOUND" &&
                                        showAvatar && (
                                            <Avatar className="w-6 h-6 mb-1">
                                                <AvatarFallback className="text-[10px]">
                                                    {activeConversation.contactName.charAt(
                                                        0
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    {!showAvatar &&
                                        msg.direction === "INBOUND" && (
                                            <div className="w-6" />
                                        )}

                                    <div
                                        className={cn(
                                            "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            msg.direction === "OUTBOUND"
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                        )}
                                    >
                                        {msg.content}
                                        <div
                                            className={cn(
                                                "flex items-center gap-1.5 mt-1 text-right",
                                                msg.direction === "OUTBOUND"
                                                    ? "text-blue-100"
                                                    : "text-gray-400"
                                            )}
                                        >
                                            {/* Channel indicator */}
                                            <span
                                                className={cn(
                                                    "inline-flex items-center gap-0.5 text-[9px] font-medium rounded px-1 py-0.5",
                                                    msg.direction === "OUTBOUND"
                                                        ? "bg-blue-500/30 text-blue-100"
                                                        : "bg-gray-100 text-gray-500"
                                                )}
                                            >
                                                {channel === "SMS" ? (
                                                    <SmartphoneIcon className="w-2.5 h-2.5" />
                                                ) : (
                                                    <Mail className="w-2.5 h-2.5" />
                                                )}
                                                {channel}
                                            </span>
                                            <span className="text-[10px] opacity-70">
                                                {format(
                                                    new Date(msg.createdAt),
                                                    "h:mm a"
                                                )}
                                                {msg.status === "FAILED" &&
                                                    " \u2022 Failed"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200">


                <div className="flex items-end gap-2 bg-white rounded-xl border border-gray-300 p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">

                    <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[40px] max-h-[140px] border-none focus-visible:ring-0 px-2 py-2 resize-none"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        className="h-8 w-8 mb-1 bg-blue-600 hover:bg-blue-700 shrink-0"
                        onClick={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 px-6">
            <div className="flex flex-col items-center max-w-sm text-center">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No conversation selected
                </h3>
                <p className="text-sm text-gray-400">
                    Choose a conversation from the sidebar to view messages and
                    start replying. AI-powered smart replies are available to
                    help you respond faster.
                </p>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-white">
            {/* Left Pane: Sidebar List - hidden on mobile when chat is open */}
            <div
                className={cn(
                    "w-full md:w-80 border-r border-gray-200 flex-col",
                    mobileShowChat ? "hidden md:flex" : "flex"
                )}
            >
                {conversationList}
            </div>

            {/* Right Pane: Chat Interface - hidden on mobile when list is shown */}
            <div
                className={cn(
                    "flex-1 min-w-0",
                    mobileShowChat ? "flex" : "hidden md:flex"
                )}
            >
                {chatPanel}
            </div>
        </div>
    );
}

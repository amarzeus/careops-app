"use client";

import { format } from "date-fns";
import { Search, X, Inbox as InboxIcon, MessageSquare, AlertCircle, Clock, Calendar, FileWarning, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ConversationDTO } from "@/types/dto";

interface ConversationListProps {
  conversations: ConversationDTO[];
  activeId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalUnread: number;
}

const intentConfig = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  complaint: { label: "Complaint", color: "bg-orange-100 text-orange-700 border-orange-200", icon: FileWarning },
  booking_request: { label: "Booking", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Calendar },
  inquiry: { label: "Inquiry", color: "bg-violet-100 text-violet-700 border-violet-200", icon: Zap },
  cancellation: { label: "Cancel", color: "bg-muted/30 text-muted-foreground border-border/40", icon: Clock },
  follow_up: { label: "Follow-up", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  general: { label: "General", color: "bg-muted/30 text-muted-foreground border-border/40", icon: MessageSquare },
};

/**
 *
 * @param root0
 * @param root0.conversations
 * @param root0.activeId
 * @param root0.onSelect
 * @param root0.searchQuery
 * @param root0.setSearchQuery
 * @param root0.totalUnread
 */
export function ConversationList({
  conversations,
  activeId,
  onSelect,
  searchQuery,
  setSearchQuery,
  totalUnread,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(
    (c) =>
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background border-r border-border/40">
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/30/50">
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
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 bg-muted/30 border-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.map((c) => {
            const intent = c.intent;
            const intentInfo = intent ? (intentConfig[intent.type] || intentConfig.general) : null;
            
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors",
                  activeId === c.id ? "bg-blue-50" : "hover:bg-muted/30"
                )}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 border border-border/40">
                    <AvatarFallback className="bg-background text-blue-600">
                      {c.contactName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {c.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span
                      className={cn(
                        "font-medium truncate",
                        c.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {c.contactName}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {format(new Date(c.lastMessageAt), "MMM d")}
                    </span>
                  </div>
                  {intentInfo && intent && c.unreadCount > 0 && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1", intentInfo.color)}>
                        <intentInfo.icon className="w-2.5 h-2.5" />
                        {intentInfo.label}
                      </span>
                      {intent.priority === "high" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                  )}
                  <p
                    className={cn(
                      "text-xs truncate",
                      c.unreadCount > 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {c.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
          {filteredConversations.length === 0 && conversations.length > 0 && (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No conversations match &quot;{searchQuery}&quot;
            </div>
          )}
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
              <InboxIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium text-muted-foreground mb-1">Inbox is empty</p>
              <p className="text-xs text-center">
                Conversations will appear here when contacts send messages or you
                start new ones.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

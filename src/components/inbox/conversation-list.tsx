"use client";

import { format } from "date-fns";
import {
  Search,
  X,
  Inbox as InboxIcon,
  MessageSquare,
  AlertCircle,
  Clock,
  Calendar,
  FileWarning,
  Zap,
} from "lucide-react";
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
  complaint: {
    label: "Complaint",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: FileWarning,
  },
  booking_request: {
    label: "Booking",
    color: "bg-blue-100 text-primary/90 border-blue-200",
    icon: Calendar,
  },
  inquiry: {
    label: "Inquiry",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    icon: Zap,
  },
  cancellation: {
    label: "Cancel",
    color: "bg-muted/30 text-muted-foreground border-border/40",
    icon: Clock,
  },
  follow_up: {
    label: "Follow-up",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  general: {
    label: "General",
    color: "bg-muted/30 text-muted-foreground border-border/40",
    icon: MessageSquare,
  },
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
    <div className="bg-background border-border/40 flex h-full flex-col border-r">
      <div className="border-border/40 bg-muted/30/50 flex items-center justify-between border-b p-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="text-primary h-5 w-5" /> Inbox
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
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Search messages..."
            className="bg-muted/30 border-none pl-9 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute top-2.5 right-3">
              <X className="text-muted-foreground hover:text-muted-foreground h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.map((c) => {
            const intent = c.intent;
            const intentInfo = intent ? intentConfig[intent.type] || intentConfig.general : null;

            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
                  activeId === c.id ? "bg-blue-50" : "hover:bg-muted/30"
                )}
              >
                <div className="relative">
                  <Avatar className="border-border/40 h-10 w-10 border">
                    <AvatarFallback className="bg-background text-primary">
                      {c.contactName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {c.unreadCount > 0 && (
                    <span className="bg-primary absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span
                      className={cn(
                        "truncate font-medium",
                        c.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {c.contactName}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs whitespace-nowrap">
                      {format(new Date(c.lastMessageAt), "MMM d")}
                    </span>
                  </div>
                  {intentInfo && intent && c.unreadCount > 0 && (
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]",
                          intentInfo.color
                        )}
                      >
                        <intentInfo.icon className="h-2.5 w-2.5" />
                        {intentInfo.label}
                      </span>
                      {intent.priority === "high" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                  )}
                  <p
                    className={cn(
                      "truncate text-xs",
                      c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {c.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
          {filteredConversations.length === 0 && conversations.length > 0 && (
            <div className="text-muted-foreground p-8 text-center text-sm">
              No conversations match &quot;{searchQuery}&quot;
            </div>
          )}
          {conversations.length === 0 && (
            <div className="text-muted-foreground flex flex-col items-center justify-center p-10">
              <InboxIcon className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-muted-foreground mb-1 font-medium">Inbox is empty</p>
              <p className="text-center text-xs">
                Conversations will appear here when contacts send messages or you start new ones.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

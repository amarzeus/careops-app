"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Mail, SmartphoneIcon, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MessageDTO } from "@/types/dto";

interface MessageThreadProps {
  messages: MessageDTO[];
  loading: boolean;
  contactName: string;
}

/**
 *
 * @param root0
 * @param root0.messages
 * @param root0.loading
 * @param root0.contactName
 */
export function MessageThread({ messages, loading, contactName }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" ref={scrollRef}>
      {messages.map((msg, i) => {
        const showAvatar = i === 0 || messages[i - 1].direction !== msg.direction;
        const channel = msg.channel || "EMAIL";
        return (
          <div
            key={msg.id}
            className={cn(
              "flex w-full mb-2",
              msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "flex items-end max-w-[85%] sm:max-w-[70%] gap-2",
                msg.direction === "OUTBOUND" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.direction === "INBOUND" && showAvatar && (
                <Avatar className="w-6 h-6 mb-1">
                  <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                    {contactName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              {!showAvatar && msg.direction === "INBOUND" && <div className="w-6" />}

              <div
                className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.direction === "OUTBOUND"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-background border border-border/40 text-muted-foreground rounded-bl-none"
                )}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                <div
                  className={cn(
                    "flex items-center gap-1.5 mt-1 text-right",
                    msg.direction === "OUTBOUND" ? "text-blue-100" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[9px] font-medium rounded px-1 py-0.5",
                      msg.direction === "OUTBOUND"
                        ? "bg-blue-500/30 text-blue-100"
                        : "bg-muted/30 text-muted-foreground"
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
                    {format(new Date(msg.createdAt), "h:mm a")}
                    {msg.status === "FAILED" && " • Failed"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

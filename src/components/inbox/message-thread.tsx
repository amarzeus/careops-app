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
        <Loader2 className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>
      {messages.map((msg, i) => {
        const showAvatar = i === 0 || messages[i - 1].direction !== msg.direction;
        const channel = msg.channel || "EMAIL";
        return (
          <div
            key={msg.id}
            className={cn(
              "mb-2 flex w-full",
              msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "flex max-w-[85%] items-end gap-2 sm:max-w-[70%]",
                msg.direction === "OUTBOUND" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.direction === "INBOUND" && showAvatar && (
                <Avatar className="mb-1 h-6 w-6">
                  <AvatarFallback className="text-primary/90 bg-blue-100 text-[10px]">
                    {contactName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              {!showAvatar && msg.direction === "INBOUND" && <div className="w-6" />}

              <div
                className={cn(
                  "rounded-2xl p-3 text-sm leading-relaxed shadow-sm",
                  msg.direction === "OUTBOUND"
                    ? "bg-primary rounded-br-none text-white"
                    : "bg-background border-border/40 text-muted-foreground rounded-bl-none border"
                )}
              >
                <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-1.5 text-right",
                    msg.direction === "OUTBOUND" ? "text-blue-100" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium",
                      msg.direction === "OUTBOUND"
                        ? "bg-blue-500/30 text-blue-100"
                        : "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    {channel === "SMS" ? (
                      <SmartphoneIcon className="h-2.5 w-2.5" />
                    ) : (
                      <Mail className="h-2.5 w-2.5" />
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

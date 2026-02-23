"use client";

import { useState } from "react";
import { Send, Loader2, Mail, Smartphone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type SendChannel = "email" | "sms";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: (channel?: SendChannel) => void;
  sending: boolean;
  disabled?: boolean;
  contactHasPhone?: boolean;
  contactHasEmail?: boolean;
}

const channelConfig: Record<SendChannel, { icon: typeof Mail; label: string; color: string }> = {
  email: { icon: Mail, label: "Email", color: "text-primary" },
  sms: { icon: Smartphone, label: "SMS", color: "text-primary" },
};

/**
 *
 * @param root0
 * @param root0.inputText
 * @param root0.setInputText
 * @param root0.onSend
 * @param root0.sending
 * @param root0.disabled
 * @param root0.contactHasPhone
 * @param root0.contactHasEmail
 */
export function ChatInput({
  inputText,
  setInputText,
  onSend,
  sending,
  disabled,
  contactHasPhone,
  contactHasEmail,
}: ChatInputProps) {
  const [channel, setChannel] = useState<SendChannel>("email");
  const [showChannelPicker, setShowChannelPicker] = useState(false);

  const config = channelConfig[channel];
  const ChannelIcon = config.icon;

  const availableChannels = [
    ...(contactHasEmail !== false ? [{ key: "email" as SendChannel }] : []),
    ...(contactHasPhone ? [{ key: "sms" as SendChannel }] : []),
  ];

  const handleSend = () => {
    onSend(channel);
    setShowChannelPicker(false);
  };

  return (
    <div className="bg-background border-border/40 border-t p-3 sm:p-4">
      {/* Channel selector dropdown */}
      {showChannelPicker && (
        <div className="bg-muted/30 border-border/40 mb-2 flex gap-1 rounded-lg border p-1">
          {availableChannels.map(({ key }) => {
            const cfg = channelConfig[key];
            const Icon = cfg.icon;
            const isActive = channel === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setChannel(key);
                  setShowChannelPicker(false);
                }}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-background border-border/40 border shadow-sm"
                    : "hover:bg-muted/30 text-muted-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? cfg.color : ""}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-background border-border/40 flex items-end gap-2 rounded-xl border p-2 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        {/* Channel indicator button */}
        {availableChannels.length > 1 && (
          <button
            onClick={() => setShowChannelPicker(!showChannelPicker)}
            className="hover:bg-muted/30 mb-1 flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1.5 transition-colors"
            title={`Sending via ${config.label}`}
          >
            <ChannelIcon className={`h-4 w-4 ${config.color}`} />
            <ChevronDown className="text-muted-foreground h-3 w-3" />
          </button>
        )}

        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type a message (via ${config.label})...`}
          className="max-h-[140px] min-h-[40px] resize-none border-none px-2 py-2 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
        />
        <Button
          size="icon"
          className="bg-primary hover:bg-primary/90 mb-1 h-8 w-8 shrink-0"
          onClick={handleSend}
          disabled={!inputText.trim() || sending || disabled}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

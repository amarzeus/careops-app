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
    <div className="p-3 sm:p-4 bg-background border-t border-border/40">
      {/* Channel selector dropdown */}
      {showChannelPicker && (
        <div className="mb-2 flex gap-1 p-1 bg-muted/30 rounded-lg border border-border/40">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${isActive
                  ? "bg-background shadow-sm border border-border/40"
                  : "hover:bg-muted/30 text-muted-foreground"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? cfg.color : ""}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2 bg-background rounded-xl border border-border/40 p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
        {/* Channel indicator button */}
        {availableChannels.length > 1 && (
          <button
            onClick={() => setShowChannelPicker(!showChannelPicker)}
            className="flex items-center gap-0.5 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors mb-1 shrink-0"
            title={`Sending via ${config.label}`}
          >
            <ChannelIcon className={`w-4 h-4 ${config.color}`} />
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type a message (via ${config.label})...`}
          className="min-h-[40px] max-h-[140px] border-none focus-visible:ring-0 px-2 py-2 resize-none shadow-none"
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
          className="h-8 w-8 mb-1 shrink-0 bg-primary hover:bg-primary/90"
          onClick={handleSend}
          disabled={!inputText.trim() || sending || disabled}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

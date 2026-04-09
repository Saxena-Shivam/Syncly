import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Smile } from "lucide-react";

interface InputBarProps {
  onSendMessage: (content: string) => void;
  onUploadFile?: (file: File, caption?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export default function InputBar({
  onSendMessage,
  onUploadFile,
  onTypingStart,
  onTypingStop,
}: InputBarProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      onTypingStop?.();
      inputRef.current?.focus();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadFile) {
      return;
    }

    onUploadFile(file, message.trim() || undefined);
    setMessage("");
    onTypingStop?.();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-end gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />
          <Paperclip className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex-1">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              const next = e.target.value;
              setMessage(next);
              if (next.trim()) {
                onTypingStart?.();
              } else {
                onTypingStop?.();
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Smile className="w-5 h-5 text-foreground" />
        </button>

        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

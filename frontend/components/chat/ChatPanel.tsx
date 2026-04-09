import React, { useRef, useEffect } from "react";
import { ChatMessage, ChatRoom } from "@/types/chat";
import ChatHeader from "./ChatHeader";
import MessageContainer from "./MessageContainer";
import InputBar from "./InputBar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface ChatPanelProps {
  room?: ChatRoom;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onUploadFile?: (file: File, caption?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  isTyping: boolean;
  token?: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ChatPanel({
  room,
  messages,
  onSendMessage,
  onUploadFile,
  onTypingStart,
  onTypingStop,
  isTyping,
  token,
  sidebarOpen,
  onToggleSidebar,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            No conversation selected. Open contacts to start chatting.
          </p>
          <Button variant="outline" onClick={onToggleSidebar} className="gap-2">
            <Menu className="w-4 h-4" />
            Open Contacts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <ChatHeader
        room={room}
        token={token}
        onToggleSidebar={onToggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      {/* Messages */}
      <MessageContainer
        messages={messages}
        isTyping={isTyping}
        ref={messagesEndRef}
      />

      {/* Input */}
      <InputBar
        onSendMessage={onSendMessage}
        onUploadFile={onUploadFile}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </div>
  );
}

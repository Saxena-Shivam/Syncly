import React, { forwardRef } from 'react';
import { ChatMessage } from '@/types/chat';
import MessageBubble from './MessageBubble';

interface MessageContainerProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

const MessageContainer = forwardRef<HTMLDivElement, MessageContainerProps>(
  ({ messages, isTyping }, ref) => {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-xs text-accent">Bot</span>
            </div>
            <div className="flex gap-1 items-center p-3 bg-card rounded-lg rounded-tl-none">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}

        <div ref={ref} />
      </div>
    );
  }
);

MessageContainer.displayName = 'MessageContainer';

export default MessageContainer;

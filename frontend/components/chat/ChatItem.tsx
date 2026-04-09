import React from "react";
import { ChatRoom } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatItemProps {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}

export default function ChatItem({ room, isActive, onClick }: ChatItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-colors duration-200",
        "hover:bg-sidebar-accent/50",
        isActive && "bg-sidebar-primary/20 border-l-4 border-sidebar-primary",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sidebar-foreground truncate">
            {room.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-sm text-sidebar-foreground/70 truncate flex-1 min-w-0">
              {room.lastMessage}
            </p>
            <p className="text-xs text-sidebar-foreground/50 flex-shrink-0">
              {room.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {room.unreadCount > 0 && (
          <div className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="text-xs font-bold text-sidebar-primary-foreground">
              {room.unreadCount > 9 ? "9+" : room.unreadCount}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

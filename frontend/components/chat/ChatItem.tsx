import React from "react";
import { ChatRoom } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatItemProps {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}

export default function ChatItem({ room, isActive, onClick }: ChatItemProps) {
  const hasUnread = room.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-all duration-200 relative",
        "hover:bg-sidebar-accent/50 active:scale-95",
        isActive &&
          "bg-sidebar-primary/20 border-l-4 border-sidebar-primary shadow-sm",
        hasUnread && !isActive && "bg-sidebar-accent/20",
      )}
    >
      {/* Unread Indicator Dot */}
      {hasUnread && !isActive && (
        <div className="absolute left-2 top-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}

      <div className="flex items-center gap-3">
        {/* Avatar with Unread Badge */}
        <div className="relative flex-shrink-0">
          {room.avatar && (
            <img
              src={room.avatar}
              alt={room.name}
              className={cn(
                "w-12 h-12 rounded-full object-cover transition-all",
                hasUnread && "ring-2 ring-red-500/50 ring-offset-1",
              )}
              crossOrigin="anonymous"
            />
          )}
          {/* Unread Dot on Avatar */}
          {hasUnread && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-sidebar flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "truncate",
              hasUnread
                ? "font-bold text-sidebar-foreground"
                : "font-semibold text-sidebar-foreground",
            )}
          >
            {room.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <p
              className={cn(
                "truncate flex-1 min-w-0 text-sm",
                hasUnread
                  ? "text-sidebar-foreground/80 font-medium"
                  : "text-sidebar-foreground/70",
              )}
            >
              {room.lastMessage}
            </p>
          </div>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">
            {room.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Unread Badge */}
        {hasUnread && (
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">
                {room.unreadCount > 9 ? "9+" : room.unreadCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

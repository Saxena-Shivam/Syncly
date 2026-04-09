import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import ChatItem from "./ChatItem";
import { ChatRoom } from "@/types/chat";

interface SidebarProps {
  rooms: ChatRoom[];
  searchResults?: ChatRoom[];
  activeRoomId: string;
  searchQuery?: string;
  isSearching?: boolean;
  onSearchChange?: (value: string) => void;
  onSelectRoom: (roomId: string) => void;
}

export default function Sidebar({
  rooms,
  searchResults,
  activeRoomId,
  searchQuery,
  isSearching,
  onSearchChange,
  onSelectRoom,
}: SidebarProps) {
  const [localSearch, setLocalSearch] = useState("");

  const searchValue = searchQuery ?? localSearch;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }

    setLocalSearch(value);
  };

  const filteredRooms = rooms;

  const visibleSearchResults = searchValue.trim()
    ? (searchResults || []).filter(
        (candidate) => !filteredRooms.some((room) => room.id === candidate.id),
      )
    : [];

  const totalUnread = filteredRooms.reduce(
    (sum, room) => sum + room.unreadCount,
    0,
  );

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.12em] text-sidebar-foreground/70">
            Chats
          </p>
          {totalUnread > 0 && (
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            </div>
          )}
        </div>
        <Input
          value={searchValue}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search"
          className="h-8 w-full max-w-[10rem] bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
        />
      </div>

      {searchValue.trim() ? (
        <div className="px-3 py-2 border-b border-sidebar-border bg-sidebar/95 space-y-2">
          {isSearching ? (
            <p className="text-xs text-sidebar-foreground/70 px-1">
              Searching...
            </p>
          ) : null}

          <div className="max-h-52 overflow-y-auto space-y-2">
            {visibleSearchResults.length ? (
              visibleSearchResults.map((room) => (
                <ChatItem
                  key={`search-${room.id}`}
                  room={room}
                  isActive={room.id === activeRoomId}
                  onClick={() => {
                    onSelectRoom(room.id);
                    handleSearchChange("");
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-sidebar-foreground/70 px-2 py-1">
                No matching users.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredRooms.length ? (
          filteredRooms.map((room) => (
            <ChatItem
              key={room.id}
              room={room}
              isActive={room.id === activeRoomId}
              onClick={() => onSelectRoom(room.id)}
            />
          ))
        ) : (
          <p className="text-sm text-sidebar-foreground/70 px-2 py-1">
            No chats yet. Use search to find a user.
          </p>
        )}
      </div>
    </div>
  );
}

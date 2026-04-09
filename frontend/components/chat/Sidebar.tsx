import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatItem from "./ChatItem";
import { ChatRoom } from "@/types/chat";
import { Search, X } from "lucide-react";

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
  const [showSearchPopup, setShowSearchPopup] = useState(false);

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

  const closeSearchPopup = () => {
    setShowSearchPopup(false);
    handleSearchChange("");
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sidebar-border flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.12em] text-sidebar-foreground/70">
          Chats
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearchPopup((current) => !current)}
          className="h-8 w-8 text-sidebar-foreground/80 hover:text-sidebar-foreground"
          aria-label="Search users"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {showSearchPopup ? (
        <div className="px-3 py-2 border-b border-sidebar-border bg-sidebar/95 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search username"
              className="h-8 w-full max-w-[16rem] bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
            />
            <button
              type="button"
              onClick={closeSearchPopup}
              className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isSearching ? (
            <p className="text-xs text-sidebar-foreground/70 px-1">
              Searching...
            </p>
          ) : null}

          <div className="max-h-52 overflow-y-auto space-y-2">
            {searchValue.trim() ? (
              visibleSearchResults.length ? (
                visibleSearchResults.map((room) => (
                  <ChatItem
                    key={`search-${room.id}`}
                    room={room}
                    isActive={room.id === activeRoomId}
                    onClick={() => {
                      onSelectRoom(room.id);
                      closeSearchPopup();
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-sidebar-foreground/70 px-2 py-1">
                  No matching users.
                </p>
              )
            ) : (
              <p className="text-sm text-sidebar-foreground/70 px-2 py-1">
                Type username to search.
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

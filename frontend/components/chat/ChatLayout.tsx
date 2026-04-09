import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatPanel from "./ChatPanel";
import { ChatMessage, ChatRoom } from "@/types/chat";

interface ChatLayoutProps {
  rooms: ChatRoom[];
  searchResults?: ChatRoom[];
  activeRoomId: string;
  messages: ChatMessage[];
  userSearch?: string;
  onUserSearchChange?: (value: string) => void;
  isSearchingUsers?: boolean;
  onSelectRoom: (roomId: string) => void;
  onSendMessage: (content: string) => void;
  onUploadFile?: (file: File, caption?: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  isTyping: boolean;
  token?: string;
  onLogout?: () => void;
}

export default function ChatLayout({
  rooms,
  searchResults,
  activeRoomId,
  messages,
  userSearch,
  onUserSearchChange,
  isSearchingUsers,
  onSelectRoom,
  onSendMessage,
  onUploadFile,
  onTypingStart,
  onTypingStop,
  isTyping,
  token,
  onLogout: _onLogout,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activeRoom =
    rooms.find((r) => r.id === activeRoomId) ||
    (searchResults || []).find((r) => r.id === activeRoomId);

  return (
    <div className="flex h-full w-full bg-background">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-1/4 md:w-1/3 lg:w-1/4" : "w-0"
        } hidden md:block border-r border-border`}
      >
        <Sidebar
          rooms={rooms}
          searchResults={searchResults}
          activeRoomId={activeRoomId}
          searchQuery={userSearch}
          isSearching={isSearchingUsers}
          onSearchChange={onUserSearchChange}
          onSelectRoom={onSelectRoom}
        />
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col md:min-w-0">
        <ChatPanel
          room={activeRoom}
          messages={messages}
          onSendMessage={onSendMessage}
          onUploadFile={onUploadFile}
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
          isTyping={isTyping}
          token={token}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 md:hidden z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-3/4 h-full bg-sidebar border-r border-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              rooms={rooms}
              searchResults={searchResults}
              activeRoomId={activeRoomId}
              searchQuery={userSearch}
              isSearching={isSearchingUsers}
              onSearchChange={onUserSearchChange}
              onSelectRoom={(roomId) => {
                onSelectRoom(roomId);
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

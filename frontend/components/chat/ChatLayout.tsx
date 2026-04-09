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
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [showChat, setShowChat] = useState(isMobile ? false : true);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowChat(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeRoom =
    rooms.find((r) => r.id === activeRoomId) ||
    (searchResults || []).find((r) => r.id === activeRoomId);

  const handleSelectRoom = (roomId: string) => {
    onSelectRoom(roomId);
    if (isMobile) {
      setShowChat(true);
    }
  };

  // Mobile: show chat list or chat panel based on selection
  if (isMobile) {
    return showChat ? (
      <ChatPanel
        room={activeRoom}
        messages={messages}
        onSendMessage={onSendMessage}
        onUploadFile={onUploadFile}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        isTyping={isTyping}
        token={token}
        sidebarOpen={true}
        onToggleSidebar={() => setShowChat(false)}
      />
    ) : (
      <Sidebar
        rooms={rooms}
        searchResults={searchResults}
        activeRoomId={activeRoomId}
        searchQuery={userSearch}
        isSearching={isSearchingUsers}
        onSearchChange={onUserSearchChange}
        onSelectRoom={handleSelectRoom}
      />
    );
  }

  // Desktop: show both sidebar and chat panel
  return (
    <div className="flex h-full w-full bg-background">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-border hidden md:flex flex-col">
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
          sidebarOpen={true}
          onToggleSidebar={() => setShowChat(false)}
        />
      </div>
    </div>
  );
}

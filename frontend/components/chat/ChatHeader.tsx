import React, { useState } from "react";
import { ChatRoom } from "@/types/chat";
import { Menu, Phone, QrCode, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCodeModal from "../modals/QRCodeModal";

interface ChatHeaderProps {
  room: ChatRoom;
  token?: string;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function ChatHeader({
  room,
  token,
  onToggleSidebar,
  sidebarOpen,
}: ChatHeaderProps) {
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {room.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {room.subtitle || "Direct message"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Video className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="QR Pair"
          >
            <QrCode className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
      {showQR && (
        <QRCodeModal token={token || ""} onClose={() => setShowQR(false)} />
      )}
    </>
  );
}

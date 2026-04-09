export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  avatar?: string;
  type?: "text" | "image" | "video" | "document";
  fileUrl?: string;
  delivered?: boolean;
  seen?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage: string;
  timestamp: Date;
  avatar?: string;
  subtitle?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
}

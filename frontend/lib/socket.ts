import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getAuthToken = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("syncly_token") || "";
};

export const initSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "");

  const token = getAuthToken();

  socket = io(socketUrl, {
    auth: token ? { token } : {},
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket connected");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket event handlers
export const emitMessage = (
  receiverId: string,
  message: {
    sender?: string;
    content?: string;
    text?: string;
    fileUrl?: string;
    type?: "text" | "image" | "video" | "document";
  },
): void => {
  const sock = getSocket();
  if (sock) {
    sock.emit("send_message", {
      receiverId,
      text: message.text || message.content || "",
      fileUrl: message.fileUrl || "",
      type: message.type || "text",
      clientTempId: Date.now().toString(),
    });
  }
};

export const emitTyping = (receiverId: string): void => {
  const sock = getSocket();
  if (!sock || !receiverId) {
    return;
  }

  sock.emit("typing", { receiverId });
};

export const emitStopTyping = (receiverId: string): void => {
  const sock = getSocket();
  if (!sock || !receiverId) {
    return;
  }

  sock.emit("stop_typing", { receiverId });
};

export const onReceiveMessage = (
  callback: (data: any) => void,
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    const handler = (payload: any) => {
      callback({
        ...payload,
        id: payload?._id,
        sender: payload?.senderId,
        content: payload?.text,
        timestamp: payload?.createdAt,
        roomId: payload?.senderId,
      });
    };

    sock.on("receive_message", handler);
    return () => {
      sock.off("receive_message", handler);
    };
  }
  return () => {};
};

export const onTypingIndicator = (
  callback: (data: any) => void,
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("typing", callback);
    return () => {
      sock.off("typing", callback);
    };
  }
  return () => {};
};

export const onStopTypingIndicator = (
  callback: (data: any) => void,
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("stop_typing", callback);
    return () => {
      sock.off("stop_typing", callback);
    };
  }
  return () => {};
};

export const onMessageSent = (callback: (data: any) => void): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("message_sent", callback);
    return () => {
      sock.off("message_sent", callback);
    };
  }
  return () => {};
};

export const onDeviceConnected = (
  callback: (data: any) => void,
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("device_connected", callback);
    return () => {
      sock.off("device_connected", callback);
    };
  }
  return () => {};
};

export const onUserOnlineStatus = (
  callback: (data: any) => void,
): (() => void) => {
  const sock = getSocket();
  if (sock) {
    sock.on("presence_update", callback);
    return () => {
      sock.off("presence_update", callback);
    };
  }
  return () => {};
};

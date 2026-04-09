const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");
const { verifyToken } = require("../utils/jwt");
const { cleanString } = require("../utils/sanitize");
const {
  markOnline,
  markOffline,
  isUserOnline,
  getOnlineUserIds,
} = require("./presence");

const resolveToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken) {
    return authToken;
  }

  const header = socket.handshake.headers?.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return "";
};

const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = resolveToken(socket);
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select("_id");
      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = user._id.toString();
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    socket.join(userId);
    markOnline(userId, socket.id);

    io.emit("presence_update", {
      userId,
      online: true,
      onlineUsers: getOnlineUserIds(),
    });

    socket.on("join", (payload = {}) => {
      const requestedUserId = String(payload.userId || "").trim();
      if (requestedUserId && requestedUserId === userId) {
        socket.join(userId);
      }
    });

    socket.on("send_message", async (payload = {}, ack) => {
      try {
        const receiverId = cleanString(payload.receiverId, 50);
        const text = cleanString(payload.text || "", 5000);
        const fileUrl = cleanString(payload.fileUrl || "", 2000);
        const type = ["text", "image", "video", "document"].includes(
          payload.type,
        )
          ? payload.type
          : "text";

        if (!receiverId) {
          throw new Error("receiverId is required");
        }

        if (!mongoose.isValidObjectId(receiverId)) {
          throw new Error("Invalid receiverId");
        }

        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists) {
          throw new Error("Receiver not found");
        }

        if (!text && !fileUrl) {
          throw new Error("Message content is required");
        }

        const delivered = isUserOnline(receiverId);

        const message = await Message.create({
          senderId: userId,
          receiverId,
          text,
          fileUrl,
          type,
          delivered,
          seen: false,
        });

        const messagePayload = {
          _id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          fileUrl: message.fileUrl,
          type: message.type,
          delivered: message.delivered,
          seen: message.seen,
          createdAt: message.createdAt,
          clientTempId: cleanString(payload.clientTempId || "", 100),
        };

        io.to(receiverId).emit("receive_message", messagePayload);
        io.to(userId).emit("message_sent", messagePayload);

        if (typeof ack === "function") {
          ack({ ok: true, message: messagePayload });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({
            ok: false,
            message: error.message || "Failed to send message",
          });
        }
      }
    });

    socket.on("typing", (payload = {}) => {
      const receiverId = cleanString(payload.receiverId || "", 50);
      if (!receiverId) {
        return;
      }

      io.to(receiverId).emit("typing", {
        fromUserId: userId,
      });
    });

    socket.on("stop_typing", (payload = {}) => {
      const receiverId = cleanString(payload.receiverId || "", 50);
      if (!receiverId) {
        return;
      }

      io.to(receiverId).emit("stop_typing", {
        fromUserId: userId,
      });
    });

    socket.on("disconnect", async () => {
      const fullyOffline = markOffline(userId, socket.id);

      if (fullyOffline) {
        await User.findByIdAndUpdate(userId, {
          $set: { lastSeenAt: new Date() },
        }).exec();

        io.emit("presence_update", {
          userId,
          online: false,
          onlineUsers: getOnlineUserIds(),
        });
      }
    });
  });
};

module.exports = registerSocketHandlers;

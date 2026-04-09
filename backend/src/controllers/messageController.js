const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { isUserOnline } = require("../sockets/presence");

const getConversations = asyncHandler(async (req, res) => {
  const myId = req.user._id;

  const conversationRows = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: myId }, { receiverId: myId }],
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        otherUserId: {
          $cond: [{ $eq: ["$senderId", myId] }, "$receiverId", "$senderId"],
        },
        text: 1,
        fileUrl: 1,
        type: 1,
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: "$otherUserId",
        lastMessageText: { $first: "$text" },
        lastMessageType: { $first: "$type" },
        lastMessageFileUrl: { $first: "$fileUrl" },
        lastMessageAt: { $first: "$createdAt" },
      },
    },
    {
      $sort: {
        lastMessageAt: -1,
      },
    },
    {
      $limit: 200,
    },
  ]);

  const userIds = conversationRows.map((row) => row._id);

  if (!userIds.length) {
    res.json({ users: [] });
    return;
  }

  const users = await User.find({ _id: { $in: userIds } })
    .select("_id username email avatar lastSeenAt createdAt")
    .lean();

  const byId = new Map(users.map((user) => [String(user._id), user]));

  const mappedUsers = conversationRows
    .map((row) => {
      const user = byId.get(String(row._id));
      if (!user) {
        return null;
      }

      return {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        online: isUserOnline(String(user._id)),
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
        lastMessage: row.lastMessageText || "",
        lastMessageType: row.lastMessageType || "text",
        lastMessageFileUrl: row.lastMessageFileUrl || "",
        lastMessageAt: row.lastMessageAt,
      };
    })
    .filter(Boolean);

  res.json({ users: mappedUsers });
});

const getMessagesWithUser = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;

  if (!mongoose.isValidObjectId(otherUserId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const myId = req.user._id;

  const messages = await Message.find({
    $or: [
      { senderId: myId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: myId },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(1000)
    .lean();

  await Message.updateMany(
    {
      senderId: otherUserId,
      receiverId: myId,
      seen: false,
    },
    {
      $set: { seen: true, delivered: true },
    },
  );

  res.json({ messages });
});

module.exports = {
  getConversations,
  getMessagesWithUser,
};

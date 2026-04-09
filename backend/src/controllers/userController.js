const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { cleanString, isValidUsername } = require("../utils/sanitize");
const { isUserOnline } = require("../sockets/presence");

const me = asyncHandler(async (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      online: isUserOnline(user._id.toString()),
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
    },
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const username = cleanString(req.body?.username, 24);

  if (!isValidUsername(username)) {
    throw new ApiError(
      400,
      "Username must be 3-24 chars: letters, numbers, underscore",
    );
  }

  const exists = await User.exists({ username, _id: { $ne: req.user._id } });
  if (exists) {
    throw new ApiError(409, "Username is already taken");
  }

  req.user.username = username;
  await req.user.save();

  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const search = cleanString(req.query.search || "", 50);

  const query = {
    _id: { $ne: req.user._id },
  };

  if (search) {
    query.username = { $regex: search, $options: "i" };
  }

  const users = await User.find(query)
    .select("_id username email avatar lastSeenAt createdAt")
    .sort({ username: 1 })
    .limit(200);

  res.json({
    users: users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      online: isUserOnline(user._id.toString()),
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
    })),
  });
});

module.exports = {
  me,
  updateMe,
  listUsers,
};

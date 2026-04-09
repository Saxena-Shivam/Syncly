const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { signToken } = require("../utils/jwt");
const { cleanString, isValidUsername } = require("../utils/sanitize");
const { verifyGoogleToken } = require("../utils/googleAuth");

const fallbackUsernameFromEmail = (email) => {
  const prefix = String(email)
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 20);
  return prefix.length >= 3 ? prefix : `user${Date.now().toString().slice(-6)}`;
};

const pickAvailableUsername = async (base) => {
  let candidate = base;
  let suffix = 0;

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ username: candidate });
    if (!exists) {
      return candidate;
    }

    suffix += 1;
    candidate = `${base}${suffix}`.slice(0, 24);
  }
};

const createSessionPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

const register = asyncHandler(async (req, res) => {
  const email = cleanString(req.body?.email || "", 320).toLowerCase();
  const password = cleanString(req.body?.password || "", 128);
  const requestedUsername = cleanString(req.body?.username || "", 24);

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Enter a valid email address");
  }

  if (!password || password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account already exists with this email");
  }

  let username = requestedUsername || fallbackUsernameFromEmail(email);
  if (!isValidUsername(username)) {
    username = fallbackUsernameFromEmail(email);
  }

  username = await pickAvailableUsername(username);
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email,
    username,
    passwordHash,
    avatar: "",
  });

  const token = signToken({ userId: user._id.toString() });

  res.status(201).json({
    token,
    user: createSessionPayload(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const email = cleanString(req.body?.email || "", 320).toLowerCase();
  const password = cleanString(req.body?.password || "", 128);

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user._id.toString() });

  res.json({
    token,
    user: createSessionPayload(user),
  });
});

const googleLogin = asyncHandler(async (req, res) => {
  const idToken = cleanString(req.body?.idToken || "", 4096);
  if (!idToken) {
    throw new ApiError(400, "idToken is required");
  }

  let payload;
  try {
    payload = await verifyGoogleToken(idToken);
  } catch (error) {
    throw new ApiError(401, "Invalid Google token");
  }

  const email = cleanString(payload.email || "", 320).toLowerCase();
  if (!email) {
    throw new ApiError(401, "Google account email is missing");
  }

  let user = await User.findOne({ email });

  if (!user) {
    let username =
      cleanString(payload.name || "", 24) || fallbackUsernameFromEmail(email);
    if (!isValidUsername(username)) {
      username = fallbackUsernameFromEmail(email);
    }

    username = await pickAvailableUsername(username);

    user = await User.create({
      email,
      username,
      avatar: cleanString(payload.picture || "", 2048),
      passwordHash: "",
    });
  }

  const token = signToken({ userId: user._id.toString() });

  res.json({
    token,
    user: createSessionPayload(user),
  });
});

module.exports = {
  register,
  login,
  googleLogin,
};

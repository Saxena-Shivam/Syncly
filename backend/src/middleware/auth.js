const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

const getTokenFromReq = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (typeof req.query.token === "string") {
    return req.query.token;
  }

  return "";
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-googleId");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = {
  requireAuth,
};

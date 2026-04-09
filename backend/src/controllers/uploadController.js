const path = require("path");
const env = require("../config/env");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "File is required");
  }

  const origin = env.publicApiUrl || `${req.protocol}://${req.get("host")}`;
  const fileUrl = `${origin}/uploads/${path.basename(req.file.path)}`;
  const mediaType = req.file.mimetype.startsWith("video/")
    ? "video"
    : req.file.mimetype.startsWith("image/")
      ? "image"
      : "document";

  res.status(201).json({
    fileUrl,
    type: mediaType,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

module.exports = {
  uploadFile,
};

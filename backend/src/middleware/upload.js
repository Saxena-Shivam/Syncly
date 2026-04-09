const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");
const env = require("../config/env");

const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const baseName = path.basename(file.originalname || "file", ext);
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    const uniqueSuffix = randomUUID();
    cb(null, `${Date.now()}-${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }

    cb(null, true);
  },
});

module.exports = upload;

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
];

let loadedEnvPath = "";

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    loadedEnvPath = candidate;
    break;
  }
}

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  port: toNumber(process.env.PORT, 5000),
  publicApiUrl: (process.env.PUBLIC_API_URL || "").replace(/\/$/, ""),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/syncly",
  mongoConnectRetryMs: toNumber(process.env.MONGO_CONNECT_RETRY_MS, 5000),
  mongoConnectMaxRetries: toNumber(process.env.MONGO_CONNECT_MAX_RETRIES, 0),
  mongoServerSelectionTimeoutMs: toNumber(
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    10000,
  ),
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 20),
  qrTokenTtlMs: toNumber(process.env.QR_TOKEN_TTL_MS, 5 * 60 * 1000),
  nodeEnv: process.env.NODE_ENV || "development",
  loadedEnvPath,
};

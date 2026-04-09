const mongoose = require("mongoose");
const env = require("./env");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const maskMongoUri = (uri) => {
  if (!uri || typeof uri !== "string") {
    return "<empty>";
  }

  return uri.replace(/:\/\/([^:@/]+):([^@/]+)@/, "://$1:***@");
};

const connectDB = async () => {
  mongoose.set("strictQuery", true);

  // eslint-disable-next-line no-console
  console.log(`[startup] env file: ${env.loadedEnvPath || "not found"}`);
  // eslint-disable-next-line no-console
  console.log(`[startup] mongo uri: ${maskMongoUri(env.mongoUri)}`);

  let attempt = 0;

  while (true) {
    attempt += 1;

    try {
      await mongoose.connect(env.mongoUri, {
        autoIndex: true,
        maxPoolSize: 20,
        serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
      });
      break;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `[startup] MongoDB connection failed (attempt ${attempt})`,
        error.message,
      );

      const maxRetries = env.mongoConnectMaxRetries;
      if (maxRetries > 0 && attempt >= maxRetries) {
        throw error;
      }

      // eslint-disable-next-line no-console
      console.log(
        `[startup] retrying MongoDB in ${env.mongoConnectRetryMs}ms...`,
      );
      // eslint-disable-next-line no-await-in-loop
      await sleep(env.mongoConnectRetryMs);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[startup] MongoDB connected: ${mongoose.connection.host}`);

  return mongoose.connection;
};

module.exports = connectDB;

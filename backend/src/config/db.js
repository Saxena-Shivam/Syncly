const mongoose = require("mongoose");
const env = require("./env");

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

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: true,
      maxPoolSize: 20,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[startup] MongoDB connection failed", error.message);
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log(`[startup] MongoDB connected: ${mongoose.connection.host}`);

  return mongoose.connection;
};

module.exports = connectDB;

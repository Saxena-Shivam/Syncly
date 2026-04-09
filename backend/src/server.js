const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { Server } = require("socket.io");

const env = require("./config/env");
const connectDB = require("./config/db");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const registerSocketHandlers = require("./sockets");
const { setQrSocketServer } = require("./controllers/qrController");

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: true,
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

setQrSocketServer(io);
registerSocketHandlers(io);

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", (req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbState = dbStates[readyState] || "unknown";

  res.status(readyState === 1 ? 200 : 503).json({
    ok: readyState === 1,
    service: "syncly-backend",
    db: dbState,
    ts: Date.now(),
  });
});

app.use("/", routes);
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

const bootstrap = async () => {
  server.listen(env.port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Syncly backend listening on http://0.0.0.0:${env.port}`);
  });

  connectDB().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB background connection stopped", error);
  });
};

bootstrap();

const ApiError = require("../utils/apiError");

const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof ApiError ? err.statusCode : 500;
  const payload = {
    message: err.message || "Internal server error",
  };

  if (err instanceof ApiError && err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== "production" && status === 500) {
    payload.stack = err.stack;
  }

  return res.status(status).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

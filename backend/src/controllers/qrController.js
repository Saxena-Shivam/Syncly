const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const {
  createPairingToken,
  consumePairingToken,
} = require("../utils/qrPairingStore");

let ioRef = null;

const setQrSocketServer = (io) => {
  ioRef = io;
};

const generateQr = asyncHandler(async (req, res) => {
  const { token, expiresAt } = createPairingToken(req.user._id.toString());
  res.json({ token, expiresAt });
});

const connectDevice = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || "").trim();
  if (!token) {
    throw new ApiError(400, "token is required");
  }

  const result = consumePairingToken(token, req.user._id.toString());
  if (!result.ok) {
    throw new ApiError(400, result.reason);
  }

  if (ioRef) {
    ioRef.to(result.session.ownerUserId).emit("device_connected", {
      ownerUserId: result.session.ownerUserId,
      connectedUserId: result.session.connectedUserId,
      pairedAt: Date.now(),
    });
  }

  res.json({
    success: true,
    ownerUserId: result.session.ownerUserId,
    connectedUserId: result.session.connectedUserId,
  });
});

module.exports = {
  setQrSocketServer,
  generateQr,
  connectDevice,
};

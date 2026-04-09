const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { generateQr, connectDevice } = require("../controllers/qrController");

const router = express.Router();

router.get("/generate-qr", requireAuth, generateQr);
router.post("/connect-device", requireAuth, connectDevice);

module.exports = router;

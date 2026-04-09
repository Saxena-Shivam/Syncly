const express = require("express");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");
const { uploadFile } = require("../controllers/uploadController");

const router = express.Router();

router.post("/", requireAuth, upload.single("file"), uploadFile);

module.exports = router;

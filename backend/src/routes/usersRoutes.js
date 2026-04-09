const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { listUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/", requireAuth, listUsers);

module.exports = router;

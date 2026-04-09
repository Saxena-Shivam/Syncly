const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getConversations,
  getMessagesWithUser,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/conversations", requireAuth, getConversations);
router.get("/:userId", requireAuth, getMessagesWithUser);

module.exports = router;

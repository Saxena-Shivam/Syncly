const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { me, updateMe } = require("../controllers/userController");

const router = express.Router();

router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);

module.exports = router;

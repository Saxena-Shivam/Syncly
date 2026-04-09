const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const usersRoutes = require("./usersRoutes");
const messageRoutes = require("./messageRoutes");
const uploadRoutes = require("./uploadRoutes");
const qrRoutes = require("./qrRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/users", usersRoutes);
router.use("/messages", messageRoutes);
router.use("/upload", uploadRoutes);
router.use("/", qrRoutes);

module.exports = router;

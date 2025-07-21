const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../../user/middleware/auth");

const router = express.Router();

// All routes require admin
router.use(authenticateToken, authorizeAdmin);

// All On-Call Rotations routes removed

module.exports = router; 
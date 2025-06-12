const express = require("express");
const { register, login } = require("../controllers/userController");
const User = require("../models/User"); // ✅ Add this line

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// ✅ Fetch all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

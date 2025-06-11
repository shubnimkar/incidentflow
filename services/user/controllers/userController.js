// /services/user/controllers/userController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = "your_jwt_secret"; // use env vars in production

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token });
};

const express = require("express");
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { 
  register, 
  login, 
  verifyEmail, 
  resendVerification, 
  forgotPassword, 
  resetPassword, 
  getCurrentUser 
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Test route to verify routing is working
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes are working!" });
});

// --- SESSION TRACKING (simple in-memory for demo) ---
const activeSessions = new Set();

// Add to activeSessions on login
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const result = await require("../controllers/authController").login(req, res);
  // If login is successful and a token is returned, add to activeSessions
  if (res.statusCode === 200 && res.locals && res.locals.userId) {
    activeSessions.add(res.locals.userId);
  }
});

// Remove from activeSessions on logout (if you have a logout route)
// router.post("/logout", (req, res) => {
//   if (req.user && req.user.id) {
//     activeSessions.delete(req.user.id);
//   }
//   res.json({ message: "Logged out" });
// });

// GET /sessions - return count of active sessions
router.get("/sessions", (req, res) => {
  res.json({ count: activeSessions.size });
});

// REGISTER & LOGIN
router.post("/register", register);
router.post("/login", login);

// EMAIL VERIFICATION
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

// PASSWORD RESET
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// GET CURRENT USER (protected)
router.get("/me", authMiddleware, getCurrentUser);

// SSO ROUTES
// Google OAuth
router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: req.query.state, // Pass state for linking
  })(req, res, next);
});

// Google OAuth callback
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?link=error`);
    }
    if (req.query.link === '1') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?link=success`);
    }
    const token = jwt.sign({ 
      id: user._id, 
      role: user.role,
      email: user.email,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?token=${token}`);
  })(req, res, next);
});

// GitHub OAuth entry route
router.get('/github', (req, res, next) => {
  passport.authenticate('github', {
    scope: ['user:email'],
    state: req.query.state, // Pass state for linking
  })(req, res, next);
});

// GitHub OAuth callback
router.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?link=error`);
    }
    if (req.query.link === '1') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?link=success`);
    }
    const token = jwt.sign({ 
      id: user._id, 
      role: user.role,
      email: user.email,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?token=${token}`);
  })(req, res, next);
});

// Microsoft OAuth entry route
router.get('/microsoft', (req, res, next) => {
  passport.authenticate('microsoft', {
    scope: ['user.read', 'email'],
    state: req.query.state, // Pass state for linking
  })(req, res, next);
});

// Microsoft OAuth callback
router.get("/microsoft/callback", (req, res, next) => {
  passport.authenticate("microsoft", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?link=error`);
    }
    if (req.query.link === '1') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?link=success`);
    }
    const token = jwt.sign({ 
      id: user._id, 
      role: user.role,
      email: user.email,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?token=${token}`);
  })(req, res, next);
});

module.exports = router;

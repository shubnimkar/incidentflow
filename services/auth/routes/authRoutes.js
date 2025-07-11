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
router.get("/google", (req, res, next) => {
  console.log("Google OAuth route hit");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ 
      message: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." 
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  console.log("Google OAuth callback route hit");
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Google OAuth error:", err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?error=oauth_failed`);
    }
    if (!user) {
      console.error("Google OAuth: No user returned");
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?error=no_user`);
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

// GitHub OAuth
router.get("/github", (req, res, next) => {
  console.log("GitHub OAuth route hit");
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(500).json({ 
      message: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables." 
    });
  }
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});

router.get("/github/callback", (req, res, next) => {
  console.log("GitHub OAuth callback route hit");
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err) {
      console.error("GitHub OAuth error:", err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?error=oauth_failed`);
    }
    if (!user) {
      console.error("GitHub OAuth: No user returned");
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?error=no_user`);
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

// Microsoft OAuth
router.get("/microsoft", (req, res, next) => {
  console.log("Microsoft OAuth route hit");
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return res.status(500).json({ 
      message: "Microsoft OAuth not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET environment variables." 
    });
  }
  passport.authenticate("microsoft", { scope: ["user.read"] })(req, res, next);
});

router.get("/microsoft/callback", (req, res, next) => {
  console.log("Microsoft OAuth callback route hit");
  passport.authenticate("microsoft", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Microsoft OAuth error:", err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?error=oauth_failed`);
    }
    if (!user) {
      console.error("Microsoft OAuth: No user returned");
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?error=no_user`);
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

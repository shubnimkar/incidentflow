require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link existing account to Google
        user.googleId = profile.id;
        user.ssoProvider = 'google';
        user.isEmailVerified = true; // Google emails are verified
        await user.save();
        return done(null, user);
      }

      // Create new user
      const newUser = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatarUrl: profile.photos[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=random`,
        ssoProvider: 'google',
        isEmailVerified: true,
        role: 'responder'
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('✅ Google OAuth strategy loaded');
} else {
  console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        return done(null, user);
      }

      user = await User.findOne({ email: profile.emails[0]?.value });
      
      if (user) {
        user.githubId = profile.id;
        user.ssoProvider = 'github';
        user.isEmailVerified = true;
        await user.save();
        return done(null, user);
      }

      const newUser = new User({
        githubId: profile.id,
        name: profile.displayName || profile.username,
        email: profile.emails[0]?.value,
        avatarUrl: profile.photos[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=random`,
        ssoProvider: 'github',
        isEmailVerified: true,
        role: 'responder'
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('✅ GitHub OAuth strategy loaded');
} else {
  console.log('⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
}

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: "/api/auth/microsoft/callback",
    scope: ['user.read', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Robust email extraction
      const email =
        (profile.emails && profile.emails[0] && profile.emails[0].value) ||
        (profile._json && profile._json.mail) ||
        (profile._json && profile._json.userPrincipalName) ||
        null;

      if (!email) {
        return done(new Error('No email found in Microsoft profile'), null);
      }

      let user = await User.findOne({ microsoftId: profile.id });
      if (user) {
        return done(null, user);
      }

      user = await User.findOne({ email });
      if (user) {
        user.microsoftId = profile.id;
        user.ssoProvider = 'microsoft';
        user.isEmailVerified = true;
        await user.save();
        return done(null, user);
      }

      const newUser = new User({
        microsoftId: profile.id,
        name: profile.displayName,
        email,
        avatarUrl: profile.photos && profile.photos[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=random`,
        ssoProvider: 'microsoft',
        isEmailVerified: true,
        role: 'responder'
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('✅ Microsoft OAuth strategy loaded');
} else {
  console.log('⚠️  Microsoft OAuth not configured (missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET)');
}

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 
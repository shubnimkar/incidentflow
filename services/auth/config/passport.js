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
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      }
      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        // If user already has a different SSO provider or local, do not link automatically
        if (user.ssoProvider && user.ssoProvider !== 'google') {
          return done({ message: 'account_exists' }, null);
        }
        // Link existing account to Google
        user.googleId = profile.id;
        user.ssoProvider = 'google';
        user.isEmailVerified = true;
        // Only set name/avatar if missing
        if (!user.name && profile.displayName) user.name = profile.displayName;
        if (!user.avatarUrl && profile.photos?.[0]?.value) user.avatarUrl = profile.photos[0].value;
        console.log('[Google SSO] Linking to existing user:', { id: user._id, name: user.name, avatarUrl: user.avatarUrl });
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
      console.log('[Google SSO] Creating new user:', { name: newUser.name, avatarUrl: newUser.avatarUrl });
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
        if (user.ssoProvider && user.ssoProvider !== 'github') {
          return done({ message: 'account_exists' }, null);
        }
        user.githubId = profile.id;
        user.ssoProvider = 'github';
        user.isEmailVerified = true;
        // Only set name/avatar if missing
        if (!user.name && (profile.displayName || profile.username)) user.name = profile.displayName || profile.username;
        if (!user.avatarUrl && profile.photos?.[0]?.value) user.avatarUrl = profile.photos[0].value;
        console.log('[GitHub SSO] Linking to existing user:', { id: user._id, name: user.name, avatarUrl: user.avatarUrl });
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
      console.log('[GitHub SSO] Creating new user:', { name: newUser.name, avatarUrl: newUser.avatarUrl });
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
        if (user.ssoProvider && user.ssoProvider !== 'microsoft') {
          return done({ message: 'account_exists' }, null);
        }
        user.microsoftId = profile.id;
        user.ssoProvider = 'microsoft';
        user.isEmailVerified = true;
        // Only set name/avatar if missing
        if (!user.name && profile.displayName) user.name = profile.displayName;
        if (!user.avatarUrl && profile.photos?.[0]?.value) user.avatarUrl = profile.photos[0].value;
        console.log('[Microsoft SSO] Linking to existing user:', { id: user._id, name: user.name, avatarUrl: user.avatarUrl });
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
      console.log('[Microsoft SSO] Creating new user:', { name: newUser.name, avatarUrl: newUser.avatarUrl });
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
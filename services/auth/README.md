# Auth Service - Email Verification & SSO Setup

This service provides authentication with email verification and Single Sign-On (SSO) support.

## Features

- ✅ Email verification for new accounts
- ✅ Password reset functionality
- ✅ Google OAuth SSO
- ✅ GitHub OAuth SSO
- ✅ Microsoft OAuth SSO
- ✅ JWT-based authentication
- ✅ Role-based access control

## Environment Variables

Create a `.env` file in the `services/auth` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/incidentflow

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (Mailtrap for development)
SMTP_HOST=live.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=api
SMTP_PASS=your-mailtrap-api-token
EMAIL_FROM=noreply@incidentflow.com

# OAuth Configuration
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## OAuth Setup Instructions

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Homepage URL: `http://localhost:3000`
4. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
5. Copy Client ID and Client Secret to your `.env` file

### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Set redirect URI: `http://localhost:5000/api/auth/microsoft/callback`
4. Copy Application (client) ID and create a client secret
5. Add to your `.env` file

## Email Setup (Mailtrap)

1. Sign up at [Mailtrap](https://mailtrap.io/)
2. Go to your inbox
3. Click "Show Credentials"
4. Copy the SMTP settings to your `.env` file

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user (protected)

### Email Verification
- `GET /api/auth/verify-email/:token` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email

### Password Reset
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password with token

### SSO
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/github` - GitHub OAuth login
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/microsoft` - Microsoft OAuth login
- `GET /api/auth/microsoft/callback` - Microsoft OAuth callback

## Running the Service

```bash
cd services/auth
npm install
npm start
```

The service will run on `http://localhost:5000` 
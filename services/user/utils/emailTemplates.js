const emailTemplates = {
  verificationEmail: (name, verificationUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
        </div>
        <div class="footer">
          <p>This email was sent from IncidentFlow. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  welcomeEmail: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to IncidentFlow</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to IncidentFlow!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Welcome to IncidentFlow! Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul>
            <li>Create and manage incidents</li>
            <li>Collaborate with your team</li>
            <li>Track incident progress</li>
            <li>Receive real-time updates</li>
          </ul>
          <p>Get started by logging into your account.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing IncidentFlow!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordResetEmail: (name, resetUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
        </div>
        <div class="footer">
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

module.exports = emailTemplates; 
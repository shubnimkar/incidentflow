const emailTemplates = {
  verificationEmail: (name, verificationUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - IncidentFlow</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 IncidentFlow</h1>
          <p>Verify Your Email Address</p>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'}!</h2>
          <p>Welcome to IncidentFlow! Please verify your email address to complete your registration and start managing incidents effectively.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create an account with IncidentFlow, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 IncidentFlow. All rights reserved.</p>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - IncidentFlow</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 IncidentFlow</h1>
          <p>Reset Your Password</p>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'}!</h2>
          <p>We received a request to reset your password for your IncidentFlow account.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 IncidentFlow. All rights reserved.</p>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to IncidentFlow!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 IncidentFlow</h1>
          <p>Welcome to the Team!</p>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'}!</h2>
          <p>Welcome to IncidentFlow! Your email has been verified and your account is now active.</p>
          <p>You can now:</p>
          <ul>
            <li>Create and manage incidents</li>
            <li>Assign tasks to team members</li>
            <li>Track progress with our Kanban board</li>
            <li>Collaborate with your team</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Started</a>
          </p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>© 2024 IncidentFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  incidentNotification: (userName, incidentTitle, incidentId, action, url) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Incident Notification - IncidentFlow</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #007bff 0%, #00c6ff 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 IncidentFlow</h1>
          <p>Incident Notification</p>
        </div>
        <div class="content">
          <h2>Hi ${userName || 'there'}!</h2>
          <p>The incident <strong>${incidentTitle}</strong> (ID: ${incidentId}) has been <strong>${action}</strong> and you are assigned to it.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${url}" class="button">View Incident</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${url}</p>
        </div>
        <div class="footer">
          <p>© 2024 IncidentFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

module.exports = emailTemplates; 
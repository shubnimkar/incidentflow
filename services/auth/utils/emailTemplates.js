const emailTemplates = {
  verificationEmail: (name, verificationUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - IncidentFlow</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%); color: white; padding: 32px 30px 20px 30px; text-align: center; border-radius: 18px 18px 0 0; }
        .header-title { font-size: 2rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
        .header-desc { font-size: 1.1rem; font-weight: 500; opacity: 0.95; }
        .content { background: #fff; padding: 36px 30px 30px 30px; border-radius: 0 0 18px 18px; box-shadow: 0 8px 32px 0 rgba(40,60,120,0.08); }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 36px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 2px 8px 0 rgba(37,99,235,0.10); transition: background 0.2s; }
        .button:hover { background: #1746a2; }
        .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px; padding-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-title">IncidentFlow</div>
          <div class="header-desc">Verify Your Email Address</div>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color:#1e293b;">Hi ${name || 'there'}!</h2>
          <p>Welcome to IncidentFlow! Please verify your email address to complete your registration and start managing incidents effectively.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p style="margin-bottom: 0.5em;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb; margin-top:0;">${verificationUrl}</p>
          <p style="margin-top: 2em;">This link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create an account with IncidentFlow, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} IncidentFlow. All rights reserved.
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%); color: white; padding: 32px 30px 20px 30px; text-align: center; border-radius: 18px 18px 0 0; }
        .header-title { font-size: 2rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
        .header-desc { font-size: 1.1rem; font-weight: 500; opacity: 0.95; }
        .content { background: #fff; padding: 36px 30px 30px 30px; border-radius: 0 0 18px 18px; box-shadow: 0 8px 32px 0 rgba(40,60,120,0.08); }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 36px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 2px 8px 0 rgba(37,99,235,0.10); transition: background 0.2s; }
        .button:hover { background: #1746a2; }
        .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px; padding-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-title">IncidentFlow</div>
          <div class="header-desc">Reset Your Password</div>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color:#1e293b;">Hi ${name || 'there'}!</h2>
          <p>We received a request to reset your password for your IncidentFlow account.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p style="margin-bottom: 0.5em;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb; margin-top:0;">${resetUrl}</p>
          <p style="margin-top: 2em;">This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} IncidentFlow. All rights reserved.
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%); color: white; padding: 32px 30px 20px 30px; text-align: center; border-radius: 18px 18px 0 0; }
        .header-title { font-size: 2rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
        .header-desc { font-size: 1.1rem; font-weight: 500; opacity: 0.95; }
        .content { background: #fff; padding: 36px 30px 30px 30px; border-radius: 0 0 18px 18px; box-shadow: 0 8px 32px 0 rgba(40,60,120,0.08); }
        .button { display: inline-block; background: #2563eb; color: white; padding: 14px 36px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 1.1rem; box-shadow: 0 2px 8px 0 rgba(37,99,235,0.10); transition: background 0.2s; }
        .button:hover { background: #1746a2; }
        .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 14px; padding-bottom: 12px; }
        ul { margin: 1.2em 0 1.6em 0; padding-left: 1.2em; }
        li { margin-bottom: 0.5em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-title">IncidentFlow</div>
          <div class="header-desc">Welcome to the Team!</div>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color:#1e293b;">Hi ${name || 'there'}!</h2>
          <p>Welcome to IncidentFlow! Your email has been verified and your account is now active.</p>
          <p>You can now:</p>
          <ul>
            <li>Create and manage incidents</li>
            <li>Assign tasks to team members</li>
            <li>Track progress with our Kanban board</li>
            <li>Collaborate with your team</li>
          </ul>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Started</a>
          </p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} IncidentFlow. All rights reserved.
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
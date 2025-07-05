// services/auth/utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // "live.smtp.mailtrap.io"
    port: Number(process.env.SMTP_PORT), // 587
    auth: {
      user: process.env.SMTP_USER, // "api"
      pass: process.env.SMTP_PASS, // your Mailtrap API token
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"IncidentFlow" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    throw err;
  }
};

module.exports = sendEmail;

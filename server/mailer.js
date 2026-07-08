// Transactional email via SMTP (nodemailer), same env var convention used
// across other Advanced Marketing projects: SMTP_HOST/PORT/SECURE/USER/PASS,
// FROM_EMAIL. If unset, reset links are logged instead of emailed so local
// dev and a not-yet-configured production box don't crash.
const nodemailer = require('nodemailer');

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const transport = getTransport();
  if (!transport) {
    console.warn(`[mailer] SMTP not configured — password reset link for ${toEmail}: ${resetUrl}`);
    return;
  }
  await transport.sendMail({
    from: process.env.FROM_EMAIL || 'LinkLeaf <no-reply@linkleaf.im>',
    to: toEmail,
    subject: 'Reset your LinkLeaf password',
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>Reset your LinkLeaf password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
  });
}

module.exports = { sendPasswordResetEmail };

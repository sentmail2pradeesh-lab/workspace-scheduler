const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

async function sendOtpEmail(email, otp, expiresInMinutes = 10) {
  const transport = getTransporter();
  if (!transport) {
    const err = new Error(
      'Email service is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to backend/.env'
    );
    err.status = 503;
    throw err;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transport.sendMail({
    from,
    to: email,
    subject: 'Your Workspace Scheduler verification code',
    text: [
      'Use this code to complete your registration:',
      '',
      otp,
      '',
      `This code expires in ${expiresInMinutes} minutes.`,
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Verify your email</h2>
        <p>Use this code to complete your registration:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</p>
        <p style="color: #666; font-size: 14px;">This code expires in ${expiresInMinutes} minutes.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  const pass = (SMTP_PASS || '').replace(/\s/g, '');
  if (!SMTP_HOST || !SMTP_USER?.trim() || !pass) {
    return null;
  }

  const allowInsecureTls = process.env.SMTP_TLS_INSECURE === 'true';

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.SMTP_SECURE !== 'true',
    auth: {
      user: SMTP_USER.trim(),
      pass,
    },
    tls: {
      rejectUnauthorized: !allowInsecureTls,
      minVersion: 'TLSv1.2',
    },
  });

  return transporter;
}

function mapEmailError(err) {
  const msg = err.message || '';

  if (msg.includes('certificate') || err.code === 'ESOCKET') {
    return 'Email could not be sent (SSL certificate issue). Add SMTP_TLS_INSECURE=true to backend/.env for local development.';
  }
  if (err.code === 'EAUTH') {
    return 'Email authentication failed. Check SMTP_USER and SMTP_PASS (use a Gmail App Password).';
  }
  if (err.code === 'ECONNECTION') {
    return 'Could not connect to the email server. Check SMTP_HOST and SMTP_PORT.';
  }

  return msg || 'Failed to send verification email';
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

  try {
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
  } catch (err) {
    const wrapped = new Error(mapEmailError(err));
    wrapped.status = 503;
    throw wrapped;
  }
}

module.exports = { sendOtpEmail };

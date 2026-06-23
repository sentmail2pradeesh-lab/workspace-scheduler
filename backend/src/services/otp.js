const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { sendOtpEmail } = require('./email');

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function normalizeEmail(email) {
  const normalized = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    const err = new Error('Enter a valid email address');
    err.status = 400;
    throw err;
  }
  return normalized;
}

function normalizeMobile(mobile) {
  if (!mobile || !String(mobile).trim()) return null;
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    const err = new Error('Enter a valid mobile number (10–15 digits)');
    err.status = 400;
    throw err;
  }
  return digits;
}

function validateRole(role) {
  if (!['Standard', 'Supervisor'].includes(role)) {
    const err = new Error('Role must be Standard or Supervisor');
    err.status = 400;
    throw err;
  }
}

async function sendRegistrationOtp(email, otp) {
  await sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
}

async function requestRegistrationOtp({ name, email, mobile, password, role }) {
  if (!name?.trim() || !email || !password || !role) {
    const err = new Error('Name, email, password, and role are required');
    err.status = 400;
    throw err;
  }

  if (password.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 400;
    throw err;
  }

  validateRole(role);
  const normalizedEmail = normalizeEmail(email);
  const normalizedMobile = normalizeMobile(mobile);

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [normalizedEmail]
  );
  if (existing.rows.length > 0) {
    const err = new Error('An account with this email already exists');
    err.status = 409;
    throw err;
  }

  if (normalizedMobile) {
    const mobileExists = await pool.query(
      'SELECT id FROM users WHERE mobile = $1',
      [normalizedMobile]
    );
    if (mobileExists.rows.length > 0) {
      const err = new Error('An account with this mobile number already exists');
      err.status = 409;
      throw err;
    }
  }

  await pool.query('DELETE FROM otp_verifications WHERE email = $1', [normalizedEmail]);

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const passwordHash = await bcrypt.hash(password, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_verifications (email, mobile, name, password_hash, role, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [normalizedEmail, normalizedMobile, name.trim(), passwordHash, role, otpHash, expiresAt]
  );

  await sendRegistrationOtp(normalizedEmail, otp);

  return {
    message: 'Verification code sent to your email',
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
}

async function verifyRegistrationOtp({ email, otp }) {
  if (!email || !otp) {
    const err = new Error('Email and OTP are required');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);

  const pending = await pool.query(
    `SELECT * FROM otp_verifications
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail]
  );

  if (pending.rows.length === 0) {
    const err = new Error('No pending registration found. Please request a new OTP');
    err.status = 404;
    throw err;
  }

  const record = pending.rows[0];

  if (new Date(record.expires_at) < new Date()) {
    await pool.query('DELETE FROM otp_verifications WHERE id = $1', [record.id]);
    const err = new Error('OTP has expired. Please request a new one');
    err.status = 410;
    throw err;
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await pool.query('DELETE FROM otp_verifications WHERE id = $1', [record.id]);
    const err = new Error('Too many failed attempts. Please request a new OTP');
    err.status = 429;
    throw err;
  }

  const valid = await bcrypt.compare(String(otp).trim(), record.otp_hash);
  if (!valid) {
    await pool.query(
      'UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1',
      [record.id]
    );
    const err = new Error('Invalid OTP');
    err.status = 401;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (email, mobile, password_hash, name, role, mobile_verified)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, mobile, name, role`,
      [record.email, record.mobile, record.password_hash, record.name, record.role]
    );

    await client.query('DELETE FROM otp_verifications WHERE id = $1', [record.id]);
    await client.query('COMMIT');

    return userResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      const dup = new Error('An account with this email or mobile already exists');
      dup.status = 409;
      throw dup;
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  requestRegistrationOtp,
  verifyRegistrationOtp,
  normalizeEmail,
  normalizeMobile,
};

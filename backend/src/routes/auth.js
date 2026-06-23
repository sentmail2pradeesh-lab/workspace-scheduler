const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { requestRegistrationOtp, verifyRegistrationOtp } = require('../services/otp');

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    mobile: user.mobile,
    name: user.name,
    role: user.role,
  };
}

router.post('/register/request-otp', async (req, res) => {
  try {
    const result = await requestRegistrationOtp(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to send OTP' });
  }
});

router.post('/register/verify', async (req, res) => {
  try {
    const user = await verifyRegistrationOtp(req.body);
    const token = issueToken(user);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Verification failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, mobile, name, role, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueToken(user);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { sendOtpEmail } = require('../services/email.service');

/* ── Helper: generate 6-digit OTP ─────────────────── */
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

/* ── Helper: resend cooldown check (60 seconds) ───── */
const RESEND_COOLDOWN_MS = 60 * 1000;

const checkResendCooldown = async (email, purpose) => {
  const [rows] = await pool.query(
    `SELECT created_at FROM otp_tokens
     WHERE email = ? AND purpose = ? AND used = 0
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );
  if (rows.length === 0) return false;
  const lastSent = new Date(rows[0].created_at);
  return (Date.now() - lastSent.getTime()) < RESEND_COOLDOWN_MS;
};

/* ─────────────────────────────────────────────────────
   POST /api/auth/send-otp
   Body: { email, name, password, role, purpose: 'registration' }
   Saves pending user data temporarily — sends OTP
───────────────────────────────────────────────────── */
const sendRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Invalid role' });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }

    // Check resend cooldown
    const onCooldown = await checkResendCooldown(normalizedEmail, 'registration');
    if (onCooldown) {
      return res.status(429).json({ status: 'error', message: 'Please wait 60 seconds before requesting another OTP' });
    }

    // Invalidate all previous OTPs for this email+purpose
    await pool.query(
      'UPDATE otp_tokens SET used = 1 WHERE email = ? AND purpose = ?',
      [normalizedEmail, 'registration']
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await pool.query(
      'INSERT INTO otp_tokens (email, otp, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [normalizedEmail, otp, 'registration', expiresAt]
    );

    // Send the email
    await sendOtpEmail({ to: normalizedEmail, otp, purpose: 'registration' });

    res.json({
      status: 'ok',
      message: `Verification code sent to ${normalizedEmail}`,
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to send verification email. Please try again.' });
  }
};

/* ─────────────────────────────────────────────────────
   POST /api/auth/verify-otp
   Body: { email, otp, name, password, role }
   Verifies OTP → creates the user account
───────────────────────────────────────────────────── */
const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp, name, password, role } = req.body || {};

    if (!email || !otp || !name || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find valid OTP
    const [otpRows] = await pool.query(
      `SELECT * FROM otp_tokens
       WHERE email = ? AND purpose = 'registration' AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No active OTP found. Please request a new code.' });
    }

    const record = otpRows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ status: 'error', message: 'OTP has expired. Please request a new code.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP. Please check and try again.' });
    }

    // Mark OTP as used
    await pool.query('UPDATE otp_tokens SET used = 1 WHERE id = ?', [record.id]);

    // Double-check email not taken (race condition)
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }

    // Create the user
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, role]
    );

    res.status(201).json({
      status: 'ok',
      message: 'Email verified and account created successfully!',
      user: { id: result.insertId, name: name.trim(), email: normalizedEmail, role },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ status: 'error', message: 'Verification failed. Please try again.' });
  }
};

/* ─────────────────────────────────────────────────────
   POST /api/auth/forgot-password
   Body: { email }
   Sends password reset OTP
───────────────────────────────────────────────────── */
const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email exists — use same message either way to avoid enumeration
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (rows.length === 0) {
      // Don't reveal whether email exists
      return res.json({ status: 'ok', message: 'If this email is registered, a reset code has been sent.' });
    }

    // Check cooldown
    const onCooldown = await checkResendCooldown(normalizedEmail, 'password_reset');
    if (onCooldown) {
      return res.status(429).json({ status: 'error', message: 'Please wait 60 seconds before requesting another OTP' });
    }

    // Invalidate previous reset OTPs
    await pool.query(
      'UPDATE otp_tokens SET used = 1 WHERE email = ? AND purpose = ?',
      [normalizedEmail, 'password_reset']
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_tokens (email, otp, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [normalizedEmail, otp, 'password_reset', expiresAt]
    );

    await sendOtpEmail({ to: normalizedEmail, otp, purpose: 'password_reset' });

    res.json({ status: 'ok', message: 'If this email is registered, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to send reset email. Please try again.' });
  }
};

/* ─────────────────────────────────────────────────────
   POST /api/auth/reset-password
   Body: { email, otp, newPassword }
   Verifies OTP → updates password
───────────────────────────────────────────────────── */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [otpRows] = await pool.query(
      `SELECT * FROM otp_tokens
       WHERE email = ? AND purpose = 'password_reset' AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No active OTP found. Please request a new code.' });
    }

    const record = otpRows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ status: 'error', message: 'OTP has expired. Please request a new code.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP. Please check and try again.' });
    }

    // Check user exists
    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (userRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Mark OTP used
    await pool.query('UPDATE otp_tokens SET used = 1 WHERE id = ?', [record.id]);

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, normalizedEmail]);

    res.json({ status: 'ok', message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ status: 'error', message: 'Password reset failed. Please try again.' });
  }
};

/* ─────────────────────────────────────────────────────
   POST /api/auth/resend-otp
   Body: { email, purpose }
───────────────────────────────────────────────────── */
const resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    if (!email || !purpose) {
      return res.status(400).json({ status: 'error', message: 'Email and purpose are required' });
    }
    if (!['registration', 'password_reset'].includes(purpose)) {
      return res.status(400).json({ status: 'error', message: 'Invalid purpose' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const onCooldown = await checkResendCooldown(normalizedEmail, purpose);
    if (onCooldown) {
      return res.status(429).json({ status: 'error', message: 'Please wait 60 seconds before requesting another OTP' });
    }

    // For password_reset — verify email exists
    if (purpose === 'password_reset') {
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
      if (rows.length === 0) {
        return res.json({ status: 'ok', message: 'If this email is registered, a new code has been sent.' });
      }
    }

    // Invalidate old OTPs
    await pool.query(
      'UPDATE otp_tokens SET used = 1 WHERE email = ? AND purpose = ?',
      [normalizedEmail, purpose]
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_tokens (email, otp, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [normalizedEmail, otp, purpose, expiresAt]
    );

    await sendOtpEmail({ to: normalizedEmail, otp, purpose });

    res.json({ status: 'ok', message: 'New verification code sent.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to resend OTP. Please try again.' });
  }
};

module.exports = {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendPasswordResetOtp,
  resetPassword,
  resendOtp,
};

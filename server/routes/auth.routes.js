const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendPasswordResetOtp,
  resetPassword,
  resendOtp,
} = require('../controllers/otp.controller');

// Existing
router.post('/register', register);
router.post('/login', login);

// OTP — Registration
router.post('/send-otp', sendRegistrationOtp);
router.post('/verify-otp', verifyRegistrationOtp);

// OTP — Forgot Password
router.post('/forgot-password', sendPasswordResetOtp);
router.post('/reset-password', resetPassword);

// Resend (shared for both purposes)
router.post('/resend-otp', resendOtp);

module.exports = router;

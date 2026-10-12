import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate JWT Access Token
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE }
  );
};

// Generate JWT Refresh Token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
};

// Generate Email Verification Token
export const generateEmailVerificationToken = (userId) => {
  return jwt.sign(
    { id: userId, purpose: 'email-verification' },
    process.env.JWT_EMAIL_SECRET,
    { expiresIn: process.env.JWT_EMAIL_EXPIRE }
  );
};

// Generate Password Reset Token
export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return { resetToken, hashedToken, expiry };
};

// Verify JWT Token
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};
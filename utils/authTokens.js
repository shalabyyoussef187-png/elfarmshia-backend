const jwt = require('jsonwebtoken');

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[auth] JWT_SECRET is not set; using insecure dev default');
  }
  return secret || 'dev-only-change-JWT_SECRET-in-production';
}

const defaultExpires = () => process.env.JWT_EXPIRES_IN || '7d';

/** JWT for customer accounts (`User` model). Payload: `{ userId }`. */
function signUserToken(userId) {
  return jwt.sign({ userId }, jwtSecret(), { expiresIn: defaultExpires() });
}

/** JWT for dashboard admins (`Admin` model). Payload: `{ adminId }`. */
function signAdminToken(adminId) {
  // Use a shorter expiration for the access token (e.g. 15 minutes)
  return jwt.sign({ adminId }, jwtSecret(), { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
}

/** Refresh JWT for dashboard admins. Payload: `{ adminId }`. */
function signAdminRefreshToken(adminId) {
  // Use a longer expiration for the refresh token (e.g. 7 days)
  return jwt.sign({ adminId }, jwtSecret(), { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
}

/** @deprecated Use signUserToken */
function signToken(userId) {
  return signUserToken(userId);
}

module.exports = { jwtSecret, signUserToken, signAdminToken, signAdminRefreshToken, signToken };

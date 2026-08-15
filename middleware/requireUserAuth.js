const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { jwtSecret } = require('../utils/authTokens');

/**
 * Validates Bearer JWT with `userId` claim and sets req.user (without password).
 */
module.exports = async function requireUserAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — missing Bearer token',
      });
    }

    const token = header.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — empty token',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret());
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    if (!decoded.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — user token required',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — user not found',
      });
    }

    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

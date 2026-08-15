const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { jwtSecret } = require('../utils/authTokens');

/**
 * Validates Bearer JWT with `userId` or `adminId` claim and sets req.user or req.admin.
 */
module.exports = async function requireAnyAuth(req, res, next) {
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

    if (decoded.adminId) {
      const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } });
      if (admin) {
        const { password, ...adminWithoutPassword } = admin;
        req.admin = adminWithoutPassword;
        return next();
      }
    }

    if (decoded.userId) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) {
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Unauthorized — invalid user or admin',
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

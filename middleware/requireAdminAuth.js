const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { jwtSecret } = require('../utils/authTokens');

/**
 * Validates Bearer JWT with `adminId` claim and sets req.admin (without password).
 */
module.exports = async function requireAdminAuth(req, res, next) {
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

    if (!decoded.adminId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — admin token required',
      });
    }

    const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — admin not found',
      });
    }

    const { password, ...adminWithoutPassword } = admin;
    req.admin = adminWithoutPassword;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { signAdminToken, signAdminRefreshToken, jwtSecret } = require('../utils/authTokens');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: String(email).toLowerCase().trim() }
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signAdminToken(admin.id);
    const refreshToken = signAdminRefreshToken(admin.id);

    res.status(200).json({
      success: true,
      data: {
        admin: { id: admin.id, email: admin.email, createdAt: admin.createdAt },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.me = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      admin: {
        id: req.admin.id,
        email: req.admin.email,
        createdAt: req.admin.createdAt,
      },
    },
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email: String(email).toLowerCase().trim() }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await prisma.admin.create({
      data: {
        email: String(email).toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    const token = signAdminToken(admin.id);
    const refreshToken = signAdminRefreshToken(admin.id);

    res.status(201).json({
      success: true,
      data: {
        admin: { id: admin.id, email: admin.email, createdAt: admin.createdAt },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'refreshToken is required',
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, jwtSecret());
    
    // Check if admin still exists
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin no longer exists',
      });
    }

    // Generate new tokens
    const newToken = signAdminToken(admin.id);
    const newRefreshToken = signAdminRefreshToken(admin.id);

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    // Return 401 if token is invalid or expired
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

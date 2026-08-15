const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { signUserToken } = require('../utils/authTokens');
const { trackAction, getOrCreateSessionId } = require('../utils/trackVisit');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'password must be at least 6 characters',
      });
    }

    const exists = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() }
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    const token = signUserToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
        token,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signUserToken(user.id);
    const sessionId = getOrCreateSessionId(req, res);

    trackAction({
      req,
      actionType: 'login',
      userId: user.id,
      resourceId: String(user.id),
      resourceType: 'user',
      sessionId,
    });

    res.status(200).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
        token,
        sessionId,
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
      user: {
        id: req.user.id,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    },
  });
};

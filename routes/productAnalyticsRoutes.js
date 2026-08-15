const express = require('express');
const router = express.Router();
const productAnalyticsController = require('../controllers/productAnalyticsController');
const requireAdminAuth = require('../middleware/requireAdminAuth');
// we might want to decode user info if present for tracking, but not require it.
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../utils/authTokens');

// Middleware to extract user info without failing if not logged in
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    try {
      const decoded = jwt.verify(token, jwtSecret());
      if (decoded.userId) {
        req.user = { id: decoded.userId };
      }
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: ProductAnalytics
 *   description: Tracking and statistics for products and pages
 */

/**
 * @swagger
 * /api/product-analytics/track:
 *   post:
 *     summary: Track a new analytics event
 *     tags: [ProductAnalytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionType
 *             properties:
 *               actionType:
 *                 type: string
 *                 enum: [page_view, product_view, add_to_cart, purchase]
 *               path:
 *                 type: string
 *               resourceId:
 *                 type: string
 *               resourceType:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               properties:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event tracked successfully
 */
router.post('/track', optionalAuth, productAnalyticsController.trackEvent);

/**
 * @swagger
 * /api/product-analytics/stats:
 *   get:
 *     summary: Get product analytics statistics
 *     tags: [ProductAnalytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated statistics
 */
router.get('/stats', requireAdminAuth, productAnalyticsController.getStatistics);

module.exports = router;

const express = require('express');
const router = express.Router();
const requireAdminAuth = require('../middleware/requireAdminAuth');
const {
  getSummary,
  getPageViews,
  getProductViews,
  getEvents,
  getTrend,
  trackPageView,
  getTopApis,
  getErrors,
  getRequestsPerDay,
  getBusinessMetrics,
} = require('../controllers/analyticsController');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: إحصائيات الزيارات والمنتجات
 */

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: ملخص الإحصائيات
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: تاريخ البداية (مثال 2025-01-01)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: تاريخ النهاية
 *     responses:
 *       200:
 *         description: إجمالي الأحداث، الزوار الفريدين، تفصيل بنوع الحدث
 */
router.get('/summary', requireAdminAuth, getSummary);

/**
 * @swagger
 * /api/analytics/page-views:
 *   get:
 *     summary: مشاهدات الصفحات مجمعة بالـ path
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: قائمة الصفحات مع عدد مشاهدات كل صفحة
 */
router.get('/page-views', requireAdminAuth, getPageViews);

/**
 * @swagger
 * /api/analytics/page-view:
 *   post:
 *     summary: تسجيل مشاهدة صفحة من الواجهة الأمامية فقط
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *                 example: /categories
 *                 description: مسار الصفحة في الواجهة (ليس API)
 *               sessionId:
 *                 type: string
 *                 example: abc123
 *                 description: اختياري، يتم إنشاؤه تلقائيًا إذا لم يُرسل
 *     responses:
 *       202:
 *         description: تم تسجيل المشاهدة بنجاح
 *       400:
 *         description: path غير صالح أو يبدأ بـ /api
 */
router.post('/page-view', trackPageView);

/**
 * @swagger
 * /api/analytics/product-views:
 *   get:
 *     summary: المنتجات الأكثر مشاهدة
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: عدد المنتجات (default 20)
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: قائمة بـ productId وعدد مشاهداته
 */
router.get('/product-views', requireAdminAuth, getProductViews);

/**
 * @swagger
 * /api/analytics/trend:
 *   get:
 *     summary: تريند الأحداث يومياً (مفيد للرسم البياني)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: event
 *         schema: { type: string }
 *         description: نوع الحدث (اختياري)
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: مصفوفة { date, count } مرتبة بالتاريخ
 */
router.get('/trend', requireAdminAuth, getTrend);

/**
 * @swagger
 * /api/analytics/top-apis:
 *   get:
 *     summary: أكثر مسارات API استدعاءً
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: عدد النتائج (default 20)
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: قائمة المسارات مع عدد الاستدعاءات
 */
router.get('/top-apis', requireAdminAuth, getTopApis);

/**
 * @swagger
 * /api/analytics/errors:
 *   get:
 *     summary: الأخطاء (status >= 400) مجمعة بالمسار
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: قائمة المسارات التي بها أخطاء مع عددها
 */
router.get('/errors', requireAdminAuth, getErrors);

/**
 * @swagger
 * /api/analytics/requests-per-day:
 *   get:
 *     summary: عدد الطلبات لكل يوم
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: مصفوفة يومية بصيغة { date, count }
 */
router.get('/requests-per-day', requireAdminAuth, getRequestsPerDay);

/**
 * @swagger
 * /api/analytics/business:
 *   get:
 *     summary: مؤشرات الأعمال (orders, conversion, returning users, DAU, converting pages)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: ملخص مؤشرات الأعمال محسوبة من analytics
 */
router.get('/business', requireAdminAuth, getBusinessMetrics);

/**
 * @swagger
 * /api/analytics/events:
 *   get:
 *     summary: قائمة الأحداث الخام مع pagination
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: event
 *         schema: { type: string }
 *         description: فلتر بنوع الحدث
 *       - in: query
 *         name: resourceType
 *         schema: { type: string }
 *         description: فلتر بنوع الـ resource
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: الأحداث مع pagination
 */
router.get('/events', requireAdminAuth, getEvents);

module.exports = router;
const express = require('express');
const router = express.Router();
const requireAdminAuth = require('../middleware/requireAdminAuth');
const { login, me, register, refresh } = require('../controllers/adminAuthController');

/**
 * @swagger
 * tags:
 *   name: AdminAuth
 *   description: تسجيل دخول لوحة التحكم (أدمن)
 */

/**
 * @swagger
 * /api/admin/auth/register:
 *   post:
 *     summary: إنشاء حساب أدمن جديد
 *     tags: [AdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: نجاح — يُرجع token للأدمن الجديد
 *       400:
 *         description: بيانات غير صحيحة أو الأدمن موجود
 */
router.post('/register', register);

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: تسجيل دخول الأدمن
 *     tags: [AdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: نجاح — يُرجع token للأدمن
 *       401:
 *         description: بيانات غير صحيحة
 */
router.post('/login', login);

/**
 * @swagger
 * /api/admin/auth/refresh:
 *   post:
 *     summary: تجديد توكن الأدمن
 *     tags: [AdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: نجاح — يُرجع token و refreshToken جديدين
 *       400:
 *         description: refreshToken مطلوب
 *       401:
 *         description: refreshToken غير صالح أو منتهي
 *       404:
 *         description: الأدمن غير موجود
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/admin/auth/me:
 *   get:
 *     summary: بيانات الأدمن الحالي (يتطلب توكن أدمن)
 *     tags: [AdminAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: نجاح
 *       401:
 *         description: غير مصرّح
 */
router.get('/me', requireAdminAuth, me);

module.exports = router;

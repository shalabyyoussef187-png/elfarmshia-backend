const express = require('express');
const router = express.Router();
const requireUserAuth = require('../middleware/requireUserAuth');
const { register, login, me } = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: تسجيل الدخول والحساب
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: إنشاء حساب
 *     tags: [Auth]
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
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب وإرجاع التوكن
 *       409:
 *         description: البريد مسجّل مسبقاً
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: تسجيل الدخول
 *     tags: [Auth]
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
 *         description: نجاح — يُرجع token
 *       401:
 *         description: بيانات غير صحيحة
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: بيانات المستخدم الحالي (يتطلب توكن)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: نجاح
 *       401:
 *         description: غير مصرّح
 */
router.get('/me', requireUserAuth, me);

module.exports = router;

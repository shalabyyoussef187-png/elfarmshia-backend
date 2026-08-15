const express = require('express');
const router = express.Router();
const requireAdminAuth = require('../middleware/requireAdminAuth');
const categoryController = require('../controllers/categoryController');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: إدارة الفئات
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: جلب كل الفئات
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: عدد العناصر في الصفحة
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث باسم الفئة
 *     responses:
 *       200:
 *         description: تم جلب الفئات بنجاح
 *       500:
 *         description: خطأ في السيرفر
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: إضافة فئة جديدة
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إضافة الفئة بنجاح
 *       400:
 *         description: بيانات غلط
 */
router.post('/', requireAdminAuth, categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: حذف فئة
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID الفئة
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 *       500:
 *         description: خطأ في السيرفر
 */
router.delete('/:id', requireAdminAuth, categoryController.deleteCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: تعديل فئة
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID الفئة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 *       404:
 *         description: الفئة غير موجودة
 *       500:
 *         description: خطأ في السيرفر
 */
router.put('/:id', requireAdminAuth, categoryController.updateCategory);

module.exports = router;
const express = require('express');
const router = express.Router();
const requireAdminAuth = require('../middleware/requireAdminAuth');
const brandController = require('../controllers/brandController');

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Manage brands
 */

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
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
 *         description: البحث باسم الماركة
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', brandController.getAllBrands);

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: إضافة ماركة جديدة
 *     tags: [Brands]
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
 *         description: تم إضافة الماركة بنجاح
 *       400:
 *         description: بيانات غلط
 */
router.post('/', requireAdminAuth, brandController.createBrand);

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     summary: حذف ماركة
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID الماركة
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 *       500:
 *         description: خطأ في السيرفر
 */
router.delete('/:id', requireAdminAuth, brandController.deleteBrand);

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     summary: تعديل ماركة
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID الماركة
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
 *         description: الماركة غير موجودة
 *       500:
 *         description: خطأ في السيرفر
 */
router.put('/:id', requireAdminAuth, brandController.updateBrand);

module.exports = router;
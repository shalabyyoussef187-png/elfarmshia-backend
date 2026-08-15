const express = require('express');
const router = express.Router();
const requireAdminAuth = require('../middleware/requireAdminAuth');
const {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
} = require('../controllers/messageController');

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: إدارة الرسائل
 */

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: جلب كل الرسائل (مع ترقيم صفحات)
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: بحث في عنوان الرسالة
 *     responses:
 *       200:
 *         description: نجاح
 *       500:
 *         description: خطأ في السيرفر
 */
router.get('/', requireAdminAuth, getAllMessages);

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: جلب رسالة بالـ ID
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: نجاح
 *       404:
 *         description: الرسالة غير موجودة
 */
router.get('/:id', requireAdminAuth, getMessageById);

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: إنشاء رسالة
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Important
 *               content:
 *                 type: string
 *                 example: New update available
 *     responses:
 *       201:
 *         description: تم الإنشاء
 *       400:
 *         description: بيانات غير صالحة
 */
router.post('/', requireAdminAuth, createMessage);

/**
 * @swagger
 * /api/messages/{id}:
 *   put:
 *     summary: تعديل رسالة
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم التعديل
 *       404:
 *         description: الرسالة غير موجودة
 */
router.put('/:id', requireAdminAuth, updateMessage);

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: حذف رسالة
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم الحذف
 *       404:
 *         description: الرسالة غير موجودة
 */
router.delete('/:id', requireAdminAuth, deleteMessage);

module.exports = router;

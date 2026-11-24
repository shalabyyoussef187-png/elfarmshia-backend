const express = require('express');
const router = express.Router();
const multer = require('multer');
const requireAdminAuth = require('../middleware/requireAdminAuth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getWarehouseProducts,
  publishProduct,
} = require('../controllers/productController');

// ✅ Multer — بيخزن الصور في الـ memory مباشرة
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('ملفات صور فقط!'), false);
  }
};
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// ✅ حقول الصور: image, image2, image3 (كل واحدة max 1 ملف)
const uploadFields = upload.fields([
  { name: 'image',  maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: إدارة المنتجات
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: جلب كل المنتجات
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: onOffer
 *         schema:
 *           type: string
 *       - in: query
 *         name: bestSeller
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم جلب المنتجات بنجاح
 *       500:
 *         description: خطأ في السيرفر
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/warehouse:
 *   get:
 *     summary: جلب المنتجات الموجودة في المخزن فقط (غير معروضة للبيع)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب منتجات المخزن بنجاح
 */
router.get('/warehouse', requireAdminAuth, getWarehouseProducts);

/**
 * @swagger
 * /api/products/{id}/publish:
 *   patch:
 *     summary: نشر منتج من المخزن ليكون متاحاً للبيع
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم نشر المنتج بنجاح
 */
router.patch('/:id/publish', requireAdminAuth, publishProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: جلب منتج بالـ ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم جلب المنتج بنجاح
 *       404:
 *         description: المنتج مش موجود
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: إضافة منتج جديد
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم المنتج
 *               price:
 *                 type: number
 *                 description: سعر المنتج
 *               description:
 *                 type: string
 *                 description: وصف المنتج (اختياري)
 *               features:
 *                 type: string
 *                 description: مميزات المنتج (اختياري)
 *               usageInstructions:
 *                 type: string
 *                 description: طريقة الاستخدام (اختياري)
 *               warnings:
 *                 type: string
 *                 description: التحذيرات (اختياري)
 *               productInfo:
 *                 type: string
 *                 description: معلومات المنتج (اختياري)
 *               category:
 *                 type: string
 *                 description: ID الفئة
 *               brand:
 *                 type: string
 *                 description: ID الماركة
 *               isOffer:
 *                 type: boolean
 *                 description: تفعيل عرض على المنتج
 *               offerDiscountPercent:
 *                 type: number
 *                 description: نسبة الخصم 0–100
 *               offerDiscountAmount:
 *                 type: number
 *                 description: مبلغ خصم ثابت
 *               isBestSeller:
 *                 type: boolean
 *                 description: يظهر في الأكثر مبيعاً
 *               isAvailable:
 *                 type: boolean
 *                 description: متوفر أو لا
 *               quantity:
 *                 type: integer
 *                 description: الكمية في المخزن
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: الصورة الرئيسية (اختياري — JPG/PNG — حد أقصى 5MB)
 *               image2:
 *                 type: string
 *                 format: binary
 *                 description: الصورة الثانية (اختياري)
 *               image3:
 *                 type: string
 *                 format: binary
 *                 description: الصورة الثالثة (اختياري)
 *     responses:
 *       201:
 *         description: تم إضافة المنتج بنجاح
 *       400:
 *         description: بيانات غلط
 */
router.post('/', requireAdminAuth, uploadFields, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: تعديل منتج
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *                 description: وصف المنتج (اختياري)
 *               features:
 *                 type: string
 *                 description: مميزات المنتج (اختياري)
 *               usageInstructions:
 *                 type: string
 *                 description: طريقة الاستخدام (اختياري)
 *               warnings:
 *                 type: string
 *                 description: التحذيرات (اختياري)
 *               productInfo:
 *                 type: string
 *                 description: معلومات المنتج (اختياري)
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               isOffer:
 *                 type: boolean
 *               offerDiscountPercent:
 *                 type: number
 *               offerDiscountAmount:
 *                 type: number
 *               isBestSeller:
 *                 type: boolean
 *               isAvailable:
 *                 type: boolean
 *               quantity:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: الصورة الرئيسية الجديدة (اختياري)
 *               image2:
 *                 type: string
 *                 format: binary
 *                 description: الصورة الثانية الجديدة (اختياري)
 *               image3:
 *                 type: string
 *                 format: binary
 *                 description: الصورة الثالثة الجديدة (اختياري)
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 *       404:
 *         description: المنتج مش موجود
 */
router.put('/:id', requireAdminAuth, uploadFields, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: حذف منتج (وكل صوره من ImageKit)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 *       404:
 *         description: المنتج مش موجود
 */
router.delete('/:id', requireAdminAuth, deleteProduct);

/**
 * @swagger
 * /api/products/{id}/image:
 *   delete:
 *     summary: حذف صورة معينة من المنتج (من غير حذف المنتج)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: slot
 *         schema:
 *           type: string
 *           enum: ['1', '2', '3']
 *           default: '1'
 *         description: رقم الصورة اللي هتتحذف (1 أو 2 أو 3)
 *     responses:
 *       200:
 *         description: تم حذف الصورة بنجاح
 *       404:
 *         description: المنتج مش موجود
 */
router.delete('/:id/image', requireAdminAuth, deleteProductImage);

module.exports = router;

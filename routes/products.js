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

// ✅ Multer — بيخزن الصورة في الـ memory مباشرة (مش على الديسك)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('ملفات صور فقط!'), false);
    }
  },
});

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
 *         name: offer
 *         description: فلتر منتجات عليها عرض (نفس onOffer)
 *         schema:
 *           type: string
 *           enum: ['true', '1']
 *       - in: query
 *         name: onOffer
 *         description: true = المنتجات التي isOffer=true
 *         schema:
 *           type: string
 *       - in: query
 *         name: bestSeller
 *         description: true = الأكثر مبيعاً فقط (isBestSeller=true). يمكن استخدام bestseller أو isBestSeller
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
 *     summary: نشر منتج من المخزن ليكون متاحاً للبيع (زر النشر)
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
 *     summary: إضافة منتج جديد (مع صورة اختياري)
 *     tags: [Products]
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
 *               description:
 *                 type: string
 *                 description: وصف المنتج (اختياري)
 *               price:
 *                 type: number
 *                 description: سعر المنتج
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
 *                 description: مبلغ خصم ثابت من السعر (استخدم إما النسبة أو المبلغ)
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
 *                 description: صورة المنتج (JPG/PNG — حد أقصى 5MB)
 *     responses:
 *       201:
 *         description: تم إضافة المنتج بنجاح
 *       400:
 *         description: بيانات غلط
 */
router.post('/', requireAdminAuth, upload.single('image'), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: تعديل منتج (مع صورة اختياري)
 *     tags: [Products]
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
 *                 description: اسم المنتج
 *               description:
 *                 type: string
 *                 description: وصف المنتج (اختياري)
 *               price:
 *                 type: number
 *                 description: سعر المنتج
 *               category:
 *                 type: string
 *                 description: ID الفئة
 *               brand:
 *                 type: string
 *                 description: ID الماركة
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
 *                 description: الكمية
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: صورة المنتج الجديدة (اختياري)
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 *       404:
 *         description: المنتج مش موجود
 */
router.put('/:id', requireAdminAuth, upload.single('image'), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: حذف منتج (وصورته من ImageKit)
 *     tags: [Products]
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
 *     summary: حذف صورة المنتج بس من غير حذف المنتج
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم حذف الصورة بنجاح
 *       404:
 *         description: المنتج مش موجود
 */
router.delete('/:id/image', requireAdminAuth, deleteProductImage);

module.exports = router;
const prisma = require('../utils/prisma');
const paginate = require('../utils/paginate');
const { recordSiteVisitFireAndForget } = require('../utils/trackVisit');
const ImageKit = require('imagekit');

// ✅ ImageKit instance
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ✅ Helper: رفع صورة على ImageKit
const uploadToImageKit = async (fileBuffer, fileName) => {
  const result = await imagekit.upload({
    file: fileBuffer,
    fileName: fileName,
    folder: process.env.IMAGEKIT_FOLDER || '/pharmacy',
  });
  return {
    url: result.url,
    fileId: result.fileId,
    thumbnailUrl: result.thumbnailUrl,
  };
};

// ✅ Helper: حذف صورة من ImageKit
const deleteFromImageKit = async (fileId) => {
  if (!fileId) return;
  try {
    await imagekit.deleteFile(fileId);
  } catch (err) {
    console.error('ImageKit delete error:', err.message);
  }
};

/** تحويل حقول الـ multipart (نصوص) لأنواع مناسبة */
const parseProductBody = (body) => {
  const out = { ...body };
  const boolKeys = ['isOffer', 'isBestSeller', 'isAvailable'];
  for (const key of boolKeys) {
    if (out[key] === undefined) continue;
    const v = out[key];
    out[key] = v === true || v === 'true' || v === '1';
  }
  const numKeys = ['price', 'offerDiscountPercent', 'offerDiscountAmount', 'quantity'];
  for (const key of numKeys) {
    if (out[key] === undefined || out[key] === '') continue;
    const n = Number(out[key]);
    if (!Number.isNaN(n)) out[key] = n;
  }
  return out;
};

// ─────────────────────────────────────────
// GET /api/products  (جلب كل المنتجات)
// ─────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const result = await paginate('product', req);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// GET /api/products/warehouse
// ─────────────────────────────────────────
exports.getWarehouseProducts = async (req, res) => {
  try {
    // Get products that are NOT available for sale yet
    req.query.isAvailable = 'false';
    const result = await paginate('product', req);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// PATCH /api/products/:id/publish
// ─────────────────────────────────────────
exports.publishProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isAvailable: true }
    });

    res.status(200).json({ success: true, message: 'Product published to store successfully', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// GET /api/products/:id
// ─────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) return res.status(404).json({ message: 'المنتج مش موجود' });

    recordSiteVisitFireAndForget(req, {
      event: 'product_view',
      path: req.path,
      resourceId: req.params.id,
      resourceType: 'product',
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// POST /api/products   (multipart/form-data)
// ─────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    let imageData = {};

    // لو في صورة اترفعت مع الـ request
    if (req.file) {
      imageData = await uploadToImageKit(req.file.buffer, req.file.originalname);
    }

    const parsedData = parseProductBody(req.body);
    const data = {
      ...parsedData,
      imageUrl: imageData.url || '',
      imageFileId: imageData.fileId || '',
      imageThumbnailUrl: imageData.thumbnailUrl || ''
    };

    const product = await prisma.product.create({
      data
    });

    res.status(201).json({ success: true, data: product });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// PUT /api/products/:id   (multipart/form-data)
// ─────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    let imageUrl = existing.imageUrl;
    let imageFileId = existing.imageFileId;
    let imageThumbnailUrl = existing.imageThumbnailUrl;

    // لو اترفعت صورة جديدة → احذف القديمة وارفع الجديدة
    if (req.file) {
      await deleteFromImageKit(existing.imageFileId);
      const imageData = await uploadToImageKit(req.file.buffer, req.file.originalname);
      imageUrl = imageData.url;
      imageFileId = imageData.fileId;
      imageThumbnailUrl = imageData.thumbnailUrl;
    }

    const parsedData = parseProductBody(req.body);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...parsedData,
        imageUrl,
        imageFileId,
        imageThumbnailUrl
      }
    });

    res.status(200).json({ success: true, data: product });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// DELETE /api/products/:id
// ─────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    await prisma.product.delete({ where: { id: req.params.id } });

    // ✅ احذف الصورة من ImageKit كمان
    await deleteFromImageKit(existing.imageFileId);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// DELETE /api/products/:id/image   حذف الصورة بس من غير حذف المنتج
// ─────────────────────────────────────────
exports.deleteProductImage = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    await deleteFromImageKit(existing.imageFileId);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        imageUrl: '',
        imageFileId: '',
        imageThumbnailUrl: ''
      }
    });

    res.status(200).json({ success: true, message: 'Image deleted successfully', data: product });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
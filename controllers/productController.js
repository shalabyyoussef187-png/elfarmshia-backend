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
    const files = req.files || {};

    // ── صورة 1 ──
    let imageData = {};
    if (files.image?.[0]) {
      imageData = await uploadToImageKit(files.image[0].buffer, files.image[0].originalname);
    }

    // ── صورة 2 ──
    let imageData2 = {};
    if (files.image2?.[0]) {
      imageData2 = await uploadToImageKit(files.image2[0].buffer, files.image2[0].originalname);
    }

    // ── صورة 3 ──
    let imageData3 = {};
    if (files.image3?.[0]) {
      imageData3 = await uploadToImageKit(files.image3[0].buffer, files.image3[0].originalname);
    }

    const parsedData = parseProductBody(req.body);
    const data = {
      ...parsedData,
      // صورة 1
      imageUrl:          imageData.url          || '',
      imageFileId:       imageData.fileId       || '',
      imageThumbnailUrl: imageData.thumbnailUrl || '',
      // صورة 2
      imageUrl2:          imageData2.url          || '',
      imageFileId2:       imageData2.fileId       || '',
      imageThumbnailUrl2: imageData2.thumbnailUrl || '',
      // صورة 3
      imageUrl3:          imageData3.url          || '',
      imageFileId3:       imageData3.fileId       || '',
      imageThumbnailUrl3: imageData3.thumbnailUrl || '',
    };

    const product = await prisma.product.create({ data });
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

    const files = req.files || {};

    // ── صورة 1 ──
    let imageUrl          = existing.imageUrl;
    let imageFileId       = existing.imageFileId;
    let imageThumbnailUrl = existing.imageThumbnailUrl;
    if (files.image?.[0]) {
      await deleteFromImageKit(existing.imageFileId);
      const img = await uploadToImageKit(files.image[0].buffer, files.image[0].originalname);
      imageUrl = img.url; imageFileId = img.fileId; imageThumbnailUrl = img.thumbnailUrl;
    }

    // ── صورة 2 ──
    let imageUrl2          = existing.imageUrl2;
    let imageFileId2       = existing.imageFileId2;
    let imageThumbnailUrl2 = existing.imageThumbnailUrl2;
    if (files.image2?.[0]) {
      await deleteFromImageKit(existing.imageFileId2);
      const img = await uploadToImageKit(files.image2[0].buffer, files.image2[0].originalname);
      imageUrl2 = img.url; imageFileId2 = img.fileId; imageThumbnailUrl2 = img.thumbnailUrl;
    }

    // ── صورة 3 ──
    let imageUrl3          = existing.imageUrl3;
    let imageFileId3       = existing.imageFileId3;
    let imageThumbnailUrl3 = existing.imageThumbnailUrl3;
    if (files.image3?.[0]) {
      await deleteFromImageKit(existing.imageFileId3);
      const img = await uploadToImageKit(files.image3[0].buffer, files.image3[0].originalname);
      imageUrl3 = img.url; imageFileId3 = img.fileId; imageThumbnailUrl3 = img.thumbnailUrl;
    }

    const parsedData = parseProductBody(req.body);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...parsedData,
        imageUrl, imageFileId, imageThumbnailUrl,
        imageUrl2, imageFileId2, imageThumbnailUrl2,
        imageUrl3, imageFileId3, imageThumbnailUrl3,
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

    // احذف كل الصور من ImageKit
    await deleteFromImageKit(existing.imageFileId);
    await deleteFromImageKit(existing.imageFileId2);
    await deleteFromImageKit(existing.imageFileId3);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// DELETE /api/products/:id/image   حذف صورة معينة (1 أو 2 أو 3)
// query: ?slot=1 أو ?slot=2 أو ?slot=3  (default: 1)
// ─────────────────────────────────────────
exports.deleteProductImage = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    const slot = req.query.slot || '1';

    let updateData = {};
    if (slot === '2') {
      await deleteFromImageKit(existing.imageFileId2);
      updateData = { imageUrl2: '', imageFileId2: '', imageThumbnailUrl2: '' };
    } else if (slot === '3') {
      await deleteFromImageKit(existing.imageFileId3);
      updateData = { imageUrl3: '', imageFileId3: '', imageThumbnailUrl3: '' };
    } else {
      await deleteFromImageKit(existing.imageFileId);
      updateData = { imageUrl: '', imageFileId: '', imageThumbnailUrl: '' };
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.status(200).json({ success: true, message: `Image ${slot} deleted successfully`, data: product });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

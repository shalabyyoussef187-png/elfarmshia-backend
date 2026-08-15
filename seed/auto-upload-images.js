

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const ImageKit = require('imagekit');
const Product = require('../models/Product');

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function getProductImageUrl(productUrl) {
  try {
    const res = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(res.data);

    // جرب og:image أولاً
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) return ogImage;

    // جرب أول صورة في الـ product gallery
    const wooImg = $('.woocommerce-product-gallery__image img').first().attr('src')
      || $('img.wp-post-image').first().attr('src')
      || $('figure.woocommerce-product-gallery__wrapper img').first().attr('data-src')
      || $('figure.woocommerce-product-gallery__wrapper img').first().attr('src');

    return wooImg || null;
  } catch (err) {
    console.error(`  ❌ فشل جلب الصفحة: ${err.message}`);
    return null;
  }
}

// ✅ حمّل الصورة وارفعها على ImageKit
async function uploadImageToImageKit(imageUrl, productName) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    });

    const buffer = Buffer.from(response.data);
    const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
    const fileName = productName.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50) + '.' + ext;

    const result = await imagekit.upload({
      file: buffer,
      fileName: fileName,
      folder: process.env.IMAGEKIT_FOLDER || '/pharmacy',
    });

    return {
      url: result.url,
      fileId: result.fileId,
      thumbnailUrl: result.thumbnailUrl,
    };
  } catch (err) {
    console.error(`  ❌ فشل الرفع على ImageKit: ${err.message}`);
    return null;
  }
}

// ✅ Main
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected!\n');

  // جيب المنتجات اللي عندها productUrl بس مفيهاش صورة
  const products = await Product.find({
    productUrl: { $exists: true, $ne: '' },
    $or: [
      { 'image.url': { $exists: false } },
      { 'image.url': '' },
      { 'image.url': null },
    ],
  });

  console.log(`📦 ${products.length} منتج محتاج صورة\n`);

  let success = 0;
  let failed = 0;

  for (const product of products) {
    console.log(`⏳ ${product.name}`);

    // جيب URL الصورة من الموقع
    const imageUrl = await getProductImageUrl(product.productUrl);

    if (!imageUrl) {
      console.log(`  ⚠️  مش لاقي صورة - هتعدي\n`);
      failed++;
      continue;
    }

    console.log(`  📸 صورة: ${imageUrl}`);

    // ارفع على ImageKit
    const imageData = await uploadImageToImageKit(imageUrl, product.name);

    if (!imageData) {
      failed++;
      continue;
    }

    // حدّث المنتج في MongoDB
    product.image = imageData;
    await product.save();

    console.log(`  ✅ اترفعت: ${imageData.url}\n`);
    success++;

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n🎉 خلص!`);
  console.log(`  ✅ نجح: ${success}`);
  console.log(`  ❌ فشل: ${failed}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
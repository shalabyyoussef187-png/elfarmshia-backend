const prisma = require('../utils/prisma');
const paginate = require('../utils/paginate');

// ✅ Get All Brands
exports.getAllBrands = async (req, res) => {
  try {
    const result = await paginate('brand', req);
    console.log('Brands result:', result); // ✅ للتأكد
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Brand By ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });

    if (!brand)
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });

    res.status(200).json({
      success: true,
      data: brand
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create Brand
exports.createBrand = async (req, res) => {
  try {
    const brand = await prisma.brand.create({ data: req.body });

    res.status(201).json({
      success: true,
      data: brand
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Update Brand
exports.updateBrand = async (req, res) => {
  try {
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.status(200).json({
      success: true,
      data: brand
    });

  } catch (error) {
    if (error.code === 'P2025') { // Prisma RecordNotFound
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Brand
exports.deleteBrand = async (req, res) => {
  try {
    await prisma.brand.delete({ where: { id: req.params.id } });

    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully'
    });

  } catch (error) {
    if (error.code === 'P2025') { // Prisma RecordNotFound
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
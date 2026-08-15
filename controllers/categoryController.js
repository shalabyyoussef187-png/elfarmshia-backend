const prisma = require('../utils/prisma');
const paginate = require('../utils/paginate');

// ✅ Get All Categorie
exports.getAllCategories = async (req, res) => {
  try {
    const result = await paginate('category', req);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Category By ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });

    if (!category)
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create Category
exports.createCategory = async (req, res) => {
  try {
    const category = await prisma.category.create({ data: req.body });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Update Category
exports.updateCategory = async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
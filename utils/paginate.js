// utils/paginate.js
const prisma = require('./prisma');

const paginate = async (modelName, req, options = {}) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const brand = req.query.brand || "";
    const onOffer = req.query.onOffer ?? req.query.offer ?? "";
    const bestSeller = req.query.bestSeller ?? req.query.isBestSeller ?? req.query.bestseller ?? "";
    const isAvailable = req.query.isAvailable ?? "";

    const skip = (page - 1) * limit;

    let where = {};
    
    // ✅ البحث - لو فيه search
    if (search && search.trim() !== "") {
      const searchField = options.searchField || "name";
      where[searchField] = { contains: search, mode: 'insensitive' };
    }
    
    // للـ Products بس
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (onOffer === "true" || onOffer === "1") where.isOffer = true;
    if (bestSeller === "true" || bestSeller === "1") where.isBestSeller = true;
    // فلتر التوفر
    if (isAvailable === "true") {
      where.isAvailable = true;
      where.quantity = { gt: 0 }; // لازم الكمية تكون أكبر من صفر
    }
    if (isAvailable === "false") where.isAvailable = false;

    console.log('Filter:', where); // ✅ للتأكد
    console.log('Page:', page, 'Limit:', limit); // ✅ للتأكد

    const findArgs = {
      where,
      orderBy: options.sort || { createdAt: 'desc' },
      skip,
      take: limit,
    };

    if (options.include) {
      findArgs.include = options.include;
    }

    const data = await prisma[modelName].findMany(findArgs);
    const total = await prisma[modelName].count({ where });
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        pages,
        limit,
        next: page < pages ? page + 1 : null,
        prev: page > 1 ? page - 1 : null
      }
    };

  } catch (error) {
    throw error;
  }
};

module.exports = paginate;
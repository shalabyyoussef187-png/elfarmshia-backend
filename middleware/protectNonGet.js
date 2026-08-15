module.exports = function protectNonGet(req, res, next) {
  const method = req.method.toUpperCase();
  const path = req.originalUrl.split('?')[0];

  // ✅ السماح بالـ OPTIONS / HEAD
  if (method === 'OPTIONS' || method === 'HEAD') {
    return next();
  }

  // ✅ السماح بكل GET
  if (method === 'GET') {
    return next();
  }

  // ✅ السماح بمسارات تسجيل المستخدمين
  if (path.startsWith('/api/auth')) {
    return next();
  }

  // ✅ السماح بتسجيل دخول الأدمن فقط (بدون توكن)
  if (path.startsWith('/api/admin/auth')) {
    return next();
  }

  // ✅ السماح بإنشاء أوردر بدون تسجيل
  if (method === 'POST' && path === '/api/orders') {
    return next();
  }

  // ✅ باقي الطلبات غير GET تمر للـ routes — التحقق من التوكن يتم عبر requireAdminAuth / requireUserAuth حسب المسار
  return next();
};

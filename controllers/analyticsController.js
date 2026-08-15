const prisma = require('../utils/prisma');
const { recordEvent, getOrCreateSessionId } = require('../utils/trackVisit');

// Helper: build a date filter from query params
function buildDateFilter(query) {
  const filter = {};
  if (query.from || query.to) {
    if (query.from) filter.gte = new Date(query.from);
    if (query.to)   filter.lte = new Date(query.to);
  }
  return filter;
}

/**
 * GET /api/analytics/summary
 */
exports.getSummary = async (req, res) => {
  try {
    const createdAt = buildDateFilter(req.query);
    const where = Object.keys(createdAt).length > 0 ? { createdAt } : {};

    const [total, uniqueVisitorsArray] = await Promise.all([
      prisma.analytics.count({ where }),
      prisma.analytics.findMany({
        where: { ...where, ip: { not: null } },
        select: { ip: true },
        distinct: ['ip']
      })
    ]);

    const byEvent = await prisma.analytics.groupBy({
      by: ['event'],
      where,
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } }
    });

    res.json({
      total,
      uniqueVisitors: uniqueVisitorsArray.length,
      byEvent: byEvent.map(b => ({ _id: b.event, count: b._count.event }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/page-views
 */
exports.getPageViews = async (req, res) => {
  try {
    const createdAt = buildDateFilter(req.query);
    const where = { event: 'page_view', path: { not: { startsWith: '/api' } } };
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

    const results = await prisma.analytics.groupBy({
      by: ['path'],
      where,
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } }
    });

    res.json(results.map(r => ({ _id: r.path, count: r._count.path })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/analytics/page-view
 */
exports.trackPageView = async (req, res) => {
  try {
    const { path, sessionId } = req.body || {};

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path is required' });
    }

    if (path.startsWith('/api')) {
      return res.status(400).json({ error: 'API paths are not allowed for page_view' });
    }

    const resolvedSessionId = sessionId || getOrCreateSessionId(req, res);

    setImmediate(() => {
      recordEvent(req, {
        event: 'page_view',
        path,
        sessionId: resolvedSessionId,
      }).catch(() => {});
    });

    res.status(202).json({ success: true, sessionId: resolvedSessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/product-views
 */
exports.getProductViews = async (req, res) => {
  try {
    const createdAt = buildDateFilter(req.query);
    const limit = parseInt(req.query.limit) || 20;
    const where = { event: 'product_view', resourceType: 'product' };
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

    const results = await prisma.analytics.groupBy({
      by: ['resourceId'],
      where,
      _count: { resourceId: true },
      orderBy: { _count: { resourceId: 'desc' } },
      take: limit
    });

    res.json(results.map(r => ({ _id: r.resourceId, count: r._count.resourceId })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/events
 */
exports.getEvents = async (req, res) => {
  try {
    const createdAt = buildDateFilter(req.query);
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const where = {};
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
    if (req.query.event) where.event = req.query.event;
    if (req.query.resourceType) where.resourceType = req.query.resourceType;

    const [events, total] = await Promise.all([
      prisma.analytics.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.analytics.count({ where })
    ]);

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: events,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/trend
 */
exports.getTrend = async (req, res) => {
  // Simplified for Prisma
  res.status(501).json({ error: "Not implemented in Prisma version yet" });
};

/**
 * GET /api/analytics/top-apis
 */
exports.getTopApis = async (req, res) => {
  try {
    const createdAt = buildDateFilter(req.query);
    const limit = parseInt(req.query.limit, 10) || 20;
    const where = { event: 'api_call' };
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

    const results = await prisma.analytics.groupBy({
      by: ['path'],
      where,
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit
    });

    res.json(results.map(r => ({ _id: r.path, count: r._count.path })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/errors
 */
exports.getErrors = async (req, res) => {
  try {
    const createdAt = buildDateFilter(req.query);
    const where = { status: { gte: 400 } };
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

    const results = await prisma.analytics.groupBy({
      by: ['path'],
      where,
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } }
    });

    res.json(results.map(r => ({ _id: r.path, count: r._count.path })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/analytics/requests-per-day
 */
exports.getRequestsPerDay = async (req, res) => {
  res.status(501).json({ error: "Not implemented in Prisma version yet" });
};

/**
 * GET /api/analytics/business
 */
exports.getBusinessMetrics = async (req, res) => {
  res.status(501).json({ error: "Not implemented in Prisma version yet" });
};
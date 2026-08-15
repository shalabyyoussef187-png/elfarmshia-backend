const prisma = require('../utils/prisma');

const TRACKED_EVENTS = ['page_view', 'product_view', 'add_to_cart', 'purchase'];

/**
 * Track an analytics event
 */
exports.trackEvent = async (req, res) => {
  try {
    const { actionType, path, resourceId, resourceType, sessionId, properties } = req.body;

    if (!actionType || !TRACKED_EVENTS.includes(actionType)) {
      return res.status(400).json({ success: false, message: 'Invalid actionType' });
    }

    // Attempt to identify user if logged in
    let customerId = null;
    if (req.user && req.user.id) {
      customerId = req.user.id;
    } else if (properties && properties.customerId) {
      customerId = properties.customerId;
    }

    // Merge customerId into properties if available
    const finalProperties = {
      ...properties,
      ...(customerId && { customerId })
    };

    const newAnalytics = await prisma.analytics.create({
      data: {
        event: 'product_analytics',
        actionType,
        path,
        resourceId,
        resourceType,
        sessionId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        properties: finalProperties,
        // method and status might not apply directly for frontend tracking, but we leave them null
      }
    });

    res.status(201).json({ success: true, data: newAnalytics });
  } catch (err) {
    console.error('Error tracking product analytics:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get aggregated statistics for admin dashboard
 */
exports.getStatistics = async (req, res) => {
  try {
    // We only fetch records with event = 'product_analytics'
    const productAnalytics = await prisma.analytics.findMany({
      where: { event: 'product_analytics' },
      select: {
        actionType: true,
        path: true,
        resourceId: true,
        createdAt: true,
      }
    });

    let totalPageViews = 0;
    let totalProductViews = 0;
    let totalAddToCart = 0;
    let totalPurchases = 0;

    const productsViewedCounts = {}; // resourceId -> count
    const productsCartCounts = {};   // resourceId -> count
    const pagesVisitedCounts = {};   // path -> count
    const eventsPerDay = {};         // YYYY-MM-DD -> { page_view, product_view, add_to_cart, purchase }

    productAnalytics.forEach(record => {
      // 1. Total counts
      if (record.actionType === 'page_view') totalPageViews++;
      else if (record.actionType === 'product_view') totalProductViews++;
      else if (record.actionType === 'add_to_cart') totalAddToCart++;
      else if (record.actionType === 'purchase') totalPurchases++;

      // 2. Aggregations
      if (record.actionType === 'product_view' && record.resourceId) {
        productsViewedCounts[record.resourceId] = (productsViewedCounts[record.resourceId] || 0) + 1;
      }
      if (record.actionType === 'add_to_cart' && record.resourceId) {
        productsCartCounts[record.resourceId] = (productsCartCounts[record.resourceId] || 0) + 1;
      }
      if (record.actionType === 'page_view' && record.path) {
        pagesVisitedCounts[record.path] = (pagesVisitedCounts[record.path] || 0) + 1;
      }

      // 3. Events per day
      const dateStr = record.createdAt.toISOString().split('T')[0];
      if (!eventsPerDay[dateStr]) {
        eventsPerDay[dateStr] = { page_view: 0, product_view: 0, add_to_cart: 0, purchase: 0 };
      }
      if (eventsPerDay[dateStr][record.actionType] !== undefined) {
        eventsPerDay[dateStr][record.actionType]++;
      }
    });

    // Helper to get top items
    const getTopItems = (countsDict, limit = 10) => {
      return Object.entries(countsDict)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([key, count]) => ({ key, count }));
    };

    res.json({
      success: true,
      data: {
        totals: {
          pageViews: totalPageViews,
          productViews: totalProductViews,
          addToCart: totalAddToCart,
          purchases: totalPurchases
        },
        mostViewedProducts: getTopItems(productsViewedCounts),
        mostAddedToCartProducts: getTopItems(productsCartCounts),
        mostVisitedPages: getTopItems(pagesVisitedCounts),
        eventsPerDay
      }
    });

  } catch (err) {
    console.error('Error fetching product analytics stats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

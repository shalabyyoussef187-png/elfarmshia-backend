const { recordEvent, getOrCreateSessionId } = require('../utils/trackVisit');

/**
 * Track API calls globally without blocking requests.
 * Data is written only after the response has been sent.
 */
module.exports = function apiAnalyticsTracker(req, res, next) {
  const startedAt = Date.now();
  const path = req.originalUrl || req.path;
  const sessionId = getOrCreateSessionId(req, res);

  res.on('finish', () => {
    // Only API routes are stored as api_call.
    if (!path.startsWith('/api')) return;

    const responseTime = Date.now() - startedAt;
    const status = res.statusCode;

    setImmediate(() => {
      recordEvent(req, {
        event: 'api_call',
        path,
        method: req.method,
        status,
        responseTime,
        userId: req.user?._id || null,
        sessionId,
      }).catch(() => {});
    });
  });

  next();
};

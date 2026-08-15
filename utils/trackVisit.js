const prisma = require('./prisma');
const crypto = require('crypto');

/**
 * Record an analytics event.
 * @param {import('express').Request} req - Express request (for IP, UA, referer)
 * @param {Object} options
 * @param {string} options.event     - Event name, e.g. 'page_view', 'product_view'
 * @param {string} options.path      - The URL path, e.g. '/api/products'
 * @param {string} [options.resourceId]   - The ID of the resource being viewed
 * @param {string} [options.resourceType] - Type of resource: 'product', 'category', 'brand'
 * @param {Object} [options.properties]   - Any extra key/value data
 */
function normalizeEventByPath(path, fallbackEvent = 'page_view') {
  if (typeof path === 'string' && path.startsWith('/api')) {
    return 'api_call';
  }
  return fallbackEvent;
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

function getOrCreateSessionId(req, res) {
  const provided =
    req.headers['x-session-id'] ||
    req.body?.sessionId ||
    req.query?.sessionId ||
    null;

  const sessionId = (typeof provided === 'string' && provided.trim())
    ? provided.trim()
    : crypto.randomUUID();

  if (res && !res.headersSent) {
    res.setHeader('x-session-id', sessionId);
  }

  return sessionId;
}

async function recordEvent(
  req,
  {
    event,
    path,
    resourceId,
    resourceType,
    method,
    status,
    responseTime,
    userId,
    sessionId,
    actionType,
    properties,
  } = {}
) {
  try {
    const normalizedPath = path || req.originalUrl || req.path || null;
    const normalizedEvent = (event === 'page_view' && normalizedPath?.startsWith('/api'))
      ? 'api_call'
      : (event || normalizeEventByPath(normalizedPath));
    const resolvedSessionId = sessionId || getOrCreateSessionId(req);

    await prisma.analytics.create({
      data: {
        event: normalizedEvent,
        path: normalizedPath,
        resourceId: resourceId || null,
        resourceType: resourceType || null,
        method: method || req.method || null,
        status: Number.isInteger(status) ? status : null,
        responseTime: typeof responseTime === 'number' ? responseTime : null,
        userId: userId || req.user?.id || req.admin?.id || null,
        sessionId: resolvedSessionId,
        actionType: actionType || null,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || null,
        referer: req.headers['referer'] || req.headers['referrer'] || null,
        properties: properties || {},
      }
    });
  } catch (err) {
    // Non-critical — never crash the main request
    console.error('[Analytics] Failed to record event:', err.message);
  }
}

/**
 * Fire-and-forget wrapper (doesn't await).
 * Safe to call inside route handlers without affecting response time.
 */
function recordSiteVisitFireAndForget(req, options) {
  setImmediate(() => {
    recordEvent(req, options).catch(() => {});
  });
}

function trackAction({
  req,
  actionType,
  userId,
  resourceId = null,
  resourceType = null,
  path = null,
  sessionId = null,
  properties = {},
} = {}) {
  setImmediate(() => {
    recordEvent(req || { headers: {}, socket: {}, method: null, path: null }, {
      event: 'action',
      path: path || req?.originalUrl || req?.path || '/action',
      actionType,
      userId: userId || req?.user?.id || req?.admin?.id || null,
      resourceId,
      resourceType,
      sessionId: sessionId || (req ? getOrCreateSessionId(req) : null),
      properties,
    }).catch(() => {});
  });
}

module.exports = {
  recordEvent,
  recordSiteVisitFireAndForget,
  normalizeEventByPath,
  getClientIp,
  getOrCreateSessionId,
  trackAction,
};
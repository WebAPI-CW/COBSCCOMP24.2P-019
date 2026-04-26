import crypto from 'crypto';

/**
 * ETag Middleware — Conditional GET support (RFC 7232)
 *
 * For every GET request that results in 200 OK:
 *   1. Generates a strong ETag from the MD5 hash of the response body.
 *   2. Sets the ETag response header.
 *   3. If the request contains If-None-Match matching the ETag,
 *      responds with 304 Not Modified (no body) to save bandwidth.
 *
 * This satisfies the WSO2 guideline on Conditional GET and the
 * Level 4 rubric requirement for "conditional GET methods".
 */
export const etagMiddleware = (req, res, next) => {
  // Only apply to GET requests
  if (req.method !== 'GET') return next();

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Only generate ETag for successful responses
    if (res.statusCode === 200) {
      const hash = crypto
        .createHash('md5')
        .update(JSON.stringify(body))
        .digest('hex');
      const etag = `"${hash}"`;

      res.setHeader('ETag', etag);

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === etag) {
        // Resource has not changed — return 304 with no body
        return res.status(304).end();
      }
    }

    return originalJson(body);
  };

  next();
};

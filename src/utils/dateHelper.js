/**
 * Parse a datetime string, treating naive strings (no timezone info)
 * as Sri Lanka Standard Time (UTC+05:30).
 *
 * Examples:
 *   "2026-04-28T16:00:00"           → treated as 2026-04-28T16:00:00+05:30 → UTC 10:30
 *   "2026-04-28T16:00:00+05:30"     → used as-is
 *   "2026-04-28T10:30:00Z"          → used as-is
 */
export const parseSLT = (dateStr) => {
  if (!dateStr) return undefined;
  // Already has timezone info: ends with Z, or contains + / - after the time part
  const hasOffset = /Z$|[+-]\d{2}:\d{2}$/.test(dateStr);
  return hasOffset ? new Date(dateStr) : new Date(`${dateStr}+05:30`);
};

/**
 * Convert a UTC Date to an ISO 8601 string with the +05:30 offset.
 * e.g. 2026-04-28T04:30:00.000Z  →  2026-04-28T10:00:00.000+05:30
 */
export const toSLTString = (date) => {
  const d = new Date(date);
  const slt = new Date(d.getTime() + 19800000); // +5h30m in ms
  return slt.toISOString().replace('Z', '');
};

/**
 * Express JSON replacer — use with app.set('json replacer', sltReplacer).
 * Converts any UTC ISO string (ending in Z) in any response body to SLT.
 */
export const sltReplacer = (key, value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) && value.endsWith('Z')) {
    return toSLTString(value);
  }
  return value;
};

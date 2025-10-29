// backend/middleware/sanitize.js
const xss = require("xss");

/**
 * Recursively sanitises plain objects and arrays.
 * - Trims long strings
 * - Removes prototype-pollution keys
 * - Escapes potential XSS payloads
 */
function deepSanitize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  } else if (obj && typeof obj === "object") {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      clean[key] = deepSanitize(value);
    }
    return clean;
  } else if (typeof obj === "string") {
    // limit very long strings (DoS prevention)
    const trimmed = obj.trim().slice(0, 10000);
    return xss(trimmed);
  }
  return obj;
}

module.exports = function sanitizeMiddleware(req, res, next) {
  try {
    if (req.body)   req.body   = deepSanitize(req.body);
    if (req.query)  req.query  = deepSanitize(req.query);
    if (req.params) req.params = deepSanitize(req.params);
  } catch (err) {
    console.error("❌ Sanitisation error:", err);
  }
  next();
};

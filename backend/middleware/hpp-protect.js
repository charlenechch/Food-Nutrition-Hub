// backend/middleware/hpp-protect.js
// Lightweight HPP protection for Express: policy = 'reject'|'first'|'last'
const util = require('util');

function canonicalizeValue(values, policy) {
  if (!Array.isArray(values)) return values;
  if (policy === 'first') return values[0];
  if (policy === 'last') return values[values.length - 1];
  return values; // for 'reject' we return array and let caller handle
}

function detectDuplicates(obj) {
  const duplicates = [];
  for (const [k, v] of Object.entries(obj || {})) {
    if (Array.isArray(v)) duplicates.push(k);
  }
  return duplicates;
}

/**
 * options:
 *  - policy: 'reject' (default) | 'first' | 'last'
 *  - allowlist: array of allowed param names (optional)
 *  - logger: function(tag, meta) optional
 */
module.exports = function hppProtect(options = {}) {
  const { policy = 'reject', allowlist = null, logger = null } = options;

  return function (req, res, next) {
    try {
      // sources to check: query, body, params
      const sources = [
        { name: 'query', obj: req.query || {} },
        { name: 'body', obj: req.body || {} },
        { name: 'params', obj: req.params || {} },
      ];

      // 1) allowlist check (reject unexpected params)
      if (Array.isArray(allowlist)) {
        const unexpected = [];
        for (const s of sources) {
          for (const k of Object.keys(s.obj)) {
            if (!allowlist.includes(k)) unexpected.push({ source: s.name, key: k });
          }
        }
        if (unexpected.length) {
          const msg = `Unexpected parameter(s): ${unexpected.map(u => `${u.source}:${u.key}`).join(', ')}`;
          if (logger) logger('hpp_unexpected_params', { message: msg, unexpected, ip: req.ip, path: req.path });
          return res.status(400).json({ error: msg });
        }
      }

      // 2) find duplicates
      const duplicatesFound = [];
      for (const s of sources) {
        const dups = detectDuplicates(s.obj);
        if (dups.length) duplicatesFound.push({ source: s.name, keys: dups });
      }

      if (duplicatesFound.length) {
        // if reject policy -> block
        if (policy === 'reject') {
          const msg = `Duplicate parameter(s) detected: ${duplicatesFound.map(d => `${d.source}[${d.keys.join(',')}]`).join('; ')}`;
          if (logger) logger('hpp_duplicates_detected', { message: msg, duplicatesFound, ip: req.ip, path: req.path });
          return res.status(400).json({ error: msg });
        }

        // else canonicalize arrays to single values (first/last)
        for (const s of sources) {
          for (const [k, v] of Object.entries(s.obj)) {
            if (Array.isArray(v)) {
              s.obj[k] = canonicalizeValue(v, policy);
            }
          }
        }
      }

      // ensure req.params are normalized too (rare case they are arrays)
      for (const [k, v] of Object.entries(req.params || {})) {
        if (Array.isArray(v)) req.params[k] = canonicalizeValue(v, policy);
      }

      return next();
    } catch (err) {
      if (logger) logger('hpp_protect_error', { error: err.message, stack: err.stack });
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
  };
};

// middleware/validateSanitize.js
const sanitizeHtml = require("sanitize-html");
const validator = require("validator");

module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: error.details.map((d) => d.message).join(", ") });
  }

  const cleanData = Object.fromEntries(
    Object.entries(value).map(([key, val]) => {
      if (typeof val === "string") {
        val = sanitizeHtml(val, { allowedTags: [], allowedAttributes: {} });
        val = validator.trim(val);
      }
      return [key, val];
    })
  );

  req.body = cleanData;
  next();
};

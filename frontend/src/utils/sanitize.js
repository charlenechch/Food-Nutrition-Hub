import DOMPurify from "dompurify";

export const cleanHTML = (dirty) => {
  if (!dirty || typeof dirty !== "string") return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "u", "em", "strong", "a", "ul", "li", "br"],
    ALLOWED_ATTR: ["href", "target"],
  });
};

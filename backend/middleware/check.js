// checkAccess.js
import { rolePermissions } from "./rolePermissions.js";

export function hasAccess(role, page) {
  const allowedPages = rolePermissions[role] || [];
  return allowedPages.includes(page);
}

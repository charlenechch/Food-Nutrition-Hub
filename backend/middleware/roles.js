// roles.js
const ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  GUEST: "guest"
};

// rolePermissions.js
const ROLES = require('./roles');

const rolePermissions = {
  [ROLES.GUEST]: ['explore', 'recipe'], // ✅ guests can only view these
  [ROLES.MEMBER]: ['explore', 'recipe', 'analyser', 'community'], // ✅ full member access
  [ROLES.ADMIN]: ['explore', 'recipe', 'analyser', 'community', 'admin-dashboard']
};

module.exports = rolePermissions;


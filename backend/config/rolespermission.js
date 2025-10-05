const ROLES = require('./roles');

const rolePermissions = {
  [ROLES.GUEST]: ['explore', 'recipe'],
  [ROLES.MEMBER]: ['explore', 'recipe', 'analyser', 'community'],
  [ROLES.ADMIN]: ['explore', 'recipe', 'analyser', 'community', 'admin-dashboard']
};

module.exports = rolePermissions;

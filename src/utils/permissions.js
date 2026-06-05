const { applicationStaffRoleIds, privilegedUserIds } = require('../config');

function isStaff(member) {
  return applicationStaffRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

function isPrivilegedUser(userOrInteraction) {
  const userId = typeof userOrInteraction === 'string'
    ? userOrInteraction
    : userOrInteraction.user.id;
  return privilegedUserIds.includes(userId);
}

module.exports = { isStaff, isPrivilegedUser };

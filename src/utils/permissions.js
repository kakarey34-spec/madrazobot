const { applicationStaffRoleIds, privilegedUserIds } = require('../config');

function isStaff(member) {
  return applicationStaffRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

function isPrivilegedUser(interaction) {
  return privilegedUserIds.includes(interaction.user.id);
}

module.exports = { isStaff, isPrivilegedUser };

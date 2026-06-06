const { privilegedUserIds, applicationStaffRoleIds } = require('../../config');
const { getStore } = require('./store');

function isWhitelisted(member) {
  if (!member) return false;

  const userId = member.id ?? member.user?.id;
  if (!userId) return false;

  if (privilegedUserIds.includes(userId)) return true;
  if (applicationStaffRoleIds.some((roleId) => member.roles?.cache?.has(roleId))) return true;

  const { whitelistUserIds } = getStore();
  return whitelistUserIds.includes(userId);
}

module.exports = { isWhitelisted };

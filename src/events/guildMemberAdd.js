const { handleAntiRaid } = require('../features/security/antiraid');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    await handleAntiRaid(member);
  },
};

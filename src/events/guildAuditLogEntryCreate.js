const { handleAntiNuke } = require('../features/security/antinuke');

module.exports = {
  name: 'guildAuditLogEntryCreate',
  async execute(auditLogEntry, guild) {
    await handleAntiNuke(auditLogEntry, guild);
  },
};

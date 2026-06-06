const { handleDmallMessage } = require('../features/dmall');
const { handleAntiLink } = require('../features/security/antilink');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    const linkBlocked = await handleAntiLink(message);
    if (linkBlocked) return;

    await handleDmallMessage(message);
  },
};

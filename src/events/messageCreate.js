const { handleDmallMessage } = require('../features/dmall');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    await handleDmallMessage(message);
  },
};

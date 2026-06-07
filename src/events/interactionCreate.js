const { handleApplicationButton } = require('../features/applications/tickets');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error running /${interaction.commandName}:`, error);
        const payload = { content: 'Something went wrong while running that command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      }
      return;
    }

    if (interaction.isButton()) {
      const applicationButtons = [
        'application_apply',
        'application_approve',
        'application_deny',
        'application_close',
      ];

      if (applicationButtons.includes(interaction.customId)) {
        await handleApplicationButton(interaction);
      }
    }
  },
};

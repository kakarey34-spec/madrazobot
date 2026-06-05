const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildApplicationPanel } = require('../../features/applications/panel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-applications')
    .setDescription('Post the application panel in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.channel.send(buildApplicationPanel());
    await interaction.reply({ content: 'Application panel posted.', ephemeral: true });
  },
};

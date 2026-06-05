const { SlashCommandBuilder } = require('discord.js');
const { isPrivilegedUser } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('Member to kick').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the kick'),
    ),

  async execute(interaction) {
    if (!isPrivilegedUser(interaction)) {
      await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
      return;
    }

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!target) {
      await interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
      return;
    }

    if (!target.kickable) {
      await interaction.reply({ content: 'I cannot kick this member.', ephemeral: true });
      return;
    }

    await target.kick(reason);
    await interaction.reply({ content: `Kicked **${target.user.tag}**. Reason: ${reason}` });
  },
};

const { SlashCommandBuilder } = require('discord.js');
const { isPrivilegedUser } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('Member to ban').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the ban'),
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

    if (!target.bannable) {
      await interaction.reply({ content: 'I cannot ban this member.', ephemeral: true });
      return;
    }

    await target.ban({ reason });
    await interaction.reply({ content: `Banned **${target.user.tag}**. Reason: ${reason}` });
  },
};

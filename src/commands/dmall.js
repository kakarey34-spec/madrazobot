const { SlashCommandBuilder } = require('discord.js');
const { isPrivilegedUser } = require('../utils/permissions');

const BATCH_DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dmall')
    .setDescription('Send a direct message to all server members')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Message to send to each member')
        .setRequired(true)
        .setMaxLength(2000),
    ),

  async execute(interaction) {
    if (!isPrivilegedUser(interaction)) {
      await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
      return;
    }

    const message = interaction.options.getString('message');
    await interaction.deferReply({ ephemeral: true });

    const members = await interaction.guild.members.fetch();
    const targets = members.filter((member) => !member.user.bot);

    let sent = 0;
    let failed = 0;

    for (const member of targets.values()) {
      try {
        await member.send(message);
        sent += 1;
      } catch {
        failed += 1;
      }

      await sleep(BATCH_DELAY_MS);
    }

    await interaction.editReply({
      content: `Mass DM complete. Sent: **${sent}**, failed: **${failed}** (DMs closed or blocked).`,
    });
  },
};

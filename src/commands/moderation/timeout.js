const { SlashCommandBuilder } = require('discord.js');
const { isPrivilegedUser } = require('../../utils/permissions');

const UNIT_MS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseDuration(input) {
  const match = input.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const ms = amount * UNIT_MS[unit];

  if (ms < 1000 || ms > 28 * 86_400_000) return null;
  return ms;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .addUserOption((option) =>
      option.setName('user').setDescription('Member to timeout').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration (e.g. 10m, 2h, 1d)')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout'),
    ),

  async execute(interaction) {
    if (!isPrivilegedUser(interaction)) {
      await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
      return;
    }

    const target = interaction.options.getMember('user');
    const durationInput = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const durationMs = parseDuration(durationInput);

    if (!target) {
      await interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
      return;
    }

    if (!durationMs) {
      await interaction.reply({
        content: 'Invalid duration. Use a value like `10m`, `2h`, or `1d` (max 28 days).',
        ephemeral: true,
      });
      return;
    }

    if (!target.moderatable) {
      await interaction.reply({ content: 'I cannot timeout this member.', ephemeral: true });
      return;
    }

    await target.timeout(durationMs, reason);
    await interaction.reply({
      content: `Timed out **${target.user.tag}** for **${durationInput}**. Reason: ${reason}`,
    });
  },
};

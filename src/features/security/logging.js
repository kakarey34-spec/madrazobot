const { EmbedBuilder } = require('discord.js');
const { securityLogChannelId } = require('../../config');

async function logSecurityEvent(guild, { title, description, color = 0xed4245, fields = [] }) {
  if (!securityLogChannelId) return;

  const channel = await guild.channels.fetch(securityLogChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  await channel.send({ embeds: [embed] }).catch((err) => {
    console.error('Failed to send security log:', err.message);
  });
}

module.exports = { logSecurityEvent };

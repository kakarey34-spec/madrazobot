const { EmbedBuilder } = require('discord.js');
const { isWhitelisted } = require('./whitelist');
const { hasLinks, isLinkAuthorized } = require('./links');
const { logSecurityEvent } = require('./logging');

async function handleAntiLink(message) {
  if (!message.guild || message.author.bot) return false;
  if (!message.content || !hasLinks(message.content)) return false;

  const member = message.member ?? await message.guild.members.fetch(message.author.id).catch(() => null);
  if (!member) return false;

  if (isWhitelisted(member)) return false;
  if (isLinkAuthorized(message.author.id, message.content)) return false;

  await message.delete().catch(() => null);

  const notice = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('Links Not Allowed')
    .setDescription(
      `${message.author}, links are not allowed in this server unless explicitly authorized by staff.`,
    )
    .setFooter({ text: 'Contact staff if you need to share a link.' });

  const sent = await message.channel.send({ embeds: [notice] }).catch(() => null);
  if (sent) {
    setTimeout(() => sent.delete().catch(() => null), 10000);
  }

  await logSecurityEvent(message.guild, {
    title: 'Anti-Link: Message Removed',
    description: 'A message containing unauthorized links was deleted.',
    color: 0xfaa61a,
    fields: [
      { name: 'User', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
      { name: 'Channel', value: `${message.channel}`, inline: true },
      { name: 'Content', value: message.content.slice(0, 1000) || '*empty*' },
    ],
  });

  return true;
}

module.exports = { handleAntiLink };

const { EmbedBuilder } = require('discord.js');
const { collectMessageText, messageHasLinks, isLinkAuthorized } = require('./links');
const { logSecurityEvent } = require('./logging');

async function handleAntiLink(message) {
  if (!message.guild || message.author.bot) return false;

  if (message.partial) {
    try {
      await message.fetch();
    } catch (error) {
      console.error('Anti-link: failed to fetch partial message:', error.message);
      return false;
    }
  }

  if (!messageHasLinks(message)) return false;

  const scannedText = collectMessageText(message);

  if (isLinkAuthorized(message.author.id, scannedText)) return false;

  try {
    await message.delete();
  } catch (error) {
    console.error('Anti-link: failed to delete message:', error.message);
    await logSecurityEvent(message.guild, {
      title: 'Anti-Link: Delete Failed',
      description: 'Detected an unauthorized link but could not delete the message. Check bot permissions.',
      color: 0xed4245,
      fields: [
        { name: 'User', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Error', value: error.message },
        { name: 'Content', value: scannedText.slice(0, 1000) || '*empty*' },
      ],
    });
    return true;
  }

  const notice = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('Links Not Allowed')
    .setDescription(
      `${message.author}, links are not allowed in this server. Staff must authorize you with \`/authorizeuserlink\` before you can post links.`,
    )
    .setFooter({ text: 'No roles bypass this rule — authorization is required.' });

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
      { name: 'Content', value: scannedText.slice(0, 1000) || '*empty*' },
    ],
  });

  return true;
}

module.exports = { handleAntiLink };

const { isPrivilegedUser } = require('../utils/permissions');

const PREFIX = '!dmall';
const BATCH_DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleDmallMessage(message) {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  if (!isPrivilegedUser(message.author.id)) {
    await message.reply('You are not authorized to use this command.');
    return;
  }

  const text = message.content.slice(PREFIX.length).trim();
  if (!text) {
    await message.reply('Usage: `!dmall <message>`');
    return;
  }

  const status = await message.reply('Starting mass DM...');

  const members = await message.guild.members.fetch();
  const targets = members.filter((member) => !member.user.bot);

  let sent = 0;
  let failed = 0;

  for (const member of targets.values()) {
    try {
      await member.send(text);
      sent += 1;
    } catch {
      failed += 1;
    }

    await sleep(BATCH_DELAY_MS);
  }

  await status.edit({
    content: `Mass DM complete. Sent: **${sent}**, failed: **${failed}** (DMs closed or blocked).`,
  });
}

module.exports = { handleDmallMessage };

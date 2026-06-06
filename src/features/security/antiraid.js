const { logSecurityEvent } = require('./logging');
const { isWhitelisted } = require('./whitelist');

const JOIN_LIMIT = 8;
const JOIN_WINDOW_MS = 30_000;
const RAID_MODE_DURATION_MS = 5 * 60_000;
const MIN_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60_000;

const joinHistory = [];
let raidModeUntil = 0;

function recordJoin() {
  const now = Date.now();
  const recent = joinHistory.filter((ts) => now - ts < JOIN_WINDOW_MS);
  recent.push(now);
  joinHistory.length = 0;
  joinHistory.push(...recent);

  if (recent.length >= JOIN_LIMIT) {
    raidModeUntil = now + RAID_MODE_DURATION_MS;
    return { raidTriggered: true, joinCount: recent.length };
  }

  return { raidTriggered: false, joinCount: recent.length, raidActive: now < raidModeUntil };
}

function isRaidModeActive() {
  return Date.now() < raidModeUntil;
}

async function handleAntiRaid(member) {
  if (!member.guild || member.user.bot) return;

  const joinResult = recordJoin();

  if (joinResult.raidTriggered) {
    await logSecurityEvent(member.guild, {
      title: 'Anti-Raid: Raid Mode Activated',
      description: `Detected **${joinResult.joinCount}** joins within ${JOIN_WINDOW_MS / 1000} seconds. New suspicious accounts will be kicked.`,
      color: 0xed4245,
      fields: [
        { name: 'Threshold', value: `${JOIN_LIMIT} joins / ${JOIN_WINDOW_MS / 1000}s`, inline: true },
        { name: 'Duration', value: `${RAID_MODE_DURATION_MS / 60_000} minutes`, inline: true },
      ],
    });
  }

  if (isWhitelisted(member)) return;

  const accountAge = Date.now() - member.user.createdTimestamp;
  const shouldKick = isRaidModeActive() && accountAge < MIN_ACCOUNT_AGE_MS;

  if (!shouldKick) return;

  if (!member.kickable) {
    await logSecurityEvent(member.guild, {
      title: 'Anti-Raid: Kick Failed',
      description: `Could not kick **${member.user.tag}** — insufficient permissions or role hierarchy.`,
      fields: [
        { name: 'User', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
        { name: 'Account Age', value: `${Math.floor(accountAge / 86_400_000)} days`, inline: true },
      ],
    });
    return;
  }

  const reason = 'Anti-Raid: New account joined during raid mode';
  await member.kick(reason);

  await logSecurityEvent(member.guild, {
    title: 'Anti-Raid: User Kicked',
    description: `**${member.user.tag}** was kicked for joining during an active raid.`,
    fields: [
      { name: 'User', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
      { name: 'Account Age', value: `${Math.floor(accountAge / 86_400_000)} days`, inline: true },
      { name: 'Reason', value: reason },
    ],
  });
}

module.exports = { handleAntiRaid, isRaidModeActive };

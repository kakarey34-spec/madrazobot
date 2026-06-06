const { AuditLogEvent } = require('discord.js');
const { isWhitelisted } = require('./whitelist');
const { logSecurityEvent } = require('./logging');

const ACTION_LIMITS = {
  [AuditLogEvent.ChannelCreate]: { limit: 3, windowMs: 10_000, label: 'Mass Channel Creation' },
  [AuditLogEvent.ChannelDelete]: { limit: 3, windowMs: 10_000, label: 'Mass Channel Deletion' },
  [AuditLogEvent.RoleCreate]: { limit: 3, windowMs: 10_000, label: 'Mass Role Creation' },
  [AuditLogEvent.RoleDelete]: { limit: 3, windowMs: 10_000, label: 'Mass Role Deletion' },
  [AuditLogEvent.RoleUpdate]: { limit: 5, windowMs: 15_000, label: 'Mass Role Modification' },
  [AuditLogEvent.WebhookCreate]: { limit: 2, windowMs: 10_000, label: 'Webhook Abuse' },
  [AuditLogEvent.WebhookDelete]: { limit: 2, windowMs: 10_000, label: 'Webhook Deletion Abuse' },
  [AuditLogEvent.MemberBanAdd]: { limit: 3, windowMs: 10_000, label: 'Mass Ban' },
  [AuditLogEvent.MemberKick]: { limit: 5, windowMs: 10_000, label: 'Mass Kick' },
  [AuditLogEvent.GuildUpdate]: { limit: 2, windowMs: 15_000, label: 'Server Settings Abuse' },
};

const actionHistory = new Map();

function trackAction(userId, actionType) {
  const key = `${userId}:${actionType}`;
  const now = Date.now();
  const config = ACTION_LIMITS[actionType];
  if (!config) return { exceeded: false, count: 0 };

  const entries = (actionHistory.get(key) ?? []).filter((ts) => now - ts < config.windowMs);
  entries.push(now);
  actionHistory.set(key, entries);

  return {
    exceeded: entries.length > config.limit,
    count: entries.length,
    limit: config.limit,
    label: config.label,
  };
}

async function handleAntiNuke(auditLogEntry, guild) {
  const config = ACTION_LIMITS[auditLogEntry.action];
  if (!config) return;

  const executorId = auditLogEntry.executorId;
  if (!executorId || executorId === guild.client.user.id) return;

  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member || isWhitelisted(member)) return;

  const result = trackAction(executorId, auditLogEntry.action);
  if (!result.exceeded) return;

  if (!member.kickable) {
    await logSecurityEvent(guild, {
      title: `Anti-Nuke: ${result.label}`,
      description: 'Suspicious activity detected but the user could not be kicked (missing permissions or hierarchy).',
      fields: [
        { name: 'User', value: `${member.user.tag} (\`${executorId}\`)`, inline: true },
        { name: 'Actions', value: `${result.count}/${result.limit} in ${config.windowMs / 1000}s`, inline: true },
        { name: 'Action Type', value: result.label, inline: true },
      ],
    });
    return;
  }

  const reason = `Anti-Nuke: ${result.label} (${result.count} actions)`;
  await member.kick(reason);

  await logSecurityEvent(guild, {
    title: `Anti-Nuke: User Kicked`,
    description: `**${member.user.tag}** was automatically kicked for suspicious activity.`,
    fields: [
      { name: 'User', value: `${member.user.tag} (\`${executorId}\`)`, inline: true },
      { name: 'Trigger', value: result.label, inline: true },
      { name: 'Actions', value: `${result.count}/${result.limit} in ${config.windowMs / 1000}s`, inline: true },
      { name: 'Reason', value: reason },
    ],
  });
}

module.exports = { handleAntiNuke, ACTION_LIMITS };

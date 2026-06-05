require('dotenv').config();

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  port: Number(process.env.PORT) || 3000,
  selfPingUrl: process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL || null,
  selfPingIntervalMs: Number(process.env.SELF_PING_INTERVAL_MS) || 14 * 60 * 1000,

  applicationStaffRoleIds: [
    '1384167697977315338',
    '1384167902428659913',
    '1329124620405833789',
    '1329124621487702016',
  ],

  privilegedUserIds: [
    '1262056594993315943',
    '1237787274108866643',
  ],

  transcriptChannelId: '1512410721215053965',
};

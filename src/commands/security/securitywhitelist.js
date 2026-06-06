const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isPrivilegedUser, isStaff } = require('../../utils/permissions');
const { addWhitelistUser, removeWhitelistUser, getStore } = require('../../features/security/store');
const { logSecurityEvent } = require('../../features/security/logging');

function canManageSecurity(interaction) {
  return isPrivilegedUser(interaction) || isStaff(interaction.member);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('securitywhitelist')
    .setDescription('Whitelist users for anti-nuke/anti-raid (does not allow links)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a user to the security whitelist')
        .addUserOption((option) =>
          option.setName('user').setDescription('User to whitelist').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a user from the security whitelist')
        .addUserOption((option) =>
          option.setName('user').setDescription('User to remove').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('List whitelisted users'),
    ),

  async execute(interaction) {
    if (!canManageSecurity(interaction)) {
      await interaction.reply({ content: 'You are not authorized to manage the security whitelist.', ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const target = interaction.options.getUser('user');
      addWhitelistUser(target.id);

      await interaction.reply({
        content: `**${target.tag}** has been added to the security whitelist.`,
        ephemeral: true,
      });

      await logSecurityEvent(interaction.guild, {
        title: 'Security Whitelist: User Added',
        description: `**${target.tag}** can now bypass security checks.`,
        color: 0x57f287,
        fields: [
          { name: 'User', value: `${target.tag} (\`${target.id}\`)`, inline: true },
          { name: 'Added By', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
        ],
      });
      return;
    }

    if (subcommand === 'remove') {
      const target = interaction.options.getUser('user');
      removeWhitelistUser(target.id);

      await interaction.reply({
        content: `**${target.tag}** has been removed from the security whitelist.`,
        ephemeral: true,
      });

      await logSecurityEvent(interaction.guild, {
        title: 'Security Whitelist: User Removed',
        description: `**${target.tag}** no longer bypasses security checks.`,
        color: 0xfaa61a,
        fields: [
          { name: 'User', value: `${target.tag} (\`${target.id}\`)`, inline: true },
          { name: 'Removed By', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
        ],
      });
      return;
    }

    const { whitelistUserIds } = getStore();
    if (whitelistUserIds.length === 0) {
      await interaction.reply({ content: 'No users are on the security whitelist.', ephemeral: true });
      return;
    }

    const list = whitelistUserIds.map((id) => `• <@${id}> (\`${id}\`)`).join('\n');
    await interaction.reply({ content: `**Security Whitelist**\n${list}`, ephemeral: true });
  },
};

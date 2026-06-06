const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isPrivilegedUser, isStaff } = require('../../utils/permissions');
const { authorizeUserLink, revokeUserLinkAuthorization } = require('../../features/security/store');
const { logSecurityEvent } = require('../../features/security/logging');

function canManageSecurity(interaction) {
  return isPrivilegedUser(interaction) || isStaff(interaction.member);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('authorizeuserlink')
    .setDescription('The only way to allow a user to post links in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName('grant')
        .setDescription('Allow a user to post links')
        .addUserOption((option) =>
          option.setName('user').setDescription('User to authorize').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('link')
            .setDescription('Specific link to allow (leave empty to allow all links)'),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('revoke')
        .setDescription('Remove link authorization from a user')
        .addUserOption((option) =>
          option.setName('user').setDescription('User to revoke').setRequired(true),
        ),
    ),

  async execute(interaction) {
    if (!canManageSecurity(interaction)) {
      await interaction.reply({ content: 'You are not authorized to manage link permissions.', ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');

    if (subcommand === 'grant') {
      const link = interaction.options.getString('link');
      authorizeUserLink(target.id, { link, authorizedBy: interaction.user.id });

      const scope = link ? `the link \`${link}\`` : 'all links';
      await interaction.reply({
        content: `**${target.tag}** is now authorized to post ${scope}.`,
        ephemeral: true,
      });

      await logSecurityEvent(interaction.guild, {
        title: 'Link Authorization Granted',
        description: `**${target.tag}** was authorized to post links.`,
        color: 0x57f287,
        fields: [
          { name: 'User', value: `${target.tag} (\`${target.id}\`)`, inline: true },
          { name: 'Scope', value: link ? link : 'All links', inline: true },
          { name: 'Authorized By', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
        ],
      });
      return;
    }

    revokeUserLinkAuthorization(target.id);
    await interaction.reply({
      content: `Removed link authorization for **${target.tag}**.`,
      ephemeral: true,
    });

    await logSecurityEvent(interaction.guild, {
      title: 'Link Authorization Revoked',
      description: `Link permissions were removed from **${target.tag}**.`,
      color: 0xfaa61a,
      fields: [
        { name: 'User', value: `${target.tag} (\`${target.id}\`)`, inline: true },
        { name: 'Revoked By', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
      ],
    });
  },
};

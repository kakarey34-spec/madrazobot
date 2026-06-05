const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { applicationStaffRoleIds } = require('../../config');
const { isStaff } = require('../../utils/permissions');

const CLOSE_BUTTON_ID = 'application_close';

function buildCloseRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CLOSE_BUTTON_ID)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger),
  );
}

function sanitizeUsername(username) {
  return username.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 32);
}

async function createApplicationTicket(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;
  const channelName = `application-${sanitizeUsername(member.user.username)}`;

  const existing = guild.channels.cache.find(
    (ch) => ch.name === channelName && ch.type === ChannelType.GuildText,
  );

  if (existing) {
    await interaction.reply({
      content: `You already have an open application: ${existing}`,
      ephemeral: true,
    });
    return;
  }

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    ...applicationStaffRoleIds.map((roleId) => ({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    })),
  ];

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `Application ticket for ${member.user.tag}`,
    permissionOverwrites,
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Application Ticket')
    .setDescription(
      [
        `Welcome ${member}, thank you for applying!`,
        '',
        'Please answer the following:',
        '1. Why do you want to join?',
        '2. What experience do you have?',
        '3. Anything else we should know?',
        '',
        'Staff will review your application shortly.',
      ].join('\n'),
    )
    .setFooter({ text: 'Use the button below to close this ticket when finished.' });

  await channel.send({
    content: `${member} — staff has been notified.`,
    embeds: [embed],
    components: [buildCloseRow()],
  });

  await interaction.reply({
    content: `Your application ticket has been created: ${channel}`,
    ephemeral: true,
  });
}

async function closeApplicationTicket(interaction) {
  if (!isStaff(interaction.member)) {
    await interaction.reply({
      content: 'Only staff can close application tickets.',
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({ content: 'Closing this ticket in 3 seconds...' });

  setTimeout(async () => {
    try {
      await interaction.channel.delete('Application ticket closed by staff');
    } catch (error) {
      console.error('Failed to delete application channel:', error);
    }
  }, 3000);
}

async function handleApplicationButton(interaction) {
  if (interaction.customId === 'application_apply') {
    await createApplicationTicket(interaction);
    return;
  }

  if (interaction.customId === CLOSE_BUTTON_ID) {
    await closeApplicationTicket(interaction);
  }
}

module.exports = { handleApplicationButton, buildCloseRow };

const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');
const {
  applicationStaffRoleIds,
  transcriptChannelId,
  applicationApprovedRoleId,
  applicationPingChannelIds,
} = require('../../config');
const { isStaff } = require('../../utils/permissions');

const APPLY_BUTTON_ID = 'application_apply';
const CLOSE_BUTTON_ID = 'application_close';
const APPROVE_BUTTON_ID = 'application_approve';
const DENY_BUTTON_ID = 'application_deny';

const APPLICATION_MESSAGE = `**APPLICATION**

1) Όνομα IRL:
2) Ηλικία:
3) Πόσο καιρό παίζεις criminal rp:
4) Γιατί να σε επιλέξουμε:
5) Ποια είναι η ειδικότητα σου:
6) Πόσες ώρες θα είσαι On:
8) Τι θέση πιστεύεις θα φτάσεις:
9) Ποια βαθμίδα σε ενδιαφέρει και γιατί:
10) Έχετε διαβάσει καλά τα rules?:
11) Κάποια σημείωση:

Παρακαλούμε τις αιτήσεις να τις απαντάτε έτσι:

1) Όνομα IRL: (απάντηση)
2) Ηλικία: (απάντηση)
3) Πόσο καιρό παίζεις criminal rp: (απάντηση)
4) Γιατί να σε επιλέξουμε: (απάντηση)
5) Ποια είναι η ειδικότητα σου: (απάντηση)
6) Πόσες ώρες θα είσαι On: (απάντηση)
8) Τι θέση πιστεύεις θα φτάσεις: (απάντηση)
9) Ποια βαθμίδα σε ενδιαφέρει και γιατί: (απάντηση)
10) Έχετε διαβάσει καλά τα rules?: (απάντηση)
11) Κάποια σημείωση: (απάντηση)

Αλλιώς οποίος ξέρει εμένα ή <@1237787274108866643> Dm Για Roles!`;

function buildStaffActionRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(APPROVE_BUTTON_ID)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(DENY_BUTTON_ID)
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(CLOSE_BUTTON_ID)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );
}

function sanitizeUsername(username) {
  return username.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 32);
}

function buildApplicantTopic(member) {
  return `Application ticket for ${member.user.tag} | applicant:${member.id}`;
}

function getApplicantId(channel) {
  const topicMatch = channel.topic?.match(/applicant:(\d+)/);
  if (topicMatch) return topicMatch[1];

  const applicantOverwrite = channel.permissionOverwrites.cache.find((overwrite) => {
    if (overwrite.id === channel.guild.id) return false;
    if (applicationStaffRoleIds.includes(overwrite.id)) return false;
    return overwrite.allow.has(PermissionFlagsBits.ViewChannel);
  });

  return applicantOverwrite?.id ?? null;
}

async function fetchAllMessages(channel) {
  const messages = [];
  let lastId;

  while (true) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(lastId && { before: lastId }),
    });

    if (batch.size === 0) break;

    messages.push(...batch.values());
    lastId = batch.last().id;

    if (batch.size < 100) break;
  }

  return messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

function formatTranscript(channel, messages, closedBy, status = 'closed') {
  const header = [
    `Application Transcript`,
    `Channel: #${channel.name}`,
    `Status: ${status}`,
    `Handled by: ${closedBy.tag} (${closedBy.id})`,
    `Closed at: ${new Date().toISOString()}`,
    '',
    '─'.repeat(50),
    '',
  ].join('\n');

  const body = messages.map((message) => {
    const time = new Date(message.createdTimestamp).toISOString();
    const author = `${message.author.tag} (${message.author.id})`;
    const parts = [message.content || ''];

    if (message.embeds.length > 0) {
      for (const embed of message.embeds) {
        if (embed.title) parts.push(`[Embed Title] ${embed.title}`);
        if (embed.description) parts.push(`[Embed] ${embed.description}`);
      }
    }

    if (message.attachments.size > 0) {
      const urls = [...message.attachments.values()].map((a) => a.url).join(', ');
      parts.push(`[Attachments] ${urls}`);
    }

    return `[${time}] ${author}\n${parts.filter(Boolean).join('\n')}`;
  }).join('\n\n');

  return `${header}${body}`;
}

async function sendTranscript(channel, closedBy, status = 'closed') {
  const transcriptChannel = await channel.guild.channels.fetch(transcriptChannelId).catch(() => null);
  if (!transcriptChannel) {
    console.error(`Transcript channel not found: ${transcriptChannelId}`);
    return;
  }

  const messages = await fetchAllMessages(channel);
  const transcript = formatTranscript(channel, messages, closedBy, status);
  const fileName = `${channel.name}-${Date.now()}.txt`;
  const attachment = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), { name: fileName });

  await transcriptChannel.send({
    content: `Application ticket **${status}**: **${channel.name}** από ${closedBy}`,
    files: [attachment],
  });
}

async function disableTicketButtons(interaction) {
  const ticketMessage = interaction.message;
  if (!ticketMessage) return;

  await ticketMessage.edit({ components: [buildStaffActionRow(true)] }).catch(() => null);
}

async function pingApplicantInChannels(guild, applicantId) {
  for (const channelId of applicationPingChannelIds) {
    const pingChannel = await guild.channels.fetch(channelId).catch(() => null);
    if (!pingChannel?.isTextBased()) continue;

    const pingMessage = await pingChannel.send(`<@${applicantId}>`).catch((error) => {
      console.error(`Failed to ping applicant in ${channelId}:`, error.message);
      return null;
    });

    if (pingMessage) {
      await pingMessage.delete().catch((error) => {
        console.error(`Failed to delete ping in ${channelId}:`, error.message);
      });
    }
  }
}

async function getApplicantMember(guild, channel) {
  const applicantId = getApplicantId(channel);
  if (!applicantId) return null;

  return guild.members.fetch(applicantId).catch(() => null);
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
    topic: buildApplicantTopic(member),
    permissionOverwrites,
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setDescription(APPLICATION_MESSAGE)
    .setFooter({ text: 'Staff: χρησιμοποιήστε Approve ή Deny για την αίτηση.' });

  await channel.send({
    content: `${member}`,
    embeds: [embed],
    components: [buildStaffActionRow()],
  });

  await interaction.reply({
    content: `Your application ticket has been created: ${channel}`,
    ephemeral: true,
  });
}

async function approveApplicationTicket(interaction) {
  if (!isStaff(interaction.member)) {
    await interaction.reply({
      content: 'Only staff can approve applications.',
      ephemeral: true,
    });
    return;
  }

  const ticketChannel = interaction.channel;
  const applicant = await getApplicantMember(ticketChannel.guild, ticketChannel);

  if (!applicant) {
    await interaction.reply({
      content: 'Could not find the applicant for this ticket.',
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({ content: `Εγκρίνεται η αίτηση του ${applicant}...` });
  await disableTicketButtons(interaction);

  const role = await ticketChannel.guild.roles.fetch(applicationApprovedRoleId).catch(() => null);
  if (!role) {
    await interaction.followUp({
      content: `Approved role not found (\`${applicationApprovedRoleId}\`). Ticket was not closed.`,
      ephemeral: true,
    });
    return;
  }

  if (!applicant.roles.cache.has(role.id)) {
    try {
      await applicant.roles.add(role, `Application approved by ${interaction.user.tag}`);
    } catch (error) {
      console.error('Failed to add approved role:', error.message);
      await interaction.followUp({
        content: `Could not assign the role. Check bot role hierarchy. (${error.message})`,
        ephemeral: true,
      });
      return;
    }
  }

  await pingApplicantInChannels(ticketChannel.guild, applicant.id);

  try {
    await sendTranscript(ticketChannel, interaction.user, 'approved');
    await ticketChannel.delete(`Application approved by ${interaction.user.tag}`);
  } catch (error) {
    console.error('Failed to close approved application ticket:', error);
    await interaction.followUp({
      content: 'Role assigned but failed to close the ticket. Close it manually.',
      ephemeral: true,
    });
  }
}

async function denyApplicationTicket(interaction) {
  if (!isStaff(interaction.member)) {
    await interaction.reply({
      content: 'Only staff can deny applications.',
      ephemeral: true,
    });
    return;
  }

  const applicant = await getApplicantMember(interaction.channel.guild, interaction.channel);

  await interaction.reply({
    content: applicant
      ? `Η αίτηση του ${applicant} απορρίφθηκε.`
      : 'Η αίτηση απορρίφθηκε.',
  });
  await disableTicketButtons(interaction);

  const ticketChannel = interaction.channel;

  try {
    await sendTranscript(ticketChannel, interaction.user, 'denied');
    await ticketChannel.delete(`Application denied by ${interaction.user.tag}`);
  } catch (error) {
    console.error('Failed to close denied application ticket:', error);
    await interaction.followUp({
      content: 'Αποτυχία κλεισίματος του ticket. Δοκίμασε ξανά.',
      ephemeral: true,
    });
  }
}

async function closeApplicationTicket(interaction) {
  if (!isStaff(interaction.member)) {
    await interaction.reply({
      content: 'Only staff can close application tickets.',
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({ content: 'Κλείνει το ticket...' });
  await disableTicketButtons(interaction);

  const ticketChannel = interaction.channel;

  try {
    await sendTranscript(ticketChannel, interaction.user, 'closed');
    await ticketChannel.delete(`Application ticket closed by ${interaction.user.tag}`);
  } catch (error) {
    console.error('Failed to close application ticket:', error);
    await interaction.followUp({
      content: 'Αποτυχία κλεισίματος του ticket. Δοκίμασε ξανά.',
      ephemeral: true,
    });
  }
}

async function handleApplicationButton(interaction) {
  if (interaction.customId === APPLY_BUTTON_ID) {
    await createApplicationTicket(interaction);
    return;
  }

  if (interaction.customId === APPROVE_BUTTON_ID) {
    await approveApplicationTicket(interaction);
    return;
  }

  if (interaction.customId === DENY_BUTTON_ID) {
    await denyApplicationTicket(interaction);
    return;
  }

  if (interaction.customId === CLOSE_BUTTON_ID) {
    await closeApplicationTicket(interaction);
  }
}

module.exports = {
  handleApplicationButton,
  buildStaffActionRow,
  APPLY_BUTTON_ID,
  CLOSE_BUTTON_ID,
  APPROVE_BUTTON_ID,
  DENY_BUTTON_ID,
};

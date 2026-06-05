const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildApplicationPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('Apply Here')
    .setDescription(
      [
        'Interested in joining our team?',
        '',
        'Click the button below to open a private application ticket.',
        'Only you and staff will be able to see it.',
      ].join('\n'),
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('application_apply')
      .setLabel('Apply')
      .setStyle(ButtonStyle.Success),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { buildApplicationPanel };

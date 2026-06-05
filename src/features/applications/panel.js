const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildApplicationPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('Madrazo Applications')
    .setDescription(
      [
        'Θες να μπεις στους Madrazo;',
        '',
        'Πάτα το κουμπί από κάτω για να ανοίξεις ένα application ticket και κάνε την αίτησή σου.',
        'Μόνο εσύ και το staff θα μπορείτε να το δείτε.',
      ].join('\n'),
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('application_apply')
      .setLabel('Άνοιξε Application')
      .setStyle(ButtonStyle.Success),
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { buildApplicationPanel };

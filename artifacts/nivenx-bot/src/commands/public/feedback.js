/**
 * NivenX - /feedback command
 * Submit feedback, bug reports, or feature requests.
 */

import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Submit feedback, bug reports, or feature requests')
    .addStringOption(o => o.setName('category').setDescription('Feedback type').setRequired(true)
      .addChoices(
        { name: '💡 Feature Request', value: 'Feature Request' },
        { name: '🐛 Bug Report', value: 'Bug Report' },
        { name: '⭐ General Feedback', value: 'General Feedback' },
        { name: '😤 Complaint', value: 'Complaint' },
        { name: '💬 Suggestion', value: 'Suggestion' },
      )),

  async execute(interaction) {
    const category = interaction.options.getString('category');

    const modal = new ModalBuilder()
      .setCustomId(`feedback_submit_${category.replace(/\s/g, '_')}`)
      .setTitle(`Submit ${category}`);

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('message')
          .setLabel('Your Feedback')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder('Please be as detailed as possible...')
          .setMinLength(20)
          .setMaxLength(2000),
      ),
    );

    await interaction.showModal(modal);
  },
};

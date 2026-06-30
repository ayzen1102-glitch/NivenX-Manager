/**
 * NivenX - /quote command
 * Request a price quote for a service.
 */

import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Request a price quote for a service'),

  async execute(interaction) {
    const serviceOptions = config.services.map(s => s.label).slice(0, 5);

    const modal = new ModalBuilder()
      .setCustomId('quote_request_modal')
      .setTitle('Request a Price Quote');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('service')
          .setLabel('Service Needed')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('e.g. Discord Bot, Website, Hosting...')
          .setMaxLength(100),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('requirements')
          .setLabel('Describe your requirements')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder('Be as specific as possible about what you need...')
          .setMaxLength(1000),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('budget')
          .setLabel('Your Budget (optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('e.g. $50-100')
          .setMaxLength(50),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('timeline')
          .setLabel('Desired Timeline (optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('e.g. Within 1 week')
          .setMaxLength(100),
      ),
    );

    await interaction.showModal(modal);
  },
};

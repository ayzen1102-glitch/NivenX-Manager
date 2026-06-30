/**
 * NivenX Assistant - /ticket command
 * Opens a support ticket with category selection.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { buildTicketCategoryMenu } from '../../ui/components/ticketComponents.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a support ticket'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Open a Support Ticket')
      .setDescription(
        'Select the category that best describes your issue.\n' +
        'A private channel will be created for you and our team.'
      )
      .setColor(config.bot.color)
      .setFooter({ text: 'NivenX Assistant • Select a category below' });

    await interaction.reply({
      embeds: [embed],
      components: [buildTicketCategoryMenu()],
      ephemeral: true,
    });
  },
};

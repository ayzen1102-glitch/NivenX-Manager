/**
 * NivenX Assistant - /order command
 * Starts the order flow with a service selection menu.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { buildServiceSelectMenu } from '../../ui/components/orderComponents.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('order')
    .setDescription('Place a new service order with NivenX'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🛍️ NivenX Services')
      .setDescription(
        'Select a service below to start your order.\n' +
        'You\'ll be guided through a short form to capture your requirements.'
      )
      .setColor(config.bot.color)
      .addFields(
        config.services.map(s => ({
          name: s.label,
          value: s.description,
          inline: true,
        }))
      )
      .setFooter({ text: 'NivenX Assistant • Select a service to continue' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [buildServiceSelectMenu()],
      ephemeral: true,
    });
  },
};

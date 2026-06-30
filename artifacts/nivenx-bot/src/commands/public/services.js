/**
 * NivenX Assistant - /services command
 * Display available services without starting an order.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('services')
    .setDescription('Browse all available NivenX services'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🌐 NivenX Services Catalog')
      .setDescription('Here\'s everything we offer. Use `/order` to place an order for any service.')
      .setColor(config.bot.color)
      .addFields(
        config.services.map(s => ({
          name: s.label,
          value: s.description,
          inline: true,
        }))
      )
      .setFooter({ text: 'NivenX Assistant • Use /order to get started' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

/**
 * NivenX Assistant - /orderinfo command
 * Get detailed info on a specific order (client-facing).
 */

import { SlashCommandBuilder } from 'discord.js';
import { Orders } from '../../database/queries.js';
import { buildOrderEmbed } from '../../ui/embeds/orderEmbed.js';
import { errorEmbed } from '../../ui/embeds/generalEmbed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('orderinfo')
    .setDescription('Get detailed info on one of your orders')
    .addStringOption(opt =>
      opt.setName('order_id')
        .setDescription('Your order ID (e.g. NVX-0001)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const orderId = interaction.options.getString('order_id').toUpperCase();
    const order = Orders.findById(orderId);

    if (!order) {
      return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` was not found.`)], ephemeral: true });
    }

    if (order.user_id !== interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('Access Denied', 'You can only view your own orders.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [buildOrderEmbed(order)], ephemeral: true });
  },
};

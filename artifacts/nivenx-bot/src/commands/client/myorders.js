/**
 * NivenX Assistant - /myorders command
 * Client dashboard: view your own orders.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Orders } from '../../database/queries.js';
import { buildOrderEmbed } from '../../ui/embeds/orderEmbed.js';
import { config } from '../../config/config.js';
import { errorEmbed } from '../../ui/embeds/generalEmbed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('myorders')
    .setDescription('View your order history')
    .addStringOption(opt =>
      opt.setName('order_id')
        .setDescription('Look up a specific order by ID')
        .setRequired(false)
    ),

  async execute(interaction) {
    const orderId = interaction.options.getString('order_id');

    if (orderId) {
      const order = Orders.findById(orderId.toUpperCase());
      if (!order || order.user_id !== interaction.user.id) {
        return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });
      }
      return interaction.reply({ embeds: [buildOrderEmbed(order)], ephemeral: true });
    }

    const orders = Orders.findByUser(interaction.user.id);

    if (orders.length === 0) {
      return interaction.reply({
        embeds: [{
          color: config.bot.infoColor,
          title: '📦 Your Orders',
          description: 'You have no orders yet.\nUse `/order` to place your first order!',
        }],
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📦 Your Orders')
      .setColor(config.bot.color)
      .setDescription(`You have **${orders.length}** order(s).`)
      .setFooter({ text: 'Use /myorders <order_id> to see full details' });

    // Show up to 10 most recent
    orders.slice(0, 10).forEach(o => {
      const statusColors = { Completed: '🟢', 'In Progress': '🔵', Pending: '🟡', Cancelled: '🔴', 'Awaiting Payment': '🟣', Paid: '🟢' };
      embed.addFields({
        name: `${statusColors[o.status] ?? '⚪'} ${o.order_id}`,
        value: `${o.service_label} — **${o.status}**\n<t:${Math.floor(new Date(o.created_at).getTime() / 1000)}:R>`,
        inline: true,
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

/**
 * NivenX Assistant - /staffpanel command (Admin)
 * View business overview for admin/staff.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Orders, Tickets, Reviews, Coupons } from '../../database/queries.js';
import { getOrderStats } from '../../services/orderService.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('staffpanel')
    .setDescription('Staff: view business overview'),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;

    const stats = getOrderStats();
    const reviewStats = Reviews.averageRating();
    const openTickets = Tickets.countOpen();
    const recentOrders = Orders.findAll(5);
    const activeCoupons = Coupons.findAll().filter(c => c.active);

    const embed = new EmbedBuilder()
      .setTitle('🏢 NivenX Staff Panel')
      .setColor(config.bot.color)
      .addFields(
        { name: '📊 Orders', value: [
          `Total: **${stats.total}**`,
          `Pending: **${stats['Pending'] ?? 0}**`,
          `Awaiting Payment: **${stats['Awaiting Payment'] ?? 0}**`,
          `In Progress: **${stats['In Progress'] ?? 0}**`,
          `Completed: **${stats['Completed'] ?? 0}**`,
          `Cancelled: **${stats['Cancelled'] ?? 0}**`,
        ].join('\n'), inline: true },
        { name: '🎫 Support', value: `Open Tickets: **${openTickets}**`, inline: true },
        { name: '⭐ Reviews', value: reviewStats.avg
          ? `Avg: **${Number(reviewStats.avg).toFixed(1)}/5** (${reviewStats.total} reviews)`
          : 'No reviews yet', inline: true },
        { name: '🎟️ Active Coupons', value: `${activeCoupons.length} active`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'NivenX Assistant • Staff Panel' });

    if (recentOrders.length > 0) {
      embed.addFields({
        name: '📦 Recent Orders',
        value: recentOrders.map(o =>
          `**${o.order_id}** — ${o.service_label} — \`${o.status}\` — <@${o.user_id}>`
        ).join('\n'),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

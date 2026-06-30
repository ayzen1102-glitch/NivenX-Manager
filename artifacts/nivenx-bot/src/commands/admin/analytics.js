/**
 * NivenX - /analytics command (Admin)
 * Revenue analytics, order trends, and business insights.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Orders, Reviews, Tickets, UserAccounts } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { buildAnalyticsCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('analytics')
    .setDescription('View business analytics and revenue stats (Admin)')
    .addStringOption(o => o.setName('period').setDescription('Time period').setRequired(false)
      .addChoices(
        { name: '7 days', value: '7d' },
        { name: '30 days', value: '30d' },
        { name: '90 days', value: '90d' },
        { name: 'All time', value: 'all' },
      )),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;
    await interaction.deferReply({ ephemeral: true });

    const period = interaction.options.getString('period') ?? '30d';

    const allOrders = Orders.findAll(9999);
    const completed = allOrders.filter(o => o.status === 'Completed');
    const pending = allOrders.filter(o => o.status === 'Pending');
    const cancelled = allOrders.filter(o => o.status === 'Cancelled');

    const revenue = completed.reduce((sum, o) => sum + (o.price ?? 0), 0);
    const avgOrderValue = completed.length > 0 ? revenue / completed.length : 0;

    const reviewStats = Reviews.averageRating();
    const openTickets = Tickets.findAll('open').length;
    const closedTickets = Tickets.findAll('closed').length;
    const topServices = Orders.topServices(3);

    const stats = {
      revenue,
      avgOrderValue,
      bestDay: 0,
      orders: allOrders.length,
      completed: completed.length,
      pending: pending.length,
      cancelled: cancelled.length,
      conversionRate: allOrders.length > 0 ? Math.round((completed.length / allOrders.length) * 100) : 0,
      ticketsOpened: openTickets + closedTickets,
      ticketsClosed: closedTickets,
      avgResolutionTime: 'N/A',
      reviews: reviewStats.total,
      avgRating: reviewStats.avg ? Number(reviewStats.avg).toFixed(1) : null,
      newCustomers: UserAccounts.count(),
      returningCustomers: 0,
      topService: topServices[0]?.service_label ?? 'N/A',
    };

    await interaction.editReply(buildAnalyticsCard(stats, period));
  },
};

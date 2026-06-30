/**
 * NivenX Assistant - /leaderboard command (Admin)
 * View staff performance leaderboard.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDb } from '../../database/database.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Admin: view staff performance leaderboard'),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;

    // Count orders completed/closed per staff tag from audit log
    const rows = getDb().prepare(`
      SELECT actor_tag, actor_id, COUNT(*) as actions
      FROM audit_log
      WHERE action IN ('ORDER_STATUS_CHANGED', 'TICKET_CLOSED', 'ORDER_ASSIGNED', 'INVOICE_PAID')
      GROUP BY actor_id
      ORDER BY actions DESC
      LIMIT 10
    `).all();

    const embed = new EmbedBuilder()
      .setTitle('🏆 Staff Leaderboard')
      .setDescription('Top staff by total actions taken (orders updated, tickets closed, invoices, assignments).')
      .setColor(config.bot.color)
      .setTimestamp();

    if (rows.length === 0) {
      embed.setDescription('No activity recorded yet.');
    } else {
      const medals = ['🥇', '🥈', '🥉'];
      rows.forEach((r, i) => {
        embed.addFields({
          name: `${medals[i] ?? `#${i + 1}`} ${r.actor_tag}`,
          value: `**${r.actions}** actions`,
          inline: true,
        });
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

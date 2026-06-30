/**
 * NivenX Assistant - /export command (Admin)
 * Export orders or tickets as a CSV text file attachment.
 */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { Orders, Tickets } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { errorEmbed } from '../../ui/embeds/generalEmbed.js';

function toCSV(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map(row =>
    columns.map(col => {
      const val = row[col] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export default {
  data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Admin: export data as CSV')
    .addStringOption(opt =>
      opt.setName('type').setDescription('Data to export').setRequired(true)
        .addChoices(
          { name: 'Orders', value: 'orders' },
          { name: 'Tickets', value: 'tickets' },
        )
    )
    .addStringOption(opt =>
      opt.setName('status').setDescription('Filter by status (optional)').setRequired(false)
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.options.getString('type');
    const status = interaction.options.getString('status');

    let csv = '';
    let filename = '';

    if (type === 'orders') {
      const orders = status ? Orders.findByStatus(status) : Orders.findAll(500);
      csv = toCSV(orders, ['order_id', 'user_tag', 'service_label', 'status', 'price', 'coupon_code', 'created_at', 'updated_at']);
      filename = `orders_export_${Date.now()}.csv`;
    } else if (type === 'tickets') {
      const tickets = status ? Tickets.findAll(status) : Tickets.findAll('open');
      csv = toCSV(tickets, ['ticket_id', 'user_tag', 'category', 'status', 'created_at', 'closed_at']);
      filename = `tickets_export_${Date.now()}.csv`;
    }

    const buffer = Buffer.from(csv, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: filename });

    await interaction.editReply({
      content: `✅ Export ready — **${filename}**`,
      files: [attachment],
    });
  },
};

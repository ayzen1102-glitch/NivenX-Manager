/**
 * NivenX Assistant - /note command (Staff)
 * Add internal staff notes to an order.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Orders, AuditLog } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { buildOrderEmbed } from '../../ui/embeds/orderEmbed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Staff: add a note to an order')
    .addStringOption(opt =>
      opt.setName('order_id').setDescription('Order ID (e.g. NVX-0001)').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('note').setDescription('Note content').setRequired(true).setMaxLength(500)
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;

    const orderId = interaction.options.getString('order_id').toUpperCase();
    const note = interaction.options.getString('note');

    const order = Orders.findById(orderId);
    if (!order) {
      return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });
    }

    const existing = order.notes ? order.notes + '\n\n' : '';
    const timestamped = `[${new Date().toLocaleString()} — ${interaction.user.tag}] ${note}`;
    Orders.updatePrice(orderId, order.price, existing + timestamped);

    AuditLog.insert({
      action: 'ORDER_NOTE_ADDED',
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      targetType: 'order',
      targetId: orderId,
      details: { note },
    });

    await interaction.reply({
      embeds: [successEmbed('Note Added', `Note appended to **${orderId}**.`), buildOrderEmbed(Orders.findById(orderId))],
      ephemeral: true,
    });
  },
};

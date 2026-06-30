/**
 * NivenX Assistant - /assign command (Staff)
 * Assign an order to a staff member and notify them.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Orders, AuditLog } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { buildOrderEmbed } from '../../ui/embeds/orderEmbed.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('assign')
    .setDescription('Staff: assign an order to a staff member')
    .addStringOption(opt =>
      opt.setName('order_id').setDescription('Order ID').setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('staff').setDescription('Staff member to assign').setRequired(true)
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;

    const orderId = interaction.options.getString('order_id').toUpperCase();
    const staffUser = interaction.options.getUser('staff');

    const order = Orders.findById(orderId);
    if (!order) {
      return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });
    }

    const note = `[ASSIGNED] → ${staffUser.tag} by ${interaction.user.tag}`;
    const existing = order.notes ? order.notes + '\n' : '';
    Orders.updatePrice(orderId, order.price, existing + note);

    AuditLog.insert({
      action: 'ORDER_ASSIGNED',
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      targetType: 'order',
      targetId: orderId,
      details: { assignedTo: staffUser.id, assignedTag: staffUser.tag },
    });

    // DM the assigned staff member
    try {
      const assignEmbed = new EmbedBuilder()
        .setTitle('📋 Order Assigned to You')
        .setDescription(`You have been assigned **${orderId}** by ${interaction.user.tag}.`)
        .setColor(config.bot.infoColor)
        .addFields(
          { name: 'Service', value: order.service_label, inline: true },
          { name: 'Status', value: order.status, inline: true },
          { name: 'Customer', value: `<@${order.user_id}>`, inline: true },
        )
        .setTimestamp();
      await staffUser.send({ embeds: [assignEmbed] });
    } catch { /* DMs closed */ }

    await interaction.reply({
      embeds: [successEmbed('Assigned', `Order **${orderId}** assigned to <@${staffUser.id}>. They have been notified via DM.`)],
      ephemeral: true,
    });
  },
};

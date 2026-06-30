/**
 * NivenX Assistant - /remind command (Staff)
 * Send a payment reminder to a client via DM.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Orders, Invoices } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Staff: send a payment reminder to a client')
    .addStringOption(opt =>
      opt.setName('order_id').setDescription('Order ID').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('message').setDescription('Custom reminder message (optional)').setRequired(false)
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;

    const orderId = interaction.options.getString('order_id').toUpperCase();
    const customMsg = interaction.options.getString('message');
    const order = Orders.findById(orderId);

    if (!order) {
      return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });
    }

    const invoices = Invoices.findByOrder(orderId);
    const unpaid = invoices.find(i => i.status === 'unpaid');

    const embed = new EmbedBuilder()
      .setTitle('💳 Payment Reminder — NivenX')
      .setDescription(
        customMsg ??
        `This is a friendly reminder that your order **${orderId}** is awaiting payment.\n\nPlease complete your payment at your earliest convenience to proceed with your order.`
      )
      .setColor(config.bot.warningColor)
      .addFields(
        { name: '📦 Order', value: orderId, inline: true },
        { name: '🛍️ Service', value: order.service_label, inline: true },
        { name: '📊 Status', value: order.status, inline: true },
      );

    if (unpaid) {
      embed.addFields({ name: '💰 Amount Due', value: `$${unpaid.total.toFixed(2)}`, inline: true });
    }

    embed
      .addFields({ name: '💬 Questions?', value: 'Open a support ticket with `/ticket` in our server.' })
      .setFooter({ text: 'NivenX Assistant' })
      .setTimestamp();

    try {
      const user = await interaction.client.users.fetch(order.user_id);
      await user.send({ embeds: [embed] });
      await interaction.reply({ embeds: [successEmbed('Reminder Sent', `Payment reminder sent to <@${order.user_id}>.`)], ephemeral: true });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('DMs Closed', `Could not DM <@${order.user_id}>. Their DMs may be disabled.`)], ephemeral: true });
    }
  },
};

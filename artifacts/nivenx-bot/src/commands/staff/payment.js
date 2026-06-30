/**
 * NivenX - /payment command (Staff)
 * View pending payments and verify/reject them.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Payments, Invoices, Orders } from '../../database/queries.js';
import { verifyPayment, rejectPayment } from '../../services/paymentService.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { buildPaymentProofCard, successCard, errorCard } from '../../ui/v2/generalV2.js';
import { text, container, Colors, V2EphemeralFlags } from '../../ui/v2/builder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('payment')
    .setDescription('Manage payment proofs (Staff)')
    .addSubcommand(s => s.setName('pending').setDescription('View all pending payment proofs'))
    .addSubcommand(s => s.setName('verify').setDescription('Verify a payment proof')
      .addIntegerOption(o => o.setName('payment_id').setDescription('Payment ID').setRequired(true)))
    .addSubcommand(s => s.setName('reject').setDescription('Reject a payment proof')
      .addIntegerOption(o => o.setName('payment_id').setDescription('Payment ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Rejection reason').setRequired(true))),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'pending') {
      const pending = Payments.findPending();
      if (pending.length === 0) {
        return interaction.editReply(successCard('No Pending Payments', 'All payments have been processed.'));
      }

      const lines = [`## 💳 Pending Payments (${pending.length})`, ``];
      for (const p of pending) {
        const invoice = Invoices.findById(p.invoice_id);
        lines.push(`**ID ${p.id}** — \`${p.invoice_id}\` — <@${p.user_id}>`);
        lines.push(`> Method: **${p.method}** | Amount: **$${p.amount}** | Ref: \`${p.reference ?? 'N/A'}\``);
        lines.push(`> Submitted: <t:${Math.floor(new Date(p.created_at).getTime() / 1000)}:R>`);
        lines.push(``);
      }
      lines.push(`> Use \`/payment verify [id]\` or \`/payment reject [id]\` to process.`);

      return interaction.editReply({
        components: [container(Colors.warning, text(lines.join('\n')))],
        flags: V2EphemeralFlags,
      });
    }

    if (sub === 'verify') {
      const paymentId = interaction.options.getInteger('payment_id');
      try {
        await verifyPayment(paymentId, interaction.user.id, interaction.user.tag);

        const payment = Payments.findById(paymentId);
        const order = Orders.findById(payment.order_id);

        // Notify in orders channel
        const ordersChannel = interaction.guild.channels.cache.find(c => c.name === 'orders');
        if (ordersChannel && order) {
          await ordersChannel.send({
            content: `✅ Payment confirmed for order **${order.order_id}** (<@${order.user_id}>). Order status: **Paid**.`,
          }).catch(() => {});
        }

        await interaction.editReply(successCard('Payment Verified!', `Payment **#${paymentId}** has been confirmed.\nThe customer has been notified and their order is now marked **Paid**.`));
      } catch (err) {
        await interaction.editReply(errorCard('Error', err.message));
      }
    }

    if (sub === 'reject') {
      const paymentId = interaction.options.getInteger('payment_id');
      const reason = interaction.options.getString('reason');
      try {
        rejectPayment(paymentId, interaction.user.id, interaction.user.tag, reason);
        await interaction.editReply(successCard('Payment Rejected', `Payment **#${paymentId}** has been rejected.\nReason: ${reason}\nThe customer has been notified.`));
      } catch (err) {
        await interaction.editReply(errorCard('Error', err.message));
      }
    }
  },
};

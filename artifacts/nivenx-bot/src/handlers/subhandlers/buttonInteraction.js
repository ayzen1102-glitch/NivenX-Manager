/**
 * NivenX - Button Interaction Handler (Components V2)
 * Routes all button clicks.
 */

import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { Orders, Tickets, Coupons, Giveaways, Polls, Payments, Invoices, UserAccounts } from '../../database/queries.js';
import { updateOrderStatus, confirmOrder } from '../../services/orderService.js';
import { closeTicket } from '../../services/ticketService.js';
import { verifyPayment, rejectPayment } from '../../services/paymentService.js';
import { redeemPoints } from '../../services/accountService.js';
import { successCard, errorCard, warningCard, buildPaymentProofCard, buildCloseConfirmCard, buildGiveawayCard } from '../../ui/v2/generalV2.js';
import { buildOrderConfirmedCard, buildNewOrderNotification } from '../../ui/v2/orderV2.js';
import { buildTicketClaimedCard } from '../../ui/v2/ticketV2.js';
import { isStaff } from '../../utils/permissions.js';
import { config } from '../../config/config.js';

function buildSetPriceModal(orderId) {
  return new ModalBuilder()
    .setCustomId(`set_price_${orderId}`)
    .setTitle(`Set Price — ${orderId}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('price').setLabel('Price (USD)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 49.99').setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('notes').setLabel('Notes (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)
      ),
    );
}

function buildCouponModal(orderId) {
  return new ModalBuilder()
    .setCustomId(`coupon_modal_${orderId}`)
    .setTitle('Apply Coupon Code')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('coupon_code').setLabel('Coupon Code').setStyle(TextInputStyle.Short).setPlaceholder('e.g. SAVE20').setRequired(true)
      )
    );
}

function buildPaymentProofModal(orderId) {
  return new ModalBuilder()
    .setCustomId(`payment_proof_${orderId}`)
    .setTitle('Submit Payment Proof')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('method').setLabel('Payment Method Used').setStyle(TextInputStyle.Short).setPlaceholder('e.g. PayPal, Crypto').setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('tx_id').setLabel('Transaction ID / Reference').setStyle(TextInputStyle.Short).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('notes').setLabel('Additional Notes').setStyle(TextInputStyle.Paragraph).setRequired(false)
      ),
    );
}

export async function handleButton(interaction, client) {
  const { customId } = interaction;
  logger.debug('ButtonInteraction', `Button: ${customId} by ${interaction.user.tag}`);

  // ── Order: Confirm ──────────────────────────────
  if (customId.startsWith('order_confirm_')) {
    const orderId = customId.replace('order_confirm_', '');
    const order = Orders.findById(orderId);
    if (!order || order.user_id !== interaction.user.id) {
      return interaction.reply(errorCard('Not Found', 'Order not found or not yours.'));
    }
    await interaction.deferUpdate();
    const confirmed = confirmOrder(orderId, interaction.user.id, interaction.user.tag);

    await interaction.followUp({ ...buildOrderConfirmedCard(confirmed), flags: 64 });

    // Notify staff in orders channel
    const ordersChannel = interaction.guild.channels.cache.find(c => c.name === 'orders');
    if (ordersChannel) {
      await ordersChannel.send(buildNewOrderNotification(confirmed)).catch(() => {});
    }
    return;
  }

  // ── Order: Cancel ───────────────────────────────
  if (customId.startsWith('order_cancel_')) {
    const orderId = customId.replace('order_cancel_', '');
    Orders.updateStatus(orderId, 'Cancelled');
    await interaction.update({ components: [] });
    await interaction.followUp({ ...errorCard('Order Cancelled', 'Your order was discarded. Use `/order` to start a new one.'), flags: 64 });
    return;
  }

  // ── Order: Apply Coupon ─────────────────────────
  if (customId.startsWith('order_coupon_')) {
    const orderId = customId.replace('order_coupon_', '');
    return interaction.showModal(buildCouponModal(orderId));
  }

  // ── Order: Submit Payment ───────────────────────
  if (customId.startsWith('order_pay_')) {
    const orderId = customId.replace('order_pay_', '');
    return interaction.showModal(buildPaymentProofModal(orderId));
  }

  // ── Ticket: Close ───────────────────────────────
  if (customId.startsWith('ticket_close_') && !customId.includes('confirm') && !customId.includes('cancel')) {
    const ticketId = customId.replace('ticket_close_', '');
    const ticket = Tickets.findById(ticketId);
    if (!ticket) return interaction.reply({ ...errorCard('Not Found', 'Ticket not found.'), flags: 64 });
    if (ticket.user_id !== interaction.user.id && !isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Only the ticket owner or staff can close this ticket.'), flags: 64 });
    }
    return interaction.reply({ ...buildCloseConfirmCard(ticketId), flags: 64 });
  }

  // ── Ticket: Close Confirm ───────────────────────
  if (customId.startsWith('ticket_close_confirm_')) {
    await interaction.deferUpdate();
    try {
      await closeTicket({ guild: interaction.guild, channel: interaction.channel, closedBy: interaction.user });
    } catch (err) {
      await interaction.followUp({ ...errorCard('Error', err.message), flags: 64 });
    }
    return;
  }

  // ── Ticket: Close Cancel ────────────────────────
  if (customId.startsWith('ticket_close_cancel_')) {
    return interaction.update({ components: [] });
  }

  // ── Ticket: Claim ───────────────────────────────
  if (customId.startsWith('ticket_claim_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Only staff can claim tickets.'), flags: 64 });
    }
    const ticketId = customId.replace('ticket_claim_', '');
    Tickets.updateAssignee(ticketId, interaction.user.id, interaction.user.tag);
    return interaction.reply(buildTicketClaimedCard(interaction.user));
  }

  // ── Ticket: Transcript ──────────────────────────
  if (customId.startsWith('ticket_transcript_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Only staff can save transcripts.'), flags: 64 });
    }
    return interaction.reply({ ...successCard('Transcript Queued', 'The transcript will be saved when this ticket closes.'), flags: 64 });
  }

  // ── Staff: Set Price ────────────────────────────
  if (customId.startsWith('set_price_btn_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Staff only.'), flags: 64 });
    }
    const orderId = customId.replace('set_price_btn_', '');
    return interaction.showModal(buildSetPriceModal(orderId));
  }

  // ── Payment: Verify ─────────────────────────────
  if (customId.startsWith('payment_verify_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Staff only.'), flags: 64 });
    }
    const paymentId = customId.replace('payment_verify_', '');
    try {
      await verifyPayment(paymentId, interaction.user.id, interaction.user.tag, interaction.client);
      await interaction.update({ components: [] });
      await interaction.followUp({ ...successCard('Payment Verified', `Payment \`${paymentId}\` verified and order status updated.`), flags: 64 });
    } catch (err) {
      await interaction.reply({ ...errorCard('Error', err.message), flags: 64 });
    }
    return;
  }

  // ── Payment: Reject ──────────────────────────────
  if (customId.startsWith('payment_reject_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Staff only.'), flags: 64 });
    }
    const paymentId = customId.replace('payment_reject_', '');
    try {
      await rejectPayment(paymentId, interaction.user.id, interaction.user.tag, interaction.client);
      await interaction.update({ components: [] });
      await interaction.followUp({ ...errorCard('Payment Rejected', `Payment \`${paymentId}\` has been rejected. The customer has been notified.`), flags: 64 });
    } catch (err) {
      await interaction.reply({ ...errorCard('Error', err.message), flags: 64 });
    }
    return;
  }

  // ── Points: Redeem ───────────────────────────────
  if (customId.startsWith('points_redeem_')) {
    const [, , userId, amount] = customId.split('_');
    if (interaction.user.id !== userId) {
      return interaction.reply({ ...errorCard('Not Yours', 'This button is not for you.'), flags: 64 });
    }
    try {
      const pts = parseInt(amount, 10);
      redeemPoints(interaction.user.id, pts, 'Redeemed via button', interaction.client);
      await interaction.update({ components: [] });
      await interaction.followUp({ ...successCard('Points Redeemed!', `You've redeemed **${pts} points** for a discount. A staff member will apply it to your next invoice.`), flags: 64 });
    } catch (err) {
      await interaction.reply({ ...errorCard('Error', err.message), flags: 64 });
    }
    return;
  }

  logger.warn('ButtonInteraction', `Unhandled button: ${customId}`);
}

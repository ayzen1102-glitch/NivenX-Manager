/**
 * NivenX Assistant - Button Interaction Sub-handler
 * Routes button clicks to the correct handler based on customId prefix.
 */

import { logger } from '../../utils/logger.js';
import { Orders, Tickets, Coupons } from '../../database/queries.js';
import { updateOrderStatus } from '../../services/orderService.js';
import { closeTicket } from '../../services/ticketService.js';
import { buildOrderEmbed } from '../../ui/embeds/orderEmbed.js';
import { buildSetPriceModal, buildCouponModal } from '../../ui/components/orderComponents.js';
import { buildCloseConfirmButtons } from '../../ui/components/ticketComponents.js';
import { successEmbed, errorEmbed, warningEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';
import { isStaff } from '../../utils/permissions.js';

export async function handleButton(interaction, client) {
  const { customId } = interaction;
  logger.debug('ButtonInteraction', `Button: ${customId} by ${interaction.user.tag}`);

  // ── Order: Confirm ──────────────────────────────
  if (customId.startsWith('order_confirm_')) {
    const orderId = customId.replace('order_confirm_', '');
    const order = Orders.findById(orderId);

    if (!order || order.user_id !== interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed('Not Found', 'Order not found or not yours.')], ephemeral: true });
    }

    // Disable buttons
    await interaction.update({ components: [] });

    const embed = buildOrderEmbed(order);
    await interaction.followUp({
      embeds: [
        embed,
        successEmbed('Order Submitted!', `Your order **${orderId}** has been received.\nA staff member will review it shortly and reach out via ticket.`),
      ],
      ephemeral: true,
    });

    // Notify in orders channel if configured
    const ordersChannel = interaction.guild.channels.cache.find(c => c.name === 'orders');
    if (ordersChannel) {
      await ordersChannel.send({
        embeds: [buildOrderEmbed(order)],
        content: `📦 New order from <@${order.user_id}>`,
      });
    }
  }

  // ── Order: Cancel ───────────────────────────────
  else if (customId.startsWith('order_cancel_')) {
    await interaction.update({
      embeds: [errorEmbed('Order Cancelled', 'Your order has been discarded.')],
      components: [],
    });
  }

  // ── Order: Apply Coupon ─────────────────────────
  else if (customId.startsWith('order_coupon_')) {
    const orderId = customId.replace('order_coupon_', '');
    await interaction.showModal(buildCouponModal(orderId));
  }

  // ── Ticket: Close ───────────────────────────────
  else if (customId.startsWith('ticket_close_') && !customId.includes('confirm') && !customId.includes('cancel')) {
    const ticketId = customId.replace('ticket_close_', '');
    const ticket = Tickets.findById(ticketId);

    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not Found', 'Ticket not found.')], ephemeral: true });

    // Only ticket owner or staff can close
    if (ticket.user_id !== interaction.user.id && !isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Only the ticket owner or staff can close this ticket.')], ephemeral: true });
    }

    await interaction.reply({
      embeds: [warningEmbed('Close Ticket?', 'Are you sure you want to close this ticket? A transcript will be saved.')],
      components: [buildCloseConfirmButtons(ticketId)],
      ephemeral: true,
    });
  }

  // ── Ticket: Close Confirm ───────────────────────
  else if (customId.startsWith('ticket_close_confirm_')) {
    await interaction.deferUpdate();
    try {
      await closeTicket({
        guild: interaction.guild,
        channel: interaction.channel,
        closedBy: interaction.user,
      });
    } catch (err) {
      await interaction.followUp({ embeds: [errorEmbed('Error', err.message)], ephemeral: true });
    }
  }

  // ── Ticket: Close Cancel ────────────────────────
  else if (customId.startsWith('ticket_close_cancel_')) {
    await interaction.update({ content: 'Close cancelled.', embeds: [], components: [] });
  }

  // ── Ticket: Claim ───────────────────────────────
  else if (customId.startsWith('ticket_claim_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff can claim tickets.')], ephemeral: true });
    }
    await interaction.reply({
      embeds: [successEmbed('Ticket Claimed', `This ticket has been claimed by <@${interaction.user.id}>. Staff will assist shortly.`)],
    });
  }

  // ── Ticket: Transcript ──────────────────────────
  else if (customId.startsWith('ticket_transcript_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff can save transcripts manually.')], ephemeral: true });
    }
    await interaction.reply({ embeds: [successEmbed('Transcript Saved', 'Transcript will be saved when the ticket is closed.')], ephemeral: true });
  }

  // ── Staff: Set Price ────────────────────────────
  else if (customId.startsWith('set_price_btn_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Staff only.')], ephemeral: true });
    }
    const orderId = customId.replace('set_price_btn_', '');
    await interaction.showModal(buildSetPriceModal(orderId));
  }

  else {
    logger.warn('ButtonInteraction', `Unhandled button customId: ${customId}`);
  }
}

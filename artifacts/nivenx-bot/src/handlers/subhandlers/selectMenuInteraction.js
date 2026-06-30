/**
 * NivenX - Select Menu Interaction Handler (Components V2)
 */

import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { Orders, UserAccounts } from '../../database/queries.js';
import { updateOrderStatus } from '../../services/orderService.js';
import { createTicket } from '../../services/ticketService.js';
import { successCard, errorCard, buildFaqCard } from '../../ui/v2/generalV2.js';
import { buildOrderSummaryCard } from '../../ui/v2/orderV2.js';
import { config } from '../../config/config.js';
import { isStaff } from '../../utils/permissions.js';
import { randomUUID } from 'crypto';

const FAQS = {
  how_order: { label: '📦 How do I place an order?', answer: 'Use `/order`, pick a service, fill in the form, and confirm. You\'ll get an order ID and a support ticket is created automatically.' },
  how_ticket: { label: '🎫 How do I open a support ticket?', answer: 'Use `/ticket` and select a category. A private channel is created for you and our team.' },
  payment: { label: '💳 What payment methods do you accept?', answer: 'We accept PayPal, Crypto (BTC, ETH, LTC), and bank transfer. Staff will send an invoice with payment details after reviewing your order.' },
  timeline: { label: '⏱️ How long does delivery take?', answer: '• Hosting/VPS: 1–24 hours\n• Domain: 1–2 hours\n• Discord Setup: 1–3 days\n• Bot Dev: 3–14 days\n• Website: 7–30 days\n\nTimelines are confirmed at order review.' },
  refund: { label: '💰 What is your refund policy?', answer: 'Refunds within 48 hours of payment if work hasn\'t started. After work begins, refunds are at our discretion. Open a ticket to discuss.' },
  cancel: { label: '❌ Can I cancel my order?', answer: 'Open a ticket and reference your order ID. Free cancellation before work begins.' },
  review: { label: '⭐ How do I leave a review?', answer: 'Use `/review` after your order is Completed. Provide your order ID, a star rating (1–5), and optional comment. You\'ll earn points!' },
  coupon: { label: '🎟️ How do I use a coupon?', answer: 'After filling in your order form, click the **Apply Coupon** button and enter your code.' },
};

function buildOrderModal(serviceId, tempId) {
  const service = config.services.find(s => s.id === serviceId);
  const fields = service?.fields ?? ['Requirements', 'Budget', 'Timeline'];
  const modal = new ModalBuilder()
    .setCustomId(`order_form_${serviceId}_${tempId}`)
    .setTitle(`Order: ${service?.label ?? serviceId}`);
  fields.slice(0, 5).forEach((field, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`field_${i}`)
          .setLabel(field)
          .setStyle(i === 0 ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(i === 0)
      )
    );
  });
  return modal;
}

export async function handleSelectMenu(interaction, client) {
  const { customId, values } = interaction;
  logger.debug('SelectMenu', `Menu: ${customId} = ${values.join(',')} by ${interaction.user.tag}`);

  // ── FAQ ─────────────────────────────────────────
  if (customId === 'faq_select') {
    const faq = FAQS[values[0]];
    if (!faq) return;
    return interaction.reply({ ...buildFaqCard(faq.label, faq.answer), flags: 64 });
  }

  // ── Service select → Order form modal ───────────
  if (customId === 'service_select') {
    const account = UserAccounts.findById(interaction.user.id);
    if (account?.blacklisted) {
      return interaction.reply({ ...errorCard('Order Blocked', 'You are not permitted to place orders. Contact staff.'), flags: 64 });
    }
    const serviceId = values[0];
    const service = config.services.find(s => s.id === serviceId);
    if (!service) return interaction.reply({ ...errorCard('Error', 'Unknown service.'), flags: 64 });

    const tempId = randomUUID().split('-')[0];
    if (!client.pendingOrders) client.pendingOrders = new Map();
    client.pendingOrders.set(`${interaction.user.id}_${tempId}`, {
      serviceId, serviceLabel: service.label,
      userId: interaction.user.id, userTag: interaction.user.tag,
      guildId: interaction.guildId,
    });
    return interaction.showModal(buildOrderModal(serviceId, tempId));
  }

  // ── Ticket category select ───────────────────────
  if (customId === 'ticket_category_select') {
    const category = values[0];
    await interaction.deferReply({ flags: 64 });
    try {
      const { channel } = await createTicket({ guild: interaction.guild, user: interaction.user, category });
      await interaction.editReply(successCard('Ticket Created', `Your ticket: <#${channel.id}>\n\nA staff member will assist you shortly.`));
    } catch (err) {
      await interaction.editReply(errorCard('Error', err.message));
    }
    return;
  }

  // ── Order status update (staff) ──────────────────
  if (customId.startsWith('status_update_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Staff only.'), flags: 64 });
    }
    const orderId = customId.replace('status_update_', '');
    const newStatus = values[0];
    try {
      updateOrderStatus(orderId, newStatus, interaction.user.id, interaction.user.tag);
      await interaction.update({ components: [] });
      await interaction.followUp({ ...successCard('Status Updated', `Order **${orderId}** → **${newStatus}**`), flags: 64 });
    } catch (err) {
      await interaction.reply({ ...errorCard('Error', err.message), flags: 64 });
    }
    return;
  }

  logger.warn('SelectMenu', `Unhandled: ${customId}`);
}

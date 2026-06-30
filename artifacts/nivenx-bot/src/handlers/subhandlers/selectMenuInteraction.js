/**
 * NivenX Assistant - Select Menu Interaction Sub-handler
 */

import { logger } from '../../utils/logger.js';
import { Orders } from '../../database/queries.js';
import { updateOrderStatus } from '../../services/orderService.js';
import { createTicket } from '../../services/ticketService.js';
import { buildOrderModal } from '../../ui/components/orderComponents.js';
import { buildOrderEmbed } from '../../ui/embeds/orderEmbed.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';
import { isStaff } from '../../utils/permissions.js';
import { Blacklist } from '../../commands/admin/blacklist.js';
import { randomUUID } from 'crypto';

const FAQS = {
  how_order: { label: '📦 How do I place an order?', answer: 'Use the `/order` command and select your desired service. Fill in the form and confirm. You\'ll receive an order ID (e.g., NVX-0001) and a staff member will contact you.' },
  how_ticket: { label: '🎫 How do I open a support ticket?', answer: 'Use `/ticket` and select a category. A private channel will be created for you and our team will respond shortly.' },
  payment: { label: '💳 What payment methods do you accept?', answer: 'We accept PayPal, Crypto (BTC, ETH, LTC), and bank transfer. Once your order is reviewed, a staff member will send you an invoice with payment details.' },
  timeline: { label: '⏱️ How long does delivery take?', answer: 'Delivery time depends on the service:\n• Hosting/VPS: 1–24 hours\n• Domain setup: 1–2 hours\n• Discord Server Setup: 1–3 days\n• Bot Development: 3–14 days\n• Website: 7–30 days' },
  refund: { label: '💰 What is your refund policy?', answer: 'Refunds are available within 48 hours of payment if work has not started. Once development or setup has begun, refunds are issued at our discretion.' },
  cancel: { label: '❌ Can I cancel my order?', answer: 'Open a ticket and reference your order ID. Orders can be cancelled before work begins with no charge.' },
  review: { label: '⭐ How do I leave a review?', answer: 'Use `/review` after your order is marked Completed. Provide your order ID, a star rating (1–5), and optional comment.' },
  coupon: { label: '🎟️ How do I use a coupon?', answer: 'When placing an order, after filling out the form click Apply Coupon. Enter your code and the discount will be applied to your invoice.' },
};

export async function handleSelectMenu(interaction, client) {
  const { customId, values } = interaction;
  logger.debug('SelectMenu', `Menu: ${customId} = ${values.join(',')} by ${interaction.user.tag}`);

  // ── FAQ selection ───────────────────────────────
  if (customId === 'faq_select') {
    const faq = FAQS[values[0]];
    if (!faq) return;
    const { EmbedBuilder } = await import('discord.js');
    const embed = new EmbedBuilder()
      .setTitle(faq.label)
      .setDescription(faq.answer)
      .setColor(config.bot.infoColor)
      .setFooter({ text: 'Need more help? Open a ticket with /ticket' });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ── Service Selection → Show Order Form Modal ───
  if (customId === 'service_select') {
    // Check blacklist
    if (Blacklist.isBlacklisted(interaction.user.id)) {
      return interaction.reply({
        embeds: [errorEmbed('Order Blocked', 'You are not permitted to place orders. Contact staff for more information.')],
        ephemeral: true,
      });
    }

    const serviceId = values[0];
    const service = config.services.find(s => s.id === serviceId);
    if (!service) return interaction.reply({ embeds: [errorEmbed('Error', 'Unknown service.')], ephemeral: true });

    const tempId = randomUUID().split('-')[0];
    if (!client.pendingOrders) client.pendingOrders = new Map();
    client.pendingOrders.set(`${interaction.user.id}_${tempId}`, {
      serviceId,
      serviceLabel: service.label,
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId,
    });

    await interaction.showModal(buildOrderModal(serviceId, tempId));
  }

  // ── Ticket Category Selection ───────────────────
  else if (customId === 'ticket_category_select') {
    const category = values[0];
    await interaction.deferReply({ ephemeral: true });

    try {
      const { ticket, channel } = await createTicket({
        guild: interaction.guild,
        user: interaction.user,
        category,
      });
      await interaction.editReply({
        embeds: [successEmbed('Ticket Created', `Your ticket has been created: <#${channel.id}>\n\nA staff member will assist you shortly.`)],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [errorEmbed('Error', err.message)] });
    }
  }

  // ── Order Status Update (staff) ─────────────────
  else if (customId.startsWith('status_update_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Staff only.')], ephemeral: true });
    }
    const orderId = customId.replace('status_update_', '');
    const newStatus = values[0];
    try {
      const updated = updateOrderStatus(orderId, newStatus, interaction.user.id, interaction.user.tag);
      await interaction.update({ embeds: [buildOrderEmbed(updated)], components: [] });
      await interaction.followUp({
        embeds: [successEmbed('Status Updated', `Order **${orderId}** → **${newStatus}**`)],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed('Error', err.message)], ephemeral: true });
    }
  }

  else {
    logger.warn('SelectMenu', `Unhandled select menu: ${customId}`);
  }
}

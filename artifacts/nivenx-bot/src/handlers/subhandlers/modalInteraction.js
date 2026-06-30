/**
 * NivenX - Modal Interaction Handler (Components V2)
 * Handles all modal submissions.
 */

import { logger } from '../../utils/logger.js';
import { Orders, Coupons, Quotes, Feedback, UserAccounts, Payments, generateQuoteId } from '../../database/queries.js';
import { createOrder, setOrderPrice } from '../../services/orderService.js';
import { submitPaymentProof } from '../../services/paymentService.js';
import { buildOrderSummaryCard, buildOrderConfirmedCard } from '../../ui/v2/orderV2.js';
import { successCard, errorCard, buildQuoteCard } from '../../ui/v2/generalV2.js';
import { config } from '../../config/config.js';
import { isStaff } from '../../utils/permissions.js';

export async function handleModal(interaction, client) {
  const { customId } = interaction;
  logger.debug('ModalInteraction', `Modal: ${customId} by ${interaction.user.tag}`);

  // ── Order Form Submission ───────────────────────
  if (customId.startsWith('order_form_')) {
    const rest = customId.replace('order_form_', '');
    const parts = rest.split('_');
    const tempId = parts[parts.length - 1];
    const serviceId = parts.slice(0, -1).join('_');

    await interaction.deferReply({ flags: 64 });

    const pendingKey = `${interaction.user.id}_${tempId}`;
    const pending = client.pendingOrders?.get(pendingKey);
    if (!pending) {
      return interaction.editReply(errorCard('Session Expired', 'Your order session expired. Please run `/order` again.'));
    }

    const service = config.services.find(s => s.id === serviceId);
    if (!service) return interaction.editReply(errorCard('Error', 'Unknown service.'));

    const formData = {};
    (service.fields ?? []).slice(0, 5).forEach((field, i) => {
      try { formData[field] = interaction.fields.getTextInputValue(`field_${i}`); } catch {}
    });

    pending.formData = formData;

    const order = createOrder({
      userId: interaction.user.id, userTag: interaction.user.tag,
      guildId: interaction.guildId, serviceId, serviceLabel: service.label,
      formData, couponCode: null,
    });

    pending.orderId = order.order_id;
    client.pendingOrders.set(pendingKey, pending);

    setTimeout(() => client.pendingOrders?.delete(pendingKey), 10 * 60 * 1000);

    return interaction.editReply(buildOrderSummaryCard(service.label, formData, order.order_id));
  }

  // ── Coupon modal ────────────────────────────────
  if (customId.startsWith('coupon_modal_')) {
    const orderId = customId.replace('coupon_modal_', '');
    const code = interaction.fields.getTextInputValue('coupon_code').trim().toUpperCase();
    const coupon = Coupons.validate(code);
    if (!coupon) {
      return interaction.reply({ ...errorCard('Invalid Coupon', `Code \`${code}\` is invalid, expired, or already used.`), flags: 64 });
    }
    const discountText = coupon.discount_type === 'percent' ? `${coupon.discount_value}% off` : `$${coupon.discount_value} off`;
    Orders.applyCoupon(orderId, code);
    return interaction.reply({ ...successCard('Coupon Applied!', `Code \`${code}\` — **${discountText}**\nThis discount will appear on your invoice.`), flags: 64 });
  }

  // ── Payment Proof modal ─────────────────────────
  if (customId.startsWith('payment_proof_')) {
    const orderId = customId.replace('payment_proof_', '');
    const method = interaction.fields.getTextInputValue('method');
    const txId = interaction.fields.getTextInputValue('tx_id');
    const notes = (() => { try { return interaction.fields.getTextInputValue('notes'); } catch { return ''; } })();

    try {
      const proof = submitPaymentProof({ orderId, userId: interaction.user.id, userTag: interaction.user.tag, method, txId, notes });
      await interaction.reply({ ...successCard('Payment Submitted!', `Your payment proof has been received.\nReference: \`${txId}\`\n\nStaff will verify and update your order.`), flags: 64 });

      // Notify staff
      const ordersChannel = interaction.guild?.channels.cache.find(c => c.name === 'orders');
      if (ordersChannel) await ordersChannel.send(buildPaymentProofCard(proof, interaction.user)).catch(() => {});
    } catch (err) {
      return interaction.reply({ ...errorCard('Error', err.message), flags: 64 });
    }
    return;
  }

  // ── Set price modal (staff) ─────────────────────
  if (customId.startsWith('set_price_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ ...errorCard('Permission Denied', 'Staff only.'), flags: 64 });
    }
    const orderId = customId.replace('set_price_', '');
    const priceStr = interaction.fields.getTextInputValue('price').replace(/[^0-9.]/g, '');
    const notes = (() => { try { return interaction.fields.getTextInputValue('notes'); } catch { return null; } })();
    const price = parseFloat(priceStr);

    if (isNaN(price) || price < 0) {
      return interaction.reply({ ...errorCard('Invalid Price', 'Please enter a valid positive number.'), flags: 64 });
    }

    try {
      setOrderPrice(orderId, price, notes, interaction.user.id, interaction.user.tag);
      Orders.updateStatus(orderId, 'Awaiting Payment');
      await interaction.reply({ ...successCard('Price Set', `Order **${orderId}** — **$${price.toFixed(2)}**\nStatus: Awaiting Payment`), flags: 64 });

      // DM the client
      const order = Orders.findById(orderId);
      if (order) {
        const user = await interaction.client.users.fetch(order.user_id).catch(() => null);
        if (user) await user.send(successCard('Invoice Ready', `Your order **${orderId}** has been priced at **$${price.toFixed(2)}**.\n\nPlease open your ticket to submit payment.`)).catch(() => {});
      }
    } catch (err) {
      await interaction.reply({ ...errorCard('Error', err.message), flags: 64 });
    }
    return;
  }

  // ── Quote modal ─────────────────────────────────
  if (customId === 'quote_request_modal') {
    const service = interaction.fields.getTextInputValue('service');
    const description = interaction.fields.getTextInputValue('description');
    const budget = (() => { try { return interaction.fields.getTextInputValue('budget'); } catch { return 'Not specified'; } })();

    const quoteId = `QT-${String(Date.now()).slice(-5)}`;
    Quotes.create({ quoteId, userId: interaction.user.id, userTag: interaction.user.tag, service, description, budget });

    await interaction.reply({ ...successCard('Quote Requested!', `Your quote request \`${quoteId}\` has been submitted.\n\nA staff member will respond via ticket within 24 hours.`), flags: 64 });

    const quotesChannel = interaction.guild?.channels.cache.find(c => c.name === 'quotes' || c.name === 'quote-requests');
    if (quotesChannel) await quotesChannel.send(buildQuoteCard({ quoteId, service, description, budget }, interaction.user)).catch(() => {});
    return;
  }

  logger.warn('ModalInteraction', `Unhandled modal: ${customId}`);
}

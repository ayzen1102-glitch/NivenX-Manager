/**
 * NivenX Assistant - Modal Interaction Sub-handler
 * Handles form submissions from modals (order forms, set price, coupons).
 */

import { logger } from '../../utils/logger.js';
import { Orders, Coupons } from '../../database/queries.js';
import { createOrder, setOrderPrice } from '../../services/orderService.js';
import { buildOrderSummaryEmbed } from '../../ui/embeds/orderEmbed.js';
import { buildOrderConfirmButtons } from '../../ui/components/orderComponents.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';
import { isStaff } from '../../utils/permissions.js';

export async function handleModal(interaction, client) {
  const { customId } = interaction;
  logger.debug('ModalInteraction', `Modal: ${customId} by ${interaction.user.tag}`);

  // ── Order Form Submission ───────────────────────
  if (customId.startsWith('order_form_')) {
    // customId format: order_form_{serviceId}_{tempId}
    const parts = customId.replace('order_form_', '').split('_');
    const tempId = parts[parts.length - 1];
    const serviceId = parts.slice(0, -1).join('_');

    await interaction.deferReply({ ephemeral: true });

    const pendingKey = `${interaction.user.id}_${tempId}`;
    const pending = client.pendingOrders?.get(pendingKey);

    if (!pending) {
      return interaction.editReply({ embeds: [errorEmbed('Session Expired', 'Your order session expired. Please start over.')] });
    }

    const service = config.services.find(s => s.id === serviceId);
    if (!service) {
      return interaction.editReply({ embeds: [errorEmbed('Error', 'Unknown service.')] });
    }

    // Collect form field values into a keyed object
    const formData = {};
    service.fields.slice(0, 5).forEach((field, i) => {
      formData[field] = interaction.fields.getTextInputValue(`field_${i}`);
    });

    // Store the form data in pending (before coupon/confirm)
    pending.formData = formData;
    client.pendingOrders.set(pendingKey, pending);

    // Create the order in DB immediately (Pending status)
    const order = await createOrder({
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId,
      serviceId,
      serviceLabel: service.label,
      formData,
      couponCode: null,
    });

    // Store the real order ID in pending for confirm/coupon
    pending.orderId = order.order_id;
    client.pendingOrders.set(pendingKey, pending);

    const summaryEmbed = buildOrderSummaryEmbed(service.label, formData);
    const confirmButtons = buildOrderConfirmButtons(order.order_id);

    await interaction.editReply({
      embeds: [summaryEmbed],
      components: [confirmButtons],
    });

    // Clean up pending after 10 minutes
    setTimeout(() => client.pendingOrders?.delete(pendingKey), 10 * 60 * 1000);
  }

  // ── Coupon Code Modal ───────────────────────────
  else if (customId.startsWith('coupon_modal_')) {
    const orderId = customId.replace('coupon_modal_', '');
    const code = interaction.fields.getTextInputValue('coupon_code').trim().toUpperCase();

    const coupon = Coupons.validate(code);
    if (!coupon) {
      return interaction.reply({
        embeds: [errorEmbed('Invalid Coupon', `The code \`${code}\` is invalid, expired, or already used.`)],
        ephemeral: true,
      });
    }

    const discountText = coupon.discount_type === 'percent'
      ? `${coupon.discount_value}% off`
      : `$${coupon.discount_value} off`;

    await interaction.reply({
      embeds: [successEmbed('Coupon Applied!', `Code \`${coupon.code}\` applied — **${discountText}**.\nThis discount will be reflected in your final invoice.`)],
      ephemeral: true,
    });
  }

  // ── Set Order Price (staff) ─────────────────────
  else if (customId.startsWith('set_price_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Staff only.')], ephemeral: true });
    }

    const orderId = customId.replace('set_price_', '');
    const priceStr = interaction.fields.getTextInputValue('price').replace('$', '').trim();
    const notes = interaction.fields.getTextInputValue('notes')?.trim() || null;
    const price = parseFloat(priceStr);

    if (isNaN(price) || price < 0) {
      return interaction.reply({ embeds: [errorEmbed('Invalid Price', 'Please enter a valid positive number.')], ephemeral: true });
    }

    try {
      setOrderPrice(orderId, price, notes, interaction.user.id, interaction.user.tag);
      await interaction.reply({
        embeds: [successEmbed('Price Set', `Order **${orderId}** price set to **$${price.toFixed(2)}**.\nStatus updated to Awaiting Payment.`)],
        ephemeral: true,
      });
      // Auto-advance to Awaiting Payment
      Orders.updateStatus(orderId, 'Awaiting Payment');
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed('Error', err.message)], ephemeral: true });
    }
  }

  else {
    logger.warn('ModalInteraction', `Unhandled modal: ${customId}`);
  }
}

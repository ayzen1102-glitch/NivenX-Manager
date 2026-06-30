/**
 * NivenX Assistant - Order UI Components
 * Buttons, select menus, and modals for the order flow.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { config } from '../../config/config.js';

/**
 * Build the service selection menu.
 */
export function buildServiceSelectMenu() {
  const options = config.services.map(s => ({
    label: s.label,
    description: s.description,
    value: s.id,
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId('service_select')
    .setPlaceholder('Choose a service...')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(menu);
}

/**
 * Build the order confirmation buttons (Confirm / Cancel).
 */
export function buildOrderConfirmButtons(orderId) {
  const confirm = new ButtonBuilder()
    .setCustomId(`order_confirm_${orderId}`)
    .setLabel('✅ Confirm Order')
    .setStyle(ButtonStyle.Success);

  const cancel = new ButtonBuilder()
    .setCustomId(`order_cancel_${orderId}`)
    .setLabel('❌ Cancel')
    .setStyle(ButtonStyle.Danger);

  const coupon = new ButtonBuilder()
    .setCustomId(`order_coupon_${orderId}`)
    .setLabel('🎟️ Apply Coupon')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(confirm, coupon, cancel);
}

/**
 * Build a dynamic order form modal based on the selected service.
 * @param {string} serviceId - The service ID from config
 * @param {string} tempId - Temporary session ID (to match response)
 */
export function buildOrderModal(serviceId, tempId) {
  const service = config.services.find(s => s.id === serviceId);
  if (!service) throw new Error(`Service not found: ${serviceId}`);

  const modal = new ModalBuilder()
    .setCustomId(`order_form_${serviceId}_${tempId}`)
    .setTitle(`Order: ${service.label}`);

  // Build one text input per field (max 5 in a Discord modal)
  const inputs = service.fields.slice(0, 5).map((field, i) =>
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(`field_${i}`)
        .setLabel(field)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(200)
    )
  );

  modal.addComponents(...inputs);
  return modal;
}

/**
 * Build coupon code input modal.
 */
export function buildCouponModal(orderId) {
  const modal = new ModalBuilder()
    .setCustomId(`coupon_modal_${orderId}`)
    .setTitle('Apply Coupon Code');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('coupon_code')
        .setLabel('Enter your coupon code')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(20)
        .setPlaceholder('e.g. SAVE20')
    )
  );

  return modal;
}

/**
 * Build order status update select menu (for staff).
 */
export function buildStatusSelectMenu(orderId) {
  const statuses = Object.values(config.orderStatuses);
  const options = statuses.map(s => ({ label: s, value: s }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`status_update_${orderId}`)
    .setPlaceholder('Select new status...')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(menu);
}

/**
 * Build order price/notes set modal (for staff).
 */
export function buildSetPriceModal(orderId) {
  const modal = new ModalBuilder()
    .setCustomId(`set_price_${orderId}`)
    .setTitle('Set Order Price');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('price')
        .setLabel('Price (USD)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder('e.g. 49.99')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('notes')
        .setLabel('Staff Notes (optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500)
    )
  );

  return modal;
}

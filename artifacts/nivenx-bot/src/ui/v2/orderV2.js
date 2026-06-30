/**
 * NivenX Assistant - Order Components V2 Builders
 */

import {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  MessageFlags, SeparatorSpacingSize,
} from 'discord.js';
import {
  text, sep, bigSep, container, row, btn, btnSuccess, btnDanger, btnSecondary, btnPrimary,
  Colors, V2Flags, V2EphemeralFlags, formatDate, formatRelative, formatCurrency,
  statusEmoji, ratingStars, progressBar,
} from './builder.js';
import { config } from '../../config/config.js';

// ── Order Detail Card ─────────────────────────────────────────────────────────

export function buildOrderCard(order, ephemeral = false) {
  const details = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;
  const statusColor = config.statusColors[order.status] ?? Colors.primary;
  const emoji = statusEmoji(order.status);

  const lines = [`## 📦 Order \`${order.order_id}\``, ``];
  lines.push(`${emoji} **Status:** ${order.status}`);
  lines.push(`👤 **Customer:** <@${order.user_id}> (\`${order.user_tag}\`)`);
  lines.push(`🛍️ **Service:** ${order.service_label}`);
  if (order.price != null) lines.push(`💰 **Price:** ${formatCurrency(order.price)}`);
  if (order.discount_amount > 0) lines.push(`🏷️ **Discount:** -${formatCurrency(order.discount_amount)}`);
  if (order.coupon_code) lines.push(`🎟️ **Coupon:** \`${order.coupon_code}\``);
  if (order.assigned_to) lines.push(`👷 **Assigned:** <@${order.assigned_to}>`);
  lines.push(`📅 **Created:** ${formatDate(order.created_at)}`);
  lines.push(`🔄 **Updated:** ${formatRelative(order.updated_at)}`);

  const mainText = text(lines.join('\n'));

  const detailLines = [];
  if (details && typeof details === 'object') {
    detailLines.push(`\n**📋 Order Details**`);
    for (const [k, v] of Object.entries(details)) {
      detailLines.push(`> **${k}:** ${v}`);
    }
  }

  const notesLines = [];
  if (order.notes) {
    notesLines.push(`\n**📝 Staff Notes**`);
    notesLines.push(`> ${order.notes}`);
  }

  const paymentLines = [];
  if (order.payment_method) {
    paymentLines.push(`\n**💳 Payment**`);
    paymentLines.push(`> **Method:** ${order.payment_method}`);
    paymentLines.push(`> **Status:** ${order.payment_status ?? 'Pending'}`);
  }

  const allText = [
    lines.join('\n'),
    detailLines.length ? detailLines.join('\n') : null,
    notesLines.length ? notesLines.join('\n') : null,
    paymentLines.length ? paymentLines.join('\n') : null,
  ].filter(Boolean).join('\n');

  const components = [text(allText), sep()];

  const flags = ephemeral ? V2EphemeralFlags : V2Flags;
  return {
    components: [container(statusColor, ...components)],
    flags,
  };
}

// ── Order Summary (pre-confirm) ───────────────────────────────────────────────

export function buildOrderSummaryCard(serviceLabel, details, coupon = null, orderId = null) {
  const lines = [`## 📋 Order Summary`, ``, `> Please review your order before confirming.`, ``];
  lines.push(`🛍️ **Service:** ${serviceLabel}`);
  lines.push(``);
  lines.push(`**📝 Your Information**`);
  for (const [k, v] of Object.entries(details)) {
    lines.push(`> **${k}:** ${v}`);
  }

  if (coupon) {
    const discountText = coupon.discount_type === 'percent'
      ? `${coupon.discount_value}% off`
      : `$${coupon.discount_value} off`;
    lines.push(``, `🎟️ **Coupon Applied:** \`${coupon.code}\` — ${discountText}`);
  }

  const buttons = orderId ? row(
    btnSuccess(`order_confirm_${orderId}`, '✅ Confirm Order'),
    btnSecondary(`order_coupon_${orderId}`, '🎟️ Apply Coupon'),
    btnDanger(`order_cancel_${orderId}`, '❌ Cancel'),
  ) : null;

  const comps = [text(lines.join('\n')), sep()];
  if (buttons) comps.push(buttons);

  return {
    components: [container(Colors.info, ...comps)],
    flags: V2EphemeralFlags,
  };
}

// ── Order List ────────────────────────────────────────────────────────────────

export function buildOrderListCard(orders, title = '📦 Orders', ephemeral = false) {
  const lines = [`## ${title}`, ``];

  if (orders.length === 0) {
    lines.push(`*No orders found.*`);
  } else {
    for (const o of orders.slice(0, 20)) {
      const emoji = statusEmoji(o.status);
      lines.push(`${emoji} **\`${o.order_id}\`** — ${o.service_label} — <@${o.user_id}>`);
      lines.push(`  └ Status: **${o.status}** | ${formatRelative(o.created_at)}`);
    }
    if (orders.length > 20) lines.push(``, `*...and ${orders.length - 20} more*`);
  }

  const flags = ephemeral ? V2EphemeralFlags : V2Flags;
  return {
    components: [container(Colors.primary, text(lines.join('\n')))],
    flags,
  };
}

// ── New Order Notification (for #orders channel) ──────────────────────────────

export function buildNewOrderNotification(order) {
  const details = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;

  const lines = [
    `## 📦 New Order Received!`,
    ``,
    `👤 **Customer:** <@${order.user_id}> (\`${order.user_tag}\`)`,
    `🛍️ **Service:** ${order.service_label}`,
    `🆔 **Order ID:** \`${order.order_id}\``,
    `📅 **Placed:** ${formatRelative(order.created_at)}`,
    ``,
    `**📋 Details**`,
  ];
  for (const [k, v] of Object.entries(details ?? {})) {
    lines.push(`> **${k}:** ${v}`);
  }
  if (order.coupon_code) lines.push(``, `🎟️ Coupon: \`${order.coupon_code}\``);

  const actionRow = row(
    btn(`set_price_btn_${order.order_id}`, '💰 Set Price', ButtonStyle.Primary),
    btn(`assign_order_${order.order_id}`, '👷 Assign', ButtonStyle.Secondary),
    btn(`view_order_${order.order_id}`, '👁️ View', ButtonStyle.Secondary),
  );

  return {
    components: [container(Colors.warning,
      text(lines.join('\n')),
      sep(),
      actionRow,
    )],
    flags: V2Flags,
  };
}

// ── Order Confirmed (sent to user) ────────────────────────────────────────────

export function buildOrderConfirmedCard(order, ticketChannel = null) {
  const lines = [
    `## ✅ Order Confirmed!`,
    ``,
    `Your order **\`${order.order_id}\`** has been submitted successfully.`,
    ``,
    `🛍️ **Service:** ${order.service_label}`,
    `📊 **Status:** ${statusEmoji(order.status)} ${order.status}`,
    `📅 **Submitted:** ${formatDate(order.created_at)}`,
  ];

  if (ticketChannel) {
    lines.push(``, `🎫 **Your support ticket:** <#${ticketChannel}>`);
    lines.push(`A staff member will contact you there shortly.`);
  } else {
    lines.push(``, `A staff member will review your order and reach out soon.`);
  }

  lines.push(``, `> Use \`/myorders\` to track your order status.`);

  return {
    components: [container(Colors.success, text(lines.join('\n')))],
    flags: V2EphemeralFlags,
  };
}

// ── Payment Request Card (sent to user in ticket) ────────────────────────────

export function buildPaymentRequestCard(order, invoice, paymentInstructions) {
  const lines = [
    `## 💳 Payment Required`,
    ``,
    `**Order:** \`${order.order_id}\` — ${order.service_label}`,
    `**Invoice:** \`${invoice.invoice_id}\``,
    ``,
    `**Amount Due: ${formatCurrency(invoice.total)}**`,
  ];

  if (invoice.discount > 0) {
    lines.push(`🏷️ Discount Applied: -${formatCurrency(invoice.discount)}`);
  }

  if (invoice.due_date) {
    lines.push(`⏰ **Due:** ${formatDate(invoice.due_date)}`);
  }

  lines.push(``, `---`, ``, `**📋 Payment Instructions**`);
  for (const [method, details] of Object.entries(paymentInstructions)) {
    lines.push(``, `**${method}**`, `\`\`\`${details}\`\`\``);
  }

  lines.push(``, `> After sending payment, click **Submit Proof** below.`);

  const actionRow = row(
    btn(`submit_payment_${invoice.invoice_id}`, '📤 Submit Payment Proof', ButtonStyle.Success),
    btn(`payment_cancel_${invoice.invoice_id}`, '❓ I Need Help', ButtonStyle.Secondary),
  );

  return {
    components: [container(Colors.warning,
      text(lines.join('\n')),
      sep(),
      actionRow,
    )],
    flags: V2Flags,
  };
}

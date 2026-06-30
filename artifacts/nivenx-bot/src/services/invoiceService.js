/**
 * NivenX Assistant - Invoice Service
 * Generate and manage invoices tied to orders.
 */

import { EmbedBuilder } from 'discord.js';
import { Invoices, Orders, AuditLog, generateInvoiceId } from '../database/queries.js';
import { config } from '../config/config.js';

/**
 * Create an invoice for an order.
 */
export function createInvoice({ orderId, userId, amount, discount = 0, dueDate = null, notes = null }) {
  const invoiceId = generateInvoiceId();
  const total = Math.max(0, amount - discount);

  Invoices.create({
    invoiceId,
    orderId,
    userId,
    amount,
    discount,
    total,
    dueDate,
    notes,
  });

  return Invoices.findById(invoiceId);
}

/**
 * Build an invoice embed for display in Discord.
 */
export function buildInvoiceEmbed(invoice, order) {
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString()
    : 'Upon receipt';

  const statusColors = {
    unpaid: config.bot.warningColor,
    paid: config.bot.successColor,
    cancelled: config.bot.errorColor,
  };

  return new EmbedBuilder()
    .setTitle(`🧾 Invoice ${invoice.invoice_id}`)
    .setColor(statusColors[invoice.status] ?? config.bot.color)
    .addFields(
      { name: '📦 Order', value: invoice.order_id, inline: true },
      { name: '👤 Customer', value: `<@${invoice.user_id}>`, inline: true },
      { name: '📊 Status', value: `**${invoice.status.toUpperCase()}**`, inline: true },
      { name: '💵 Amount', value: `$${invoice.amount.toFixed(2)}`, inline: true },
      { name: '🏷️ Discount', value: `$${(invoice.discount ?? 0).toFixed(2)}`, inline: true },
      { name: '💰 Total Due', value: `**$${invoice.total.toFixed(2)}**`, inline: true },
      { name: '📅 Due Date', value: dueDate, inline: true },
    )
    .setDescription(order ? `**Service:** ${order.service_label}` : '')
    .setFooter({ text: `NivenX Assistant • Invoice generated` })
    .setTimestamp(new Date(invoice.created_at));
}

/**
 * Mark invoice as paid and update the related order.
 */
export function markInvoicePaid(invoiceId, actorId, actorTag) {
  const invoice = Invoices.findById(invoiceId);
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

  Invoices.markPaid(invoiceId);

  // Auto-advance order status to Paid
  Orders.updateStatus(invoice.order_id, 'Paid');

  AuditLog.insert({
    action: 'INVOICE_PAID',
    actorId,
    actorTag,
    targetType: 'invoice',
    targetId: invoiceId,
    details: { orderId: invoice.order_id, total: invoice.total },
  });

  return Invoices.findById(invoiceId);
}

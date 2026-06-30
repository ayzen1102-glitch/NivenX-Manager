/**
 * NivenX Assistant - Order Service
 * Business logic for creating and managing orders.
 * Auto-creates linked support ticket on order confirmation.
 */

import { Orders, Coupons, AuditLog, generateOrderId, UserAccounts } from '../database/queries.js';
import { createTicket } from './ticketService.js';
import { awardXP } from './accountService.js';
import { notifyOrderStatus } from './notificationService.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new order from form submission.
 */
export async function createOrder({ userId, userTag, guildId, serviceId, serviceLabel, formData, couponCode }) {
  let coupon = null;
  let discountAmount = 0;

  if (couponCode) {
    coupon = Coupons.validate(couponCode);
    if (!coupon) throw new Error('Invalid, expired, or already-used coupon code.');
  }

  const orderId = generateOrderId();

  Orders.create({
    orderId, userId, userTag, guildId, serviceId, serviceLabel,
    details: formData,
    couponCode: coupon?.code ?? null,
    discountAmount,
  });

  if (coupon) Coupons.use(coupon.code);

  // Award XP for placing order
  awardXP(userId, 'ORDER_PLACED');

  AuditLog.insert({
    action: 'ORDER_CREATED',
    actorId: userId,
    actorTag: userTag,
    targetType: 'order',
    targetId: orderId,
    details: { serviceId, serviceLabel },
  });

  logger.success('OrderService', `Order ${orderId} created by ${userTag}`);
  return Orders.findById(orderId);
}

/**
 * Confirm an order: auto-create support ticket linked to it.
 */
export async function confirmOrder({ orderId, guild, user }) {
  const order = Orders.findById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  let ticketChannel = null;

  try {
    const { ticket, channel } = await createTicket({
      guild,
      user,
      category: 'Order Support',
      subject: `${order.service_label} — ${orderId}`,
      orderId,
      isAutoCreated: true,
    });
    Orders.linkTicket(orderId, channel.id);
    ticketChannel = channel;
    logger.success('OrderService', `Auto-ticket created for order ${orderId}: #${channel.name}`);
  } catch (err) {
    logger.warn('OrderService', `Could not auto-create ticket for ${orderId}: ${err.message}`);
  }

  return { order, ticketChannel };
}

/**
 * Update order status and notify user.
 */
export async function updateOrderStatus(orderId, newStatus, actorId, actorTag) {
  const order = Orders.findById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  Orders.updateStatus(orderId, newStatus);

  // Notify customer via DM
  await notifyOrderStatus(order.user_id, orderId, order.status, newStatus);

  // If completed, prompt for review
  if (newStatus === 'Completed') {
    const { promptReview } = await import('./notificationService.js');
    await promptReview(order.user_id, orderId);
  }

  AuditLog.insert({
    action: 'ORDER_STATUS_CHANGED',
    actorId, actorTag,
    targetType: 'order',
    targetId: orderId,
    details: { from: order.status, to: newStatus },
  });

  logger.info('OrderService', `Order ${orderId}: ${order.status} → ${newStatus} by ${actorTag}`);
  return Orders.findById(orderId);
}

/**
 * Set order price and notes (staff action).
 */
export function setOrderPrice(orderId, price, notes, actorId, actorTag) {
  const order = Orders.findById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  Orders.updatePrice(orderId, price, notes);

  AuditLog.insert({
    action: 'ORDER_PRICE_SET',
    actorId, actorTag,
    targetType: 'order',
    targetId: orderId,
    details: { price, notes },
  });

  return Orders.findById(orderId);
}

/**
 * Apply coupon discount to a price.
 */
export function applyDiscount(price, coupon) {
  if (!coupon) return { finalPrice: price, discount: 0 };
  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = price * (coupon.discount_value / 100);
  } else {
    discount = Math.min(coupon.discount_value, price);
  }
  return { finalPrice: Math.max(0, price - discount), discount: parseFloat(discount.toFixed(2)) };
}

/**
 * Get order statistics.
 */
export function getOrderStats() {
  const statuses = ['Pending', 'Awaiting Payment', 'Paid', 'In Progress', 'Completed', 'Cancelled'];
  const stats = {};
  for (const s of statuses) stats[s] = Orders.countByStatus(s);
  stats.total = Orders.count();
  stats.revenue = Orders.totalRevenue();
  return stats;
}

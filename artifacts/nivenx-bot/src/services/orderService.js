/**
 * NivenX Assistant - Order Service
 * Business logic for creating and managing orders.
 */

import { Orders, Coupons, AuditLog, generateOrderId } from '../database/queries.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new order from form submission.
 */
export async function createOrder({ userId, userTag, guildId, serviceId, serviceLabel, formData, couponCode }) {
  // Validate coupon if provided
  let coupon = null;
  let discountAmount = 0;

  if (couponCode) {
    coupon = Coupons.validate(couponCode);
    if (!coupon) {
      throw new Error('Invalid, expired, or already-used coupon code.');
    }
  }

  const orderId = generateOrderId();

  Orders.create({
    orderId,
    userId,
    userTag,
    guildId,
    serviceId,
    serviceLabel,
    details: formData,
    couponCode: coupon?.code ?? null,
    discountAmount,
  });

  // Mark coupon as used
  if (coupon) {
    Coupons.use(coupon.code);
  }

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
 * Update order status and log the change.
 */
export function updateOrderStatus(orderId, newStatus, actorId, actorTag) {
  const order = Orders.findById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  Orders.updateStatus(orderId, newStatus);

  AuditLog.insert({
    action: 'ORDER_STATUS_CHANGED',
    actorId,
    actorTag,
    targetType: 'order',
    targetId: orderId,
    details: { from: order.status, to: newStatus },
  });

  logger.info('OrderService', `Order ${orderId} status: ${order.status} → ${newStatus} by ${actorTag}`);
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
    actorId,
    actorTag,
    targetType: 'order',
    targetId: orderId,
    details: { price, notes },
  });

  return Orders.findById(orderId);
}

/**
 * Apply a coupon discount to a price.
 */
export function applyDiscount(price, coupon) {
  if (!coupon) return { finalPrice: price, discount: 0 };

  let discount = 0;
  if (coupon.discount_type === 'percent') {
    discount = price * (coupon.discount_value / 100);
  } else {
    discount = Math.min(coupon.discount_value, price);
  }

  return {
    finalPrice: Math.max(0, price - discount),
    discount: parseFloat(discount.toFixed(2)),
  };
}

/**
 * Get order statistics for dashboards.
 */
export function getOrderStats() {
  const statuses = Object.values({
    Pending: 'Pending',
    'Awaiting Payment': 'Awaiting Payment',
    Paid: 'Paid',
    'In Progress': 'In Progress',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
  });

  const stats = {};
  for (const status of statuses) {
    stats[status] = Orders.countByStatus(status);
  }
  stats.total = Orders.count();
  return stats;
}

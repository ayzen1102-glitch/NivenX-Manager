/**
 * NivenX Assistant - Database Query Functions
 * All database interactions go through this module.
 * Uses node:sqlite (Node.js 22.5+ built-in).
 */

import { getDb } from './database.js';
import { config } from '../config/config.js';

// ─────────────────────────────────────────────
// COUNTERS & ID GENERATION
// ─────────────────────────────────────────────

/**
 * Atomically increment a named counter and return the new value.
 */
export function nextCounter(name) {
  const db = getDb();
  db.prepare(`UPDATE counters SET value = value + 1 WHERE name = ?`).run(name);
  return db.prepare(`SELECT value FROM counters WHERE name = ?`).get(name).value;
}

export function generateOrderId() {
  return `${config.orders.prefix}-${String(nextCounter('orders')).padStart(4, '0')}`;
}

export function generateTicketId() {
  return `TICKET-${String(nextCounter('tickets')).padStart(4, '0')}`;
}

export function generateInvoiceId() {
  return `INV-${String(nextCounter('invoices')).padStart(4, '0')}`;
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export const Orders = {
  create({ orderId, userId, userTag, guildId, serviceId, serviceLabel, details, couponCode, discountAmount }) {
    return getDb().prepare(`
      INSERT INTO orders (order_id, user_id, user_tag, guild_id, service_id, service_label, details, coupon_code, discount_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, userId, userTag, guildId, serviceId, serviceLabel, JSON.stringify(details), couponCode ?? null, discountAmount ?? 0);
  },

  findById(orderId) {
    return getDb().prepare(`SELECT * FROM orders WHERE order_id = ?`).get(orderId);
  },

  findByUser(userId) {
    return getDb().prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
  },

  findByStatus(status) {
    return getDb().prepare(`SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC`).all(status);
  },

  findAll(limit = 50) {
    return getDb().prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`).all(limit);
  },

  updateStatus(orderId, status) {
    return getDb().prepare(`
      UPDATE orders SET status = ?, updated_at = datetime('now') WHERE order_id = ?
    `).run(status, orderId);
  },

  updatePrice(orderId, price, notes) {
    return getDb().prepare(`
      UPDATE orders SET price = ?, notes = ?, updated_at = datetime('now') WHERE order_id = ?
    `).run(price, notes ?? null, orderId);
  },

  linkTicket(orderId, channelId) {
    return getDb().prepare(`
      UPDATE orders SET ticket_channel_id = ?, updated_at = datetime('now') WHERE order_id = ?
    `).run(channelId, orderId);
  },

  count() {
    return getDb().prepare(`SELECT COUNT(*) as total FROM orders`).get().total;
  },

  countByStatus(status) {
    return getDb().prepare(`SELECT COUNT(*) as total FROM orders WHERE status = ?`).get(status).total;
  },
};

// ─────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────

export const Tickets = {
  create({ ticketId, channelId, userId, userTag, guildId, category, subject, orderId }) {
    return getDb().prepare(`
      INSERT INTO tickets (ticket_id, channel_id, user_id, user_tag, guild_id, category, subject, order_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ticketId, channelId, userId, userTag, guildId, category, subject ?? null, orderId ?? null);
  },

  findByChannel(channelId) {
    return getDb().prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(channelId);
  },

  findById(ticketId) {
    return getDb().prepare(`SELECT * FROM tickets WHERE ticket_id = ?`).get(ticketId);
  },

  findOpenByUser(userId) {
    return getDb().prepare(`SELECT * FROM tickets WHERE user_id = ? AND status = 'open'`).all(userId);
  },

  findAll(status = 'open') {
    return getDb().prepare(`SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC`).all(status);
  },

  close(channelId, closedBy, transcript) {
    return getDb().prepare(`
      UPDATE tickets SET status = 'closed', closed_by = ?, transcript = ?, closed_at = datetime('now')
      WHERE channel_id = ?
    `).run(closedBy, transcript ?? null, channelId);
  },

  updateActivity(channelId) {
    return getDb().prepare(`
      UPDATE tickets SET last_activity = datetime('now') WHERE channel_id = ?
    `).run(channelId);
  },

  countOpen() {
    return getDb().prepare(`SELECT COUNT(*) as total FROM tickets WHERE status = 'open'`).get().total;
  },
};

// ─────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────

export const Invoices = {
  create({ invoiceId, orderId, userId, amount, discount, total, dueDate, notes }) {
    return getDb().prepare(`
      INSERT INTO invoices (invoice_id, order_id, user_id, amount, discount, total, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceId, orderId, userId, amount, discount ?? 0, total, dueDate ?? null, notes ?? null);
  },

  findById(invoiceId) {
    return getDb().prepare(`SELECT * FROM invoices WHERE invoice_id = ?`).get(invoiceId);
  },

  findByOrder(orderId) {
    return getDb().prepare(`SELECT * FROM invoices WHERE order_id = ? ORDER BY created_at DESC`).all(orderId);
  },

  findByUser(userId) {
    return getDb().prepare(`SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC`).all(userId);
  },

  markPaid(invoiceId) {
    return getDb().prepare(`
      UPDATE invoices SET status = 'paid', paid_at = datetime('now') WHERE invoice_id = ?
    `).run(invoiceId);
  },

  cancel(invoiceId) {
    return getDb().prepare(`UPDATE invoices SET status = 'cancelled' WHERE invoice_id = ?`).run(invoiceId);
  },
};

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────

export const Reviews = {
  create({ userId, userTag, orderId, rating, comment }) {
    return getDb().prepare(`
      INSERT INTO reviews (user_id, user_tag, order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, userTag, orderId ?? null, rating, comment ?? null);
  },

  findAll(limit = 20) {
    return getDb().prepare(`SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?`).all(limit);
  },

  averageRating() {
    return getDb().prepare(`SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews`).get();
  },
};

// ─────────────────────────────────────────────
// COUPONS
// ─────────────────────────────────────────────

export const Coupons = {
  create({ code, discountType, discountValue, maxUses, expiresAt, createdBy }) {
    return getDb().prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(code.toUpperCase(), discountType, discountValue, maxUses ?? 1, expiresAt ?? null, createdBy);
  },

  findByCode(code) {
    return getDb().prepare(`SELECT * FROM coupons WHERE code = ? AND active = 1`).get(code.toUpperCase());
  },

  use(code) {
    return getDb().prepare(`UPDATE coupons SET uses = uses + 1 WHERE code = ?`).run(code.toUpperCase());
  },

  deactivate(code) {
    return getDb().prepare(`UPDATE coupons SET active = 0 WHERE code = ?`).run(code.toUpperCase());
  },

  findAll() {
    return getDb().prepare(`SELECT * FROM coupons ORDER BY created_at DESC`).all();
  },

  validate(code) {
    const coupon = this.findByCode(code);
    if (!coupon) return null;
    if (!coupon.active) return null;
    if (coupon.max_uses !== -1 && coupon.uses >= coupon.max_uses) return null;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return null;
    return coupon;
  },
};

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

export const AuditLog = {
  insert({ action, actorId, actorTag, targetType, targetId, details }) {
    return getDb().prepare(`
      INSERT INTO audit_log (action, actor_id, actor_tag, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(action, actorId, actorTag, targetType ?? null, targetId ?? null, JSON.stringify(details ?? {}));
  },

  recent(limit = 20) {
    return getDb().prepare(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`).all(limit);
  },
};

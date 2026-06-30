/**
 * NivenX Assistant - Database Query Functions
 * All database interactions go through this module.
 */

import { getDb } from './database.js';
import { config } from '../config/config.js';
import { randomBytes } from 'crypto';

// ─── COUNTERS & ID GENERATION ─────────────────────────────────────────────────

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
export function generateQuoteId() {
  return `QUOTE-${String(nextCounter('quotes')).padStart(4, '0')}`;
}
export function generatePollId() {
  return `POLL-${String(nextCounter('polls')).padStart(4, '0')}`;
}
export function generateReferralCode(userId) {
  return `NVX-${userId.slice(-4).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export const Orders = {
  create({ orderId, userId, userTag, guildId, serviceId, serviceLabel, details, couponCode, discountAmount }) {
    return getDb().prepare(`
      INSERT INTO orders (order_id, user_id, user_tag, guild_id, service_id, service_label, details, coupon_code, discount_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, userId, userTag, guildId, serviceId, serviceLabel, JSON.stringify(details), couponCode ?? null, discountAmount ?? 0);
  },

  findById(orderId) { return getDb().prepare(`SELECT * FROM orders WHERE order_id = ?`).get(orderId); },
  findByUser(userId) { return getDb().prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`).all(userId); },
  findByStatus(status) { return getDb().prepare(`SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC`).all(status); },
  findAll(limit = 50) { return getDb().prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`).all(limit); },
  findByAssigned(staffId) { return getDb().prepare(`SELECT * FROM orders WHERE assigned_to = ? ORDER BY created_at DESC`).all(staffId); },
  findByTicketChannel(channelId) { return getDb().prepare(`SELECT * FROM orders WHERE ticket_channel_id = ?`).get(channelId); },

  updateStatus(orderId, status) {
    return getDb().prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE order_id = ?`).run(status, orderId);
  },

  updatePrice(orderId, price, notes) {
    return getDb().prepare(`UPDATE orders SET price = ?, notes = ?, updated_at = datetime('now') WHERE order_id = ?`).run(price, notes ?? null, orderId);
  },

  linkTicket(orderId, channelId) {
    return getDb().prepare(`UPDATE orders SET ticket_channel_id = ?, updated_at = datetime('now') WHERE order_id = ?`).run(channelId, orderId);
  },

  assign(orderId, staffId) {
    return getDb().prepare(`UPDATE orders SET assigned_to = ?, updated_at = datetime('now') WHERE order_id = ?`).run(staffId, orderId);
  },

  setPaymentMethod(orderId, method) {
    return getDb().prepare(`UPDATE orders SET payment_method = ?, updated_at = datetime('now') WHERE order_id = ?`).run(method, orderId);
  },

  setPriority(orderId, priority) {
    return getDb().prepare(`UPDATE orders SET priority = ?, updated_at = datetime('now') WHERE order_id = ?`).run(priority, orderId);
  },

  setDeadline(orderId, deadline) {
    return getDb().prepare(`UPDATE orders SET deadline = ?, updated_at = datetime('now') WHERE order_id = ?`).run(deadline, orderId);
  },

  markReviewRequested(orderId) {
    return getDb().prepare(`UPDATE orders SET review_requested = 1 WHERE order_id = ?`).run(orderId);
  },

  search(query) {
    return getDb().prepare(`
      SELECT * FROM orders WHERE order_id LIKE ? OR user_tag LIKE ? OR service_label LIKE ?
      ORDER BY created_at DESC LIMIT 20
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);
  },

  count() { return getDb().prepare(`SELECT COUNT(*) as total FROM orders`).get().total; },
  countByStatus(status) { return getDb().prepare(`SELECT COUNT(*) as total FROM orders WHERE status = ?`).get(status).total; },
  countByUser(userId) { return getDb().prepare(`SELECT COUNT(*) as total FROM orders WHERE user_id = ?`).get(userId).total; },

  totalRevenue() {
    return getDb().prepare(`SELECT SUM(price) as total FROM orders WHERE status = 'Completed' AND price IS NOT NULL`).get().total ?? 0;
  },

  revenueByPeriod(days = 30) {
    return getDb().prepare(`
      SELECT SUM(price) as total FROM orders
      WHERE status = 'Completed' AND price IS NOT NULL
      AND created_at >= datetime('now', '-${days} days')
    `).get().total ?? 0;
  },

  topServices(limit = 5) {
    return getDb().prepare(`
      SELECT service_label, COUNT(*) as count FROM orders
      GROUP BY service_label ORDER BY count DESC LIMIT ?
    `).all(limit);
  },

  completedByUser(userId) {
    return getDb().prepare(`SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND status = 'Completed'`).get(userId).total;
  },
};

// ─── TICKETS ──────────────────────────────────────────────────────────────────

export const Tickets = {
  create({ ticketId, channelId, userId, userTag, guildId, category, subject, orderId }) {
    return getDb().prepare(`
      INSERT INTO tickets (ticket_id, channel_id, user_id, user_tag, guild_id, category, subject, order_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ticketId, channelId, userId, userTag, guildId, category, subject ?? null, orderId ?? null);
  },

  findByChannel(channelId) { return getDb().prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(channelId); },
  findById(ticketId) { return getDb().prepare(`SELECT * FROM tickets WHERE ticket_id = ?`).get(ticketId); },
  findOpenByUser(userId) { return getDb().prepare(`SELECT * FROM tickets WHERE user_id = ? AND status = 'open'`).all(userId); },
  findAll(status = 'open') { return getDb().prepare(`SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC`).all(status); },
  findByUser(userId) { return getDb().prepare(`SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC`).all(userId); },
  findByAssigned(staffId) { return getDb().prepare(`SELECT * FROM tickets WHERE assigned_to = ? AND status = 'open'`).all(staffId); },

  close(channelId, closedBy, transcript) {
    return getDb().prepare(`
      UPDATE tickets SET status = 'closed', closed_by = ?, transcript = ?, closed_at = datetime('now')
      WHERE channel_id = ?
    `).run(closedBy, transcript ?? null, channelId);
  },

  updateActivity(channelId) {
    return getDb().prepare(`UPDATE tickets SET last_activity = datetime('now') WHERE channel_id = ?`).run(channelId);
  },

  assign(ticketId, staffId) {
    return getDb().prepare(`UPDATE tickets SET assigned_to = ? WHERE ticket_id = ?`).run(staffId, ticketId);
  },

  setPriority(ticketId, priority) {
    return getDb().prepare(`UPDATE tickets SET priority = ? WHERE ticket_id = ?`).run(priority, ticketId);
  },

  countOpen() { return getDb().prepare(`SELECT COUNT(*) as total FROM tickets WHERE status = 'open'`).get().total; },
  countByUser(userId) { return getDb().prepare(`SELECT COUNT(*) as total FROM tickets WHERE user_id = ?`).get(userId).total; },
};

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export const Invoices = {
  create({ invoiceId, orderId, userId, amount, discount, total, dueDate, notes }) {
    return getDb().prepare(`
      INSERT INTO invoices (invoice_id, order_id, user_id, amount, discount, total, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceId, orderId, userId, amount, discount ?? 0, total, dueDate ?? null, notes ?? null);
  },

  findById(invoiceId) { return getDb().prepare(`SELECT * FROM invoices WHERE invoice_id = ?`).get(invoiceId); },
  findByOrder(orderId) { return getDb().prepare(`SELECT * FROM invoices WHERE order_id = ? ORDER BY created_at DESC`).all(orderId); },
  findByUser(userId) { return getDb().prepare(`SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC`).all(userId); },
  findUnpaidByUser(userId) { return getDb().prepare(`SELECT * FROM invoices WHERE user_id = ? AND status = 'unpaid' ORDER BY created_at DESC`).all(userId); },
  findAll(status = null) {
    if (status) return getDb().prepare(`SELECT * FROM invoices WHERE status = ? ORDER BY created_at DESC`).all(status);
    return getDb().prepare(`SELECT * FROM invoices ORDER BY created_at DESC`).all();
  },

  markPaid(invoiceId) {
    return getDb().prepare(`UPDATE invoices SET status = 'paid', paid_at = datetime('now') WHERE invoice_id = ?`).run(invoiceId);
  },

  cancel(invoiceId) {
    return getDb().prepare(`UPDATE invoices SET status = 'cancelled' WHERE invoice_id = ?`).run(invoiceId);
  },

  findOverdue() {
    return getDb().prepare(`
      SELECT * FROM invoices WHERE status = 'unpaid' AND due_date < datetime('now') AND due_date IS NOT NULL
    `).all();
  },
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const Payments = {
  create({ invoiceId, orderId, userId, method, amount, reference, proofUrl }) {
    return getDb().prepare(`
      INSERT INTO payments (invoice_id, order_id, user_id, method, amount, reference, proof_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(invoiceId, orderId, userId, method, amount, reference ?? null, proofUrl ?? null);
  },

  findById(id) { return getDb().prepare(`SELECT * FROM payments WHERE id = ?`).get(id); },
  findByInvoice(invoiceId) { return getDb().prepare(`SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC`).all(invoiceId); },
  findPending() { return getDb().prepare(`SELECT * FROM payments WHERE status = 'pending' ORDER BY created_at ASC`).all(); },

  verify(id, verifiedBy) {
    return getDb().prepare(`
      UPDATE payments SET status = 'verified', verified_by = ?, verified_at = datetime('now') WHERE id = ?
    `).run(verifiedBy, id);
  },

  reject(id, notes) {
    return getDb().prepare(`UPDATE payments SET status = 'rejected', notes = ? WHERE id = ?`).run(notes, id);
  },
};

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const Reviews = {
  create({ userId, userTag, orderId, rating, comment }) {
    return getDb().prepare(`
      INSERT INTO reviews (user_id, user_tag, order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, userTag, orderId ?? null, rating, comment ?? null);
  },

  findAll(limit = 20) { return getDb().prepare(`SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?`).all(limit); },
  findByUser(userId) { return getDb().prepare(`SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC`).all(userId); },
  findByOrder(orderId) { return getDb().prepare(`SELECT * FROM reviews WHERE order_id = ?`).get(orderId); },
  averageRating() { return getDb().prepare(`SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews`).get(); },
  countByUser(userId) { return getDb().prepare(`SELECT COUNT(*) as total FROM reviews WHERE user_id = ?`).get(userId).total; },
};

// ─── COUPONS ──────────────────────────────────────────────────────────────────

export const Coupons = {
  create({ code, discountType, discountValue, maxUses, expiresAt, createdBy, description, minOrderAmount }) {
    return getDb().prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at, created_by, description, min_order_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code.toUpperCase(), discountType, discountValue, maxUses ?? 1, expiresAt ?? null, createdBy, description ?? null, minOrderAmount ?? 0);
  },

  findByCode(code) { return getDb().prepare(`SELECT * FROM coupons WHERE code = ? AND active = 1`).get(code.toUpperCase()); },
  findAll() { return getDb().prepare(`SELECT * FROM coupons ORDER BY created_at DESC`).all(); },

  use(code) { return getDb().prepare(`UPDATE coupons SET uses = uses + 1 WHERE code = ?`).run(code.toUpperCase()); },
  deactivate(code) { return getDb().prepare(`UPDATE coupons SET active = 0 WHERE code = ?`).run(code.toUpperCase()); },
  activate(code) { return getDb().prepare(`UPDATE coupons SET active = 1 WHERE code = ?`).run(code.toUpperCase()); },

  validate(code, orderAmount = 0) {
    const coupon = this.findByCode(code);
    if (!coupon) return null;
    if (!coupon.active) return null;
    if (coupon.max_uses !== -1 && coupon.uses >= coupon.max_uses) return null;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return null;
    if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) return null;
    return coupon;
  },
};

// ─── USER ACCOUNTS ────────────────────────────────────────────────────────────

export const UserAccounts = {
  create({ userId, username, guildId, referredBy }) {
    const referralCode = `NVX-${userId.slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return getDb().prepare(`
      INSERT OR IGNORE INTO user_accounts (user_id, username, guild_id, referral_code, referred_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, guildId, referralCode, referredBy ?? null);
  },

  findById(userId) { return getDb().prepare(`SELECT * FROM user_accounts WHERE user_id = ?`).get(userId); },
  findByReferralCode(code) { return getDb().prepare(`SELECT * FROM user_accounts WHERE referral_code = ?`).get(code.toUpperCase()); },

  upsert({ userId, username, guildId }) {
    const existing = this.findById(userId);
    if (!existing) {
      this.create({ userId, username, guildId });
    } else {
      getDb().prepare(`UPDATE user_accounts SET username = ?, last_active = datetime('now') WHERE user_id = ?`).run(username, userId);
    }
    return this.findById(userId);
  },

  addXP(userId, amount) {
    const account = this.findById(userId);
    if (!account) return;
    const newXP = account.xp + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    getDb().prepare(`UPDATE user_accounts SET xp = ?, level = ?, last_active = datetime('now') WHERE user_id = ?`).run(newXP, newLevel, userId);
    return { newXP, newLevel, leveledUp: newLevel > account.level };
  },

  addPoints(userId, amount, reason, referenceId = null) {
    getDb().prepare(`UPDATE user_accounts SET points = points + ?, last_active = datetime('now') WHERE user_id = ?`).run(amount, userId);
    getDb().prepare(`INSERT INTO points_history (user_id, amount, reason, reference_id) VALUES (?, ?, ?, ?)`).run(userId, amount, reason, referenceId);
  },

  spendPoints(userId, amount) {
    const account = this.findById(userId);
    if (!account || account.points < amount) return false;
    getDb().prepare(`UPDATE user_accounts SET points = points - ? WHERE user_id = ?`).run(amount, userId);
    getDb().prepare(`INSERT INTO points_history (user_id, amount, reason) VALUES (?, ?, ?)`).run(userId, -amount, 'Redeemed');
    return true;
  },

  addSpending(userId, amount) {
    getDb().prepare(`UPDATE user_accounts SET total_spent = total_spent + ? WHERE user_id = ?`).run(amount, userId);
  },

  updateBio(userId, bio) {
    getDb().prepare(`UPDATE user_accounts SET bio = ? WHERE user_id = ?`).run(bio, userId);
  },

  setBlacklisted(userId, blacklisted, reason = null) {
    getDb().prepare(`UPDATE user_accounts SET blacklisted = ?, blacklist_reason = ? WHERE user_id = ?`).run(blacklisted ? 1 : 0, reason, userId);
  },

  isBlacklisted(userId) {
    const acc = this.findById(userId);
    return acc?.blacklisted === 1;
  },

  addReferral(referralCode, newUserId) {
    const referrer = this.findByReferralCode(referralCode);
    if (!referrer || referrer.user_id === newUserId) return null;
    getDb().prepare(`UPDATE user_accounts SET referral_count = referral_count + 1 WHERE user_id = ?`).run(referrer.user_id);
    getDb().prepare(`UPDATE user_accounts SET referred_by = ? WHERE user_id = ?`).run(referrer.user_id, newUserId);
    return referrer;
  },

  topBySpending(limit = 10) {
    return getDb().prepare(`SELECT * FROM user_accounts ORDER BY total_spent DESC LIMIT ?`).all(limit);
  },

  topByPoints(limit = 10) {
    return getDb().prepare(`SELECT * FROM user_accounts ORDER BY points DESC LIMIT ?`).all(limit);
  },

  pointsHistory(userId, limit = 20) {
    return getDb().prepare(`SELECT * FROM points_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(userId, limit);
  },

  count() { return getDb().prepare(`SELECT COUNT(*) as total FROM user_accounts`).get().total; },

  notifyEnabled(userId) {
    const acc = this.findById(userId);
    return acc?.notification_dms !== 0;
  },
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const Notifications = {
  queue(userId, type, data) {
    return getDb().prepare(`INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)`).run(userId, type, JSON.stringify(data));
  },

  getPending() {
    return getDb().prepare(`SELECT * FROM notifications WHERE sent = 0 ORDER BY created_at ASC`).all();
  },

  markSent(id) {
    return getDb().prepare(`UPDATE notifications SET sent = 1 WHERE id = ?`).run(id);
  },
};

// ─── POLLS ────────────────────────────────────────────────────────────────────

export const Polls = {
  create({ pollId, channelId, question, options, createdBy, endsAt }) {
    return getDb().prepare(`
      INSERT INTO polls (poll_id, channel_id, question, options, created_by, ends_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(pollId, channelId, JSON.stringify(options), JSON.stringify(options), createdBy, endsAt ?? null);
  },

  findById(pollId) {
    const p = getDb().prepare(`SELECT * FROM polls WHERE poll_id = ?`).get(pollId);
    if (!p) return null;
    return { ...p, options: JSON.parse(p.options), votes: JSON.parse(p.votes), voter_ids: JSON.parse(p.voter_ids) };
  },

  setMessageId(pollId, messageId) {
    return getDb().prepare(`UPDATE polls SET message_id = ? WHERE poll_id = ?`).run(messageId, pollId);
  },

  vote(pollId, userId, optionIndex) {
    const poll = this.findById(pollId);
    if (!poll || poll.ended) return { success: false, reason: 'Poll not found or ended.' };
    if (poll.voter_ids.includes(userId)) return { success: false, reason: 'Already voted.' };

    const votes = poll.votes;
    votes[optionIndex] = (votes[optionIndex] ?? 0) + 1;
    const voterIds = [...poll.voter_ids, userId];

    getDb().prepare(`UPDATE polls SET votes = ?, voter_ids = ? WHERE poll_id = ?`).run(
      JSON.stringify(votes), JSON.stringify(voterIds), pollId
    );
    return { success: true, votes };
  },

  end(pollId) {
    return getDb().prepare(`UPDATE polls SET ended = 1 WHERE poll_id = ?`).run(pollId);
  },

  findActive() {
    return getDb().prepare(`SELECT * FROM polls WHERE ended = 0`).all().map(p => ({
      ...p, options: JSON.parse(p.options), votes: JSON.parse(p.votes), voter_ids: JSON.parse(p.voter_ids),
    }));
  },
};

// ─── GIVEAWAYS ────────────────────────────────────────────────────────────────

export const Giveaways = {
  create({ channelId, prize, hostId, endsAt }) {
    return getDb().prepare(`INSERT INTO giveaways (channel_id, prize, host_id, ends_at) VALUES (?, ?, ?, ?)`).run(channelId, prize, hostId, endsAt);
  },

  findById(id) {
    const g = getDb().prepare(`SELECT * FROM giveaways WHERE id = ?`).get(id);
    if (!g) return null;
    return { ...g, entries: JSON.parse(g.entries) };
  },

  setMessageId(id, messageId) {
    return getDb().prepare(`UPDATE giveaways SET message_id = ? WHERE id = ?`).run(messageId, id);
  },

  enter(id, userId) {
    const g = this.findById(id);
    if (!g || g.ended) return { success: false, reason: 'Giveaway not found or ended.' };
    if (g.entries.includes(userId)) return { success: false, reason: 'Already entered.' };

    const entries = [...g.entries, userId];
    getDb().prepare(`UPDATE giveaways SET entries = ? WHERE id = ?`).run(JSON.stringify(entries), id);
    return { success: true, entries };
  },

  end(id) {
    const g = this.findById(id);
    if (!g || g.entries.length === 0) {
      getDb().prepare(`UPDATE giveaways SET ended = 1 WHERE id = ?`).run(id);
      return null;
    }
    const winner = g.entries[Math.floor(Math.random() * g.entries.length)];
    getDb().prepare(`UPDATE giveaways SET ended = 1, winner_id = ? WHERE id = ?`).run(winner, id);
    return winner;
  },

  findActive() {
    return getDb().prepare(`SELECT * FROM giveaways WHERE ended = 0`).all().map(g => ({
      ...g, entries: JSON.parse(g.entries),
    }));
  },
};

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────

export const Portfolio = {
  add({ title, description, category, url, imageUrl, addedBy }) {
    return getDb().prepare(`INSERT INTO portfolio (title, description, category, url, image_url, added_by) VALUES (?, ?, ?, ?, ?, ?)`).run(title, description, category ?? null, url ?? null, imageUrl ?? null, addedBy);
  },

  findAll() { return getDb().prepare(`SELECT * FROM portfolio WHERE visible = 1 ORDER BY created_at DESC`).all(); },
  remove(id) { return getDb().prepare(`UPDATE portfolio SET visible = 0 WHERE id = ?`).run(id); },
};

// ─── QUOTES ──────────────────────────────────────────────────────────────────

export const Quotes = {
  create({ userId, userTag, service, requirements }) {
    return getDb().prepare(`INSERT INTO quotes (user_id, user_tag, service, requirements) VALUES (?, ?, ?, ?)`).run(userId, userTag, service, requirements);
  },

  findAll() { return getDb().prepare(`SELECT * FROM quotes WHERE status = 'pending' ORDER BY created_at DESC`).all(); },
  findById(id) { return getDb().prepare(`SELECT * FROM quotes WHERE id = ?`).get(id); },

  respond(id, estimatedPrice, staffId) {
    return getDb().prepare(`UPDATE quotes SET estimated_price = ?, status = 'responded', responded_by = ? WHERE id = ?`).run(estimatedPrice, staffId, id);
  },
};

// ─── REMINDERS ────────────────────────────────────────────────────────────────

export const Reminders = {
  create({ userId, channelId, message, remindAt }) {
    return getDb().prepare(`INSERT INTO reminders (user_id, channel_id, message, remind_at) VALUES (?, ?, ?, ?)`).run(userId, channelId, message, remindAt);
  },

  findDue() {
    return getDb().prepare(`SELECT * FROM reminders WHERE sent = 0 AND remind_at <= datetime('now')`).all();
  },

  markSent(id) { return getDb().prepare(`UPDATE reminders SET sent = 1 WHERE id = ?`).run(id); },
};

// ─── AUTO RESPONSES ───────────────────────────────────────────────────────────

export const AutoResponses = {
  add({ trigger, response, createdBy }) {
    return getDb().prepare(`INSERT OR REPLACE INTO auto_responses (trigger, response, created_by) VALUES (?, ?, ?)`).run(trigger.toLowerCase(), response, createdBy);
  },

  findByTrigger(trigger) {
    return getDb().prepare(`SELECT * FROM auto_responses WHERE trigger = ? AND active = 1`).get(trigger.toLowerCase());
  },

  findAll() { return getDb().prepare(`SELECT * FROM auto_responses ORDER BY trigger ASC`).all(); },
  remove(trigger) { return getDb().prepare(`UPDATE auto_responses SET active = 0 WHERE trigger = ?`).run(trigger.toLowerCase()); },
  incrementUse(trigger) { return getDb().prepare(`UPDATE auto_responses SET uses = uses + 1 WHERE trigger = ?`).run(trigger.toLowerCase()); },
};

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────

export const Feedback = {
  create({ userId, userTag, category, message }) {
    return getDb().prepare(`INSERT INTO feedback (user_id, user_tag, category, message) VALUES (?, ?, ?, ?)`).run(userId, userTag, category, message);
  },

  findAll() { return getDb().prepare(`SELECT * FROM feedback ORDER BY created_at DESC`).all(); },
  findOpen() { return getDb().prepare(`SELECT * FROM feedback WHERE status = 'open' ORDER BY created_at DESC`).all(); },

  respond(id, response) {
    return getDb().prepare(`UPDATE feedback SET status = 'responded', response = ? WHERE id = ?`).run(response, id);
  },
};

// ─── SERVICE PRICING ─────────────────────────────────────────────────────────

export const ServicePricing = {
  set({ serviceId, minPrice, maxPrice, basePrice, updatedBy }) {
    return getDb().prepare(`
      INSERT OR REPLACE INTO service_pricing (service_id, min_price, max_price, base_price, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(serviceId, minPrice ?? null, maxPrice ?? null, basePrice ?? null, updatedBy);
  },

  findById(serviceId) { return getDb().prepare(`SELECT * FROM service_pricing WHERE service_id = ?`).get(serviceId); },
  findAll() { return getDb().prepare(`SELECT * FROM service_pricing`).all(); },
};

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

export const AuditLog = {
  insert({ action, actorId, actorTag, targetType, targetId, details }) {
    return getDb().prepare(`
      INSERT INTO audit_log (action, actor_id, actor_tag, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(action, actorId, actorTag, targetType ?? null, targetId ?? null, JSON.stringify(details ?? {}));
  },

  recent(limit = 50) { return getDb().prepare(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`).all(limit); },
  byActor(actorId, limit = 20) { return getDb().prepare(`SELECT * FROM audit_log WHERE actor_id = ? ORDER BY created_at DESC LIMIT ?`).all(actorId, limit); },
  byAction(action, limit = 20) { return getDb().prepare(`SELECT * FROM audit_log WHERE action = ? ORDER BY created_at DESC LIMIT ?`).all(action, limit); },
};

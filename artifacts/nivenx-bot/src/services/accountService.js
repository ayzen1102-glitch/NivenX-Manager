/**
 * NivenX Assistant - Account Service
 * Manages user accounts, XP, points, referrals.
 */

import { UserAccounts, AuditLog } from '../database/queries.js';
import { logger } from '../utils/logger.js';

export const XP_EVENTS = {
  ORDER_PLACED: 50,
  ORDER_COMPLETED: 100,
  REVIEW_LEFT: 25,
  TICKET_OPENED: 10,
  DAILY_LOGIN: 5,
  REFERRAL: 75,
};

export const POINTS_EVENTS = {
  ORDER_COMPLETED_PER_DOLLAR: 1,
  REVIEW_LEFT: 20,
  REFERRAL_BONUS: 100,
  REFERRED_BONUS: 50,
  DAILY_BONUS: 10,
};

/**
 * Ensure user has an account. Create if missing.
 */
export function ensureAccount(userId, username, guildId) {
  return UserAccounts.upsert({ userId, username, guildId });
}

/**
 * Award XP for an event.
 */
export function awardXP(userId, eventType) {
  const amount = XP_EVENTS[eventType] ?? 0;
  if (amount === 0) return null;
  const result = UserAccounts.addXP(userId, amount);
  if (result?.leveledUp) {
    logger.info('AccountService', `User ${userId} leveled up to ${result.newLevel}!`);
  }
  return result;
}

/**
 * Award loyalty points.
 */
export function awardPoints(userId, amount, reason, referenceId = null) {
  if (amount <= 0) return;
  UserAccounts.addPoints(userId, amount, reason, referenceId);
  logger.debug('AccountService', `Awarded ${amount} pts to ${userId} for: ${reason}`);
}

/**
 * Award points based on completed order amount.
 */
export function awardOrderPoints(userId, orderAmount, orderId) {
  const pts = Math.floor(orderAmount * POINTS_EVENTS.ORDER_COMPLETED_PER_DOLLAR);
  if (pts > 0) {
    awardPoints(userId, pts, `Order ${orderId} completed`, orderId);
  }
  awardXP(userId, 'ORDER_COMPLETED');
}

/**
 * Process referral: award points to both referrer and new user.
 */
export function processReferral(referralCode, newUserId, newUsername, guildId) {
  const referrer = UserAccounts.addReferral(referralCode, newUserId);
  if (!referrer) return null;

  awardPoints(referrer.user_id, POINTS_EVENTS.REFERRAL_BONUS, `Referral: ${newUsername}`, newUserId);
  awardXP(referrer.user_id, 'REFERRAL');

  awardPoints(newUserId, POINTS_EVENTS.REFERRED_BONUS, `Joined via referral from ${referrer.username}`, referrer.user_id);

  AuditLog.insert({
    action: 'REFERRAL_PROCESSED',
    actorId: referrer.user_id,
    actorTag: referrer.username,
    targetType: 'user',
    targetId: newUserId,
    details: { referralCode, newUsername },
  });

  logger.info('AccountService', `Referral processed: ${referrer.username} → ${newUsername}`);
  return referrer;
}

/**
 * Redeem points for a discount.
 * Returns the discount amount in dollars.
 */
export function redeemPoints(userId, pointsToSpend) {
  const tiers = [
    { points: 1000, dollarValue: 12.00 },
    { points: 500, dollarValue: 5.50 },
    { points: 100, dollarValue: 1.00 },
  ];

  const tier = tiers.find(t => t.points === pointsToSpend);
  if (!tier) throw new Error('Invalid redemption amount. Choose 100, 500, or 1000 points.');

  const account = UserAccounts.findById(userId);
  if (!account) throw new Error('Account not found.');
  if (account.points < pointsToSpend) throw new Error(`Insufficient points. You have ${account.points} pts.`);

  const success = UserAccounts.spendPoints(userId, pointsToSpend);
  if (!success) throw new Error('Failed to spend points.');

  return tier.dollarValue;
}

/**
 * Get full user stats summary.
 */
export function getUserStats(userId) {
  const { Orders, Tickets, Reviews, Invoices } = await_imports();
  return {
    orders: Orders.countByUser(userId),
    completed: Orders.completedByUser(userId),
    tickets: Tickets.countByUser(userId),
    reviews: Reviews.countByUser(userId),
    invoicesPaid: 0, // computed below
  };
}

function await_imports() {
  const { Orders, Tickets, Reviews, Invoices } = require_sync();
  return { Orders, Tickets, Reviews, Invoices };
}

function require_sync() {
  // We import synchronously since this is called sync
  const q = globalThis._queries_ref;
  return q;
}

// Store queries ref globally for sync access
import { Orders, Tickets, Reviews, Invoices } from '../database/queries.js';
export function getUserStatsSync(userId) {
  return {
    orders: Orders.countByUser(userId),
    completed: Orders.completedByUser(userId),
    tickets: Tickets.countByUser(userId),
    reviews: Reviews.countByUser(userId),
    invoicesPaid: Invoices.findByUser(userId).filter(i => i.status === 'paid').length,
  };
}

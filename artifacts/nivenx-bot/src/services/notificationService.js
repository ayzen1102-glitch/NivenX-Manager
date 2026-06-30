/**
 * NivenX Assistant - Notification Service
 * DMs users for order updates, payment reminders, review prompts.
 */

import { Notifications, UserAccounts, Orders } from '../database/queries.js';
import { buildNotificationCard } from '../ui/v2/generalV2.js';
import { logger } from '../utils/logger.js';

let _client = null;

export function setNotificationClient(client) {
  _client = client;
}

/**
 * Send a DM notification to a user.
 */
export async function sendDMNotification(userId, type, data) {
  if (!_client) return;

  const account = UserAccounts.findById(userId);
  if (account && account.notification_dms === 0) return;

  try {
    const user = await _client.users.fetch(userId);
    const card = buildNotificationCard(type, data);
    await user.send(card);
    logger.debug('NotificationService', `DM sent to ${user.tag} [${type}]`);
  } catch (err) {
    logger.warn('NotificationService', `Could not DM user ${userId}: ${err.message}`);
  }
}

/**
 * Process queued notifications.
 */
export async function processNotificationQueue() {
  if (!_client) return;

  const pending = Notifications.getPending();
  for (const notif of pending) {
    try {
      const data = JSON.parse(notif.data);
      await sendDMNotification(notif.user_id, notif.type, data);
      Notifications.markSent(notif.id);
    } catch (err) {
      logger.warn('NotificationService', `Failed to process notification ${notif.id}: ${err.message}`);
    }
  }
}

/**
 * Notify user of order status change.
 */
export async function notifyOrderStatus(userId, orderId, fromStatus, toStatus, notes = null) {
  await sendDMNotification(userId, 'order_status', {
    orderId, from: fromStatus, to: toStatus, notes,
  });
}

/**
 * Prompt user to leave a review after order completion.
 */
export async function promptReview(userId, orderId) {
  const order = Orders.findById(orderId);
  if (!order || order.review_requested) return;

  Orders.markReviewRequested(orderId);
  await sendDMNotification(userId, 'review_prompt', { orderId });
}

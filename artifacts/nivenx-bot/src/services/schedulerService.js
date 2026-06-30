/**
 * NivenX Assistant - Scheduler Service
 * Runs periodic background tasks: auto-close tickets, auto-cancel stale orders.
 */

import { Tickets, Orders } from '../database/queries.js';
import { closeTicket } from './ticketService.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * Start all background schedulers. Called once on bot startup.
 */
export function startAutoCloseScheduler(client) {
  // Run every 30 minutes
  const INTERVAL_MS = 30 * 60 * 1000;

  setInterval(() => runScheduledTasks(client), INTERVAL_MS);
  logger.info('Scheduler', 'Auto-close scheduler started (runs every 30 minutes)');
}

/**
 * Main scheduled task runner.
 */
async function runScheduledTasks(client) {
  logger.debug('Scheduler', 'Running scheduled tasks...');

  await autoCloseInactiveTickets(client);
  await autoCancelStaleOrders(client);
}

/**
 * Auto-close tickets that have been inactive beyond the configured threshold.
 */
async function autoCloseInactiveTickets(client) {
  try {
    const openTickets = Tickets.findAll('open');
    const thresholdMs = config.tickets.autoCloseHours * 60 * 60 * 1000;
    const now = Date.now();

    for (const ticket of openTickets) {
      const lastActivity = new Date(ticket.last_activity).getTime();
      if (now - lastActivity >= thresholdMs) {
        // Find the channel
        for (const guild of client.guilds.cache.values()) {
          const channel = guild.channels.cache.get(ticket.channel_id);
          if (channel) {
            logger.info('Scheduler', `Auto-closing inactive ticket ${ticket.ticket_id}`);
            try {
              await closeTicket({
                guild,
                channel,
                closedBy: client.user,
              });
            } catch (err) {
              logger.warn('Scheduler', `Failed to auto-close ticket ${ticket.ticket_id}: ${err.message}`);
            }
            break;
          }
        }
      }
    }
  } catch (err) {
    logger.error('Scheduler', `Auto-close tickets error: ${err.message}`);
  }
}

/**
 * Auto-cancel orders that have been pending payment for too long.
 */
async function autoCancelStaleOrders(client) {
  try {
    const pending = Orders.findByStatus('Awaiting Payment');
    const thresholdMs = config.orders.autoCloseHours * 60 * 60 * 1000;
    const now = Date.now();

    for (const order of pending) {
      const updatedAt = new Date(order.updated_at).getTime();
      if (now - updatedAt >= thresholdMs) {
        Orders.updateStatus(order.order_id, 'Cancelled');
        logger.info('Scheduler', `Auto-cancelled stale order ${order.order_id}`);

        // DM the customer
        try {
          const user = await client.users.fetch(order.user_id);
          await user.send({
            embeds: [{
              color: 0xED4245,
              title: '❌ Order Cancelled',
              description: `Your order **${order.order_id}** (${order.service_label}) was automatically cancelled due to no payment within ${config.orders.autoCloseHours} hours.\n\nUse \`/order\` to place a new order.`,
            }],
          });
        } catch { /* DMs closed */ }
      }
    }
  } catch (err) {
    logger.error('Scheduler', `Auto-cancel orders error: ${err.message}`);
  }
}

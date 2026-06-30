/**
 * NivenX Assistant - Scheduler Service
 * Runs background tasks every 5 min: auto-close tickets/orders,
 * payment reminders, notification queue, polls, giveaways, reminders.
 */

import { Tickets, Orders, Invoices, Giveaways, Polls, Reminders } from '../database/queries.js';
import { closeTicket } from './ticketService.js';
import { processNotificationQueue, sendDMNotification, setNotificationClient } from './notificationService.js';
import { buildGiveawayCard } from '../ui/v2/generalV2.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export function startAutoCloseScheduler(client) {
  setNotificationClient(client);
  runScheduler(client);
  setInterval(() => runScheduler(client), 5 * 60 * 1000);
  logger.info('Scheduler', 'Scheduler started (every 5 minutes)');
}

async function runScheduler(client) {
  try {
    await autoCloseStaleTickets(client);
    await autoCancelStaleOrders(client);
    await processPaymentReminders();
    await processNotificationQueue();
    await checkGiveawayEndings(client);
    await checkPollEndings();
    await processReminders(client);
  } catch (err) {
    logger.error('Scheduler', `Scheduler error: ${err.message}`);
  }
}

async function autoCloseStaleTickets(client) {
  try {
    const openTickets = Tickets.findAll('open');
    const thresholdMs = config.tickets.autoCloseHours * 60 * 60 * 1000;

    for (const ticket of openTickets) {
      const lastActivity = new Date(ticket.last_activity).getTime();
      if (Date.now() - lastActivity < thresholdMs) continue;

      const guild = client?.guilds.cache.get(ticket.guild_id);
      if (!guild) continue;
      const channel = guild.channels.cache.get(ticket.channel_id);
      if (!channel) {
        Tickets.close(ticket.channel_id, 'auto-close', 'Auto-closed (channel missing)');
        continue;
      }

      try {
        await closeTicket({ guild, channel, closedBy: client.user });
        logger.info('Scheduler', `Auto-closed ticket ${ticket.ticket_id}`);
      } catch (err) {
        logger.warn('Scheduler', `Could not auto-close ${ticket.ticket_id}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error('Scheduler', `Auto-close tickets: ${err.message}`);
  }
}

async function autoCancelStaleOrders(client) {
  try {
    const pending = Orders.findByStatus('Awaiting Payment');
    const thresholdMs = config.orders.autoCloseHours * 60 * 60 * 1000;

    for (const order of pending) {
      if (Date.now() - new Date(order.updated_at).getTime() < thresholdMs) continue;
      Orders.updateStatus(order.order_id, 'Cancelled');
      await sendDMNotification(order.user_id, 'order_status', {
        orderId: order.order_id, from: 'Awaiting Payment', to: 'Cancelled',
        notes: `Auto-cancelled: no payment within ${config.orders.autoCloseHours}h.`,
      });
      logger.info('Scheduler', `Auto-cancelled order ${order.order_id}`);
    }
  } catch (err) {
    logger.error('Scheduler', `Auto-cancel orders: ${err.message}`);
  }
}

async function processPaymentReminders() {
  try {
    const overdueInvoices = Invoices.findOverdue();
    for (const invoice of overdueInvoices) {
      await sendDMNotification(invoice.user_id, 'invoice_due', {
        invoiceId: invoice.invoice_id, amount: invoice.total, dueDate: invoice.due_date,
      });
    }
  } catch (err) {
    logger.error('Scheduler', `Payment reminders: ${err.message}`);
  }
}

async function checkGiveawayEndings(client) {
  if (!client) return;
  try {
    const active = Giveaways.findActive();
    for (const g of active) {
      if (!g.ends_at || new Date(g.ends_at) > new Date()) continue;
      const winner = Giveaways.end(g.id);
      const channel = client.channels.cache.get(g.channel_id);
      if (!channel) continue;

      if (g.message_id) {
        const msg = await channel.messages.fetch(g.message_id).catch(() => null);
        if (msg) await msg.edit(buildGiveawayCard({ ...g, entries: g.entries.length }, true, winner)).catch(() => {});
      }
      await channel.send({ content: winner ? `🎉 Congratulations <@${winner}>! You won **${g.prize}**!` : `Giveaway for **${g.prize}** ended with no entries.` });
      logger.info('Scheduler', `Giveaway ${g.id} ended. Winner: ${winner ?? 'none'}`);
    }
  } catch (err) {
    logger.error('Scheduler', `Giveaway endings: ${err.message}`);
  }
}

async function checkPollEndings() {
  try {
    const active = Polls.findActive();
    for (const poll of active) {
      if (!poll.ends_at || new Date(poll.ends_at) > new Date()) continue;
      Polls.end(poll.poll_id);
      logger.info('Scheduler', `Poll ${poll.poll_id} ended.`);
    }
  } catch (err) {
    logger.error('Scheduler', `Poll endings: ${err.message}`);
  }
}

async function processReminders(client) {
  if (!client) return;
  try {
    const due = Reminders.findDue();
    for (const reminder of due) {
      Reminders.markSent(reminder.id);
      const channel = client.channels.cache.get(reminder.channel_id);
      if (channel) await channel.send({ content: `⏰ <@${reminder.user_id}> **Reminder:** ${reminder.message}` }).catch(() => {});
    }
  } catch (err) {
    logger.error('Scheduler', `Reminders: ${err.message}`);
  }
}

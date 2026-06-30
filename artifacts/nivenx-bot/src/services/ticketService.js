/**
 * NivenX Assistant - Ticket Service
 * Business logic for creating and managing tickets.
 * Uses Components V2 for all messages.
 */

import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { Tickets, AuditLog, generateTicketId, Orders } from '../database/queries.js';
import { buildTicketWelcomeCard, buildTicketClosedCard, buildTranscriptCard, buildOrderTicketWelcomeCard } from '../ui/v2/ticketV2.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new ticket channel for a user.
 */
export async function createTicket({ guild, user, category, subject, orderId, isAutoCreated = false }) {
  // Enforce max open tickets (skip limit for auto-created order tickets)
  if (!isAutoCreated) {
    const openTickets = Tickets.findOpenByUser(user.id);
    if (openTickets.length >= config.tickets.maxOpenPerUser) {
      throw new Error(`You already have an open ticket: <#${openTickets[0].channel_id}>`);
    }
  }

  const ticketId = generateTicketId();
  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}-${ticketId.split('-')[1]}`;

  // Find or create TICKETS category
  let ticketCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === config.tickets.categoryName
  );
  if (!ticketCategory) {
    ticketCategory = await guild.channels.create({
      name: config.tickets.categoryName,
      type: ChannelType.GuildCategory,
    });
  }

  // Create ticket channel
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: ticketCategory.id,
    topic: `${ticketId} | ${user.tag} | ${category}${orderId ? ` | Order: ${orderId}` : ''}`,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
    ],
  });

  // Grant staff + admin access
  const roleNames = [config.roles.staff, config.roles.admin, config.roles.owner];
  for (const roleName of roleNames) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role) {
      await channel.permissionOverwrites.create(role, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true, ManageMessages: true, AttachFiles: true,
      }).catch(() => {});
    }
  }

  // Save to DB
  Tickets.create({ ticketId, channelId: channel.id, userId: user.id, userTag: user.tag, guildId: guild.id, category, subject, orderId });

  const ticket = Tickets.findByChannel(channel.id);

  // Send welcome message (Components V2)
  let welcomeCard;
  if (isAutoCreated && orderId) {
    const order = Orders.findById(orderId);
    welcomeCard = buildOrderTicketWelcomeCard(ticket, user, order);
  } else {
    welcomeCard = buildTicketWelcomeCard(ticket, user);
  }
  await channel.send(welcomeCard);

  AuditLog.insert({
    action: isAutoCreated ? 'TICKET_AUTO_CREATED' : 'TICKET_CREATED',
    actorId: user.id,
    actorTag: user.tag,
    targetType: 'ticket',
    targetId: ticketId,
    details: { category, channelId: channel.id, orderId },
  });

  logger.success('TicketService', `Ticket ${ticketId} created for ${user.tag}${orderId ? ` (order ${orderId})` : ''}`);
  return { ticket, channel };
}

/**
 * Close a ticket: save transcript, notify, then delete channel.
 */
export async function closeTicket({ guild, channel, closedBy }) {
  const ticket = Tickets.findByChannel(channel.id);
  if (!ticket) throw new Error('No ticket found for this channel.');
  if (ticket.status === 'closed') throw new Error('This ticket is already closed.');

  // Collect messages for transcript
  const messages = await channel.messages.fetch({ limit: 100 });
  const sortedMessages = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const transcriptLines = sortedMessages
    .filter(m => !m.author.bot)
    .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`);
  const transcript = transcriptLines.join('\n');

  Tickets.close(channel.id, closedBy.id, transcript);

  // Send closed card
  const closedCard = buildTicketClosedCard(ticket, closedBy);
  await channel.send(closedCard).catch(() => {});

  // Post transcript in transcript channel
  try {
    const transcriptChannel = guild.channels.cache.find(c => c.name === config.tickets.transcriptChannelName);
    if (transcriptChannel) {
      const humanMessages = sortedMessages.filter(m => !m.author.bot);
      const transcriptCard = buildTranscriptCard(ticket, humanMessages);
      await transcriptChannel.send(transcriptCard);

      // Also send text file if long
      if (transcript.length > 0) {
        const { AttachmentBuilder } = await import('discord.js');
        const buffer = Buffer.from(transcript, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${ticket.ticket_id}.txt` });
        await transcriptChannel.send({ files: [attachment] });
      }
    }
  } catch (e) {
    logger.warn('TicketService', `Could not post transcript: ${e.message}`);
  }

  AuditLog.insert({
    action: 'TICKET_CLOSED',
    actorId: closedBy.id,
    actorTag: closedBy.tag,
    targetType: 'ticket',
    targetId: ticket.ticket_id,
    details: { channelId: channel.id },
  });

  logger.info('TicketService', `Ticket ${ticket.ticket_id} closed by ${closedBy.tag}`);
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

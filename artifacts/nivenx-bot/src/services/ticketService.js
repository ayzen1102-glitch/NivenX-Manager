/**
 * NivenX Assistant - Ticket Service
 * Business logic for creating and managing tickets.
 */

import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { Tickets, AuditLog, generateTicketId } from '../database/queries.js';
import { buildTicketWelcomeEmbed, buildTicketClosedEmbed, buildTranscriptEmbed } from '../ui/embeds/ticketEmbed.js';
import { buildTicketManageButtons } from '../ui/components/ticketComponents.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new ticket channel for a user.
 */
export async function createTicket({ guild, user, category, subject, orderId }) {
  // Enforce max open tickets per user
  const openTickets = Tickets.findOpenByUser(user.id);
  if (openTickets.length >= config.tickets.maxOpenPerUser) {
    throw new Error(`You already have an open ticket: <#${openTickets[0].channel_id}>`);
  }

  const ticketId = generateTicketId();
  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${ticketId.split('-')[1]}`;

  // Find or create the TICKETS category
  let ticketCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === config.tickets.categoryName
  );

  if (!ticketCategory) {
    ticketCategory = await guild.channels.create({
      name: config.tickets.categoryName,
      type: ChannelType.GuildCategory,
    });
  }

  // Create the ticket channel with proper permissions
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: ticketCategory.id,
    permissionOverwrites: [
      {
        id: guild.id, // @everyone — deny view
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id, // Ticket owner — allow view + send
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ],
  });

  // Grant staff access if roles exist
  const staffRole = guild.roles.cache.find(r => r.name === config.roles.staff);
  const adminRole = guild.roles.cache.find(r => r.name === config.roles.admin);
  for (const role of [staffRole, adminRole].filter(Boolean)) {
    await channel.permissionOverwrites.create(role, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      ManageMessages: true,
    });
  }

  // Save to DB
  Tickets.create({
    ticketId,
    channelId: channel.id,
    userId: user.id,
    userTag: user.tag,
    guildId: guild.id,
    category,
    subject: subject ?? null,
    orderId: orderId ?? null,
  });

  // Send welcome message
  const ticket = Tickets.findByChannel(channel.id);
  const welcomeEmbed = buildTicketWelcomeEmbed(ticket, user);
  const manageButtons = buildTicketManageButtons(ticketId);
  await channel.send({ embeds: [welcomeEmbed], components: [manageButtons] });

  AuditLog.insert({
    action: 'TICKET_CREATED',
    actorId: user.id,
    actorTag: user.tag,
    targetType: 'ticket',
    targetId: ticketId,
    details: { category, channelId: channel.id },
  });

  logger.success('TicketService', `Ticket ${ticketId} created for ${user.tag} in #${channelName}`);
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

  // Build transcript text
  const transcriptLines = sortedMessages
    .filter(m => !m.author.bot)
    .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`);
  const transcript = transcriptLines.join('\n');

  // Update DB
  Tickets.close(channel.id, closedBy.id, transcript);

  // Send closed embed
  const closedEmbed = buildTicketClosedEmbed(ticket, closedBy);
  await channel.send({ embeds: [closedEmbed] });

  // Post transcript in the transcripts channel
  try {
    const transcriptChannel = guild.channels.cache.find(
      c => c.name === config.tickets.transcriptChannelName
    );
    if (transcriptChannel) {
      const transcriptEmbed = buildTranscriptEmbed(ticket, sortedMessages.filter(m => !m.author.bot));
      await transcriptChannel.send({ embeds: [transcriptEmbed] });
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

  // Delete channel after short delay
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

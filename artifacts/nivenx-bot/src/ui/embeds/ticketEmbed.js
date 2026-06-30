/**
 * NivenX Assistant - Ticket Embed Builder
 */

import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';

/**
 * Build the welcome embed shown inside a new ticket channel.
 */
export function buildTicketWelcomeEmbed(ticket, user) {
  return new EmbedBuilder()
    .setTitle('🎫 Support Ticket Opened')
    .setDescription(
      `Welcome <@${user.id}>!\n\n` +
      `A staff member will be with you shortly. Please describe your issue in detail.\n\n` +
      `**Ticket ID:** \`${ticket.ticket_id}\`\n` +
      `**Category:** ${ticket.category}`
    )
    .setColor(config.bot.color)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: 'Use the buttons below to manage this ticket.' })
    .setTimestamp();
}

/**
 * Build the ticket closed embed.
 */
export function buildTicketClosedEmbed(ticket, closedBy) {
  return new EmbedBuilder()
    .setTitle('🔒 Ticket Closed')
    .setDescription(
      `This ticket has been closed by <@${closedBy.id}>.\n\n` +
      `A transcript has been saved. This channel will be deleted shortly.`
    )
    .setColor(config.bot.errorColor)
    .setFooter({ text: `Ticket ID: ${ticket.ticket_id}` })
    .setTimestamp();
}

/**
 * Build a ticket transcript embed for the transcripts channel.
 */
export function buildTranscriptEmbed(ticket, messages) {
  const lines = messages.map(m =>
    `**${m.author.tag}** [${new Date(m.createdTimestamp).toLocaleString()}]:\n${m.content || '[attachment/embed]'}`
  );

  return new EmbedBuilder()
    .setTitle(`📜 Transcript — ${ticket.ticket_id}`)
    .setDescription(lines.slice(0, 20).join('\n\n').substring(0, 4000) || 'No messages.')
    .setColor(config.bot.infoColor)
    .addFields(
      { name: 'User', value: `<@${ticket.user_id}> (${ticket.user_tag})`, inline: true },
      { name: 'Category', value: ticket.category, inline: true },
      { name: 'Opened', value: new Date(ticket.created_at).toLocaleDateString(), inline: true },
    )
    .setFooter({ text: `Ticket ID: ${ticket.ticket_id}` })
    .setTimestamp();
}

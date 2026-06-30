/**
 * NivenX Assistant - Ticket Components V2 Builders
 */

import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} from 'discord.js';
import {
  text, sep, container, row, btn, btnSuccess, btnDanger, btnSecondary, btnPrimary,
  Colors, V2Flags, V2EphemeralFlags, formatDate, formatRelative, statusEmoji,
} from './builder.js';

// ── Ticket Welcome Card ───────────────────────────────────────────────────────

export function buildTicketWelcomeCard(ticket, user, order = null) {
  const lines = [
    `## 🎫 Ticket \`${ticket.ticket_id}\``,
    ``,
    `Welcome <@${user.id}>! Our team will assist you shortly.`,
    ``,
    `📂 **Category:** ${ticket.category}`,
    `📅 **Opened:** ${formatDate(ticket.created_at)}`,
  ];

  if (ticket.subject) lines.push(`📌 **Subject:** ${ticket.subject}`);

  if (order) {
    lines.push(``, `**📦 Linked Order**`);
    lines.push(`> \`${order.order_id}\` — ${order.service_label}`);
    lines.push(`> Status: ${statusEmoji(order.status)} ${order.status}`);
    if (order.price != null) lines.push(`> Price: **$${Number(order.price).toFixed(2)}**`);
  }

  lines.push(
    ``,
    `---`,
    ``,
    `**📌 Guidelines**`,
    `> • Be clear and descriptive about your issue`,
    `> • Share any relevant screenshots or files`,
    `> • Response time: typically within a few hours`,
    `> • Use the buttons below to manage this ticket`,
  );

  const manageRow = row(
    btn(`ticket_close_${ticket.ticket_id}`, '🔒 Close Ticket', ButtonStyle.Danger),
    btn(`ticket_claim_${ticket.ticket_id}`, '✋ Claim (Staff)', ButtonStyle.Primary),
    btn(`ticket_transcript_${ticket.ticket_id}`, '📄 Transcript', ButtonStyle.Secondary),
    btn(`ticket_escalate_${ticket.ticket_id}`, '🔺 Escalate', ButtonStyle.Secondary),
  );

  return {
    components: [container(Colors.primary,
      text(lines.join('\n')),
      sep(),
      manageRow,
    )],
    flags: V2Flags,
  };
}

// ── Ticket Closed Card ────────────────────────────────────────────────────────

export function buildTicketClosedCard(ticket, closedBy) {
  const lines = [
    `## 🔒 Ticket Closed`,
    ``,
    `**Ticket:** \`${ticket.ticket_id}\``,
    `**Closed by:** <@${closedBy.id}>`,
    `**Time:** ${formatDate(new Date().toISOString())}`,
    ``,
    `> Thank you for contacting us! If you need further assistance, open a new ticket.`,
    `> A transcript has been saved to the transcripts channel.`,
  ];

  return {
    components: [container(Colors.error, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

// ── Ticket List Card ──────────────────────────────────────────────────────────

export function buildTicketListCard(tickets, title = '🎫 Open Tickets', ephemeral = false) {
  const lines = [`## ${title}`, ``];

  if (tickets.length === 0) {
    lines.push(`*No tickets found.*`);
  } else {
    for (const t of tickets.slice(0, 20)) {
      const status = t.status === 'open' ? '🟢' : '⚫';
      lines.push(`${status} **\`${t.ticket_id}\`** — ${t.category} — <@${t.user_id}>`);
      lines.push(`  └ <#${t.channel_id}> | ${formatRelative(t.created_at)}`);
    }
    if (tickets.length > 20) lines.push(``, `*...and ${tickets.length - 20} more*`);
  }

  const flags = ephemeral ? V2EphemeralFlags : V2Flags;
  return {
    components: [container(Colors.primary, text(lines.join('\n')))],
    flags,
  };
}

// ── Close Confirm Card ────────────────────────────────────────────────────────

export function buildCloseConfirmCard(ticketId) {
  return {
    components: [container(Colors.warning,
      text(`## ⚠️ Close Ticket?\n\nAre you sure? A transcript will be saved to the transcripts channel.`),
      sep(),
      row(
        btnDanger(`ticket_close_confirm_${ticketId}`, '🔒 Yes, Close'),
        btnSecondary(`ticket_close_cancel_${ticketId}`, '✕ Cancel'),
      ),
    )],
    flags: V2EphemeralFlags,
  };
}

// ── Ticket Claimed Card ───────────────────────────────────────────────────────

export function buildTicketClaimedCard(staffMember) {
  const lines = [
    `## ✋ Ticket Claimed`,
    ``,
    `This ticket has been claimed by <@${staffMember.id}>.`,
    ``,
    `> They will be assisting you with your request.`,
  ];
  return {
    components: [container(Colors.success, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

// ── Order Ticket Auto-Open Card ───────────────────────────────────────────────

export function buildOrderTicketWelcomeCard(ticket, user, order) {
  const details = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;

  const lines = [
    `## 📦 Order Support Ticket`,
    ``,
    `Hello <@${user.id}>! Your order has been received and this ticket has been automatically created.`,
    ``,
    `**📦 Order Details**`,
    `> **Order ID:** \`${order.order_id}\``,
    `> **Service:** ${order.service_label}`,
    `> **Status:** ${statusEmoji(order.status)} ${order.status}`,
  ];

  if (details && typeof details === 'object') {
    lines.push(``, `**📋 Your Requirements**`);
    for (const [k, v] of Object.entries(details)) {
      lines.push(`> **${k}:** ${v}`);
    }
  }

  lines.push(
    ``,
    `---`,
    `**Next Steps:**`,
    `> 1. Our staff will review your order details`,
    `> 2. You'll receive a price quote here`,
    `> 3. Once approved, an invoice will be sent`,
    `> 4. After payment, work begins!`,
    ``,
    `> Use the buttons below to manage this ticket.`,
  );

  const manageRow = row(
    btn(`ticket_close_${ticket.ticket_id}`, '🔒 Close Ticket', ButtonStyle.Danger),
    btn(`ticket_claim_${ticket.ticket_id}`, '✋ Claim (Staff)', ButtonStyle.Primary),
    btn(`ticket_transcript_${ticket.ticket_id}`, '📄 Transcript', ButtonStyle.Secondary),
  );

  return {
    components: [container(Colors.info,
      text(lines.join('\n')),
      sep(),
      manageRow,
    )],
    flags: V2Flags,
  };
}

// ── Transcript Card ───────────────────────────────────────────────────────────

export function buildTranscriptCard(ticket, messages) {
  const lines = [
    `## 📄 Ticket Transcript`,
    ``,
    `**Ticket:** \`${ticket.ticket_id}\``,
    `**Category:** ${ticket.category}`,
    `**User:** <@${ticket.user_id}>`,
    `**Opened:** ${formatDate(ticket.created_at)}`,
    `**Closed:** ${formatDate(new Date().toISOString())}`,
    `**Messages:** ${messages.length}`,
  ];

  if (messages.length > 0) {
    lines.push(``, `**📝 Last 5 Messages**`);
    for (const m of messages.slice(-5)) {
      const preview = m.content?.substring(0, 100) || '[attachment]';
      lines.push(`> **${m.author.tag}:** ${preview}${preview.length === 100 ? '...' : ''}`);
    }
  }

  return {
    components: [container(Colors.dark, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

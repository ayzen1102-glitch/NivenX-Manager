/**
 * NivenX Assistant - General V2 UI Components
 * Success, error, info, stats, welcome, announcements, polls, etc.
 */

import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  MessageFlags,
} from 'discord.js';
import {
  text, sep, bigSep, container, row, btn, btnSuccess, btnDanger, btnSecondary, btnLink,
  Colors, V2Flags, V2EphemeralFlags, formatDate, formatRelative, formatCurrency,
  ratingStars, progressBar,
} from './builder.js';

// ── Simple status cards ───────────────────────────────────────────────────────

export function successCard(title, description) {
  return { components: [container(Colors.success, text(`## ✅ ${title}\n\n${description}`))], flags: V2EphemeralFlags };
}

export function errorCard(title, description) {
  return { components: [container(Colors.error, text(`## ❌ ${title}\n\n${description}`))], flags: V2EphemeralFlags };
}

export function warningCard(title, description) {
  return { components: [container(Colors.warning, text(`## ⚠️ ${title}\n\n${description}`))], flags: V2EphemeralFlags };
}

export function infoCard(title, description) {
  return { components: [container(Colors.info, text(`## ℹ️ ${title}\n\n${description}`))], flags: V2EphemeralFlags };
}

export function successPublic(title, description) {
  return { components: [container(Colors.success, text(`## ✅ ${title}\n\n${description}`))], flags: V2Flags };
}

export function errorPublic(title, description) {
  return { components: [container(Colors.error, text(`## ❌ ${title}\n\n${description}`))], flags: V2Flags };
}

export function infoPublic(title, description) {
  return { components: [container(Colors.info, text(`## ℹ️ ${title}\n\n${description}`))], flags: V2Flags };
}

// ── Bot Stats Card ────────────────────────────────────────────────────────────

export function buildStatsCard(stats, botUser, uptime) {
  const uptimeFmt = formatUptime(uptime);

  const lines = [
    `## 🤖 NivenX Bot Status`,
    ``,
    `🟢 **Online** | Uptime: **${uptimeFmt}**`,
    ``,
    `**📊 Database Stats**`,
    `> 📦 Total Orders: **${stats.orders}**`,
    `> 🎫 Open Tickets: **${stats.openTickets}**`,
    `> ⭐ Total Reviews: **${stats.reviews}** | Avg: **${stats.avgRating ?? 'N/A'}**`,
    `> 💳 Active Coupons: **${stats.coupons}**`,
    `> 👤 Registered Users: **${stats.accounts}**`,
    `> 💰 Total Revenue: **${formatCurrency(stats.totalRevenue)}**`,
    ``,
    `**🔗 System**`,
    `> Ping: **${Math.round(stats.ping)}ms**`,
    `> Node.js: **${process.version}**`,
    `> discord.js: **v14**`,
    `> Guilds: **${stats.guilds}**`,
  ];

  return {
    components: [container(Colors.primary, text(lines.join('\n')))],
    flags: V2EphemeralFlags,
  };
}

// ── Help Card ─────────────────────────────────────────────────────────────────

export function buildHelpCard(isStaff = false, isAdmin = false) {
  const lines = [
    `## 📖 NivenX Help`,
    ``,
    `**🌐 Public Commands**`,
    `> \`/order\` — Place a new service order`,
    `> \`/ticket\` — Open a support ticket`,
    `> \`/services\` — Browse available services`,
    `> \`/account\` — View your account profile`,
    `> \`/points\` — Check your loyalty points`,
    `> \`/review\` — Leave a review for a completed order`,
    `> \`/faq\` — Frequently asked questions`,
    `> \`/status\` — Check bot status`,
    `> \`/quote\` — Request a price quote`,
    `> \`/portfolio\` — View our past work`,
    `> \`/refer\` — Get your referral link`,
    `> \`/feedback\` — Submit feedback`,
    ``,
    `**👤 Your Account**`,
    `> \`/myorders\` — Your order history`,
    `> \`/mytickets\` — Your open/closed tickets`,
    `> \`/myinvoices\` — Your invoice history`,
    `> \`/orderinfo [id]\` — Look up an order`,
    `> \`/pay\` — Submit payment proof`,
  ];

  if (isStaff || isAdmin) {
    lines.push(
      ``,
      `**👷 Staff Commands**`,
      `> \`/orders\` — View and manage orders`,
      `> \`/tickets\` — Manage support tickets`,
      `> \`/assign\` — Assign order/ticket to staff`,
      `> \`/invoice\` — Create invoice for an order`,
      `> \`/note\` — Add staff note to order`,
      `> \`/remind\` — Send payment reminder`,
      `> \`/payment verify\` — Confirm received payment`,
    );
  }

  if (isAdmin) {
    lines.push(
      ``,
      `**⚙️ Admin Commands**`,
      `> \`/admin\` — Administration panel`,
      `> \`/announce\` — Post announcement`,
      `> \`/blacklist\` — Manage blacklist`,
      `> \`/analytics\` — View revenue analytics`,
      `> \`/giveaway\` — Run a giveaway`,
      `> \`/poll\` — Create a poll`,
      `> \`/export\` — Export database`,
      `> \`/leaderboard\` — Top customers/staff`,
      `> \`/panel\` — Deploy panels`,
      `> \`/staffpanel\` — Staff management`,
    );
  }

  return {
    components: [container(Colors.primary, text(lines.join('\n')))],
    flags: V2EphemeralFlags,
  };
}

// ── Services List Card ────────────────────────────────────────────────────────

export function buildServicesCard(services, pricing = {}) {
  const lines = [
    `## 🛍️ Our Services`,
    ``,
    `> Select any service below to place an order.`,
    ``,
  ];

  for (const s of services) {
    const price = pricing[s.id] ? ` — Starting from **${formatCurrency(pricing[s.id])}**` : '';
    lines.push(`**${s.label}**${price}`);
    lines.push(`> ${s.description}`);
    lines.push(``);
  }

  lines.push(`> 💡 Use \`/order\` to get started!`);

  return {
    components: [container(Colors.primary, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

// ── Welcome Card ──────────────────────────────────────────────────────────────

export function buildWelcomeCard(member, guildName) {
  const lines = [
    `## 👋 Welcome to ${guildName}!`,
    ``,
    `Hey <@${member.id}>, we're glad to have you here!`,
    ``,
    `**🚀 Getting Started**`,
    `> 🛍️ \`/services\` — Browse what we offer`,
    `> 📦 \`/order\` — Place your first order`,
    `> 🎫 \`/ticket\` — Get support`,
    `> 📖 \`/help\` — View all commands`,
    `> 👤 \`/account\` — Set up your profile`,
    ``,
    `> We provide professional Discord, web, and hosting services.`,
    `> Our team is ready to help you anytime!`,
  ];

  return {
    components: [container(Colors.success, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

// ── Announcement Card ─────────────────────────────────────────────────────────

export function buildAnnouncementCard(title, content, authorTag, pinged = null) {
  const lines = [
    `# 📢 ${title}`,
    ``,
    content,
    ``,
    `---`,
    `*Posted by ${authorTag}* • ${formatDate(new Date().toISOString())}`,
  ];

  if (pinged) lines.unshift(`${pinged}\n`);

  return {
    components: [container(Colors.primary, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

// ── Poll Card ─────────────────────────────────────────────────────────────────

export function buildPollCard(pollId, question, options, votes = {}, ended = false) {
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const lines = [
    `## 📊 ${ended ? '[ENDED] ' : ''}Poll`,
    ``,
    `**${question}**`,
    ``,
  ];

  options.forEach((opt, i) => {
    const count = votes[i] ?? 0;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const bar = progressBar(count, Math.max(totalVotes, 1), 10);
    lines.push(`**${i + 1}.** ${opt}`);
    if (ended || totalVotes > 0) lines.push(`${bar} ${pct}% (${count} votes)`);
    lines.push(``);
  });

  lines.push(`Total votes: **${totalVotes}**`);

  const voteButtons = options.slice(0, 5).map((opt, i) =>
    btn(`poll_vote_${pollId}_${i}`, `${i + 1}. ${opt.substring(0, 20)}`, ButtonStyle.Primary)
  );

  const actionRow = ended ? null : row(...voteButtons);

  const comps = [text(lines.join('\n'))];
  if (!ended) comps.push(sep(), actionRow);

  return {
    components: [container(Colors.teal, ...comps)],
    flags: V2Flags,
  };
}

// ── Giveaway Card ─────────────────────────────────────────────────────────────

export function buildGiveawayCard(giveaway, ended = false, winner = null) {
  const lines = [
    `## 🎉 ${ended ? 'GIVEAWAY ENDED' : 'GIVEAWAY!'}`,
    ``,
    `**Prize:** ${giveaway.prize}`,
    `**Hosted by:** <@${giveaway.host_id}>`,
    `**Entries:** ${giveaway.entries ?? 0}`,
  ];

  if (!ended) {
    lines.push(`**Ends:** ${formatDate(giveaway.ends_at)}`);
    lines.push(``, `> Click the button below to enter!`);
  } else {
    lines.push(
      ``,
      winner
        ? `🎊 **Winner: <@${winner}>**\n\nCongratulations!`
        : `*No eligible entries.*`,
    );
  }

  const actionRow = ended ? null : row(
    btn(`giveaway_enter_${giveaway.id}`, '🎉 Enter Giveaway', ButtonStyle.Success),
  );

  const comps = [text(lines.join('\n'))];
  if (!ended && actionRow) comps.push(sep(), actionRow);

  return {
    components: [container(Colors.pink, ...comps)],
    flags: V2Flags,
  };
}

// ── Invoice Card ──────────────────────────────────────────────────────────────

export function buildInvoiceCard(invoice, order, ephemeral = false) {
  const lines = [
    `## 🧾 Invoice \`${invoice.invoice_id}\``,
    ``,
    `**Order:** \`${order.order_id}\` — ${order.service_label}`,
    `**Customer:** <@${invoice.user_id}>`,
    `**Status:** ${invoice.status === 'paid' ? '✅ Paid' : invoice.status === 'cancelled' ? '❌ Cancelled' : '🟡 Unpaid'}`,
    ``,
    `**Subtotal:** ${formatCurrency(invoice.amount)}`,
  ];

  if (invoice.discount > 0) lines.push(`**Discount:** -${formatCurrency(invoice.discount)}`);
  lines.push(`**Total Due: ${formatCurrency(invoice.total)}**`);
  if (invoice.due_date) lines.push(``, `⏰ **Due Date:** ${formatDate(invoice.due_date)}`);
  if (invoice.paid_at) lines.push(`✅ **Paid At:** ${formatDate(invoice.paid_at)}`);
  if (invoice.notes) lines.push(``, `📝 **Notes:** ${invoice.notes}`);

  const flags = ephemeral ? V2EphemeralFlags : V2Flags;
  return {
    components: [container(invoice.status === 'paid' ? Colors.success : Colors.warning, text(lines.join('\n')))],
    flags,
  };
}

// ── Review Card ───────────────────────────────────────────────────────────────

export function buildReviewCard(review, public_ = true) {
  const lines = [
    `## ⭐ New Review`,
    ``,
    `**${ratingStars(review.rating)}** (${review.rating}/5)`,
    `**From:** <@${review.user_id}>`,
  ];

  if (review.order_id) lines.push(`**Order:** \`${review.order_id}\``);
  if (review.comment) lines.push(``, `> "${review.comment}"`);
  lines.push(``, `*${formatRelative(review.created_at)}*`);

  const flags = public_ ? V2Flags : V2EphemeralFlags;
  return {
    components: [container(Colors.gold, text(lines.join('\n')))],
    flags,
  };
}

// ── FAQ Card ──────────────────────────────────────────────────────────────────

export function buildFaqCard(question, answer) {
  return {
    components: [container(Colors.info,
      text(`## ❓ ${question}\n\n${answer}`),
      sep(),
      text(`> Need more help? Open a ticket with \`/ticket\``),
    )],
    flags: V2EphemeralFlags,
  };
}

// ── Quote Request Card ────────────────────────────────────────────────────────

export function buildQuoteCard(quoteId, service, requirements, estimatedPrice = null) {
  const lines = [
    `## 💬 Quote Request`,
    ``,
    `**Quote ID:** \`QUOTE-${quoteId}\``,
    `**Service:** ${service}`,
    ``,
    `**Your Requirements:**`,
    `> ${requirements}`,
  ];

  if (estimatedPrice) {
    lines.push(``, `**Estimated Price:** ${formatCurrency(estimatedPrice)}`);
    lines.push(`> *This is an estimate. Final price set by staff.*`);
  } else {
    lines.push(``, `> Our team will review your requirements and provide a quote shortly.`);
  }

  lines.push(``, `> A staff member will contact you via ticket.`);

  return {
    components: [container(Colors.teal, text(lines.join('\n')))],
    flags: V2EphemeralFlags,
  };
}

// ── Portfolio Card ────────────────────────────────────────────────────────────

export function buildPortfolioCard(portfolioItems) {
  const lines = [
    `## 🎨 Our Portfolio`,
    ``,
    `> Here's a showcase of our recent work.`,
    ``,
  ];

  if (portfolioItems.length === 0) {
    lines.push(`*Portfolio items coming soon!*`);
  } else {
    for (const item of portfolioItems.slice(0, 10)) {
      lines.push(`**${item.title}**`);
      lines.push(`> ${item.description}`);
      if (item.url) lines.push(`> 🔗 [View Project](${item.url})`);
      lines.push(``);
    }
  }

  return {
    components: [container(Colors.purple, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

// ── Payment Proof Card ────────────────────────────────────────────────────────

export function buildPaymentProofCard(payment, user) {
  const lines = [
    `## 💳 Payment Proof Received`,
    ``,
    `**From:** <@${user.id}>`,
    `**Invoice:** \`${payment.invoice_id}\``,
    `**Method:** ${payment.method}`,
    `**Amount:** ${formatCurrency(payment.amount)}`,
    `**Reference:** ${payment.reference ?? 'N/A'}`,
    `**Submitted:** ${formatRelative(payment.created_at)}`,
    ``,
    `> Please verify and confirm this payment.`,
  ];

  const actionRow = row(
    btnSuccess(`payment_verify_${payment.id}`, '✅ Confirm Payment'),
    btnDanger(`payment_reject_${payment.id}`, '❌ Reject'),
  );

  return {
    components: [container(Colors.warning,
      text(lines.join('\n')),
      sep(),
      actionRow,
    )],
    flags: V2Flags,
  };
}

// ── Notification Card ─────────────────────────────────────────────────────────

export function buildNotificationCard(type, data) {
  const templates = {
    order_status: () => {
      const lines = [
        `## 📦 Order Status Updated`,
        ``,
        `Your order **\`${data.orderId}\`** has been updated.`,
        ``,
        `**${data.from}** → **${data.to}**`,
      ];
      if (data.notes) lines.push(``, `📝 Staff Note: *${data.notes}*`);
      if (data.to === 'Awaiting Payment' && data.invoiceId) {
        lines.push(``, `> An invoice has been sent. Check your ticket for payment details.`);
      }
      if (data.to === 'Completed') {
        lines.push(``, `> 🎉 Your order is complete! Thank you for your business.`);
        lines.push(`> Please leave a review with \`/review\``);
      }
      return lines.join('\n');
    },
    payment_confirmed: () => [
      `## ✅ Payment Confirmed!`,
      ``,
      `Your payment for **\`${data.invoiceId}\`** has been confirmed.`,
      `**Amount:** ${formatCurrency(data.amount)}`,
      ``,
      `> Work on your order has now begun! We'll keep you updated.`,
    ].join('\n'),
    invoice_due: () => [
      `## ⏰ Invoice Due Soon`,
      ``,
      `Your invoice **\`${data.invoiceId}\`** is due ${formatRelative(data.dueDate)}.`,
      `**Amount Due:** ${formatCurrency(data.amount)}`,
      ``,
      `> Please submit payment to avoid cancellation.`,
    ].join('\n'),
    ticket_reply: () => [
      `## 💬 New Ticket Reply`,
      ``,
      `Your ticket **\`${data.ticketId}\`** has a new reply from **${data.staffTag}**.`,
      ``,
      `> Check your ticket: <#${data.channelId}>`,
    ].join('\n'),
    review_prompt: () => [
      `## ⭐ How was your experience?`,
      ``,
      `Your order **\`${data.orderId}\`** is now complete!`,
      ``,
      `> We'd love to hear your feedback. Use \`/review\` to leave a rating.`,
    ].join('\n'),
  };

  const content = templates[type]?.() ?? `Notification: ${type}`;
  const colorMap = {
    order_status: Colors.info,
    payment_confirmed: Colors.success,
    invoice_due: Colors.warning,
    ticket_reply: Colors.primary,
    review_prompt: Colors.gold,
  };

  return {
    components: [container(colorMap[type] ?? Colors.primary, text(content))],
    flags: V2Flags,
  };
}

// ── Admin Analytics Card ──────────────────────────────────────────────────────

export function buildAnalyticsCard(stats, period = '30d') {
  const lines = [
    `## 📊 Analytics (Last ${period})`,
    ``,
    `**💰 Revenue**`,
    `> Total: **${formatCurrency(stats.revenue)}**`,
    `> Average Order: **${formatCurrency(stats.avgOrderValue)}**`,
    `> Best Day: **${formatCurrency(stats.bestDay)}**`,
    ``,
    `**📦 Orders**`,
    `> Total: **${stats.orders}** | Completed: **${stats.completed}**`,
    `> Pending: **${stats.pending}** | Cancelled: **${stats.cancelled}**`,
    `> Conversion Rate: **${stats.conversionRate}%**`,
    ``,
    `**🎫 Tickets**`,
    `> Opened: **${stats.ticketsOpened}** | Closed: **${stats.ticketsClosed}**`,
    `> Avg Resolution: **${stats.avgResolutionTime}**`,
    ``,
    `**⭐ Reviews**`,
    `> Total: **${stats.reviews}** | Avg Rating: **${stats.avgRating ?? 'N/A'}/5**`,
    ``,
    `**👤 Customers**`,
    `> New: **${stats.newCustomers}** | Returning: **${stats.returningCustomers}**`,
    `> Top Service: **${stats.topService ?? 'N/A'}**`,
  ];

  return {
    components: [container(Colors.primary, text(lines.join('\n')))],
    flags: V2EphemeralFlags,
  };
}

// ── Uptime formatter ──────────────────────────────────────────────────────────

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}

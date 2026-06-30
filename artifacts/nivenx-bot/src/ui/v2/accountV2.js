/**
 * NivenX Assistant - Account Components V2 Builders
 */

import { ButtonStyle } from 'discord.js';
import {
  text, sep, container, row, btn, btnSuccess, btnDanger, btnSecondary,
  Colors, V2Flags, V2EphemeralFlags, formatDate, formatRelative, formatCurrency,
  ratingStars, progressBar,
} from './builder.js';

// ── User Account Profile Card ─────────────────────────────────────────────────

export function buildAccountCard(account, stats, ephemeral = true) {
  const levelProgress = progressBar(account.xp % 500, 500, 12);
  const nextLevel = (account.level + 1) * 500;
  const xpNeeded = nextLevel - account.xp;

  const lines = [
    `## 👤 ${account.username}'s Account`,
    ``,
    `🎖️ **Rank:** ${getRank(account.total_spent)}`,
    `⭐ **Level:** ${account.level} | XP: ${account.xp} / ${account.level * 500 + 500}`,
    `${levelProgress} (${xpNeeded} XP to next level)`,
    `💰 **Total Spent:** ${formatCurrency(account.total_spent)}`,
    `🎁 **Points:** ${account.points} pts`,
    `🔗 **Referrals:** ${account.referral_count}`,
    `📅 **Member Since:** ${formatDate(account.created_at)}`,
    `🕒 **Last Active:** ${formatRelative(account.last_active)}`,
    ``,
    `**📊 Statistics**`,
    `> 📦 Orders: **${stats.orders}** | ✅ Completed: **${stats.completed}**`,
    `> 🎫 Tickets: **${stats.tickets}** | ⭐ Reviews: **${stats.reviews}**`,
    `> 💳 Invoices Paid: **${stats.invoicesPaid}**`,
  ];

  if (account.bio) {
    lines.push(``, `**📝 Bio**`, `> ${account.bio}`);
  }

  if (account.referral_code) {
    lines.push(``, `**🔗 Referral Code:** \`${account.referral_code}\``);
    lines.push(`> Share this to earn bonus points!`);
  }

  const actionRow = row(
    btn('account_edit_bio', '✏️ Edit Bio', ButtonStyle.Secondary),
    btn('account_points_history', '📊 Points History', ButtonStyle.Secondary),
    btn('account_refer_link', '🔗 Refer a Friend', ButtonStyle.Primary),
  );

  const flags = ephemeral ? V2EphemeralFlags : V2Flags;
  return {
    components: [container(Colors.purple,
      text(lines.join('\n')),
      sep(),
      actionRow,
    )],
    flags,
  };
}

// ── Points Card ───────────────────────────────────────────────────────────────

export function buildPointsCard(account, history = []) {
  const lines = [
    `## 🎁 Your Points`,
    ``,
    `**Current Balance: ${account.points} pts**`,
    ``,
    `> 💡 Earn points by placing orders, leaving reviews, and referring friends.`,
    `> Use points for discounts on future orders!`,
    ``,
    `**💱 Redemption Rates**`,
    `> 100 pts = $1.00 discount`,
    `> 500 pts = $5.50 discount (10% bonus)`,
    `> 1000 pts = $12.00 discount (20% bonus)`,
  ];

  if (history.length > 0) {
    lines.push(``, `**📋 Recent Activity**`);
    for (const h of history.slice(0, 8)) {
      const sign = h.amount > 0 ? '+' : '';
      lines.push(`> ${sign}${h.amount} pts — ${h.reason} — ${formatRelative(h.created_at)}`);
    }
  }

  const actionRow = row(
    btn('redeem_points_100', '💫 Redeem 100pts', ButtonStyle.Primary),
    btn('redeem_points_500', '⭐ Redeem 500pts', ButtonStyle.Primary),
    btn('redeem_points_1000', '🌟 Redeem 1000pts', ButtonStyle.Primary),
  );

  return {
    components: [container(Colors.gold,
      text(lines.join('\n')),
      sep(),
      actionRow,
    )],
    flags: V2EphemeralFlags,
  };
}

// ── Leaderboard Card ──────────────────────────────────────────────────────────

export function buildLeaderboardCard(entries, type = 'spending') {
  const title = type === 'spending' ? '💰 Top Customers' : type === 'points' ? '🎁 Points Leaders' : '⭐ Top Reviewers';
  const lines = [`## ${title}`, ``];

  const medals = ['🥇', '🥈', '🥉'];

  entries.slice(0, 10).forEach((e, i) => {
    const medal = medals[i] || `**${i + 1}.**`;
    const value = type === 'spending'
      ? formatCurrency(e.total_spent)
      : type === 'points'
      ? `${e.points} pts`
      : `${ratingStars(Math.round(e.avg_rating))} (${e.review_count})`;
    lines.push(`${medal} <@${e.user_id}> — ${value}`);
  });

  if (entries.length === 0) lines.push(`*No data yet.*`);

  return {
    components: [container(Colors.gold, text(lines.join('\n')))],
    flags: V2Flags,
  };
}

// ── Staff Lookup Card (Admin) ─────────────────────────────────────────────────

export function buildUserLookupCard(account, stats, recentOrders = []) {
  const lines = [
    `## 🔍 User Lookup`,
    ``,
    `**User:** <@${account.user_id}> (\`${account.username}\`)`,
    `**Joined:** ${formatDate(account.created_at)}`,
    `**Last Active:** ${formatRelative(account.last_active)}`,
    `**Level:** ${account.level} | XP: ${account.xp}`,
    `**Total Spent:** ${formatCurrency(account.total_spent)}`,
    `**Points:** ${account.points}`,
    `**Referrals:** ${account.referral_count}`,
    `**Blacklisted:** ${account.blacklisted ? '🔴 Yes' : '🟢 No'}`,
    ``,
    `**📊 Activity**`,
    `> Orders: **${stats.orders}** | Completed: **${stats.completed}**`,
    `> Tickets: **${stats.tickets}** | Reviews: **${stats.reviews}**`,
  ];

  if (recentOrders.length > 0) {
    lines.push(``, `**📦 Recent Orders**`);
    for (const o of recentOrders.slice(0, 5)) {
      lines.push(`> \`${o.order_id}\` — ${o.service_label} — **${o.status}**`);
    }
  }

  const actionRow = row(
    btn(`blacklist_add_${account.user_id}`, '🔒 Blacklist', ButtonStyle.Danger),
    btn(`grant_points_${account.user_id}`, '🎁 Grant Points', ButtonStyle.Primary),
    btn(`send_dm_${account.user_id}`, '📨 Send DM', ButtonStyle.Secondary),
  );

  return {
    components: [container(Colors.dark,
      text(lines.join('\n')),
      sep(),
      actionRow,
    )],
    flags: V2EphemeralFlags,
  };
}

// ── Rank helper ───────────────────────────────────────────────────────────────

function getRank(totalSpent) {
  if (totalSpent >= 1000) return '💎 Diamond';
  if (totalSpent >= 500) return '💜 Platinum';
  if (totalSpent >= 250) return '🥇 Gold';
  if (totalSpent >= 100) return '🥈 Silver';
  if (totalSpent >= 50) return '🥉 Bronze';
  return '🌱 Starter';
}

export { getRank };

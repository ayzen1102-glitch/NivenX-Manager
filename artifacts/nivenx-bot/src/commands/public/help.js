/**
 * NivenX Assistant - /help command
 * Shows all available commands grouped by category.
 */

import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { getPermLevel, PermLevel } from '../../utils/permissions.js';

const CATEGORIES = {
  '🌐 General': [
    { name: '/order', desc: 'Place a new service order' },
    { name: '/services', desc: 'Browse all available services' },
    { name: '/ticket', desc: 'Open a support ticket' },
    { name: '/review', desc: 'Leave a review for a completed order' },
    { name: '/ping', desc: 'Check bot latency' },
    { name: '/status', desc: 'View service status page' },
    { name: '/faq', desc: 'Browse frequently asked questions' },
    { name: '/help', desc: 'Show this help menu' },
  ],
  '👤 Client': [
    { name: '/myorders', desc: 'View your order history' },
    { name: '/myinvoices', desc: 'View your invoices and payment history' },
    { name: '/mytickets', desc: 'View your open and closed tickets' },
    { name: '/orderinfo', desc: 'Get details on a specific order' },
  ],
  '🛠️ Staff': [
    { name: '/orders', desc: 'Manage all orders (list, view, update, set price)' },
    { name: '/tickets', desc: 'Manage support tickets' },
    { name: '/invoice', desc: 'Create and manage invoices' },
    { name: '/note', desc: 'Add a staff note to an order' },
    { name: '/assign', desc: 'Assign an order or ticket to a staff member' },
    { name: '/remind', desc: 'Send a payment reminder to a client' },
  ],
  '⚙️ Admin': [
    { name: '/admin stats', desc: 'View business statistics dashboard' },
    { name: '/admin auditlog', desc: 'View audit log' },
    { name: '/admin coupon_create', desc: 'Create a coupon code' },
    { name: '/admin coupon_list', desc: 'List all coupons' },
    { name: '/admin coupon_delete', desc: 'Deactivate a coupon' },
    { name: '/admin setup', desc: 'Run server setup (roles & channels)' },
    { name: '/admin blacklist', desc: 'Blacklist a user from placing orders' },
    { name: '/admin announce', desc: 'Send an announcement embed' },
    { name: '/panel orders', desc: 'Post a persistent order panel' },
    { name: '/panel tickets', desc: 'Post a persistent ticket panel' },
    { name: '/staffpanel', desc: 'View staff business overview' },
  ],
};

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Browse all NivenX Assistant commands'),

  async execute(interaction) {
    const permLevel = getPermLevel(interaction.member);

    const embed = new EmbedBuilder()
      .setTitle(`📖 ${config.bot.name} — Command Reference`)
      .setColor(config.bot.color)
      .setDescription('Here are all available commands grouped by category.\n\n*Commands you cannot access based on your role are greyed out.*')
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: `NivenX Assistant v${config.bot.version} • Use / to start any command` })
      .setTimestamp();

    for (const [category, cmds] of Object.entries(CATEGORIES)) {
      // Skip staff/admin categories for regular users
      if (category.includes('Staff') && permLevel < PermLevel.STAFF) continue;
      if (category.includes('Admin') && permLevel < PermLevel.ADMIN) continue;

      embed.addFields({
        name: category,
        value: cmds.map(c => `\`${c.name}\` — ${c.desc}`).join('\n'),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

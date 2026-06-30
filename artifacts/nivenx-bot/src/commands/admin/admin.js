/**
 * NivenX Assistant - /admin command
 * Admin panel: statistics, audit log, coupon management.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { AuditLog, Reviews, Coupons, Orders, Tickets } from '../../database/queries.js';
import { getOrderStats } from '../../services/orderService.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { buildStatsEmbed, successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin panel')
    .addSubcommand(sub =>
      sub.setName('stats')
        .setDescription('View bot and business statistics')
    )
    .addSubcommand(sub =>
      sub.setName('auditlog')
        .setDescription('View recent audit log entries')
    )
    .addSubcommand(sub =>
      sub.setName('coupon_create')
        .setDescription('Create a coupon code')
        .addStringOption(opt =>
          opt.setName('code').setDescription('Coupon code (e.g. SAVE20)').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('type').setDescription('Discount type').setRequired(true)
            .addChoices({ name: 'Percentage (%)', value: 'percent' }, { name: 'Fixed ($)', value: 'fixed' })
        )
        .addNumberOption(opt =>
          opt.setName('value').setDescription('Discount value').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('max_uses').setDescription('Max number of uses (-1 = unlimited)').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('coupon_list')
        .setDescription('List all coupons')
    )
    .addSubcommand(sub =>
      sub.setName('coupon_delete')
        .setDescription('Deactivate a coupon')
        .addStringOption(opt =>
          opt.setName('code').setDescription('Coupon code').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Run server setup (create roles and channels)')
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;
    const sub = interaction.options.getSubcommand();

    // ── Stats ───────────────────────────────────────
    if (sub === 'stats') {
      const orderStats = getOrderStats();
      const reviewStats = Reviews.averageRating();
      const openTickets = Tickets.countOpen();

      const fields = [
        { name: '📦 Total Orders', value: String(orderStats.total), inline: true },
        { name: '🎫 Open Tickets', value: String(openTickets), inline: true },
        { name: '⭐ Avg Rating', value: reviewStats.avg ? `${Number(reviewStats.avg).toFixed(1)}/5 (${reviewStats.total} reviews)` : 'No reviews yet', inline: true },
        { name: '🟡 Pending', value: String(orderStats['Pending'] ?? 0), inline: true },
        { name: '🟣 Awaiting Payment', value: String(orderStats['Awaiting Payment'] ?? 0), inline: true },
        { name: '🔵 In Progress', value: String(orderStats['In Progress'] ?? 0), inline: true },
        { name: '🟢 Completed', value: String(orderStats['Completed'] ?? 0), inline: true },
        { name: '🔴 Cancelled', value: String(orderStats['Cancelled'] ?? 0), inline: true },
      ];

      return interaction.reply({
        embeds: [buildStatsEmbed('📊 NivenX Dashboard', fields, `Statistics as of <t:${Math.floor(Date.now() / 1000)}:F>`)],
        ephemeral: true,
      });
    }

    // ── Audit Log ───────────────────────────────────
    if (sub === 'auditlog') {
      const entries = AuditLog.recent(15);

      if (entries.length === 0) {
        return interaction.reply({ embeds: [{ color: config.bot.infoColor, description: 'No audit log entries yet.' }], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔍 Audit Log')
        .setColor(config.bot.color)
        .setDescription(
          entries.map(e =>
            `\`${e.action}\` by <@${e.actor_id}> — ${e.target_type ? `${e.target_type}: \`${e.target_id}\`` : ''} — <t:${Math.floor(new Date(e.created_at).getTime() / 1000)}:R>`
          ).join('\n')
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── Create Coupon ───────────────────────────────
    if (sub === 'coupon_create') {
      const code = interaction.options.getString('code').toUpperCase();
      const type = interaction.options.getString('type');
      const value = interaction.options.getNumber('value');
      const maxUses = interaction.options.getInteger('max_uses') ?? 1;

      try {
        Coupons.create({
          code,
          discountType: type,
          discountValue: value,
          maxUses,
          createdBy: interaction.user.id,
        });

        const discountText = type === 'percent' ? `${value}%` : `$${value}`;
        return interaction.reply({
          embeds: [successEmbed('Coupon Created', `Code \`${code}\` — **${discountText} off** — Max uses: ${maxUses === -1 ? 'Unlimited' : maxUses}`)],
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({ embeds: [errorEmbed('Error', err.message.includes('UNIQUE') ? 'That coupon code already exists.' : err.message)], ephemeral: true });
      }
    }

    // ── List Coupons ────────────────────────────────
    if (sub === 'coupon_list') {
      const coupons = Coupons.findAll();

      if (coupons.length === 0) {
        return interaction.reply({ embeds: [{ color: config.bot.infoColor, description: 'No coupons found.' }], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎟️ Coupons')
        .setColor(config.bot.color);

      coupons.forEach(c => {
        const active = c.active ? '🟢' : '🔴';
        const discount = c.discount_type === 'percent' ? `${c.discount_value}%` : `$${c.discount_value}`;
        const uses = `${c.uses}/${c.max_uses === -1 ? '∞' : c.max_uses}`;
        embed.addFields({
          name: `${active} \`${c.code}\``,
          value: `${discount} off — Used: ${uses}${c.expires_at ? ` — Expires: <t:${Math.floor(new Date(c.expires_at).getTime() / 1000)}:D>` : ''}`,
          inline: false,
        });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── Delete Coupon ───────────────────────────────
    if (sub === 'coupon_delete') {
      const code = interaction.options.getString('code').toUpperCase();
      Coupons.deactivate(code);
      return interaction.reply({
        embeds: [successEmbed('Coupon Deactivated', `Coupon \`${code}\` has been deactivated.`)],
        ephemeral: true,
      });
    }

    // ── Server Setup ────────────────────────────────
    if (sub === 'setup') {
      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild;
      const created = [];

      // Create roles if they don't exist
      for (const roleName of ['Owner', 'Admin', 'Staff']) {
        if (!guild.roles.cache.find(r => r.name === roleName)) {
          await guild.roles.create({ name: roleName, reason: 'NivenX setup' });
          created.push(`Role: ${roleName}`);
        }
      }

      // Create channels if they don't exist
      const channels = ['bot-logs', 'orders', 'reviews', 'ticket-transcripts', 'welcome'];
      for (const ch of channels) {
        if (!guild.channels.cache.find(c => c.name === ch)) {
          await guild.channels.create({ name: ch, reason: 'NivenX setup' });
          created.push(`Channel: #${ch}`);
        }
      }

      const desc = created.length > 0
        ? `Created:\n${created.map(c => `• ${c}`).join('\n')}`
        : 'All required roles and channels already exist.';

      await interaction.editReply({ embeds: [successEmbed('Setup Complete', desc)] });
    }
  },
};

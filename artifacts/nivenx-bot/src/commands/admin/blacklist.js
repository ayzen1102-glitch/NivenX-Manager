/**
 * NivenX Assistant - /blacklist command (Admin)
 * Block users from placing orders.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getDb } from '../../database/database.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';

function ensureBlacklistTable() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS blacklist (
      user_id TEXT PRIMARY KEY,
      user_tag TEXT NOT NULL,
      reason TEXT,
      added_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export const Blacklist = {
  add(userId, userTag, reason, addedBy) {
    ensureBlacklistTable();
    return getDb().prepare(`INSERT OR REPLACE INTO blacklist (user_id, user_tag, reason, added_by) VALUES (?, ?, ?, ?)`)
      .run(userId, userTag, reason ?? null, addedBy);
  },
  remove(userId) {
    ensureBlacklistTable();
    return getDb().prepare(`DELETE FROM blacklist WHERE user_id = ?`).run(userId);
  },
  isBlacklisted(userId) {
    ensureBlacklistTable();
    return !!getDb().prepare(`SELECT 1 FROM blacklist WHERE user_id = ?`).get(userId);
  },
  findAll() {
    ensureBlacklistTable();
    return getDb().prepare(`SELECT * FROM blacklist ORDER BY created_at DESC`).all();
  },
};

export default {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Admin: manage the order blacklist')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Block a user from placing orders')
        .addUserOption(opt => opt.setName('user').setDescription('User to blacklist').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a user from the blacklist')
        .addUserOption(opt => opt.setName('user').setDescription('User to unblacklist').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('View all blacklisted users')
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') ?? 'No reason provided';
      Blacklist.add(user.id, user.tag, reason, interaction.user.tag);

      await interaction.reply({
        embeds: [successEmbed('User Blacklisted', `**${user.tag}** has been blocked from placing orders.\n**Reason:** ${reason}`)],
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      Blacklist.remove(user.id);
      await interaction.reply({
        embeds: [successEmbed('Removed from Blacklist', `**${user.tag}** can now place orders again.`)],
        ephemeral: true,
      });
    }

    if (sub === 'list') {
      const list = Blacklist.findAll();
      if (list.length === 0) {
        return interaction.reply({ embeds: [{ color: config.bot.infoColor, description: 'No users are blacklisted.' }], ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setTitle('🚫 Blacklisted Users')
        .setColor(config.bot.errorColor)
        .setDescription(list.map(u => `<@${u.user_id}> (${u.user_tag}) — ${u.reason ?? 'No reason'} — <t:${Math.floor(new Date(u.created_at).getTime() / 1000)}:R>`).join('\n'));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

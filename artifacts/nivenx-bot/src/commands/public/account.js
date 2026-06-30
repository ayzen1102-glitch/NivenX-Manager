/**
 * NivenX - /account command
 * View your account profile, level, XP, points, and stats.
 */

import { SlashCommandBuilder } from 'discord.js';
import { UserAccounts } from '../../database/queries.js';
import { ensureAccount, getUserStatsSync } from '../../services/accountService.js';
import { buildAccountCard } from '../../ui/v2/accountV2.js';
import { errorCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('account')
    .setDescription('View your NivenX account profile, level, and stats'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const account = ensureAccount(interaction.user.id, interaction.user.tag, interaction.guildId);
    const stats = getUserStatsSync(interaction.user.id);

    await interaction.editReply(buildAccountCard(account, stats, true));
  },
};

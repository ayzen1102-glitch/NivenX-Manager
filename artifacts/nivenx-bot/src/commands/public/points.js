/**
 * NivenX - /points command
 * View and redeem loyalty points.
 */

import { SlashCommandBuilder } from 'discord.js';
import { UserAccounts } from '../../database/queries.js';
import { ensureAccount } from '../../services/accountService.js';
import { buildPointsCard } from '../../ui/v2/accountV2.js';
import { errorCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('points')
    .setDescription('View your loyalty points and redeem for discounts'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const account = ensureAccount(interaction.user.id, interaction.user.tag, interaction.guildId);
    const history = UserAccounts.pointsHistory(interaction.user.id, 10);

    await interaction.editReply(buildPointsCard(account, history));
  },
};

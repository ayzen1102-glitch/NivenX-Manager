/**
 * NivenX - /help command (Components V2)
 */

import { SlashCommandBuilder } from 'discord.js';
import { getPermLevel, PermLevel, isStaff, isAdmin } from '../../utils/permissions.js';
import { buildHelpCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Browse all available commands'),

  async execute(interaction) {
    await interaction.reply(buildHelpCard(isStaff(interaction.member), isAdmin(interaction.member)));
  },
};

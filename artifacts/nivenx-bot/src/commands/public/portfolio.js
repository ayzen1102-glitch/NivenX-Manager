/**
 * NivenX - /portfolio command
 * View our showcase of past work.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Portfolio } from '../../database/queries.js';
import { buildPortfolioCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('View our portfolio of past work and projects'),

  async execute(interaction) {
    const items = Portfolio.findAll();
    await interaction.reply(buildPortfolioCard(items));
  },
};

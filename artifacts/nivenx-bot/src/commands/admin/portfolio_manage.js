/**
 * NivenX - /portfolio-manage command (Admin)
 * Add and remove portfolio items.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Portfolio } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { successCard, errorCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('portfolio-manage')
    .setDescription('Manage portfolio items (Admin)')
    .addSubcommand(s => s.setName('add').setDescription('Add a portfolio item')
      .addStringOption(o => o.setName('title').setDescription('Project title').setRequired(true))
      .addStringOption(o => o.setName('description').setDescription('Project description').setRequired(true))
      .addStringOption(o => o.setName('category').setDescription('Category').setRequired(false))
      .addStringOption(o => o.setName('url').setDescription('Project URL').setRequired(false)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a portfolio item')
      .addIntegerOption(o => o.setName('id').setDescription('Portfolio item ID').setRequired(true))),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      Portfolio.add({
        title: interaction.options.getString('title'),
        description: interaction.options.getString('description'),
        category: interaction.options.getString('category'),
        url: interaction.options.getString('url'),
        addedBy: interaction.user.id,
      });
      await interaction.reply(successCard('Portfolio Item Added', 'The item has been added to the portfolio.'));
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id');
      Portfolio.remove(id);
      await interaction.reply(successCard('Portfolio Item Removed', `Item #${id} has been hidden from the portfolio.`));
    }
  },
};

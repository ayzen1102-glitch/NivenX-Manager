/**
 * NivenX - /services command (Components V2)
 */

import { SlashCommandBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { ServicePricing } from '../../database/queries.js';
import { buildServicesCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('services')
    .setDescription('Browse all available NivenX services'),

  async execute(interaction) {
    const pricing = {};
    const dbPricing = ServicePricing.findAll();
    for (const p of dbPricing) pricing[p.service_id] = p.base_price;
    await interaction.reply(buildServicesCard(config.services, pricing));
  },
};

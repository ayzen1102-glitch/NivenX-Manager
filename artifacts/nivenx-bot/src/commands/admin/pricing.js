/**
 * NivenX - /pricing command (Admin)
 * Set and view service pricing.
 */

import { SlashCommandBuilder } from 'discord.js';
import { ServicePricing } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { successCard } from '../../ui/v2/generalV2.js';
import { text, container, Colors, V2EphemeralFlags } from '../../ui/v2/builder.js';
import { config } from '../../config/config.js';
import { formatCurrency } from '../../ui/v2/builder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pricing')
    .setDescription('Manage service pricing (Admin)')
    .addSubcommand(s => s.setName('set').setDescription('Set pricing for a service')
      .addStringOption(o => {
        const opt = o.setName('service').setDescription('Service ID').setRequired(true);
        config.services.forEach(sv => opt.addChoices({ name: sv.label, value: sv.id }));
        return opt;
      })
      .addNumberOption(o => o.setName('base_price').setDescription('Base starting price').setRequired(true))
      .addNumberOption(o => o.setName('min_price').setDescription('Minimum price').setRequired(false))
      .addNumberOption(o => o.setName('max_price').setDescription('Maximum price').setRequired(false)))
    .addSubcommand(s => s.setName('list').setDescription('View all service pricing')),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const serviceId = interaction.options.getString('service');
      ServicePricing.set({
        serviceId,
        basePrice: interaction.options.getNumber('base_price'),
        minPrice: interaction.options.getNumber('min_price'),
        maxPrice: interaction.options.getNumber('max_price'),
        updatedBy: interaction.user.id,
      });
      const service = config.services.find(s => s.id === serviceId);
      await interaction.reply(successCard('Pricing Updated', `**${service?.label ?? serviceId}** pricing updated.`));
    }

    if (sub === 'list') {
      const allPricing = ServicePricing.findAll();
      const lines = [`## 💰 Service Pricing`, ``];
      for (const s of config.services) {
        const p = allPricing.find(x => x.service_id === s.id);
        if (p) {
          lines.push(`**${s.label}**`);
          lines.push(`> Base: **${formatCurrency(p.base_price)}** | Min: ${formatCurrency(p.min_price)} | Max: ${formatCurrency(p.max_price)}`);
        } else {
          lines.push(`**${s.label}** — *Not set*`);
        }
      }
      await interaction.reply({ components: [container(Colors.primary, text(lines.join('\n')))], flags: V2EphemeralFlags });
    }
  },
};

/**
 * NivenX - /order command (Components V2)
 * Service order flow with auto-ticket creation.
 */

import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { UserAccounts } from '../../database/queries.js';
import { ensureAccount } from '../../services/accountService.js';
import { errorCard } from '../../ui/v2/generalV2.js';
import { text, sep, container, row, Colors, V2EphemeralFlags } from '../../ui/v2/builder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('order')
    .setDescription('Place a new service order'),

  async execute(interaction) {
    ensureAccount(interaction.user.id, interaction.user.tag, interaction.guildId);

    const account = UserAccounts.findById(interaction.user.id);
    if (account?.blacklisted) {
      return interaction.reply(errorCard('Access Denied', 'You are unable to place orders. Open a ticket if you believe this is an error.'));
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('service_select')
      .setPlaceholder('🛍️ Choose a service to order...')
      .addOptions(config.services.map(s => ({ label: s.label, description: s.description, value: s.id })));

    const lines = [
      `## 🛍️ Place an Order`,
      ``,
      `Welcome, <@${interaction.user.id}>! Select a service to get started.`,
      ``,
      `> 📋 Fill in a short form with your requirements`,
      `> 📦 An order ID and support ticket are created automatically`,
      `> 🎟️ Apply coupon codes after filling in the form`,
      `> 💡 Use \`/services\` to browse with descriptions`,
    ];

    await interaction.reply({
      components: [
        container(Colors.primary, text(lines.join('\n')), sep()),
        new ActionRowBuilder().addComponents(selectMenu),
      ],
      flags: V2EphemeralFlags,
    });
  },
};

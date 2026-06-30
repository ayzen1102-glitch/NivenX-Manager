/**
 * NivenX - /ticket command (Components V2)
 * Opens a support ticket with category selection.
 */

import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { text, sep, container, Colors, V2EphemeralFlags } from '../../ui/v2/builder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a support ticket'),

  async execute(interaction) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category_select')
      .setPlaceholder('📂 Choose a ticket category...')
      .addOptions(config.ticketCategories.map(c => ({ label: c.label, description: c.description, value: c.value })));

    const lines = [
      `## 🎫 Open a Support Ticket`,
      ``,
      `Select the category that best describes your issue.`,
      `A private channel will be created for you and our team.`,
      ``,
      `> 💬 Be ready to describe your issue in detail`,
      `> 📎 You can share screenshots and files in your ticket`,
      `> ⏱️ Our team typically responds within a few hours`,
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

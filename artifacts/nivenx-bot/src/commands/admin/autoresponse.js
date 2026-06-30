/**
 * NivenX - /autoresponse command (Admin)
 * Manage auto-responses for keywords in messages.
 */

import { SlashCommandBuilder } from 'discord.js';
import { AutoResponses } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { successCard, errorCard } from '../../ui/v2/generalV2.js';
import { text, container, Colors, V2EphemeralFlags } from '../../ui/v2/builder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('autoresponse')
    .setDescription('Manage auto-responses for keywords (Admin)')
    .addSubcommand(s => s.setName('add').setDescription('Add an auto-response')
      .addStringOption(o => o.setName('trigger').setDescription('Trigger word/phrase').setRequired(true))
      .addStringOption(o => o.setName('response').setDescription('Auto-response text').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove an auto-response')
      .addStringOption(o => o.setName('trigger').setDescription('Trigger to remove').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List all auto-responses')),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const trigger = interaction.options.getString('trigger');
      const response = interaction.options.getString('response');
      AutoResponses.add({ trigger, response, createdBy: interaction.user.id });
      await interaction.reply(successCard('Auto-Response Added', `Trigger: \`${trigger}\`\nResponse: ${response}`));
    }

    if (sub === 'remove') {
      const trigger = interaction.options.getString('trigger');
      AutoResponses.remove(trigger);
      await interaction.reply(successCard('Auto-Response Removed', `Trigger \`${trigger}\` has been removed.`));
    }

    if (sub === 'list') {
      const responses = AutoResponses.findAll();
      const lines = [`## 🤖 Auto-Responses (${responses.length})`, ``];
      if (responses.length === 0) lines.push(`*No auto-responses configured.*`);
      for (const r of responses) {
        lines.push(`**\`${r.trigger}\`** (used ${r.uses}x)${r.active ? '' : ' *(disabled)*'}`);
        lines.push(`> ${r.response.substring(0, 80)}${r.response.length > 80 ? '...' : ''}`);
      }
      await interaction.reply({ components: [container(Colors.info, text(lines.join('\n')))], flags: V2EphemeralFlags });
    }
  },
};

/**
 * NivenX Assistant - /tickets command (Staff)
 * View and manage open tickets.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Tickets } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { errorEmbed, infoEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';
import { closeTicket } from '../../services/ticketService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Staff: manage tickets')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List open tickets')
    )
    .addSubcommand(sub =>
      sub.setName('close')
        .setDescription('Force-close a ticket by channel')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('The ticket channel').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const tickets = Tickets.findAll('open');

      if (tickets.length === 0) {
        return interaction.reply({ embeds: [infoEmbed('No Open Tickets', 'There are no open tickets right now.')], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎫 Open Tickets')
        .setColor(config.bot.color)
        .setDescription(`**${tickets.length}** open ticket(s)`)
        .setTimestamp();

      tickets.slice(0, 20).forEach(t => {
        embed.addFields({
          name: `${t.ticket_id} — ${t.category}`,
          value: `<#${t.channel_id}> | <@${t.user_id}> | Opened <t:${Math.floor(new Date(t.created_at).getTime() / 1000)}:R>`,
          inline: false,
        });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'close') {
      const channel = interaction.options.getChannel('channel');
      await interaction.deferReply({ ephemeral: true });

      try {
        await closeTicket({
          guild: interaction.guild,
          channel,
          closedBy: interaction.user,
        });
        await interaction.editReply({ embeds: [{ color: config.bot.successColor, description: `✅ Ticket in <#${channel.id}> closed.` }] });
      } catch (err) {
        await interaction.editReply({ embeds: [errorEmbed('Error', err.message)] });
      }
    }
  },
};

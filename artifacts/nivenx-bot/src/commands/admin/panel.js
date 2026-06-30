/**
 * NivenX Assistant - /panel command (Admin)
 * Posts a persistent order/ticket panel in a channel.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { buildServiceSelectMenu } from '../../ui/components/orderComponents.js';
import { buildTicketCategoryMenu } from '../../ui/components/ticketComponents.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Admin: post a persistent service or ticket panel')
    .addSubcommand(sub =>
      sub.setName('orders')
        .setDescription('Post the order panel in this channel')
    )
    .addSubcommand(sub =>
      sub.setName('tickets')
        .setDescription('Post the ticket panel in this channel')
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'orders') {
      const embed = new EmbedBuilder()
        .setTitle('🛍️ NivenX Services')
        .setDescription(
          '**Welcome to NivenX!**\n\n' +
          'We offer a range of professional digital services.\n' +
          'Select a service from the menu below to begin your order.\n\n' +
          config.services.map(s => `${s.label} — ${s.description}`).join('\n')
        )
        .setColor(config.bot.color)
        .setFooter({ text: 'NivenX Assistant • Select a service to place an order' })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed], components: [buildServiceSelectMenu()] });
      await interaction.reply({ content: '✅ Order panel posted!', ephemeral: true });
    }

    if (sub === 'tickets') {
      const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setDescription(
          '**Need help? Open a ticket below.**\n\n' +
          '• **Order Support** — Help with an existing order\n' +
          '• **Billing** — Payment or invoice questions\n' +
          '• **Technical Support** — Technical issues\n' +
          '• **General** — Any other questions\n\n' +
          'Our team will respond as soon as possible.'
        )
        .setColor(config.bot.color)
        .setFooter({ text: 'NivenX Assistant • Select a category to open a ticket' })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed], components: [buildTicketCategoryMenu()] });
      await interaction.reply({ content: '✅ Ticket panel posted!', ephemeral: true });
    }
  },
};

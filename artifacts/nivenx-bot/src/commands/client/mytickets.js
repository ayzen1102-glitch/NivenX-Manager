/**
 * NivenX Assistant - /mytickets command
 * View your support ticket history.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Tickets } from '../../database/queries.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mytickets')
    .setDescription('View your support ticket history'),

  async execute(interaction) {
    const allTickets = [
      ...Tickets.findOpenByUser(interaction.user.id),
      ...Tickets.findAll('closed').filter(t => t.user_id === interaction.user.id),
    ].slice(0, 15);

    if (allTickets.length === 0) {
      return interaction.reply({
        embeds: [{
          color: config.bot.infoColor,
          title: '🎫 Your Tickets',
          description: 'You have no tickets.\nUse `/ticket` to open a support ticket.',
        }],
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Your Tickets')
      .setColor(config.bot.color)
      .setDescription(`Showing your last **${allTickets.length}** ticket(s).`);

    allTickets.forEach(t => {
      const icon = t.status === 'open' ? '🟢' : '🔴';
      embed.addFields({
        name: `${icon} ${t.ticket_id} — ${t.category}`,
        value: `Status: \`${t.status}\`${t.channel_id && t.status === 'open' ? ` | <#${t.channel_id}>` : ''}\nOpened: <t:${Math.floor(new Date(t.created_at).getTime() / 1000)}:R>`,
        inline: true,
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

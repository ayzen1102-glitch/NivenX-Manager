/**
 * NivenX Assistant - /status command
 * Show service uptime and operational status.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { Orders, Tickets } from '../../database/queries.js';

const SERVICE_STATUS = [
  { name: '🖥️ Hosting', status: 'operational' },
  { name: '☁️ VPS', status: 'operational' },
  { name: '🌐 Domains', status: 'operational' },
  { name: '💬 Discord Server Setup', status: 'operational' },
  { name: '🤖 Bot Development', status: 'operational' },
  { name: '🌍 Web Development', status: 'operational' },
  { name: '✨ Custom Requests', status: 'operational' },
];

const STATUS_DISPLAY = {
  operational: { icon: '🟢', label: 'Operational' },
  degraded: { icon: '🟡', label: 'Degraded Performance' },
  outage: { icon: '🔴', label: 'Service Outage' },
  maintenance: { icon: '🔧', label: 'Under Maintenance' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('View current service status'),

  async execute(interaction) {
    const allOk = SERVICE_STATUS.every(s => s.status === 'operational');
    const openTickets = Tickets.countOpen();

    const embed = new EmbedBuilder()
      .setTitle('📊 NivenX Service Status')
      .setDescription(allOk
        ? '✅ **All systems operational** — Everything is running smoothly.'
        : '⚠️ **Some services are experiencing issues.** Check below for details.')
      .setColor(allOk ? config.bot.successColor : config.bot.warningColor)
      .addFields(
        SERVICE_STATUS.map(s => {
          const display = STATUS_DISPLAY[s.status];
          return { name: s.name, value: `${display.icon} ${display.label}`, inline: true };
        })
      )
      .addFields({ name: '🎫 Open Support Tickets', value: String(openTickets), inline: true })
      .setFooter({ text: 'Status updates are manual • Open a ticket for incidents' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

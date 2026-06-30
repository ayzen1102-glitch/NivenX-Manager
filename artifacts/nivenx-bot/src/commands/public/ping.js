/**
 * NivenX Assistant - /ping command
 * Check bot latency and API response time.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and status'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = interaction.client.ws.ping;

    const status = roundtrip < 200 ? '🟢 Excellent' : roundtrip < 400 ? '🟡 Good' : '🔴 High';

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(roundtrip < 200 ? config.bot.successColor : roundtrip < 400 ? config.bot.warningColor : config.bot.errorColor)
      .addFields(
        { name: '📡 Roundtrip', value: `**${roundtrip}ms**`, inline: true },
        { name: '💓 WebSocket', value: `**${ws}ms**`, inline: true },
        { name: '📊 Status', value: status, inline: true },
      )
      .setFooter({ text: `NivenX Assistant v${config.bot.version}` })
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};

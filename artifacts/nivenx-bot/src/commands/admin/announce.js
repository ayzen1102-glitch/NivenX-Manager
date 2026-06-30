/**
 * NivenX Assistant - /announce command (Admin)
 * Send a styled announcement embed to any channel.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Admin: send an announcement embed to a channel')
    .addStringOption(opt =>
      opt.setName('title').setDescription('Announcement title').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('message').setDescription('Announcement body').setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Target channel (defaults to current)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('color').setDescription('Embed color').setRequired(false)
        .addChoices(
          { name: '🔵 Blue (default)', value: 'blue' },
          { name: '🟢 Green', value: 'green' },
          { name: '🔴 Red', value: 'red' },
          { name: '🟡 Yellow', value: 'yellow' },
          { name: '🟣 Purple', value: 'purple' },
        )
    )
    .addBooleanOption(opt =>
      opt.setName('ping').setDescription('Ping @everyone with the announcement').setRequired(false)
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;
    const colorKey = interaction.options.getString('color') ?? 'blue';
    const ping = interaction.options.getBoolean('ping') ?? false;

    const colorMap = {
      blue: config.bot.color,
      green: config.bot.successColor,
      red: config.bot.errorColor,
      yellow: config.bot.warningColor,
      purple: 0x9B59B6,
    };

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${title}`)
      .setDescription(message)
      .setColor(colorMap[colorKey])
      .setFooter({ text: `Announcement by ${interaction.user.tag} • NivenX` })
      .setTimestamp();

    try {
      await channel.send({
        content: ping ? '@everyone' : null,
        embeds: [embed],
      });
      await interaction.reply({ content: `✅ Announcement sent to <#${channel.id}>.`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed('Failed', `Could not send to <#${channel.id}>: ${err.message}`)], ephemeral: true });
    }
  },
};

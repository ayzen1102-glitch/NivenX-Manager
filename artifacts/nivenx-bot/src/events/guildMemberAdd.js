/**
 * NivenX Assistant - guildMemberAdd Event
 * Welcome new members and assign a Customer role if configured.
 */

import { EmbedBuilder } from 'discord.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export default {
  name: 'guildMemberAdd',
  once: false,

  async execute(member, client) {
    logger.info('GuildMemberAdd', `${member.user.tag} joined ${member.guild.name}`);

    // Post welcome in a welcome channel if it exists
    const welcomeChannel = member.guild.channels.cache.find(c => c.name === 'welcome');
    if (welcomeChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription(
          `Hey <@${member.id}>, welcome to **${member.guild.name}**!\n\n` +
          `Browse our services and open a ticket to get started.\n` +
          `Use \`/services\` to see what we offer.`
        )
        .setColor(config.bot.color)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await welcomeChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};

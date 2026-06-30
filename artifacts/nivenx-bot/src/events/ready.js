/**
 * NivenX Assistant - Ready Event
 * Fires once when the bot successfully logs in.
 */

import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export default {
  name: 'ready',
  once: true,

  async execute(client) {
    logger.success('Ready', `Logged in as ${client.user.tag}`);
    logger.info('Ready', `Serving ${client.guilds.cache.size} guild(s)`);

    // Set bot activity status
    client.user.setActivity(`${config.bot.name} v${config.bot.version}`, {
      type: ActivityType.Watching,
    });

    // Find and cache the log channel ID
    for (const guild of client.guilds.cache.values()) {
      const logChannel = guild.channels.cache.find(c => c.name === config.logging.channelName);
      if (logChannel) {
        logger.setLogChannel(logChannel.id);
        logger.info('Ready', `Log channel found: #${logChannel.name} in ${guild.name}`);
        break;
      }
    }
  },
};

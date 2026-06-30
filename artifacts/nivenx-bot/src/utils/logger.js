/**
 * NivenX Assistant - Logger Utility
 * Structured console logging with levels and Discord channel logging.
 */

import { EmbedBuilder } from 'discord.js';
import { config } from '../config/config.js';

const LEVELS = {
  info: { label: 'INFO', color: '\x1b[36m', emoji: 'ℹ️' },
  success: { label: 'SUCCESS', color: '\x1b[32m', emoji: '✅' },
  warn: { label: 'WARN', color: '\x1b[33m', emoji: '⚠️' },
  error: { label: 'ERROR', color: '\x1b[31m', emoji: '❌' },
  debug: { label: 'DEBUG', color: '\x1b[35m', emoji: '🔍' },
};

const RESET = '\x1b[0m';

/**
 * Format a log message for console output.
 */
function formatMessage(level, module, message) {
  const { label, color } = LEVELS[level];
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  return `${color}[${timestamp}] [${label}]${RESET} [${module}] ${message}`;
}

class Logger {
  constructor() {
    this.client = null;
    this.logChannelId = null;
  }

  /**
   * Attach a Discord client to enable channel logging.
   */
  setClient(client) {
    this.client = client;
  }

  /**
   * Set the log channel ID for Discord logging.
   */
  setLogChannel(channelId) {
    this.logChannelId = channelId;
  }

  /**
   * Core log function — logs to console and optionally to Discord.
   */
  _log(level, module, message, discordEmbed = null) {
    console.log(formatMessage(level, module, message));

    // Send to Discord log channel if available and enabled
    if (config.logging.enabled && this.client && this.logChannelId && level !== 'debug') {
      const channel = this.client.channels.cache.get(this.logChannelId);
      if (channel) {
        const embed = discordEmbed ?? new EmbedBuilder()
          .setDescription(`${LEVELS[level].emoji} **[${LEVELS[level].label}]** \`${module}\` — ${message}`)
          .setColor(level === 'error' ? config.bot.errorColor : level === 'warn' ? config.bot.warningColor : config.bot.infoColor)
          .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }

  info(module, message, embed = null) { this._log('info', module, message, embed); }
  success(module, message, embed = null) { this._log('success', module, message, embed); }
  warn(module, message, embed = null) { this._log('warn', module, message, embed); }
  error(module, message, embed = null) { this._log('error', module, message, embed); }
  debug(module, message) { this._log('debug', module, message); }
}

export const logger = new Logger();

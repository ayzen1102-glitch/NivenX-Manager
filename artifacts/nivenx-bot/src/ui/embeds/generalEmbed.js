/**
 * NivenX Assistant - General Purpose Embed Builders
 * Success, error, info, and warning embeds used throughout the bot.
 */

import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';

export function successEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor(config.bot.successColor)
    .setTimestamp();
}

export function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setColor(config.bot.errorColor)
    .setTimestamp();
}

export function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setColor(config.bot.infoColor)
    .setTimestamp();
}

export function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setColor(config.bot.warningColor)
    .setTimestamp();
}

/**
 * Build a generic stats/dashboard embed.
 */
export function buildStatsEmbed(title, fields, description = null) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(config.bot.color)
    .addFields(fields)
    .setTimestamp()
    .setFooter({ text: 'NivenX Assistant' });

  if (description) embed.setDescription(description);
  return embed;
}

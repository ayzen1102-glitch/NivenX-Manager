/**
 * NivenX Assistant - /review command
 * Submit a review for a completed order.
 */

import {
  SlashCommandBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Reviews, Orders } from '../../database/queries.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Leave a review for a completed order')
    .addIntegerOption(opt =>
      opt.setName('rating')
        .setDescription('Your rating (1-5 stars)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption(opt =>
      opt.setName('order_id')
        .setDescription('Your order ID (e.g. NVX-0001)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('comment')
        .setDescription('Your feedback')
        .setRequired(false)
    ),

  async execute(interaction) {
    const rating = interaction.options.getInteger('rating');
    const orderId = interaction.options.getString('order_id');
    const comment = interaction.options.getString('comment');

    // Validate order belongs to user if provided
    if (orderId) {
      const order = Orders.findById(orderId);
      if (!order) {
        return interaction.reply({ embeds: [errorEmbed('Order Not Found', `Order \`${orderId}\` was not found.`)], ephemeral: true });
      }
      if (order.user_id !== interaction.user.id) {
        return interaction.reply({ embeds: [errorEmbed('Not Your Order', 'You can only review your own orders.')], ephemeral: true });
      }
      if (order.status !== 'Completed') {
        return interaction.reply({ embeds: [errorEmbed('Order Not Completed', 'You can only review completed orders.')], ephemeral: true });
      }
    }

    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

    Reviews.create({
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      orderId: orderId ?? null,
      rating,
      comment: comment ?? null,
    });

    await interaction.reply({
      embeds: [successEmbed('Review Submitted!', `Thank you for your feedback!\n\n${stars} (${rating}/5)\n${comment ? `_"${comment}"_` : ''}`)],
      ephemeral: true,
    });

    // Post in reviews channel
    const reviewsChannel = interaction.guild?.channels.cache.find(c => c.name === config.reviews.channelName);
    if (reviewsChannel) {
      const { EmbedBuilder } = await import('discord.js');
      const reviewEmbed = new EmbedBuilder()
        .setTitle(`${stars} New Review`)
        .setDescription(comment ? `_"${comment}"_` : '*No comment provided.*')
        .setColor(config.bot.successColor)
        .addFields(
          { name: 'Customer', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Rating', value: `${rating}/5`, inline: true },
          { name: 'Order', value: orderId ?? 'N/A', inline: true },
        )
        .setTimestamp();
      await reviewsChannel.send({ embeds: [reviewEmbed] }).catch(() => {});
    }
  },
};

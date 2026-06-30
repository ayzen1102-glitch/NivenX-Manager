/**
 * NivenX - /review command (Components V2)
 * Submit a review for a completed order.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Reviews, Orders } from '../../database/queries.js';
import { successCard, errorCard, buildReviewCard } from '../../ui/v2/generalV2.js';
import { awardPoints } from '../../services/accountService.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Leave a review for a completed order')
    .addIntegerOption(o => o.setName('rating').setDescription('Star rating (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
    .addStringOption(o => o.setName('order_id').setDescription('Your order ID (e.g. NVX-0001)').setRequired(false))
    .addStringOption(o => o.setName('comment').setDescription('Your feedback comment').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    const rating = interaction.options.getInteger('rating');
    const orderId = interaction.options.getString('order_id')?.toUpperCase();
    const comment = interaction.options.getString('comment');

    if (orderId) {
      const order = Orders.findById(orderId);
      if (!order) return interaction.reply(errorCard('Order Not Found', `Order \`${orderId}\` was not found.`));
      if (order.user_id !== interaction.user.id) return interaction.reply(errorCard('Not Your Order', 'You can only review your own orders.'));
      if (order.status !== 'Completed') return interaction.reply(errorCard('Not Completed', 'You can only review orders marked as Completed.'));
      if (Reviews.findByOrder(orderId)) return interaction.reply(errorCard('Already Reviewed', `You've already reviewed order \`${orderId}\`.`));
    }

    const review = { userId: interaction.user.id, userTag: interaction.user.tag, orderId: orderId ?? null, rating, comment: comment ?? null };
    Reviews.create(review);

    // Award points for reviewing
    awardPoints(interaction.user.id, 20, 'Review submitted', orderId);

    await interaction.reply(successCard('Review Submitted! +20pts', `Thank you for your feedback! You earned **20 loyalty points** 🎁`));

    // Post in reviews channel using Components V2
    const reviewsChannel = interaction.guild?.channels.cache.find(c => c.name === config.review.channelName);
    if (reviewsChannel) {
      await reviewsChannel.send(buildReviewCard(review, true)).catch(() => {});
    }
  },
};

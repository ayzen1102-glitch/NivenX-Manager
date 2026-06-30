/**
 * NivenX Assistant - /faq command
 * Frequently Asked Questions.
 */

import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { config } from '../../config/config.js';

const FAQS = [
  {
    id: 'how_order',
    label: '📦 How do I place an order?',
    answer: 'Use the `/order` command and select your desired service. Fill in the form and confirm. You\'ll receive an order ID (e.g., NVX-0001) and a staff member will contact you.',
  },
  {
    id: 'how_ticket',
    label: '🎫 How do I open a support ticket?',
    answer: 'Use `/ticket` and select a category. A private channel will be created for you and our team will respond shortly.',
  },
  {
    id: 'payment',
    label: '💳 What payment methods do you accept?',
    answer: 'We accept PayPal, Crypto (BTC, ETH, LTC), and bank transfer. Once your order is reviewed, a staff member will send you an invoice with payment details.',
  },
  {
    id: 'timeline',
    label: '⏱️ How long does delivery take?',
    answer: 'Delivery time depends on the service:\n• Hosting/VPS: 1–24 hours\n• Domain setup: 1–2 hours\n• Discord Server Setup: 1–3 days\n• Bot Development: 3–14 days\n• Website: 7–30 days\n\nTimelines are estimated and will be confirmed at order review.',
  },
  {
    id: 'refund',
    label: '💰 What is your refund policy?',
    answer: 'Refunds are available within 48 hours of payment if work has not started. Once development or setup has begun, refunds are issued at our discretion. Open a ticket to discuss your case.',
  },
  {
    id: 'cancel',
    label: '❌ Can I cancel my order?',
    answer: 'Yes — open a ticket and reference your order ID. Orders can be cancelled before work begins with no charge. After work starts, cancellation may incur a partial fee.',
  },
  {
    id: 'review',
    label: '⭐ How do I leave a review?',
    answer: 'Use `/review` after your order is marked **Completed**. Provide your order ID, a star rating (1–5), and optional comment. Your review will be posted in our #reviews channel.',
  },
  {
    id: 'coupon',
    label: '🎟️ How do I use a coupon?',
    answer: 'When placing an order, after filling out the form you\'ll see an **Apply Coupon** button. Enter your coupon code and the discount will be applied to your invoice.',
  },
];

export default {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Browse frequently asked questions'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('❓ Frequently Asked Questions')
      .setDescription('Select a topic from the menu below, or browse common questions here.')
      .setColor(config.bot.color)
      .addFields(
        FAQS.slice(0, 4).map(faq => ({
          name: faq.label,
          value: faq.answer,
          inline: false,
        }))
      )
      .setFooter({ text: 'Use the dropdown for more questions • Open a ticket for custom help' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('faq_select')
      .setPlaceholder('Browse more questions...')
      .addOptions(FAQS.map(f => ({ label: f.label, value: f.id })));

    await interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true,
    });
  },
};

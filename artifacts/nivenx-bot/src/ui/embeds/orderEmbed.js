/**
 * NivenX Assistant - Order Embed Builder
 * Creates rich embeds for order displays.
 */

import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';

/**
 * Build an order detail embed.
 */
export function buildOrderEmbed(order) {
  const details = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;
  const statusColor = config.statusColors[order.status] ?? config.bot.color;

  const embed = new EmbedBuilder()
    .setTitle(`📦 Order ${order.order_id}`)
    .setColor(statusColor)
    .addFields(
      { name: '👤 Customer', value: `<@${order.user_id}> (${order.user_tag})`, inline: true },
      { name: '🛍️ Service', value: order.service_label, inline: true },
      { name: '📊 Status', value: `**${order.status}**`, inline: true },
    );

  // Add order details fields
  if (details && typeof details === 'object') {
    const detailLines = Object.entries(details)
      .map(([k, v]) => `**${k}:** ${v}`)
      .join('\n');
    embed.addFields({ name: '📋 Details', value: detailLines || 'None provided' });
  }

  if (order.price) {
    embed.addFields({ name: '💰 Price', value: `$${order.price.toFixed(2)}`, inline: true });
  }
  if (order.discount_amount > 0) {
    embed.addFields({ name: '🏷️ Discount', value: `$${order.discount_amount.toFixed(2)}`, inline: true });
  }
  if (order.coupon_code) {
    embed.addFields({ name: '🎟️ Coupon', value: order.coupon_code, inline: true });
  }
  if (order.notes) {
    embed.addFields({ name: '📝 Staff Notes', value: order.notes });
  }

  embed
    .setFooter({ text: `NivenX Assistant • ${config.bot.version}` })
    .setTimestamp(new Date(order.created_at));

  return embed;
}

/**
 * Build an order summary embed for confirmation before submitting.
 */
export function buildOrderSummaryEmbed(serviceLabel, details, coupon = null) {
  const embed = new EmbedBuilder()
    .setTitle('📋 Order Summary')
    .setDescription('Please review your order details before confirming.')
    .setColor(config.bot.infoColor)
    .addFields({ name: '🛍️ Service', value: serviceLabel, inline: false });

  const detailLines = Object.entries(details)
    .map(([k, v]) => `**${k}:** ${v}`)
    .join('\n');
  embed.addFields({ name: '📝 Your Information', value: detailLines });

  if (coupon) {
    const discountText = coupon.discount_type === 'percent'
      ? `${coupon.discount_value}% off`
      : `$${coupon.discount_value} off`;
    embed.addFields({ name: '🎟️ Coupon Applied', value: `\`${coupon.code}\` — ${discountText}` });
  }

  embed
    .setFooter({ text: 'Click Confirm to submit your order, or Cancel to discard.' })
    .setTimestamp();

  return embed;
}

/**
 * Build a compact order list embed for admin/staff viewing.
 */
export function buildOrderListEmbed(orders, title = '📦 Order List') {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(config.bot.color);

  if (orders.length === 0) {
    embed.setDescription('No orders found.');
    return embed;
  }

  const lines = orders.slice(0, 25).map(o =>
    `**${o.order_id}** — ${o.service_label} — \`${o.status}\` — <@${o.user_id}>`
  );

  embed.setDescription(lines.join('\n'));
  embed.setFooter({ text: `Showing ${Math.min(orders.length, 25)} of ${orders.length} orders` });
  return embed;
}

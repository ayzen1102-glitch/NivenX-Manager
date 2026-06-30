/**
 * NivenX Assistant - /orders command (Staff)
 * View and manage orders from the staff panel.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Orders } from '../../database/queries.js';
import { buildOrderEmbed, buildOrderListEmbed } from '../../ui/embeds/orderEmbed.js';
import { buildStatusSelectMenu, buildSetPriceModal } from '../../ui/components/orderComponents.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('orders')
    .setDescription('Staff: manage orders')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List orders by status')
        .addStringOption(opt =>
          opt.setName('status')
            .setDescription('Filter by status')
            .setRequired(false)
            .addChoices(
              ...Object.values(config.orderStatuses).map(s => ({ name: s, value: s }))
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View a specific order')
        .addStringOption(opt =>
          opt.setName('order_id').setDescription('Order ID (e.g. NVX-0001)').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Change order status')
        .addStringOption(opt =>
          opt.setName('order_id').setDescription('Order ID').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('setprice')
        .setDescription('Set price for an order')
        .addStringOption(opt =>
          opt.setName('order_id').setDescription('Order ID').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;

    const sub = interaction.options.getSubcommand();

    // ── List orders ─────────────────────────────────
    if (sub === 'list') {
      const status = interaction.options.getString('status');
      const orders = status ? Orders.findByStatus(status) : Orders.findAll(30);
      const title = status ? `📦 Orders — ${status}` : '📦 All Recent Orders';
      return interaction.reply({ embeds: [buildOrderListEmbed(orders, title)], ephemeral: true });
    }

    // ── View single order ───────────────────────────
    if (sub === 'view') {
      const orderId = interaction.options.getString('order_id').toUpperCase();
      const order = Orders.findById(orderId);
      if (!order) return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });

      const setPriceBtn = new ButtonBuilder()
        .setCustomId(`set_price_btn_${orderId}`)
        .setLabel('💰 Set Price')
        .setStyle(ButtonStyle.Primary);

      const statusRow = buildStatusSelectMenu(orderId);
      const btnRow = new ActionRowBuilder().addComponents(setPriceBtn);

      return interaction.reply({
        embeds: [buildOrderEmbed(order)],
        components: [statusRow, btnRow],
        ephemeral: true,
      });
    }

    // ── Update status via select ─────────────────────
    if (sub === 'status') {
      const orderId = interaction.options.getString('order_id').toUpperCase();
      const order = Orders.findById(orderId);
      if (!order) return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });

      return interaction.reply({
        embeds: [buildOrderEmbed(order)],
        components: [buildStatusSelectMenu(orderId)],
        ephemeral: true,
      });
    }

    // ── Set price via modal ──────────────────────────
    if (sub === 'setprice') {
      const orderId = interaction.options.getString('order_id').toUpperCase();
      const order = Orders.findById(orderId);
      if (!order) return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });

      const { buildSetPriceModal } = await import('../../ui/components/orderComponents.js');
      return interaction.showModal(buildSetPriceModal(orderId));
    }
  },
};

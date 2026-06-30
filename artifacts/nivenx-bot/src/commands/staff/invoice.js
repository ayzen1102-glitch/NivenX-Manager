/**
 * NivenX Assistant - /invoice command (Staff)
 * Generate and manage invoices.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Orders, Invoices } from '../../database/queries.js';
import { createInvoice, buildInvoiceEmbed, markInvoicePaid } from '../../services/invoiceService.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { errorEmbed, successEmbed } from '../../ui/embeds/generalEmbed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('invoice')
    .setDescription('Staff: manage invoices')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create an invoice for an order')
        .addStringOption(opt =>
          opt.setName('order_id').setDescription('Order ID (e.g. NVX-0001)').setRequired(true)
        )
        .addNumberOption(opt =>
          opt.setName('amount').setDescription('Invoice amount in USD').setRequired(true)
        )
        .addNumberOption(opt =>
          opt.setName('discount').setDescription('Discount amount (optional)').setRequired(false)
        )
        .addStringOption(opt =>
          opt.setName('notes').setDescription('Notes to include on the invoice').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View an invoice')
        .addStringOption(opt =>
          opt.setName('invoice_id').setDescription('Invoice ID (e.g. INV-0001)').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('paid')
        .setDescription('Mark an invoice as paid')
        .addStringOption(opt =>
          opt.setName('invoice_id').setDescription('Invoice ID').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.STAFF)) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const orderId = interaction.options.getString('order_id').toUpperCase();
      const amount = interaction.options.getNumber('amount');
      const discount = interaction.options.getNumber('discount') ?? 0;
      const notes = interaction.options.getString('notes');

      const order = Orders.findById(orderId);
      if (!order) return interaction.reply({ embeds: [errorEmbed('Not Found', `Order \`${orderId}\` not found.`)], ephemeral: true });

      const invoice = createInvoice({ orderId, userId: order.user_id, amount, discount, notes });
      const embed = buildInvoiceEmbed(invoice, order);

      // DM the invoice to the client
      try {
        const client_user = await interaction.client.users.fetch(order.user_id);
        await client_user.send({ embeds: [embed] });
      } catch { /* DMs may be closed */ }

      return interaction.reply({ embeds: [embed, { color: 0x57F287, description: `✅ Invoice sent to <@${order.user_id}>` }], ephemeral: true });
    }

    if (sub === 'view') {
      const invoiceId = interaction.options.getString('invoice_id').toUpperCase();
      const invoice = Invoices.findById(invoiceId);
      if (!invoice) return interaction.reply({ embeds: [errorEmbed('Not Found', `Invoice \`${invoiceId}\` not found.`)], ephemeral: true });
      const order = Orders.findById(invoice.order_id);
      return interaction.reply({ embeds: [buildInvoiceEmbed(invoice, order)], ephemeral: true });
    }

    if (sub === 'paid') {
      const invoiceId = interaction.options.getString('invoice_id').toUpperCase();
      try {
        const invoice = markInvoicePaid(invoiceId, interaction.user.id, interaction.user.tag);
        return interaction.reply({
          embeds: [successEmbed('Invoice Paid', `Invoice **${invoiceId}** marked as paid. Order status updated to Paid.`)],
          ephemeral: true,
        });
      } catch (err) {
        return interaction.reply({ embeds: [errorEmbed('Error', err.message)], ephemeral: true });
      }
    }
  },
};

/**
 * NivenX Assistant - /myinvoices command
 * View your invoices and payment history.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Invoices, Orders } from '../../database/queries.js';
import { buildInvoiceEmbed } from '../../services/invoiceService.js';
import { config } from '../../config/config.js';
import { errorEmbed } from '../../ui/embeds/generalEmbed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('myinvoices')
    .setDescription('View your invoices')
    .addStringOption(opt =>
      opt.setName('invoice_id')
        .setDescription('Look up a specific invoice')
        .setRequired(false)
    ),

  async execute(interaction) {
    const invoiceId = interaction.options.getString('invoice_id');

    if (invoiceId) {
      const invoice = Invoices.findById(invoiceId.toUpperCase());
      if (!invoice || invoice.user_id !== interaction.user.id) {
        return interaction.reply({ embeds: [errorEmbed('Not Found', `Invoice \`${invoiceId}\` not found.`)], ephemeral: true });
      }
      const order = Orders.findById(invoice.order_id);
      return interaction.reply({ embeds: [buildInvoiceEmbed(invoice, order)], ephemeral: true });
    }

    const invoices = Invoices.findByUser(interaction.user.id);

    if (invoices.length === 0) {
      return interaction.reply({
        embeds: [{ color: config.bot.infoColor, title: '🧾 Your Invoices', description: 'No invoices found.' }],
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🧾 Your Invoices')
      .setColor(config.bot.color)
      .setDescription(`You have **${invoices.length}** invoice(s).`);

    const statusIcons = { unpaid: '🔴', paid: '🟢', cancelled: '⚫' };
    invoices.slice(0, 10).forEach(inv => {
      embed.addFields({
        name: `${statusIcons[inv.status] ?? '⚪'} ${inv.invoice_id}`,
        value: `Order: **${inv.order_id}** — $${inv.total.toFixed(2)} — \`${inv.status.toUpperCase()}\``,
        inline: false,
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

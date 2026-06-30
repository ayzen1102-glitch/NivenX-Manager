/**
 * NivenX - /pay command
 * Submit payment proof for an invoice.
 */

import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { Invoices, Orders } from '../../database/queries.js';
import { errorCard, infoCard } from '../../ui/v2/generalV2.js';
import { V2EphemeralFlags } from '../../ui/v2/builder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Submit payment proof for your invoice')
    .addStringOption(o => o.setName('invoice_id').setDescription('Your invoice ID (e.g. INV-0001)').setRequired(true))
    .addStringOption(o => o.setName('method').setDescription('Payment method used').setRequired(true)
      .addChoices(
        { name: 'PayPal', value: 'PayPal' },
        { name: 'Crypto (BTC)', value: 'Crypto (BTC)' },
        { name: 'Crypto (ETH)', value: 'Crypto (ETH)' },
        { name: 'Bank Transfer', value: 'Bank Transfer' },
        { name: 'Other', value: 'Other' },
      )),

  async execute(interaction) {
    const invoiceId = interaction.options.getString('invoice_id').toUpperCase();
    const method = interaction.options.getString('method');

    const invoice = Invoices.findById(invoiceId);
    if (!invoice) return interaction.reply(errorCard('Not Found', `Invoice \`${invoiceId}\` not found. Check your invoice ID with \`/myinvoices\`.`));
    if (invoice.user_id !== interaction.user.id) return interaction.reply(errorCard('Permission Denied', 'This is not your invoice.'));
    if (invoice.status === 'paid') return interaction.reply(errorCard('Already Paid', 'This invoice has already been marked as paid.'));
    if (invoice.status === 'cancelled') return interaction.reply(errorCard('Cancelled', 'This invoice has been cancelled.'));

    const modal = new ModalBuilder()
      .setCustomId(`payment_proof_${invoiceId}_${method.replace(/\s/g, '_')}`)
      .setTitle('Submit Payment Proof');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reference')
          .setLabel('Transaction ID / Reference Number')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('e.g. TXN123456 or transaction hash')
          .setMaxLength(200),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('amount')
          .setLabel('Amount Sent')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder(`e.g. ${invoice.total}`)
          .setMaxLength(20),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('notes')
          .setLabel('Additional Notes (optional)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500),
      ),
    );

    await interaction.showModal(modal);
  },
};

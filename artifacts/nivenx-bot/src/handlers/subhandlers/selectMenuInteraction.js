/**
 * NivenX Assistant - Select Menu Interaction Sub-handler
 */

import { logger } from '../../utils/logger.js';
import { Orders } from '../../database/queries.js';
import { updateOrderStatus } from '../../services/orderService.js';
import { createTicket } from '../../services/ticketService.js';
import { buildOrderModal } from '../../ui/components/orderComponents.js';
import { buildOrderEmbed } from '../../ui/embeds/orderEmbed.js';
import { successEmbed, errorEmbed } from '../../ui/embeds/generalEmbed.js';
import { config } from '../../config/config.js';
import { isStaff } from '../../utils/permissions.js';
import { randomUUID } from 'crypto';

export async function handleSelectMenu(interaction, client) {
  const { customId, values } = interaction;
  logger.debug('SelectMenu', `Menu: ${customId} = ${values.join(',')} by ${interaction.user.tag}`);

  // ── Service Selection → Show Order Form Modal ───
  if (customId === 'service_select') {
    const serviceId = values[0];
    const service = config.services.find(s => s.id === serviceId);
    if (!service) return interaction.reply({ embeds: [errorEmbed('Error', 'Unknown service.')], ephemeral: true });

    // Use a temp session UUID to correlate modal response
    const tempId = randomUUID().split('-')[0];

    // Store pending service selection in client memory
    if (!client.pendingOrders) client.pendingOrders = new Map();
    client.pendingOrders.set(`${interaction.user.id}_${tempId}`, {
      serviceId,
      serviceLabel: service.label,
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      guildId: interaction.guildId,
    });

    const { buildOrderModal } = await import('../../ui/components/orderComponents.js');
    await interaction.showModal(buildOrderModal(serviceId, tempId));
  }

  // ── Ticket Category Selection ───────────────────
  else if (customId === 'ticket_category_select') {
    const category = values[0];
    await interaction.deferReply({ ephemeral: true });

    try {
      const { ticket, channel } = await createTicket({
        guild: interaction.guild,
        user: interaction.user,
        category,
        subject: null,
        orderId: null,
      });

      await interaction.editReply({
        embeds: [successEmbed('Ticket Created', `Your ticket has been created: <#${channel.id}>\n\nA staff member will assist you shortly.`)],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [errorEmbed('Error', err.message)] });
    }
  }

  // ── Order Status Update (staff) ─────────────────
  else if (customId.startsWith('status_update_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Staff only.')], ephemeral: true });
    }

    const orderId = customId.replace('status_update_', '');
    const newStatus = values[0];

    try {
      const updated = updateOrderStatus(orderId, newStatus, interaction.user.id, interaction.user.tag);
      await interaction.update({
        embeds: [buildOrderEmbed(updated)],
        components: [],
      });
      await interaction.followUp({
        embeds: [successEmbed('Status Updated', `Order **${orderId}** status changed to **${newStatus}**`)],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed('Error', err.message)], ephemeral: true });
    }
  }

  else {
    logger.warn('SelectMenu', `Unhandled select menu: ${customId}`);
  }
}

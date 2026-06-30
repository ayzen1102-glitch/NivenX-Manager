/**
 * NivenX Assistant - Ticket UI Components
 * Buttons and menus for the ticket system.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';

const TICKET_CATEGORIES = [
  { label: '📦 Order Support', description: 'Help with an existing order', value: 'order' },
  { label: '💳 Billing', description: 'Payment or invoice questions', value: 'billing' },
  { label: '🛠️ Technical Support', description: 'Technical issues with a service', value: 'technical' },
  { label: '💬 General', description: 'General questions', value: 'general' },
];

/**
 * Build the ticket category selection menu (shown in the ticket panel).
 */
export function buildTicketCategoryMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_category_select')
    .setPlaceholder('Select a ticket category...')
    .addOptions(TICKET_CATEGORIES);

  return new ActionRowBuilder().addComponents(menu);
}

/**
 * Build the in-ticket management buttons (shown in the ticket channel).
 */
export function buildTicketManageButtons(ticketId) {
  const close = new ButtonBuilder()
    .setCustomId(`ticket_close_${ticketId}`)
    .setLabel('🔒 Close Ticket')
    .setStyle(ButtonStyle.Danger);

  const claim = new ButtonBuilder()
    .setCustomId(`ticket_claim_${ticketId}`)
    .setLabel('✋ Claim Ticket')
    .setStyle(ButtonStyle.Primary);

  const transcript = new ButtonBuilder()
    .setCustomId(`ticket_transcript_${ticketId}`)
    .setLabel('📜 Save Transcript')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(close, claim, transcript);
}

/**
 * Build confirm-close buttons.
 */
export function buildCloseConfirmButtons(ticketId) {
  const yes = new ButtonBuilder()
    .setCustomId(`ticket_close_confirm_${ticketId}`)
    .setLabel('Yes, close it')
    .setStyle(ButtonStyle.Danger);

  const no = new ButtonBuilder()
    .setCustomId(`ticket_close_cancel_${ticketId}`)
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(yes, no);
}

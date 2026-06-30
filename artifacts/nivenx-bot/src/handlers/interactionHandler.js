/**
 * NivenX Assistant - Interaction Handler
 * Routes all incoming interactions (commands, buttons, selects, modals).
 */

import { InteractionType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { errorEmbed } from '../ui/embeds/generalEmbed.js';

// Sub-handlers for each interaction type
import { handleCommand } from './subhandlers/commandInteraction.js';
import { handleButton } from './subhandlers/buttonInteraction.js';
import { handleSelectMenu } from './subhandlers/selectMenuInteraction.js';
import { handleModal } from './subhandlers/modalInteraction.js';

/**
 * Route an interaction to the appropriate sub-handler.
 */
export async function handleInteraction(interaction, client) {
  try {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction, client);
    } else if (interaction.isButton()) {
      await handleButton(interaction, client);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction, client);
    }
  } catch (err) {
    logger.error('InteractionHandler', `Unhandled error: ${err.message}\n${err.stack}`);

    const errorResponse = {
      embeds: [errorEmbed('Something went wrong', `An unexpected error occurred. Please try again.\n\`\`\`${err.message}\`\`\``)],
      ephemeral: true,
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorResponse);
      } else {
        await interaction.reply(errorResponse);
      }
    } catch {
      // Interaction may have expired — silently ignore
    }
  }
}

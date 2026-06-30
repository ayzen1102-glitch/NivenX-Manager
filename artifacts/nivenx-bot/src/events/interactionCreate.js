/**
 * NivenX Assistant - interactionCreate Event
 * All interactions (commands, buttons, selects, modals) flow through here.
 */

import { handleInteraction } from '../handlers/interactionHandler.js';

export default {
  name: 'interactionCreate',
  once: false,

  async execute(interaction, client) {
    await handleInteraction(interaction, client);
  },
};

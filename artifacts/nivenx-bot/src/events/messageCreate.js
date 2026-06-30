/**
 * NivenX Assistant - messageCreate Event
 * Updates ticket activity on new messages inside ticket channels.
 */

import { Tickets } from '../database/queries.js';

export default {
  name: 'messageCreate',
  once: false,

  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Update last activity on ticket channels
    const ticket = Tickets.findByChannel(message.channelId);
    if (ticket && ticket.status === 'open') {
      Tickets.updateActivity(message.channelId);
    }
  },
};

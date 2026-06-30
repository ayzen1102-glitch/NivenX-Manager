/**
 * NivenX - guildMemberAdd Event (Components V2)
 * Welcome new members, create account, assign Customer role.
 */

import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { UserAccounts } from '../database/queries.js';
import { ensureAccount } from '../services/accountService.js';
import { buildWelcomeCard } from '../ui/v2/generalV2.js';

export default {
  name: 'guildMemberAdd',
  once: false,

  async execute(member, client) {
    logger.info('GuildMemberAdd', `${member.user.tag} joined ${member.guild.name}`);

    // Auto-create account
    try {
      ensureAccount(member.user.id, member.user.tag, member.guild.id);
    } catch {}

    // Assign Customer role
    try {
      const customerRole = member.guild.roles.cache.find(r => r.name === config.roles.customer);
      if (customerRole) await member.roles.add(customerRole);
    } catch {}

    // Welcome message using Components V2
    const welcomeChannel = member.guild.channels.cache.find(c => c.name === 'welcome');
    if (welcomeChannel) {
      await welcomeChannel.send(buildWelcomeCard(member, member.guild.name)).catch(() => {});
    }
  },
};

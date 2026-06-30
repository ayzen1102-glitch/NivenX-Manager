/**
 * NivenX Assistant - Command Interaction Sub-handler
 */

import { logger } from '../../utils/logger.js';

export async function handleCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn('CommandInteraction', `Unknown command: ${interaction.commandName}`);
    await interaction.reply({ content: 'Unknown command.', ephemeral: true });
    return;
  }

  logger.info('CommandInteraction', `/${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name}`);
  await command.execute(interaction, client);
}

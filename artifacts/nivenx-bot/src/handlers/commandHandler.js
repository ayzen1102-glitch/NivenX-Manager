/**
 * NivenX Assistant - Command Handler
 * Dynamically loads all slash commands from the commands directory.
 */

import { Collection } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load all commands from subdirectories and attach them to client.commands.
 */
export async function loadCommands(client) {
  client.commands = new Collection();

  const commandsDir = join(__dirname, '../commands');
  const categories = readdirSync(commandsDir).filter(f =>
    statSync(join(commandsDir, f)).isDirectory()
  );

  let total = 0;

  for (const category of categories) {
    const files = readdirSync(join(commandsDir, category)).filter(f => f.endsWith('.js'));

    for (const file of files) {
      try {
        const { default: command } = await import(join(commandsDir, category, file));

        if (!command?.data || !command?.execute) {
          logger.warn('CommandHandler', `Skipping ${file} — missing data or execute`);
          continue;
        }

        client.commands.set(command.data.name, command);
        total++;
        logger.debug('CommandHandler', `Loaded command: ${command.data.name}`);
      } catch (err) {
        logger.error('CommandHandler', `Failed to load ${file}: ${err.message}`);
      }
    }
  }

  logger.success('CommandHandler', `Loaded ${total} commands across ${categories.length} categories`);
}

/**
 * NivenX Assistant - Event Handler
 * Dynamically loads all event listeners from the events directory.
 */

import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load all event files and register them on the Discord client.
 */
export async function loadEvents(client) {
  const eventsDir = join(__dirname, '../events');
  const files = readdirSync(eventsDir).filter(f => f.endsWith('.js'));
  let total = 0;

  for (const file of files) {
    try {
      const { default: event } = await import(join(eventsDir, file));

      if (!event?.name || !event?.execute) {
        logger.warn('EventHandler', `Skipping ${file} — missing name or execute`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      total++;
      logger.debug('EventHandler', `Registered event: ${event.name}`);
    } catch (err) {
      logger.error('EventHandler', `Failed to load ${file}: ${err.message}`);
    }
  }

  logger.success('EventHandler', `Registered ${total} events`);
}

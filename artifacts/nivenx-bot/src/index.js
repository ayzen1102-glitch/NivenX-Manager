/**
 * NivenX Assistant - Main Entry Point
 * Bootstraps the Discord client, loads handlers, and connects to Discord.
 */

import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { initDatabase } from './database/database.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { logger } from './utils/logger.js';
import { startAutoCloseScheduler } from './services/schedulerService.js';
import { config } from './config/config.js';

// ── Validate required environment variables ──────────
const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// ── Create the Discord client ────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
  ],
});

// ── Initialize database ──────────────────────────────
initDatabase();

// ── Attach logger to client ──────────────────────────
logger.setClient(client);

// ── Load commands and events ─────────────────────────
await loadCommands(client);
await loadEvents(client);

// ── Start background scheduler ───────────────────────
startAutoCloseScheduler(client);

// ── Global error handlers ────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error('Process', `Unhandled rejection: ${err?.message ?? err}`);
});

process.on('uncaughtException', (err) => {
  logger.error('Process', `Uncaught exception: ${err.message}\n${err.stack}`);
});

// ── Login ────────────────────────────────────────────
logger.info('Startup', `Starting ${config.bot.name} v${config.bot.version}...`);
await client.login(process.env.DISCORD_TOKEN);

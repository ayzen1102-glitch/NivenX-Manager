/**
 * NivenX Assistant - Slash Command Deployer
 * Run with: node src/deploy-commands.js
 *
 * Deploys all slash commands to Discord.
 * Use DISCORD_GUILD_ID for guild-specific (instant) deployment during development,
 * or remove it to deploy globally (takes up to 1 hour to propagate).
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('[Deploy] Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
  process.exit(1);
}

// Collect all command data from subdirectories
const commands = [];
const commandsDir = join(__dirname, 'commands');
const categories = readdirSync(commandsDir).filter(f =>
  statSync(join(commandsDir, f)).isDirectory()
);

for (const category of categories) {
  const files = readdirSync(join(commandsDir, category)).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const { default: cmd } = await import(join(commandsDir, category, file));
    if (cmd?.data) {
      commands.push(cmd.data.toJSON());
      console.log(`[Deploy] Queued: /${cmd.data.name}`);
    }
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
  console.log(`[Deploy] Registering ${commands.length} slash command(s)...`);

  let result;
  if (GUILD_ID) {
    // Guild deploy — instant
    result = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`[Deploy] ✅ Deployed ${result.length} command(s) to guild ${GUILD_ID}`);
  } else {
    // Global deploy — up to 1 hour
    result = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log(`[Deploy] ✅ Deployed ${result.length} command(s) globally`);
  }
} catch (err) {
  console.error('[Deploy] Failed:', err.message);
  process.exit(1);
}

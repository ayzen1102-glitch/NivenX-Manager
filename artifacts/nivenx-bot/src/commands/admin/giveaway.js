/**
 * NivenX - /giveaway command (Admin)
 * Start and manage giveaways.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Giveaways } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { buildGiveawayCard, successCard, errorCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways (Admin)')
    .addSubcommand(s => s.setName('start').setDescription('Start a new giveaway')
      .addStringOption(o => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
      .addIntegerOption(o => o.setName('duration_hours').setDescription('Duration in hours').setRequired(true).setMinValue(1).setMaxValue(168))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post in (default: current)').setRequired(false)))
    .addSubcommand(s => s.setName('end').setDescription('End a giveaway early and pick winner')
      .addIntegerOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true)))
    .addSubcommand(s => s.setName('reroll').setDescription('Reroll a giveaway winner')
      .addIntegerOption(o => o.setName('id').setDescription('Giveaway ID').setRequired(true))),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const hours = interaction.options.getInteger('duration_hours');
      const channel = interaction.options.getChannel('channel') ?? interaction.channel;

      const endsAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();

      const result = Giveaways.create({ channelId: channel.id, prize, hostId: interaction.user.id, endsAt });
      const giveawayId = result.lastInsertRowid;

      const giveaway = { id: giveawayId, prize, host_id: interaction.user.id, entries: 0, ends_at: endsAt };
      const card = buildGiveawayCard(giveaway);

      const msg = await channel.send(card);
      Giveaways.setMessageId(giveawayId, msg.id);

      return interaction.reply(successCard('Giveaway Started!', `Giveaway **#${giveawayId}** is live in <#${channel.id}>!\nPrize: **${prize}** | Ends in **${hours}h**`));
    }

    if (sub === 'end') {
      const id = interaction.options.getInteger('id');
      await interaction.deferReply({ ephemeral: true });

      const g = Giveaways.findById(id);
      if (!g) return interaction.editReply(errorCard('Not Found', `Giveaway #${id} not found.`));

      const winner = Giveaways.end(id);
      const channel = interaction.client.channels.cache.get(g.channel_id);

      if (channel) {
        if (g.message_id) {
          const msg = await channel.messages.fetch(g.message_id).catch(() => null);
          if (msg) await msg.edit(buildGiveawayCard({ ...g, entries: g.entries.length }, true, winner)).catch(() => {});
        }
        await channel.send({ content: winner ? `🎉 Congratulations <@${winner}>! You won **${g.prize}**!` : `No eligible entries for **${g.prize}**.` });
      }

      return interaction.editReply(successCard('Giveaway Ended', winner ? `Winner: <@${winner}>` : 'No winner (no entries)'));
    }

    if (sub === 'reroll') {
      const id = interaction.options.getInteger('id');
      const g = Giveaways.findById(id);
      if (!g) return interaction.reply(errorCard('Not Found', `Giveaway #${id} not found.`));

      const entries = g.entries.filter(e => e !== g.winner_id);
      if (entries.length === 0) return interaction.reply(errorCard('No Entries', 'No eligible entries to reroll.'));

      const newWinner = entries[Math.floor(Math.random() * entries.length)];
      const channel = interaction.client.channels.cache.get(g.channel_id);
      if (channel) await channel.send({ content: `🎉 Reroll! New winner: <@${newWinner}>! Congratulations!` });

      return interaction.reply(successCard('Rerolled!', `New winner: <@${newWinner}>`));
    }
  },
};

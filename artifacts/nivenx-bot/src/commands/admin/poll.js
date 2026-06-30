/**
 * NivenX - /poll command (Admin)
 * Create polls with voting buttons.
 */

import { SlashCommandBuilder } from 'discord.js';
import { Polls, generatePollId } from '../../database/queries.js';
import { requirePermission, PermLevel } from '../../utils/permissions.js';
import { buildPollCard, successCard, errorCard } from '../../ui/v2/generalV2.js';

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create and manage polls (Admin)')
    .addSubcommand(s => s.setName('create').setDescription('Create a new poll')
      .addStringOption(o => o.setName('question').setDescription('The poll question').setRequired(true).setMaxLength(200))
      .addStringOption(o => o.setName('options').setDescription('Options separated by | (max 5)').setRequired(true).setMaxLength(500))
      .addIntegerOption(o => o.setName('duration_hours').setDescription('Duration in hours (0 = no end)').setRequired(false).setMinValue(0).setMaxValue(168))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post in').setRequired(false)))
    .addSubcommand(s => s.setName('end').setDescription('End a poll')
      .addStringOption(o => o.setName('poll_id').setDescription('Poll ID').setRequired(true))),

  async execute(interaction) {
    if (!await requirePermission(interaction, PermLevel.ADMIN)) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const question = interaction.options.getString('question');
      const rawOptions = interaction.options.getString('options').split('|').map(o => o.trim()).filter(Boolean).slice(0, 5);
      const hours = interaction.options.getInteger('duration_hours') ?? 0;
      const channel = interaction.options.getChannel('channel') ?? interaction.channel;

      if (rawOptions.length < 2) return interaction.reply(errorCard('Too Few Options', 'Please provide at least 2 options separated by |.'));

      const pollId = generatePollId();
      const endsAt = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;

      Polls.create({ pollId, channelId: channel.id, question, options: rawOptions, createdBy: interaction.user.id, endsAt });

      const card = buildPollCard(pollId, question, rawOptions);
      const msg = await channel.send(card);
      Polls.setMessageId(pollId, msg.id);

      return interaction.reply(successCard('Poll Created!', `Poll **${pollId}** posted in <#${channel.id}>!${endsAt ? ` Ends in **${hours}h**.` : ''}`));
    }

    if (sub === 'end') {
      const pollId = interaction.options.getString('poll_id').toUpperCase();
      const poll = Polls.findById(pollId);
      if (!poll) return interaction.reply(errorCard('Not Found', `Poll \`${pollId}\` not found.`));

      Polls.end(pollId);

      const channel = interaction.client.channels.cache.get(poll.channel_id);
      if (channel && poll.message_id) {
        const msg = await channel.messages.fetch(poll.message_id).catch(() => null);
        if (msg) await msg.edit(buildPollCard(pollId, poll.question, poll.options, poll.votes, true)).catch(() => {});
      }

      return interaction.reply(successCard('Poll Ended', `Poll \`${pollId}\` has been ended.`));
    }
  },
};

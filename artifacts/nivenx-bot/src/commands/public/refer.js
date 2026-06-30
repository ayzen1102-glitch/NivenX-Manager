/**
 * NivenX - /refer command
 * Get and share your referral link. Earn bonus points for referrals.
 */

import { SlashCommandBuilder } from 'discord.js';
import { UserAccounts } from '../../database/queries.js';
import { ensureAccount } from '../../services/accountService.js';
import { text, sep, container, row, btnSecondary, Colors, V2EphemeralFlags } from '../../ui/v2/builder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('refer')
    .setDescription('Get your referral code and earn bonus points')
    .addStringOption(o => o.setName('code').setDescription('Enter a referral code you received').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const account = ensureAccount(interaction.user.id, interaction.user.tag, interaction.guildId);
    const referralCode = interaction.options.getString('code');

    if (referralCode) {
      // They're entering someone else's referral code
      if (account.referred_by) {
        return interaction.editReply({
          components: [container(Colors.error, text(`## ❌ Already Referred\n\nYou have already used a referral code.`))],
          flags: V2EphemeralFlags,
        });
      }

      const { processReferral } = await import('../../services/accountService.js');
      const referrer = processReferral(referralCode, interaction.user.id, interaction.user.tag, interaction.guildId);

      if (!referrer) {
        return interaction.editReply({
          components: [container(Colors.error, text(`## ❌ Invalid Code\n\nThe referral code \`${referralCode}\` is invalid.`))],
          flags: V2EphemeralFlags,
        });
      }

      return interaction.editReply({
        components: [container(Colors.success,
          text(`## ✅ Referral Applied!\n\nYou've been referred by **${referrer.username}**.\n\n🎁 You earned **50 bonus points**!\n> Use \`/points\` to see your balance.`),
        )],
        flags: V2EphemeralFlags,
      });
    }

    // Show their own referral code
    const lines = [
      `## 🔗 Your Referral Code`,
      ``,
      `**Code: \`${account.referral_code}\`**`,
      ``,
      `📊 **Stats**`,
      `> Referrals made: **${account.referral_count}**`,
      `> Points earned from referrals: **${account.referral_count * 100}**`,
      ``,
      `**How it works:**`,
      `> 1. Share your code with friends`,
      `> 2. They use \`/refer code:${account.referral_code}\` when they join`,
      `> 3. You earn **100 points** and they get **50 points**!`,
      ``,
      `> Points can be redeemed for discounts with \`/points\``,
    ];

    await interaction.editReply({
      components: [container(Colors.purple, text(lines.join('\n')))],
      flags: V2EphemeralFlags,
    });
  },
};

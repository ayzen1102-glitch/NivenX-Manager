/**
 * NivenX Assistant - Components V2 Core Builder Utilities
 * All messages use Discord Components V2 (MessageFlags.IsComponentsV2).
 * Never use EmbedBuilder — use these helpers instead.
 */

import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SeparatorSpacingSize,
} from 'discord.js';

export const V2Flags = MessageFlags.IsComponentsV2;
export const V2EphemeralFlags = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

// Brand colors
export const Colors = {
  primary: 0x5865F2,
  success: 0x57F287,
  error: 0xED4245,
  warning: 0xFEE75C,
  info: 0x5865F2,
  gold: 0xFFD700,
  purple: 0x9B59B6,
  teal: 0x1ABC9C,
  orange: 0xE67E22,
  dark: 0x2F3136,
  pink: 0xEB459E,
};

// ─── Primitive builders ───────────────────────────────────────────────────────

export function text(content) {
  return new TextDisplayBuilder().setContent(content);
}

export function sep(spacing = SeparatorSpacingSize.Small) {
  return new SeparatorBuilder().setSpacing(spacing).setDivider(true);
}

export function bigSep() {
  return new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true);
}

// ─── Container factory ────────────────────────────────────────────────────────

/**
 * Build a Container with Components V2.
 * @param {number} color - Accent color
 * @param {...any} components - TextDisplay, Separator, ActionRow, Section, etc.
 */
export function container(color, ...components) {
  const c = new ContainerBuilder();
  if (color) c.setAccentColor(color);
  for (const comp of components) {
    if (!comp) continue;
    if (comp instanceof TextDisplayBuilder) c.addTextDisplayComponents(comp);
    else if (comp instanceof SeparatorBuilder) c.addSeparatorComponents(comp);
    else if (comp instanceof ActionRowBuilder) c.addActionRowComponents(comp);
    else if (comp instanceof SectionBuilder) c.addSectionComponents(comp);
    else if (comp instanceof ThumbnailBuilder) c.addThumbnailComponents?.(comp);
    else if (Array.isArray(comp)) {
      for (const item of comp) {
        if (item instanceof TextDisplayBuilder) c.addTextDisplayComponents(item);
        else if (item instanceof SeparatorBuilder) c.addSeparatorComponents(item);
        else if (item instanceof ActionRowBuilder) c.addActionRowComponents(item);
        else if (item instanceof SectionBuilder) c.addSectionComponents(item);
      }
    }
  }
  return c;
}

// ─── Message payload helpers ──────────────────────────────────────────────────

/** Standard Components V2 message payload (non-ephemeral) */
export function v2Message(color, ...components) {
  return {
    components: [container(color, ...components)],
    flags: V2Flags,
  };
}

/** Standard Components V2 ephemeral message payload */
export function v2Ephemeral(color, ...components) {
  return {
    components: [container(color, ...components)],
    flags: V2EphemeralFlags,
  };
}

// ─── Common message templates ─────────────────────────────────────────────────

export function successMsg(title, description, extra = []) {
  return v2Ephemeral(Colors.success,
    text(`## ✅ ${title}`),
    description ? text(description) : null,
    ...extra,
  );
}

export function errorMsg(title, description, extra = []) {
  return v2Ephemeral(Colors.error,
    text(`## ❌ ${title}`),
    description ? text(description) : null,
    ...extra,
  );
}

export function warningMsg(title, description, extra = []) {
  return v2Ephemeral(Colors.warning,
    text(`## ⚠️ ${title}`),
    description ? text(description) : null,
    ...extra,
  );
}

export function infoMsg(title, description, extra = []) {
  return v2Ephemeral(Colors.info,
    text(`## ℹ️ ${title}`),
    description ? text(description) : null,
    ...extra,
  );
}

// Non-ephemeral versions (for public announcements)
export function successPublic(title, description, extra = []) {
  return v2Message(Colors.success,
    text(`## ✅ ${title}`),
    description ? text(description) : null,
    ...extra,
  );
}

export function errorPublic(title, description, extra = []) {
  return v2Message(Colors.error,
    text(`## ❌ ${title}`),
    description ? text(description) : null,
    ...extra,
  );
}

export function infoPublic(title, description, extra = []) {
  return v2Message(Colors.info,
    text(`## ℹ️ ${title}`),
    description ? text(description) : null,
    ...extra,
  );
}

// ─── Button row helpers ───────────────────────────────────────────────────────

export function row(...buttons) {
  return new ActionRowBuilder().addComponents(...buttons);
}

export function btn(customId, label, style = ButtonStyle.Primary, emoji = null) {
  const b = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
  if (emoji) b.setEmoji(emoji);
  return b;
}

export function btnSuccess(customId, label) { return btn(customId, label, ButtonStyle.Success); }
export function btnDanger(customId, label) { return btn(customId, label, ButtonStyle.Danger); }
export function btnSecondary(customId, label) { return btn(customId, label, ButtonStyle.Secondary); }
export function btnPrimary(customId, label) { return btn(customId, label, ButtonStyle.Primary); }
export function btnLink(url, label) {
  return new ButtonBuilder().setURL(url).setLabel(label).setStyle(ButtonStyle.Link);
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return `<t:${Math.floor(new Date(dateStr).getTime() / 1000)}:f>`;
}

export function formatRelative(dateStr) {
  if (!dateStr) return 'N/A';
  return `<t:${Math.floor(new Date(dateStr).getTime() / 1000)}:R>`;
}

export function formatCurrency(amount) {
  if (amount == null) return 'TBD';
  return `$${Number(amount).toFixed(2)}`;
}

export function statusEmoji(status) {
  const map = {
    'Pending': '🟡',
    'Awaiting Payment': '🟠',
    'Paid': '🟢',
    'In Progress': '🔵',
    'Completed': '✅',
    'Cancelled': '🔴',
    'Refunded': '💜',
    'open': '🟢',
    'closed': '⚫',
    'unpaid': '🟡',
    'paid': '🟢',
    'cancelled': '🔴',
    'overdue': '🔴',
  };
  return map[status] ?? '⚪';
}

export function ratingStars(rating) {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

export function progressBar(current, max, length = 10) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * NivenX Assistant - Permission System
 * Owner > Admin > Staff > Customer (everyone else)
 */

import { config } from '../config/config.js';

/**
 * Check if a guild member has a specific role by name.
 */
function hasRoleName(member, roleName) {
  return member.roles.cache.some(r => r.name === roleName);
}

/**
 * Permission level constants.
 */
export const PermLevel = {
  CUSTOMER: 0,
  STAFF: 1,
  ADMIN: 2,
  OWNER: 3,
};

/**
 * Get the permission level of a guild member.
 * @param {GuildMember} member
 * @returns {number} PermLevel value
 */
export function getPermLevel(member) {
  // Guild owner always has highest permission
  if (member.guild.ownerId === member.id) return PermLevel.OWNER;

  if (hasRoleName(member, config.roles.owner)) return PermLevel.OWNER;
  if (hasRoleName(member, config.roles.admin)) return PermLevel.ADMIN;
  if (hasRoleName(member, config.roles.staff)) return PermLevel.STAFF;
  return PermLevel.CUSTOMER;
}

/**
 * Require a minimum permission level for an interaction.
 * Replies with an error embed if insufficient.
 * @returns {boolean} true if permission granted
 */
export async function requirePermission(interaction, minLevel) {
  const level = getPermLevel(interaction.member);
  if (level >= minLevel) return true;

  const levelNames = { 0: 'Customer', 1: 'Staff', 2: 'Admin', 3: 'Owner' };
  await interaction.reply({
    embeds: [{
      color: config.bot.errorColor,
      title: '🚫 Insufficient Permissions',
      description: `You need the **${levelNames[minLevel]}** role or higher to use this command.`,
      footer: { text: 'NivenX Assistant' },
    }],
    ephemeral: true,
  });
  return false;
}

/**
 * Check if user is staff or above.
 */
export function isStaff(member) {
  return getPermLevel(member) >= PermLevel.STAFF;
}

/**
 * Check if user is admin or above.
 */
export function isAdmin(member) {
  return getPermLevel(member) >= PermLevel.ADMIN;
}

/**
 * Check if user is owner.
 */
export function isOwner(member) {
  return getPermLevel(member) >= PermLevel.OWNER;
}

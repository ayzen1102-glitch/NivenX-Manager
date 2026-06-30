/**
 * NivenX Assistant - Permission System
 * Owner > Admin > Staff > Customer (everyone else)
 */

import { config } from '../config/config.js';
import { errorCard } from '../ui/v2/generalV2.js';

function hasRoleName(member, roleName) {
  return member.roles.cache.some(r => r.name === roleName);
}

export const PermLevel = { CUSTOMER: 0, STAFF: 1, ADMIN: 2, OWNER: 3 };

export function getPermLevel(member) {
  if (member.guild.ownerId === member.id) return PermLevel.OWNER;
  if (hasRoleName(member, config.roles.owner)) return PermLevel.OWNER;
  if (hasRoleName(member, config.roles.admin)) return PermLevel.ADMIN;
  if (hasRoleName(member, config.roles.staff)) return PermLevel.STAFF;
  return PermLevel.CUSTOMER;
}

export async function requirePermission(interaction, minLevel) {
  const level = getPermLevel(interaction.member);
  if (level >= minLevel) return true;
  const levelNames = { 0: 'Customer', 1: 'Staff', 2: 'Admin', 3: 'Owner' };
  await interaction.reply(errorCard('Permission Denied', `You need the **${levelNames[minLevel]}** role or higher.`));
  return false;
}

export function isStaff(member) { return getPermLevel(member) >= PermLevel.STAFF; }
export function isAdmin(member) { return getPermLevel(member) >= PermLevel.ADMIN; }
export function isOwner(member) { return getPermLevel(member) >= PermLevel.OWNER; }

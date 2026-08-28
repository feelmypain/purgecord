import { isSnowflake } from './utils/helpers.js';

function parseIdList(value) {
  return [...new Set(String(value ?? '').split(/[\s,]+/).filter(Boolean))];
}

/**
 * Convert the two target fields into concrete jobs for the core batch runner.
 * A channel ID is only meaningful inside one guild, so cross-guild channel
 * lists are rejected instead of producing a mostly-invalid Cartesian product.
 */
export function buildPurgePlan(guildInput, channelInput) {
  const guildIds = parseIdList(guildInput);
  const channelIds = parseIdList(channelInput);

  if (guildIds.length === 0) throw new Error('You must fill the "Server ID" field!');

  const badGuildIds = guildIds.filter(id => id !== '@me' && !isSnowflake(id));
  if (badGuildIds.length) throw new Error(`These are not valid Server IDs: ${badGuildIds.join(', ')}`);

  const badChannelIds = channelIds.filter(id => !isSnowflake(id));
  if (badChannelIds.length) throw new Error(`These are not valid Channel IDs: ${badChannelIds.join(', ')}`);

  if (guildIds.includes('@me') && guildIds.length > 1) {
    throw new Error('"@me" cannot be combined with Server IDs. Use it by itself for direct messages.');
  }

  if (guildIds.length > 1 && channelIds.length > 0) {
    throw new Error('When purging multiple servers, leave the "Channel ID" field empty.');
  }

  if (guildIds[0] === '@me' && channelIds.length === 0) {
    throw new Error('You must fill the "Channel ID" field to delete direct messages!');
  }

  const jobs = guildIds.length > 1
    ? guildIds.map(guildId => ({ guildId, channelId: undefined }))
    : channelIds.length > 0
      ? channelIds.map(channelId => ({ guildId: guildIds[0], channelId }))
      : [{ guildId: guildIds[0], channelId: undefined }];

  return { guildIds, channelIds, jobs };
}

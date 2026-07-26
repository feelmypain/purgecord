// Helpers

/** Discord snowflakes count milliseconds from 2015-01-01T00:00:00Z. */
export const DISCORD_EPOCH = 1420070400000;

export const wait = async ms => new Promise(done => setTimeout(done, Math.max(0, Number(ms) || 0)));
export const msToHMS = ms => Number.isFinite(ms) && ms >= 0
  ? `${ms / 3.6e6 | 0}h ${(ms % 3.6e6) / 6e4 | 0}m ${(ms % 6e4) / 1000 | 0}s`
  : '--h --m --s';
export const escapeHTML = html => String(html).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;' })[m]);
export const redact = str => `<x>${escapeHTML(str)}</x>`;
export const queryString = params => params.filter(p => p[1] !== undefined && p[1] !== null && p[1] !== '').map(p => p[0] + '=' + encodeURIComponent(p[1])).join('&');
export const ask = async msg => new Promise(resolve => setTimeout(() => resolve(window.confirm(msg)), 10));
export const replaceInterpolations = (str, obj, removeMissing = false) => str.replace(/\{\{([\w_]+)\}\}/g, (m, key) => obj[key] || (removeMissing ? '' : m));

export const clamp = (value, min, max) => value < min ? min : value > max ? max : value;

/** Discord ids are 17-20 digit snowflakes. */
export const isSnowflake = value => /^\d{17,20}$/.test(String(value).trim());

/**
 * Accept either a snowflake or a date and return a snowflake string.
 * BigInt is required here: the shift overflows Number.MAX_SAFE_INTEGER, which
 * used to quantize every date-range bound to a garbage value.
 * Returns undefined for anything unusable so queryString drops the parameter.
 */
export const toSnowflake = (value) => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  if (isSnowflake(str)) return str;
  const time = Date.parse(str);
  if (Number.isNaN(time)) return undefined;
  // Anything before Discord existed is the same as no bound at all.
  return ((BigInt(Math.max(time, DISCORD_EPOCH)) - BigInt(DISCORD_EPOCH)) << 22n).toString();
};

/**
 * Render a user the way Discord does today. Migrated ("pomelo") accounts have
 * a literal "0" discriminator, so the old username#discriminator form prints
 * names like "someone#0".
 */
export const displayName = (user) => {
  if (!user) return 'unknown';
  if (user.global_name) return user.global_name;
  if (user.discriminator && user.discriminator !== '0') return `${user.username}#${user.discriminator}`;
  return user.username || 'unknown';
};

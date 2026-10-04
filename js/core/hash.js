// Short, stable code from any text (djb2 hash), as a base-36 string.
// Used for cache keys and for stable "random" variation (same input → same output).

export function hashKey(text) {
  let h = 5381;
  for (const char of text) h = (Math.imul(h, 33) + char.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

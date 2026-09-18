/**
 * Caché en memoria para landings publicadas (#14).
 *
 * Evita queries repetidas a MySQL cuando una landing recibe tráfico masivo
 * de pauta. TTL de 60s + invalidación manual al publicar/cambiar estado.
 */

const TTL_MS = 60 * 1000; // 60 segundos
const cache = new Map();

export function getCachedLanding(slug) {
  const entry = cache.get(slug);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(slug);
    return null;
  }
  return entry.data;
}

export function setCachedLanding(slug, data) {
  cache.set(slug, { data, timestamp: Date.now() });
}

export function invalidateLanding(slug) {
  cache.delete(slug);
}

export function invalidateAll() {
  cache.clear();
}

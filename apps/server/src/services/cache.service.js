const memoryCache = new Map();

function setCache(key, value, ttlSeconds = 60) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryCache.set(key, { value, expiresAt });
}

function getCache(key) {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return cached.value;
}

function clearCache(key) {
  if (key) {
    memoryCache.delete(key);
    return;
  }
  memoryCache.clear();
}

module.exports = { clearCache, getCache, setCache };

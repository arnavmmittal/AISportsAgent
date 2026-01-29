/**
 * Redis/KV Client
 *
 * Unified key-value store for real-time features:
 * - Athlete activity tracking
 * - Rate limiting
 * - Session caching
 *
 * Falls back to in-memory Map when Redis isn't configured.
 * For production: Use Vercel KV or Upstash Redis.
 *
 * Environment variables:
 * - KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV)
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash)
 * - REDIS_URL (generic Redis connection string)
 */

// In-memory fallback store
const memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

// Cleanup expired entries periodically
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;

  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of memoryStore.entries()) {
      if (data.expiresAt && data.expiresAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Cleanup every minute
}

/**
 * Check if Redis/KV is configured
 */
export function isRedisConfigured(): boolean {
  return !!(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    process.env.REDIS_URL
  );
}

/**
 * Get Redis configuration
 */
function getRedisConfig(): { url: string; token: string } | null {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }

  return null;
}

/**
 * Execute a Redis REST API command
 */
async function redisCommand<T>(command: string[]): Promise<T | null> {
  const config = getRedisConfig();
  if (!config) return null;

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      console.error('Redis error:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.result as T;
  } catch (error) {
    console.error('Redis connection error:', error);
    return null;
  }
}

/**
 * Set a key-value pair with optional TTL
 */
export async function kvSet(
  key: string,
  value: string | object,
  ttlSeconds?: number
): Promise<boolean> {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const command = ttlSeconds
      ? ['SET', key, stringValue, 'EX', ttlSeconds.toString()]
      : ['SET', key, stringValue];

    const result = await redisCommand<string>(command);
    if (result === 'OK') return true;
  }

  // Fallback to memory store
  scheduleCleanup();
  memoryStore.set(key, {
    value: stringValue,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  return true;
}

/**
 * Get a value by key
 */
export async function kvGet<T = string>(key: string): Promise<T | null> {
  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<string>(['GET', key]);
    if (result !== null) {
      try {
        return JSON.parse(result) as T;
      } catch {
        return result as T;
      }
    }
    return null;
  }

  // Fallback to memory store
  const entry = memoryStore.get(key);
  if (!entry) return null;

  // Check expiry
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return entry.value as T;
  }
}

/**
 * Delete a key
 */
export async function kvDelete(key: string): Promise<boolean> {
  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<number>(['DEL', key]);
    if (result !== null) return result > 0;
  }

  // Fallback to memory store
  return memoryStore.delete(key);
}

/**
 * Get all keys matching a pattern (supports * wildcard)
 */
export async function kvKeys(pattern: string): Promise<string[]> {
  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<string[]>(['KEYS', pattern]);
    if (result !== null) return result;
  }

  // Fallback to memory store (simple pattern matching)
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  const keys: string[] = [];

  for (const [key, entry] of memoryStore.entries()) {
    // Skip expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      memoryStore.delete(key);
      continue;
    }

    if (regex.test(key)) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * Get multiple values by keys
 */
export async function kvMGet<T = string>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];

  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<(string | null)[]>(['MGET', ...keys]);
    if (result !== null) {
      return result.map(v => {
        if (v === null) return null;
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as T;
        }
      });
    }
  }

  // Fallback to memory store
  return Promise.all(keys.map(key => kvGet<T>(key)));
}

/**
 * Hash set - set a field in a hash
 */
export async function kvHSet(
  key: string,
  field: string,
  value: string | object
): Promise<boolean> {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<number>(['HSET', key, field, stringValue]);
    if (result !== null) return true;
  }

  // Fallback to memory store (simulate hash with JSON object)
  const existing = await kvGet<Record<string, string>>(key) || {};
  existing[field] = stringValue;
  return kvSet(key, existing);
}

/**
 * Hash get - get a field from a hash
 */
export async function kvHGet<T = string>(key: string, field: string): Promise<T | null> {
  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<string>(['HGET', key, field]);
    if (result !== null) {
      try {
        return JSON.parse(result) as T;
      } catch {
        return result as T;
      }
    }
    return null;
  }

  // Fallback to memory store
  const hash = await kvGet<Record<string, string>>(key);
  if (!hash || !hash[field]) return null;

  try {
    return JSON.parse(hash[field]) as T;
  } catch {
    return hash[field] as T;
  }
}

/**
 * Hash get all - get all fields from a hash
 */
export async function kvHGetAll<T = string>(key: string): Promise<Record<string, T> | null> {
  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<string[]>(['HGETALL', key]);
    if (result !== null && result.length > 0) {
      const hash: Record<string, T> = {};
      for (let i = 0; i < result.length; i += 2) {
        const field = result[i];
        const value = result[i + 1];
        try {
          hash[field] = JSON.parse(value) as T;
        } catch {
          hash[field] = value as T;
        }
      }
      return hash;
    }
    return null;
  }

  // Fallback to memory store
  const hash = await kvGet<Record<string, string>>(key);
  if (!hash) return null;

  const result: Record<string, T> = {};
  for (const [field, value] of Object.entries(hash)) {
    try {
      result[field] = JSON.parse(value) as T;
    } catch {
      result[field] = value as T;
    }
  }
  return result;
}

/**
 * Hash delete - delete a field from a hash
 */
export async function kvHDel(key: string, field: string): Promise<boolean> {
  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<number>(['HDEL', key, field]);
    if (result !== null) return result > 0;
  }

  // Fallback to memory store
  const hash = await kvGet<Record<string, string>>(key);
  if (!hash || !hash[field]) return false;

  delete hash[field];
  if (Object.keys(hash).length === 0) {
    return kvDelete(key);
  }
  return kvSet(key, hash);
}

/**
 * Set expiry on a key
 */
export async function kvExpire(key: string, ttlSeconds: number): Promise<boolean> {
  // Try Redis first
  const config = getRedisConfig();
  if (config) {
    const result = await redisCommand<number>(['EXPIRE', key, ttlSeconds.toString()]);
    if (result !== null) return result > 0;
  }

  // Fallback to memory store
  const entry = memoryStore.get(key);
  if (!entry) return false;

  entry.expiresAt = Date.now() + ttlSeconds * 1000;
  memoryStore.set(key, entry);
  return true;
}

/**
 * Get store info (for debugging)
 */
export function getStoreInfo(): {
  type: 'redis' | 'memory';
  memorySize: number;
} {
  return {
    type: isRedisConfigured() ? 'redis' : 'memory',
    memorySize: memoryStore.size,
  };
}

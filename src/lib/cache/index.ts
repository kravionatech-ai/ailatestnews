/**
 * Cache abstraction layer.
 * Uses Upstash Redis when configured, with a resilient in-memory fallback.
 * Safe for serverless: no persistent hanging sockets.
 */

interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
}

class MemoryCache implements CacheStore {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newVal = (parseInt(current ?? "0", 10) || 0) + 1;
    const entry = this.store.get(key);
    await this.set(
      key,
      String(newVal),
      entry?.expiresAt ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : undefined
    );
    return newVal;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }
}

class RedisCache implements CacheStore {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url.replace(/\/$/, "");
    this.token = token;
  }

  private async command(...args: (string | number)[]): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command("GET", key);
    return result as string | null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.command("SET", key, value, "EX", ttlSeconds);
    } else {
      await this.command("SET", key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.command("DEL", key);
  }

  async incr(key: string): Promise<number> {
    return (await this.command("INCR", key)) as number;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.command("EXPIRE", key, ttlSeconds);
  }
}

let cacheInstance: CacheStore | null = null;

export function getCache(): CacheStore {
  if (cacheInstance) return cacheInstance;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    cacheInstance = new RedisCache(redisUrl, redisToken);
  } else {
    cacheInstance = new MemoryCache();
  }

  return cacheInstance;
}

export type { CacheStore };

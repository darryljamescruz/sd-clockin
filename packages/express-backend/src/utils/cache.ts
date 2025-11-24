import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✓ Redis client initialized');
  } else {
    console.warn('⚠ Redis credentials not found - running without cache');
  }
} catch (error) {
  console.error('✗ Failed to initialize Redis:', error);
  redis = null;
}

// Cache key builders
export const CacheKeys = {
  // Student related
  STUDENT_LIST: 'students:list',
  STUDENT_DETAIL: (studentId: string, termId?: string) =>
    termId ? `student:${studentId}:term:${termId}` : `student:${studentId}`,
  STUDENT_SCHEDULE: (studentId: string, termId: string) =>
    `schedule:${studentId}:term:${termId}`,
  STUDENT_CHECKINS: (studentId: string, termId: string) =>
    `checkins:${studentId}:term:${termId}`,

  // Term related
  ACTIVE_TERM: 'term:active',
  TERMS_LIST: 'terms:list',
  TERM_DETAIL: (termId: string) => `term:${termId}`,

  // Shifts related
  TODAY_SHIFTS: (termId: string, dateKey: string) =>
    `shifts:${termId}:${dateKey}`,
  STUDENT_SHIFTS: (studentId: string, termId: string) =>
    `shifts:${studentId}:term:${termId}`,

  // Schedule related
  SCHEDULES_LIST: (termId: string) => `schedules:term:${termId}`,
};

// Cache TTL (Time To Live) in seconds
export const CacheTTL = {
  // Short TTL - Frequently changing data
  CHECKINS: 60,          // 1 minute
  SHIFTS: 180,           // 3 minutes
  TODAY_SHIFTS: 180,     // 3 minutes

  // Medium TTL - Moderately stable data
  ACTIVE_TERM: 300,      // 5 minutes
  STUDENT_LIST: 300,     // 5 minutes
  STUDENT_DETAIL: 300,   // 5 minutes
  SCHEDULE: 600,         // 10 minutes

  // Long TTL - Very stable data
  TERMS: 3600,           // 1 hour
  SCHEDULES_LIST: 3600,  // 1 hour
};

// Check if Redis is available
export function isRedisAvailable(): boolean {
  return redis !== null;
}

// Cache utility functions
const cache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const value = await redis.get<T>(key);
      if (value !== null) {
        console.log(`✓ Cache HIT: ${key}`);
      } else {
        console.log(`✗ Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      console.error(`✗ Cache GET error for ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!redis) return;

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      console.log(`✓ Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`✗ Cache SET error for ${key}:`, error);
    }
  },

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    if (!redis) return;

    try {
      await redis.del(key);
      console.log(`✓ Cache DELETE: ${key}`);
    } catch (error) {
      console.error(`✗ Cache DELETE error for ${key}:`, error);
    }
  },

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!redis) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`✓ Cache DELETE pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error(`✗ Cache DELETE pattern error for ${pattern}:`, error);
    }
  },

  /**
   * Wrapper function that handles cache-aside pattern
   * Gets from cache, or fetches and caches if not found
   */
  async wrapper<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetchFn();

    // Store in cache
    await cache.set(key, data, ttlSeconds);

    return data;
  },

  /**
   * Clear all cache entries for a specific student
   */
  async invalidateStudent(studentId: string, _termId?: string): Promise<void> {
    if (!redis) return;

    try {
      const patterns = [
        `student:${studentId}*`,
        `schedule:${studentId}*`,
        `checkins:${studentId}*`,
        `shifts:${studentId}*`,
      ];

      await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));

      // Also invalidate student list since it contains this student's data
      await cache.delete(CacheKeys.STUDENT_LIST);

      console.log(`✓ Cache invalidated for student ${studentId}`);
    } catch (error) {
      console.error(`✗ Cache invalidation error for student ${studentId}:`, error);
    }
  },

  /**
   * Clear all cache entries for a specific term
   */
  async invalidateTerm(termId: string): Promise<void> {
    if (!redis) return;

    try {
      const patterns = [
        `*:term:${termId}*`,
        `shifts:${termId}*`,
        `schedules:term:${termId}`,
      ];

      await Promise.all(patterns.map(pattern => cache.deletePattern(pattern)));

      // Also invalidate terms list and active term
      await cache.delete(CacheKeys.TERMS_LIST);
      await cache.delete(CacheKeys.ACTIVE_TERM);

      console.log(`✓ Cache invalidated for term ${termId}`);
    } catch (error) {
      console.error(`✗ Cache invalidation error for term ${termId}:`, error);
    }
  },

  /**
   * Clear today's shifts cache
   */
  async invalidateTodayShifts(termId: string, dateKey: string): Promise<void> {
    if (!redis) return;

    try {
      await cache.delete(CacheKeys.TODAY_SHIFTS(termId, dateKey));
      console.log(`✓ Cache invalidated for today's shifts (${dateKey})`);
    } catch (error) {
      console.error(`✗ Cache invalidation error for today's shifts:`, error);
    }
  },

  /**
   * Clear all cache (use sparingly!)
   */
  async flushAll(): Promise<void> {
    if (!redis) return;

    try {
      await redis.flushdb();
      console.log('✓ All cache cleared');
    } catch (error) {
      console.error('✗ Cache flush error:', error);
    }
  },
};

export default cache;
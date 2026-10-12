/**
 * In-Memory Cache for Safety Plans
 * Reduces API costs and improves response times for repeated queries
 * Cache is cleared on server restart (stateless for Vercel deployment)
 */

import type { RAGInput, SafetyPlanResponse } from "@/types/rag";
import crypto from "crypto";

interface CacheEntry {
  key: string;
  value: SafetyPlanResponse;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: string;
}

class SafetyPlanCache {
  private cache: Map<string, CacheEntry>;
  private readonly maxSize: number;
  private readonly ttl: number; // Time to live in milliseconds
  private hits: number;
  private misses: number;
  private evictions: number;

  constructor(maxSize: number = 100, ttlMinutes: number = 60) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Generate cache key from RAG input
   * Uses SHA-256 hash of normalized input
   */
  private generateKey(input: RAGInput): string {
    // Normalize input for consistent hashing
    const normalized = {
      neighbourhood: input.neighbourhood.toLowerCase().trim(),
      crime_types: input.crime_types
        .map((c) => c.toLowerCase().trim())
        .sort(),
      // Only include first 10 user context items (5 Q&A pairs) for cache key
      // This balances cache hit rate with personalization
      user_context: input.user_context.slice(0, 10)
        .map((c) => c.toLowerCase().trim())
        .sort(),
    };

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(normalized))
      .digest("hex");

    return hash.substring(0, 16); // Use first 16 chars for shorter keys
  }

  /**
   * Get cached safety plan
   * Returns null if not found or expired
   */
  get(input: RAGInput): SafetyPlanResponse | null {
    const key = this.generateKey(input);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      this.evictions++;
      return null;
    }

    // Cache hit!
    entry.hits++;
    this.hits++;
    console.log(`[Cache] HIT: ${key} (${entry.hits} hits, ${Math.round(age / 1000)}s old)`);

    return entry.value;
  }

  /**
   * Store safety plan in cache
   * Evicts oldest entry if cache is full
   */
  set(input: RAGInput, value: SafetyPlanResponse): void {
    const key = this.generateKey(input);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.evictions++;
        console.log(`[Cache] EVICT: ${oldestKey} (cache full)`);
      }
    }

    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      hits: 0,
    };

    this.cache.set(key, entry);
    console.log(`[Cache] SET: ${key}`);
  }

  /**
   * Find oldest cache entry for eviction
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions += size;
    console.log(`[Cache] CLEAR: Removed ${size} entries`);
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        pruned++;
        this.evictions++;
      }
    }

    if (pruned > 0) {
      console.log(`[Cache] PRUNE: Removed ${pruned} expired entries`);
    }

    return pruned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : "0.00";

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Log cache statistics
   */
  logStats(): void {
    const stats = this.getStats();
    console.log("\n[Cache] Statistics:");
    console.log(`  Size: ${stats.size}/${this.maxSize}`);
    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Hit Rate: ${stats.hitRate}`);
    console.log(`  Evictions: ${stats.evictions}\n`);
  }
}

// Singleton cache instance
let cacheInstance: SafetyPlanCache | null = null;

/**
 * Get or create cache instance
 * Cache configuration:
 * - Max size: 100 plans
 * - TTL: 60 minutes
 * - Memory: ~10MB (100 plans × ~100KB each)
 */
export function getCache(): SafetyPlanCache {
  if (!cacheInstance) {
    cacheInstance = new SafetyPlanCache(100, 60);

    // Prune expired entries every 10 minutes
    setInterval(() => {
      if (cacheInstance) {
        cacheInstance.prune();
      }
    }, 10 * 60 * 1000);

    // Log stats every 30 minutes in development
    if (process.env.NODE_ENV === "development") {
      setInterval(() => {
        if (cacheInstance) {
          cacheInstance.logStats();
        }
      }, 30 * 60 * 1000);
    }
  }

  return cacheInstance;
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  const cache = getCache();
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const cache = getCache();
  return cache.getStats();
}

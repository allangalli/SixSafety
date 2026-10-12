/**
 * Simple In-Memory Rate Limiter
 * Protects API endpoints from abuse
 * Uses sliding window algorithm
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMinutes: number = 15) {
    this.store = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * Returns null if allowed, or { resetTime } if limited
   */
  check(identifier: string): { limited: false } | { limited: true; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No existing entry or expired - allow request
    if (!entry || now >= entry.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { limited: false };
    }

    // Within rate limit - allow request
    if (entry.count < this.maxRequests) {
      entry.count++;
      return { limited: false };
    }

    // Rate limited
    console.warn(`[RateLimit] Blocked: ${identifier} (${entry.count}/${this.maxRequests})`);
    return {
      limited: true,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get current stats
   */
  getStats(): { total: number; active: number } {
    const now = Date.now();
    let active = 0;

    for (const entry of this.store.values()) {
      if (now < entry.resetTime) {
        active++;
      }
    }

    return {
      total: this.store.size,
      active,
    };
  }
}

// Singleton rate limiter instances
let planGenerationLimiter: RateLimiter | null = null;

/**
 * Get rate limiter for plan generation endpoint
 * Limit: 10 requests per 15 minutes per IP
 */
export function getPlanGenerationLimiter(): RateLimiter {
  if (!planGenerationLimiter) {
    planGenerationLimiter = new RateLimiter(10, 15);
  }
  return planGenerationLimiter;
}

/**
 * Extract identifier from request (IP address)
 */
export function getIdentifier(request: Request): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (localhost in development)
  return "unknown";
}

/**
 * Format reset time for response header
 */
export function formatResetTime(resetTime: number): string {
  const seconds = Math.ceil((resetTime - Date.now()) / 1000);
  return seconds.toString();
}

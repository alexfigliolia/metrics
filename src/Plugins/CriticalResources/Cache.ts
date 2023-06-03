import type { CacheEntry } from "./types";

/**
 * Cache
 *
 * A lookup table for reducing duplicate `cacheRate` computations
 * between metrics using the `CriticalResourcePlugin`
 */
export class Cache extends Map<string, CacheEntry> {
  /**
   * Lookup
   *
   * Returns the `CacheEntry` associated with a given start
   * and stop time
   */
  public lookup(startTime: number, stopTime: number) {
    return this.get(this.key(startTime, stopTime));
  }

  /**
   * Key
   *
   * Returns a cache key generated from the start and stop
   * times provided
   */
  private key(startTime: number, stopTime: number) {
    return `${startTime}-${stopTime}`;
  }

  /**
   * With Cache
   *
   * Returns function that will first reference the cache for
   * pre-existing data before computing a cache rate.
   */
  public withCache<
    T extends (startTime: number, stopTime: number) => CacheEntry
  >(func: T): (...args: Parameters<T>) => CacheEntry {
    return (startTime: number, stopTime: number) => {
      const entry = this.lookup(startTime, stopTime);
      if (entry) {
        return entry;
      }
      const cacheRate = func(startTime, stopTime);
      this.set(this.key(startTime, stopTime), cacheRate);
      return cacheRate;
    };
  }
}

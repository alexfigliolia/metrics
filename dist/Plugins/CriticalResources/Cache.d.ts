import type { CacheEntry } from "./types";
/**
 * Cache
 *
 * A lookup table for reducing duplicate `cacheRate` computations
 * between metrics using the `CriticalResourcePlugin`
 */
export declare class Cache extends Map<string, CacheEntry> {
    /**
     * Lookup
     *
     * Returns the `CacheEntry` associated with a given start
     * and stop time
     */
    lookup(startTime: number, stopTime: number): CacheEntry | undefined;
    /**
     * Key
     *
     * Returns a cache key generated from the start and stop
     * times provided
     */
    private key;
    /**
     * With Cache
     *
     * Returns function that will first reference the cache for
     * pre-existing data before computing a cache rate.
     */
    withCache<T extends (startTime: number, stopTime: number) => CacheEntry>(func: T): (...args: Parameters<T>) => CacheEntry;
}

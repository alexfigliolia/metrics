"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
/**
 * Cache
 *
 * A lookup table for reducing duplicate `cacheRate` computations
 * between metrics using the `CriticalResourcePlugin`
 */
class Cache extends Map {
    /**
     * Lookup
     *
     * Returns the `CacheEntry` associated with a given start
     * and stop time
     */
    lookup(startTime, stopTime) {
        return this.get(this.key(startTime, stopTime));
    }
    /**
     * Key
     *
     * Returns a cache key generated from the start and stop
     * times provided
     */
    key(startTime, stopTime) {
        return `${startTime}-${stopTime}`;
    }
    /**
     * With Cache
     *
     * Returns function that will first reference the cache for
     * pre-existing data before computing a cache rate.
     */
    withCache(func) {
        return (startTime, stopTime) => {
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
exports.Cache = Cache;

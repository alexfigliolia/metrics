import type { CacheEntry } from "./types";

export class Cache extends Map<string, CacheEntry> {
  public lookup(startTime: number, stopTime: number) {
    return this.get(this.key(startTime, stopTime));
  }

  private key(startTime: number, stopTime: number) {
    return `${startTime}-${stopTime}`;
  }

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

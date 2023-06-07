import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";

/**
 * Critical Resource Plugin
 *
 * A plugin designed to record Critical Path and Cache attributes
 * for a given metric. This plugin accepts a list of file extensions
 * and returns the underlying weight of collective resources required
 * to serve the metric to the browser. The aforementioned resources
 * are then calculated against any cache-hits producing a cache-
 * rate percentage
 *
 * ```typescript
 * const metric = new Metric("My Metric", {
 *   resources: new CriticalResourcePlugin(["js", "css"])
 * });
 * ```
 */
export class CriticalResourcePlugin<
  T extends Metric<any, any> = Metric<any, any>
> extends Plugin<T> {
  public cacheRate = 0;
  public criticalSize = 0;
  public extensions: Set<string>;
  private static browserSupport =
    typeof window !== undefined && "performance" in window;
  constructor(extensions: string[] = ["js", "css"]) {
    super();
    this.extensions = new Set(extensions);
  }

  /**
   * Reset
   *
   * Resets the Metric's `cacheRate` and `criticalSize` back
   * to zero
   */
  protected override reset() {
    this.cacheRate = 0;
    this.criticalSize = 0;
  }

  /**
   * Stop
   *
   * Records the `criticalSize` and `cacheRate` of resources loaded
   * between the Metric's `start()` and `stop()` events
   */
  protected override stop({ startTime, stopTime }: T) {
    const { cacheRate, criticalSize } = this.iterateResources(
      startTime,
      stopTime
    );
    this.cacheRate = cacheRate;
    this.criticalSize = criticalSize;
  }

  /**
   * Iterate Resources
   *
   * Filters all loaded resources for those loaded within the
   * duration of the metric. Returns the total size (`criticalSize`)
   * and `cacheRate`
   */
  private iterateResources(startTime: number, stopTime: number) {
    if (!CriticalResourcePlugin.browserSupport) {
      return { cacheRate: 0, criticalSize: 0 };
    }
    let cachedSize = 0;
    let criticalSize = 0;
    const resources = performance.getEntriesByType(
      "resource"
    ) as PerformanceResourceTiming[];
    for (const resource of resources) {
      const { name, fetchStart, responseEnd, transferSize, decodedBodySize } =
        resource;
      if (fetchStart < startTime || responseEnd > stopTime) {
        continue;
      }
      if (!this.extensions.has(this.parseExtension(name))) {
        continue;
      }
      criticalSize += decodedBodySize;
      if (transferSize === 0 && decodedBodySize > 0) {
        cachedSize += decodedBodySize;
      }
    }
    return {
      criticalSize,
      cacheRate: criticalSize === 0 ? 100 : (cachedSize / criticalSize) * 100,
    };
  }

  /**
   * Parse Extension
   *
   * Returns a file extension associated with a given resource
   */
  private parseExtension(url: string) {
    try {
      return url?.split(/[#?]/)?.[0]?.split(".")?.pop()?.trim() || "";
    } catch (error) {
      return "";
    }
  }

  /**
   * To JSON
   *
   * Modifies the return value of the `CriticalResourcePlugin` interface
   * when passed to `JSON.stringify`
   */
  public override toJSON() {
    return {
      cacheRate: this.cacheRate,
      criticalSize: this.criticalSize,
      extensions: Array.from(this.extensions),
      browserSupport: CriticalResourcePlugin.browserSupport,
    };
  }
}

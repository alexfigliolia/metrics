import type { Metric } from "../../Metrics/Metric";
import { Plugin } from "../../Plugin/Plugin";
/**
 * Critical Resource Plugin
 *
 * A plugin designed to record Critical Path and cache attributes
 * for a given metric. This plugin accepts a list of file extensions
 * and returns the underlying weight of collective resources required
 * to serve the metric to the browser. The aforementioned resources
 * are then calculated against any cache-hits producing a cache-
 * rate percentage
 *
 * ```typescript
 * const metric = new Metric("My Metric", {
 *   resources: new CriticalResourcePlugin("js", "css")
 * });
 * ```
 */
export declare class CriticalResourcePlugin<T extends Metric<any, any> = Metric<any, any>> extends Plugin<T> {
    cacheRate: number;
    criticalSize: number;
    extensions: Set<string>;
    private static Cache;
    private static browserSupport;
    browserSupport: boolean;
    constructor(extensions?: string[]);
    /**
     * Reset
     *
     * Resets the Metric's `cacheRate` and `criticalSize` back
     * to zero
     */
    reset(): void;
    /**
     * Stop
     *
     * Records the `criticalSize` and `cacheRate` of resources loaded
     * between the Metric's `start()` and `stop()` events
     */
    stop({ startTime, stopTime }: T): void;
    /**
     * Iterate Resources
     *
     * Filters all loaded resources for those loaded within the
     * duration of the metric. Computes the total size (`criticalSize`)
     * and `cacheRate`
     */
    private iterateResources;
    /**
     * Parse Extension
     *
     * Returns a file extension associated with a given resource
     */
    private parseExtension;
}

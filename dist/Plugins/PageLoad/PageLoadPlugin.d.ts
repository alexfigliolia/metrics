import type { Metric } from "../../Metrics/Metric";
import { Plugin } from "../../Plugin/Plugin";
/**
 * Page Load Plugin
 *
 * This plugin allows metrics to reference the browser's most
 * recent navigation when recording start times. Because the
 * browser's navigation takes place before an application
 * can completely bootstrap, Metrics on their own, cannot produce
 * the durations relative to the applications initial load. By
 * adding this plugin to a metric, it's `startTime` is set equal
 * to the browser's most recent navigation
 *
 * ```typescript
 * const metric = new Metric("My Metric", { pageLoad: PageLoadPlugin });
 * ```
 */
export declare class PageLoadPlugin<T extends Metric<any, any> = Metric<any, any>> extends Plugin<T> {
    static timing: number;
    transition: boolean;
    initialLoad: boolean;
    static enabled: boolean;
    static transitionID: number;
    private static compatible;
    register(metric: T): void;
    /**
     * Start
     *
     * Sets the target Metric's `startTime` equal to the browser's
     * most recent navigation.
     */
    protected start(metric: T): void;
    /**
     * Reset
     *
     * Resets the `transition` and `initialLoad` properties of the
     * instance
     */
    protected reset(): void;
    /**
     * Enable
     *
     * Records a high-resolution timestamp each time `History.pushState()`
     * is called and caches it. These high-resolution timestamps are then
     * used by Metrics looking to record durations beginning with the
     * browser's most recent navigation
     */
    static enable(): void;
    /**
     * Set Timing
     *
     * Sets the plugin's `timing` property to a high-resolution timestamp
     */
    private static setTiming;
}

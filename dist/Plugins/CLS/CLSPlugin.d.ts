import type { Metric } from "../../Metrics/Metric";
import { Plugin } from "../../Plugin/Plugin";
import type { LayoutShift } from "./types";
/**
 * CLS Plugin
 *
 * A plugin for tracking layout shifts associated with a given metric.
 * By providing this plugin with a DOM selector, it'll track and record
 * the position of the element between `start()` and `stop()` calls. If
 * layout shifts are detected, they'll be available on the plugin instance
 *
 * ```typescript
 * const metric = new Metric("My Metric", {
 *   CLS: new CLSPlugin(".my-ui-element")
 * });
 * ```
 */
export declare class CLSPlugin<T extends Metric<any, any> = Metric<any, any>> extends Plugin<T> {
    private name;
    selector: string;
    layoutShifts: LayoutShift[];
    initialLayout: DOMRect;
    private static readonly measures;
    constructor(selector: string);
    register(metric: T): void;
    /**
     * Start
     *
     * Records the target elements's `boundClientRect`
     */
    protected start(): void;
    /**
     * Stop
     *
     * Records the target elements's `boundClientRect` and compares
     * it to the element's initial layout position
     */
    protected stop(metric: T): void;
    /**
     * Reset
     *
     * Resets all recorded layout positions and shifts
     */
    protected reset(): void;
    /**
     * Inspect
     *
     * Records the position of the target element and compares to the
     * element's initial position
     */
    inspect(time?: number): void;
    /**
     * Query Selector
     *
     * Queries the DOM for the provided selector and returns the result
     */
    private querySelector;
    /**
     * Detect Layout Shift
     *
     * Calls the target element's `boundingClientRect()` method and
     * compares each position to the element's initial layout position.
     * If a shift is detected, a shift object is pushed to the instance's
     * `layoutShifts` property
     */
    private detectLayoutShift;
    /**
     * Initial Layout
     *
     * A zero'd out `DOMRect` object
     */
    private static readonly initialLayout;
    /**
     * DOM Rect
     *
     * A zero'd out `DOMRect` object
     */
    private static readonly DOMRect;
}

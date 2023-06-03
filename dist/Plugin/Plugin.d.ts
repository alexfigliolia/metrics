import type { Metric } from "../Metrics/Metric";
/**
 * Plugin
 *
 * The `Plugin` interface allows developers to compose custom
 * functionality for their `Metrics`
 *
 * ```typescript
 * class LoggerPlugin<T extends Metric> extends Plugin<T> {
 *   protected override start(metric: T) {
 *     console.log(metric.name, "Started!")
 *   }
 *
 *   protected override stop(metric: T) {
 *     console.log(metric.name, "Stopped!")
 *   }
 * }
 *
 *
 * const myMetric = new Metric("My Metric", { logger: LoggerPlugin });
 * ```
 */
export declare class Plugin<T extends Metric<any, any> = Metric<any, any>> {
    protected registered: boolean;
    protected static IS_DEV: boolean;
    constructor(metric?: T);
    /**
     * Register
     *
     * Binds a plugin to the provided Metric. Plugins are bound using the
     * Metric's underlying event emitter.
     */
    register(metric: T): void;
    /**
     * Validate Event
     *
     * Returns true if a constructor method on an extending class is
     * a valid event emitted by the underlying metric
     */
    private validateEvent;
    /**
     * Start
     *
     * An event emitted each time the provided metric calls `start()`
     */
    protected start(metric: T): void;
    /**
     * Stop
     *
     * An event emitted each time the provided metric calls `stop()`
     */
    protected stop(metric: T): void;
    /**
     * Reset
     *
     * An event emitted each time the provided metric calls `reset()`
     */
    protected reset(metric: T): void;
    /**
     * Success
     *
     * An event emitted each time the provided metric calls `succeed()`
     */
    protected success(metric: T): void;
    /**
     * Failure
     *
     * An event emitted each time the provided metric calls `fail()`
     */
    protected failure(metric: T): void;
}

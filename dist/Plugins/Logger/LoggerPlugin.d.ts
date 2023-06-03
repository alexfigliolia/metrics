import type { Metric } from "../../Metrics/Metric";
import { Plugin } from "../../Plugin/Plugin";
/**
 * Logger Plugin
 *
 * This plugin is designed to make debugging any `Metric` as simple
 * as possible. When registering this Plugin on one or more of your
 * metrics, you'll receive a log to the console each time an event is
 * emitted from one of your metrics
 *
 * ```typescript
 * const metric = new Metric("My Metric", { logger: LoggerPlugin });
 * ```
 */
export declare class LoggerPlugin<T extends Metric<any, any>> extends Plugin<T> {
    /**
     * Start
     *
     * Logs the target Metric's `start` event
     */
    start(metric: T): void;
    /**
     * Stop
     *
     * Logs the target Metric's `stop` event
     */
    stop(metric: T): void;
    /**
     * Success
     *
     * Logs the target Metric's `success` event
     */
    success(metric: T): void;
    /**
     * Failure
     *
     * Logs the target Metric's `failure` event
     */
    failure(metric: T): void;
    /**
     * Reset
     *
     * Logs the target Metric's `reset` event
     */
    reset(metric: T): void;
}

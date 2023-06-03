import { EventEmitter } from "@figliolia/event-emitter";
import { CoreEvents, Status } from "./types";
import type { MetricEvents, PluginTable } from "./types";
/**
 * Metric
 *
 * An extendable interface for tracking performance in your application
 *
 * ```typescript
 * const metric = new Metric("My Metric", { ...plugins });
 *
 * metric.start(); // Records the start time of your metric
 * metric.stop();  // Records the stop time and duration of your metric
 * metric.reset(); // Resets your metric
 * metric.on("start" | "stop" | "reset", async (metric) => {
 *   // Adds an event listener to your Metric's events
 *   await fetch({
 *     url: "/analytics-service",
 *     data: JSON.stringify(metric)
 *   });
 * });
 * ```
 */
export declare class Metric<T extends MetricEvents = MetricEvents, P extends PluginTable = PluginTable> extends EventEmitter<T> {
    name: string;
    stopTime: number;
    startTime: number;
    duration: number;
    plugins: P;
    status: Status;
    readonly events: typeof CoreEvents;
    constructor(name: string, plugins?: P);
    /**
     * Start
     *
     * Records a start time for your metric and moves the status
     * to `inProgress`. Emits the Metric's `start` event
     */
    start(time?: number): void;
    /**
     * Stop
     *
     * Records a stop time, duration, and moves your metric's status
     * to `complete`. Emits the Metric's `stop` event
     */
    stop(time?: number, status?: Status): void;
    /**
     * Reset
     *
     * Resets the Metric's `startTime`, `stopTime`, `duration`, and `status`
     * back to their original state. Emits the Metric's `reset` event
     */
    reset(): void;
    /**
     * Register Plugins
     *
     * Instantiates each plugin specified
     */
    private registerPlugins;
}

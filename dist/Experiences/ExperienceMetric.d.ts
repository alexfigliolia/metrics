import { Metric } from "../Metrics/Metric";
import type { IExperience } from "./types";
import type { MetricEvents, PluginTable } from "../Metrics/types";
/**
 * Experience Metric
 *
 * A composition tool for constructing metrics from one or more
 * child metrics
 *
 * ```typescript
 * const metric1 = new Metric("metric1");
 * const metric2 = new Metric("metric2");
 * const metric3 = new Metric("metric3");
 * const experience = new ExperienceMetric({
 *   name: "My Experience",
 *   metrics: [metric1, metric2, metric3],
 *   plugins: { ...plugins }
 * });
 *
 * metric1.start(); // The earliest start time becomes the Experience's start time
 * metric2.start();
 * metric3.start();
 *
 * metric1.stop();
 * metric2.stop();
 * metric3.stop(); // The latest stop time becomes the Experience's stop time
 *
 * experience.on("start" | "stop" | "reset", experience => {
 *   // Adds an event listener to your Experience's events
 *   await fetch({
 *     url: "/analytics-service",
 *     data: JSON.stringify(experience)
 *   });
 * });
 * ```
 */
export declare class ExperienceMetric<E extends MetricEvents = MetricEvents, M extends Metric<any, any>[] = Metric<any, any>[], P extends PluginTable = PluginTable> extends Metric<E, P> {
    readonly metrics: M;
    private IDs;
    private completedMetrics;
    private reference;
    constructor({ name, metrics, plugins }: IExperience<M, P>);
    /**
     * Reset
     *
     * Resets the Experience's and its sub-metric's `startTime`, `stopTime`,
     * `duration`, and `status` back to their original state. Emits the
     * Experiences's `reset` event
     */
    reset(): void;
    /**
     * Index Metrics
     *
     * Assigns a unique identifier to each child Metric and hashes
     * them on the instance
     */
    private indexMetrics;
    /**
     * Listen For Stops
     *
     * Registers a `stop` listener on each child metric and invokes
     * the `Experience's` `stop` event once all child metrics complete.
     * The `Experience` will assume the greatest stop time out of each
     * the child metrics
     */
    private listenForStops;
    /**
     * Listen For Starts
     *
     * Registers a `start` listener on each child metric and invokes
     * the `Experience's` `start` event as soon as the first child
     * `Metric` begins. The `Experience` will assume the lowest
     * start time out of each of the child metrics
     */
    private listenForStarts;
}

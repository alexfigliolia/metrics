"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceMetric = void 0;
const event_emitter_1 = require("@figliolia/event-emitter");
const Metric_1 = require("../Metrics/Metric");
const types_1 = require("../Metrics/types");
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
class ExperienceMetric extends Metric_1.Metric {
    constructor({ name, metrics, plugins }) {
        super(name, plugins);
        this.IDs = new event_emitter_1.AutoIncrementingID();
        this.completedMetrics = new Set();
        this.reference = {};
        this.metrics = metrics;
        this.indexMetrics();
        this.listenForStops();
        this.listenForStarts();
    }
    /**
     * Reset
     *
     * Resets the Experience's and its sub-metric's `startTime`, `stopTime`,
     * `duration`, and `status` back to their original state. Emits the
     * Experiences's `reset` event
     */
    reset() {
        this.metrics.forEach((metric) => {
            metric.reset();
        });
        super.reset();
        this.completedMetrics.clear();
    }
    /**
     * Index Metrics
     *
     * Assigns a unique identifier to each child Metric and hashes
     * them on the instance
     */
    indexMetrics() {
        this.metrics.forEach((metric) => {
            this.reference[metric.name] = this.IDs.get();
        });
    }
    /**
     * Listen For Stops
     *
     * Registers a `stop` listener on each child metric and invokes
     * the `Experience's` `stop` event once all child metrics complete.
     * The `Experience` will assume the greatest stop time out of each
     * the child metrics
     */
    listenForStops() {
        this.metrics.forEach((metric) => {
            metric.on(types_1.CoreEvents.stop, (m) => {
                const ID = this.reference[m.name];
                if (!this.completedMetrics.has(ID)) {
                    this.completedMetrics.add(ID);
                    if (this.completedMetrics.size === this.metrics.length) {
                        super.stop(Math.max.apply(null, this.metrics.map((m) => m.stopTime)));
                    }
                }
            });
        });
    }
    /**
     * Listen For Starts
     *
     * Registers a `start` listener on each child metric and invokes
     * the `Experience's` `start` event as soon as the first child
     * `Metric` begins. The `Experience` will assume the lowest
     * start time out of each of the child metrics
     */
    listenForStarts() {
        this.metrics.forEach((metric) => {
            metric.on(types_1.CoreEvents.start, (m) => {
                if (this.status === types_1.Status.idol) {
                    this.start(m.startTime);
                }
                else {
                    this.startTime = Math.min(m.startTime, this.startTime);
                }
            });
        });
    }
}
exports.ExperienceMetric = ExperienceMetric;

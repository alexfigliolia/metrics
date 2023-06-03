"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metric = void 0;
const event_emitter_1 = require("@figliolia/event-emitter");
const types_1 = require("./types");
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
class Metric extends event_emitter_1.EventEmitter {
    constructor(name, plugins = {}) {
        super();
        this.stopTime = 0;
        this.startTime = 0;
        this.duration = 0;
        this.plugins = {};
        this.status = types_1.Status.idol;
        this.events = types_1.CoreEvents;
        this.name = name;
        this.plugins = plugins;
        this.register();
    }
    /**
     * Start
     *
     * Records a start time for your metric and moves the status
     * to `inProgress`. Emits the Metric's `start` event
     */
    start(time = performance.now()) {
        if (this.status !== types_1.Status.idol) {
            return;
        }
        this.startTime = time;
        this.status = types_1.Status.inProgress;
        this.emit(types_1.CoreEvents.start, this);
    }
    /**
     * Stop
     *
     * Records a stop time, duration, and moves your metric's status
     * to `complete`. Emits the Metric's `stop` event
     */
    stop(time = performance.now(), status = types_1.Status.complete) {
        if (this.status !== types_1.Status.inProgress) {
            return;
        }
        this.stopTime = time;
        this.duration = this.stopTime - this.startTime;
        this.status = status;
        this.emit(types_1.CoreEvents.stop, this);
    }
    /**
     * Reset
     *
     * Resets the Metric's `startTime`, `stopTime`, `duration`, and `status`
     * back to their original state. Emits the Metric's `reset` event
     */
    reset() {
        this.duration = 0;
        this.stopTime = 0;
        this.startTime = 0;
        this.status = types_1.Status.idol;
        this.emit(types_1.CoreEvents.reset, this);
    }
    register() {
        for (const key in this.plugins) {
            this.plugins[key].register(this);
        }
    }
}
exports.Metric = Metric;

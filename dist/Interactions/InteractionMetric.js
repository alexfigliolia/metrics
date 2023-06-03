"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionMetric = void 0;
const Metric_1 = require("../Metrics/Metric");
const types_1 = require("./types");
const types_2 = require("../Metrics/types");
/**
 * Interaction Metric
 *
 * An extension of the `Metric` interface designed to track the
 * reliability of micro interactions
 *
 * ```typescript
 * const myInteraction = new InteractionMetric("Sign Up");
 *
 * async function onSubmitForm<T extends Record<string, string>>(data: T) {
 *   myInteraction.start();
 *   try {
 *     await fetch({
 *       url: "/signup",
 *       data: JSON.stringify(data)
 *     });
 *     await redirectToHome();
 *     myInteraction.succeed()
 *   } catch(error) {
 *     myInteraction.fail({ error })
 *   }
 * }
 *
 * myInteraction.on("start" | "stop" | "success" | "failure" | "reset", (metric) => {
 *   // Adds an event listener to your InteractionMetric's events
 *   await fetch({
 *     url: "/analytics-service",
 *     data: JSON.stringify(metric)
 *   });
 * })
 * ```
 */
class InteractionMetric extends Metric_1.Metric {
    constructor() {
        super(...arguments);
        this.failed = false;
        this.succeeded = false;
        this.events = Object.assign(Object.assign({}, types_2.CoreEvents), types_1.ReliabilityEvents);
    }
    /**
     * Succeed
     *
     * Records a stop time, duration, and moves your metric's status
     * to `complete`. This method can also be supplied when any
     * arbitrary data to associate with the status of the Metric.
     * Emits the Metric's `success` and `stop` events
     */
    succeed(data, stopTime = performance.now()) {
        this.data = data;
        this.failed = false;
        this.succeeded = true;
        super.stop(stopTime);
        this.emit(types_1.ReliabilityEvents.success, this);
    }
    /**
     * Fail
     *
     * Records a stop time, duration, and moves your metric's status
     * to `failed`. This method can also be supplied when any
     * arbitrary data to associate with the status of the Metric.
     * Emits the Metric's `failure` and `stop` events
     */
    fail(data, stopTime = performance.now()) {
        this.data = data;
        this.failed = true;
        this.succeeded = false;
        super.stop(stopTime, types_2.Status.failed);
        this.emit(types_1.ReliabilityEvents.failure, this);
    }
    /**
     * Reset
     *
     * Resets the Metric's `startTime`, `stopTime`, `duration`, and `status`
     * back to their original state. Emits the Metric's `reset` event
     */
    reset() {
        this.failed = false;
        this.data = undefined;
        this.succeeded = false;
        super.reset();
    }
}
exports.InteractionMetric = InteractionMetric;

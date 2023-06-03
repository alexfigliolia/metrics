import { Metric } from "../Metrics/Metric";
import { ReliabilityEvents } from "./types";
import type { InteractionEvents } from "./types";
import { CoreEvents } from "../Metrics/types";
import type { MetricEvents, PluginTable } from "../Metrics/types";
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
export declare class InteractionMetric<S extends Record<string, any> = Record<string, any>, F extends Record<string, any> = Record<string, any>, P extends PluginTable = PluginTable> extends Metric<InteractionEvents<S, F> & MetricEvents, P> {
    data?: S | F;
    failed: boolean;
    succeeded: boolean;
    readonly events: {
        success: ReliabilityEvents.success;
        failure: ReliabilityEvents.failure;
        start: CoreEvents.start;
        stop: CoreEvents.stop;
        reset: CoreEvents.reset;
    };
    /**
     * Succeed
     *
     * Records a stop time, duration, and moves your metric's status
     * to `complete`. This method can also be supplied when any
     * arbitrary data to associate with the status of the Metric.
     * Emits the Metric's `success` and `stop` events
     */
    succeed(data?: S, stopTime?: number): void;
    /**
     * Fail
     *
     * Records a stop time, duration, and moves your metric's status
     * to `failed`. This method can also be supplied when any
     * arbitrary data to associate with the status of the Metric.
     * Emits the Metric's `failure` and `stop` events
     */
    fail(data: F, stopTime?: number): void;
    /**
     * Reset
     *
     * Resets the Metric's `startTime`, `stopTime`, `duration`, and `status`
     * back to their original state. Emits the Metric's `reset` event
     */
    reset(): void;
}

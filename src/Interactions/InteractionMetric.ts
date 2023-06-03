import { Metric } from "Metrics/Metric";
import { ReliabilityEvents } from "./types";
import type { InteractionEvents } from "./types";
import { CoreEvents, Status } from "Metrics/types";
import type { MetricEvents, PluginTable } from "Metrics/types";

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
export class InteractionMetric<
  S extends Record<string, any> = Record<string, any>,
  F extends Record<string, any> = Record<string, any>,
  P extends PluginTable = PluginTable
> extends Metric<InteractionEvents<S, F> & MetricEvents, P> {
  public data?: S | F;
  public failed = false;
  public succeeded = false;
  public readonly events = { ...CoreEvents, ...ReliabilityEvents };

  /**
   * Succeed
   *
   * Records a stop time, duration, and moves your metric's status
   * to `complete`. This method can also be supplied when any
   * arbitrary data to associate with the status of the Metric.
   * Emits the Metric's `success` and `stop` events
   */
  public succeed(data?: S, stopTime: number = performance.now()) {
    this.data = data;
    this.failed = false;
    this.succeeded = true;
    super.stop(stopTime);
    this.emit(ReliabilityEvents.success, this);
  }

  /**
   * Fail
   *
   * Records a stop time, duration, and moves your metric's status
   * to `failed`. This method can also be supplied when any
   * arbitrary data to associate with the status of the Metric.
   * Emits the Metric's `failure` and `stop` events
   */
  public fail(data: F, stopTime = performance.now()) {
    this.data = data;
    this.failed = true;
    this.succeeded = false;
    super.stop(stopTime, Status.failed);
    this.emit(ReliabilityEvents.failure, this);
  }

  /**
   * Reset
   *
   * Resets the Metric's `startTime`, `stopTime`, `duration`, and `status`
   * back to their original state. Emits the Metric's `reset` event
   */
  public override reset() {
    this.failed = false;
    this.data = undefined;
    this.succeeded = false;
    super.reset();
  }
}

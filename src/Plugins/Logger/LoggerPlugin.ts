import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";
import type { PluginEvent } from "Plugin/types";

/**
 * Logger Plugin
 *
 * This plugin is designed to make debugging any `Metric` as simple
 * as possible. When registering this Plugin on one or more of your
 * metrics, you'll receive a log to the console each time an event is
 * emitted from one of your metrics
 *
 * ```typescript
 * const metric = new Metric("My Metric", {
 *  logger: new LoggerPlugin()
 * });
 * ```
 */
export class LoggerPlugin<
  T extends Metric<any, any> = Metric<any, any>
> extends Plugin<T> {
  private events: Set<PluginEvent>;
  constructor(
    events: PluginEvent[] = ["start", "stop", "success", "failure", "reset"]
  ) {
    super();
    this.events = new Set(events);
  }
  /**
   * Start
   *
   * Logs the target Metric's `start` event
   */
  protected override start(metric: T) {
    this.log("start", "rgb(225, 35, 139)", metric);
  }

  /**
   * Stop
   *
   * Logs the target Metric's `stop` event
   */
  protected override stop(metric: T) {
    this.log("stop", "rgb(29, 51, 255)", metric);
  }

  /**
   * Success
   *
   * Logs the target Metric's `success` event
   */
  protected override success(metric: T) {
    this.log("success", "#26ad65", metric);
  }

  /**
   * Failure
   *
   * Logs the target Metric's `failure` event
   */
  protected override failure(metric: T) {
    this.log("failure", "rgb(246, 52, 52)", metric);
  }

  /**
   * Reset
   *
   * Logs the target Metric's `reset` event
   */
  protected override reset(metric: T) {
    this.log("reset", "rgb(166, 166, 166)", metric);
  }

  /**
   * Log
   *
   * Returns a logging callback that'll verify that the incoming
   * event is white-listed by the constructor, then log the metric
   */
  private log(event: PluginEvent, color: string, metric: T) {
    if (!this.events.has(event)) {
      return;
    }
    console.log(
      "%cMetric:",
      "color: rgb(187, 186, 186); font-weight: bold",
      `${metric.name}:`
    );
    console.log(
      "   %c%s",
      `color: ${color}; font-weight: bold`,
      this.capitalize(event),
      metric.toJSON()
    );
  }

  /**
   * Capitalize
   *
   * Returns a capitalized plugin event
   */
  private capitalize(event: PluginEvent) {
    return `${event[0].toUpperCase()}${event.slice(1)}`;
  }
}

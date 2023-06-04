import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";

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
export class LoggerPlugin<
  T extends Metric<any, any> = Metric<any, any>
> extends Plugin<T> {
  /**
   * Start
   *
   * Logs the target Metric's `start` event
   */
  protected override start(metric: T) {
    console.log(
      `%c${metric.name}: %cStart`,
      "color: rgb(93, 93, 93); font-weight: bold",
      "color: rgb(255, 111, 0); font-weight: bold",
      metric
    );
  }

  /**
   * Stop
   *
   * Logs the target Metric's `stop` event
   */
  protected override stop(metric: T) {
    console.log(
      `%c${metric.name}: %Stop`,
      "color: rgb(93, 93, 93); font-weight: bold",
      "color: rgb(29, 51, 255); font-weight: bold",
      metric
    );
  }

  /**
   * Success
   *
   * Logs the target Metric's `success` event
   */
  protected override success(metric: T) {
    console.log(
      `%c${metric.name}: %Success`,
      "color: rgb(93, 93, 93); font-weight: bold",
      "color: #26ad65; font-weight: bold",
      metric
    );
  }

  /**
   * Failure
   *
   * Logs the target Metric's `failure` event
   */
  protected override failure(metric: T) {
    console.log(
      `%c${metric.name}: %Failure`,
      "color: rgb(93, 93, 93); font-weight: bold",
      "color: rgb(255, 43, 43); font-weight: bold",
      metric
    );
  }

  /**
   * Reset
   *
   * Logs the target Metric's `reset` event
   */
  protected override reset(metric: T) {
    console.log(
      `%c${metric.name}: %Reset`,
      "color: rgb(93, 93, 93); font-weight: bold",
      "color: rgb(166, 166, 166); font-weight: bold",
      metric
    );
  }
}

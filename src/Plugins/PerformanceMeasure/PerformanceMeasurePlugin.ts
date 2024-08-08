import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";

/**
 * Performance Measure Plugin
 *
 * This plugin creates Performance API entries for each of
 * your metrics. When a `Metric` configured with this plugin
 * reaches it's `stop()` event, a call to
 * ```typescript
 * performance.measure(metric.name, {
 *   start: metric.startTime,
 *   duration: metric.duration,
 *   end: metric.stopTime
 * });
 * ```
 * is made. From there you may access your Metrics using the
 * native Performance API by calling
 * ```typescript
 * performance.getEntriesByName(metric.name);
 * ```
 */
export class PerformanceMeasurePlugin<
  T extends Metric<any, any>,
> extends Plugin<T> {
  protected override stop(metric: T) {
    performance.measure(metric.name, {
      start: metric.startTime,
      duration: metric.duration,
      end: metric.stopTime,
    });
  }
}

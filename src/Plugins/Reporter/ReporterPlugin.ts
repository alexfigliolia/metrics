import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";
import type { ProcessingQueue } from "./ProcessingQueue";

/**
 * Reporter Plugin
 *
 * This plugin is designed to efficiently send your metrics to an
 * external service. When registering this plugin on a `Metric`, it
 * will be posted to the service you specify each time its `stop()`
 * event is called.
 *
 * Requests made to your service will attempt to batch multiple metrics
 * together using a processing queue to minimize the amount of requests
 * going out in the background of your application. The `ReporterPlugin`
 * will also use the `Beacon API` wherever possible.
 *
 * Setting up the Reporting Plugin and Processing Queue:
 * ```typescript
 * import { Metric, ReporterPlugin, ProcessingQueue } from "@figliolia/metrics";
 * import type { MetricEvents, WithReporter, PluginTable } from "@figliolia/metrics";
 *
 * class ReportedMetric<
 *   T extends MetricEvents = MetricEvents,
 *   P extends PluginTable = PluginTable
 * > extends Metric<T, WithReporter<PluginTable>> {
 *  // only one ProcessingQueue is necessary per application or analytics service
 *   private static Queue = new ProcessingQueue("https://my-analytics-service.com");
 *   constructor(name: string, plugins: P = {} as WithReporter<PluginTable>) {
 *     plugins.reporter = new new ReporterPlugin(ReportedMetric.Queue);
 *     super(name, plugins);
 *   }
 * }
 *
 * const metric = new ReportedMetric("My Metric");
 * metric.stop(); // => Metric results are sent to "https://my-analytics-server.com"
 * ```
 */
export class ReporterPlugin<
  T extends Metric<any, any> = Metric<any, any>
> extends Plugin<T> {
  private processor: ProcessingQueue<T>;
  constructor(processor: ProcessingQueue<T>) {
    super();
    this.processor = processor;
  }

  /**
   * Stop
   *
   * Enqueues the target metric to be sent to the `ProcessingQueue's`
   * destination
   */
  protected override stop(metric: T) {
    void this.processor.enqueue(metric);
  }

  /**
   * To JSON
   *
   * Modifies the return value of the `PageLoadPlugin` interface when passed
   * to `JSON.stringify`
   */
  public override toJSON() {
    return {};
  }
}

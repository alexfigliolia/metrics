"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporterPlugin = void 0;
const Plugin_1 = require("../../Plugin/Plugin");
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
 *   P extends WithReporter<PluginTable> = WithReporter<PluginTable>
 * > extends Metric<T, P> {
 *  // only one ProcessingQueue is necessary per application or analytics service
 *   private static Queue = new ProcessingQueue("https://my-analytics-service.com");
 *   constructor(name: string, plugins: P = {} as P) {
 *     plugins.reporter = new new ReporterPlugin(Queue);
 *     super(name, plugins);
 *   }
 * }
 *
 * const metric = new ReportedMetric("My Metric");
 * metric.stop(); // => Metric results are sent to "https://my-analytics-server.com"
 * ```
 */
class ReporterPlugin extends Plugin_1.Plugin {
    constructor(processor) {
        super();
        this.processor = processor;
    }
    /**
     * Stop
     *
     * Enqueues the target metric to be sent to the `ProcessingQueue's`
     * destination
     */
    stop(metric) {
        void this.processor.enqueue(metric);
    }
}
exports.ReporterPlugin = ReporterPlugin;

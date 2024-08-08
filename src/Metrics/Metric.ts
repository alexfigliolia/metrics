import { EventEmitter } from "@figliolia/event-emitter";
import type { MetricEvents, PluginTable } from "./types";
import { CoreEvents, Status } from "./types";

/**
 * Metric
 *
 * An interface for tracking performance in your application
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
export class Metric<
  T extends MetricEvents = MetricEvents,
  P extends PluginTable = PluginTable,
> extends EventEmitter<T> {
  public name: string;
  public stopTime = 0;
  public startTime = 0;
  public duration = 0;
  public plugins = {} as P;
  public status: Status = Status.idol;
  constructor(name: string, plugins = {} as P) {
    super()
    this.name = name;
    this.plugins = plugins;
    this.registerPlugins();
  }

  /**
   * Start
   *
   * Records a start time for your metric and moves the status
   * to `inProgress`. Emits the Metric's `start` event
   */
  public start(time = performance.now()) {
    if (this.status !== Status.idol) {
      return;
    }
    this.startTime = time;
    this.status = Status.inProgress;
    this.emit(CoreEvents.start, this);
  }

  /**
   * Stop
   *
   * Records a stop time, duration, and moves your metric's status
   * to `complete`. Emits the Metric's `stop` event
   */
  public stop(time = performance.now(), status: Status = Status.complete) {
    if (this.status !== Status.inProgress) {
      return;
    }
    this.stopTime = time;
    this.duration = this.stopTime - this.startTime;
    this.status = status;
    this.emit(CoreEvents.stop, this);
  }

  /**
   * Reset
   *
   * Resets the Metric's `startTime`, `stopTime`, `duration`, and `status`
   * back to their original state. Emits the Metric's `reset` event
   */
  public reset() {
    this.duration = 0;
    this.stopTime = 0;
    this.startTime = 0;
    this.status = Status.idol;
    this.emit(CoreEvents.reset, this);
  }

  /**
   * Register Plugins
   *
   * Instantiates each plugin specified
   */
  private registerPlugins() {
    for (const key in this.plugins) {
      this.plugins[key].register(this);
    }
  }

  /**
   * To JSON
   *
   * Returns all public mutable properties when passed into calls
   * to `JSON.stringify`
   */
  public toJSON() {
    return {
      name: this.name,
      startTime: this.startTime,
      stopTime: this.stopTime,
      duration: this.duration,
      plugins: this.plugins,
      status: this.status,
    };
  }

  /**
   * Events
   *
   * Returns each of the Metric's enumerated events. To extend
   * the default available metrics, override this method in
   * extending classes
   */
  public get events() {
    return CoreEvents;
  }
}

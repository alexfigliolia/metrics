import type { Metric } from "Metrics/Metric";
import type { PluginEvent } from "./types";

/**
 * Plugin
 *
 * The `Plugin` interface allows developers to compose custom
 * functionality for their `Metrics`
 *
 * ```typescript
 * class LoggerPlugin<T extends Metric> extends Plugin<T> {
 *   protected override start(metric: T) {
 *     console.log(metric.name, "Started!")
 *   }
 *
 *   protected override stop(metric: T) {
 *     console.log(metric.name, "Stopped!")
 *   }
 * }
 *
 *
 * const myMetric = new Metric("My Metric", {
 *   logger: new LoggerPlugin()
 * });
 * ```
 */
export class Plugin<T extends Metric<any, any> = Metric<any, any>> {
  private registered = false;

  /**
   * Register
   *
   * Binds a plugin to the provided Metric. Plugins are bound using the
   * Metric's underlying event emitter.
   */
  public register(metric: T) {
    if (this.registered) {
      console.warn(
        `${metric.name}: The plugin ${this.constructor.name} was registered more than once. Registering plugins is only necessary a single time`
      );
      return;
    }
    this.registered = true;
    const extension = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(extension);
    methods.forEach((event) => {
      if (this.validateEvent(event, metric)) {
        metric.on(event, this[event].bind(this));
      }
    });
  }

  /**
   * Validate Event
   *
   * Returns true if a constructor method on an extending class is
   * a valid event emitted by the underlying metric
   */
  private validateEvent(event: string, metric: T): event is PluginEvent {
    return event in metric.events && event !== "constructor";
  }

  /**
   * Start
   *
   * An event emitted each time the provided metric calls `start()`
   */
  protected start(metric: T) {}

  /**
   * Stop
   *
   * An event emitted each time the provided metric calls `stop()`
   */
  protected stop(metric: T) {}

  /**
   * Reset
   *
   * An event emitted each time the provided metric calls `reset()`
   */
  protected reset(metric: T) {}

  /**
   * Success
   *
   * An event emitted each time the provided metric calls `succeed()`
   */
  protected success(metric: T) {}

  /**
   * Failure
   *
   * An event emitted each time the provided metric calls `fail()`
   */
  protected failure(metric: T) {}

  /**
   * To JSON
   *
   * Modifies the return value of the `Plugin` interface when passed
   * to `JSON.stringify`
   */
  protected toJSON() {
    return {};
  }
}

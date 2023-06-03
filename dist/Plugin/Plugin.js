"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = void 0;
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
 * const myMetric = new Metric("My Metric", { logger: LoggerPlugin });
 * ```
 */
class Plugin {
    constructor(metric) {
        this.registered = false;
        if (metric) {
            this.register(metric);
        }
    }
    /**
     * Register
     *
     * Binds a plugin to the provided Metric. Plugins are bound using the
     * Metric's underlying event emitter.
     */
    register(metric) {
        if (this.registered && Plugin.IS_DEV) {
            console.warn(`The plugin ${this.constructor.name} was registered on ${metric.name} more than once. Registering plugins is only necessary a single time`);
            return;
        }
        this.registered = true;
        const extension = Object.getPrototypeOf(this);
        const methods = Object.getOwnPropertyNames(extension);
        methods.forEach((event) => {
            if (this.validateEvent(event, metric)) {
                metric.on(event, this[event]);
            }
        });
    }
    /**
     * Validate Event
     *
     * Returns true if a constructor method on an extending class is
     * a valid event emitted by the underlying metric
     */
    validateEvent(event, metric) {
        return event in metric.events && event !== "constructor";
    }
    /**
     * Start
     *
     * An event emitted each time the provided metric calls `start()`
     */
    start(metric) { }
    /**
     * Stop
     *
     * An event emitted each time the provided metric calls `stop()`
     */
    stop(metric) { }
    /**
     * Reset
     *
     * An event emitted each time the provided metric calls `reset()`
     */
    reset(metric) { }
    /**
     * Success
     *
     * An event emitted each time the provided metric calls `succeed()`
     */
    success(metric) { }
    /**
     * Failure
     *
     * An event emitted each time the provided metric calls `fail()`
     */
    failure(metric) { }
}
exports.Plugin = Plugin;
Plugin.IS_DEV = ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.NODE_ENV) === "development";
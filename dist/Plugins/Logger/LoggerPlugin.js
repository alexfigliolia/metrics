"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerPlugin = void 0;
const Plugin_1 = require("../../Plugin/Plugin");
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
class LoggerPlugin extends Plugin_1.Plugin {
    /**
     * Start
     *
     * Logs the target Metric's `start` event
     */
    start(metric) {
        console.log("%c%s", "color: rgb(255, 111, 0); font-weight: bold", `${metric.name} - START`, metric);
    }
    /**
     * Stop
     *
     * Logs the target Metric's `stop` event
     */
    stop(metric) {
        console.log("%c%s", "color: rgb(29, 51, 255); font-weight: bold", `${metric.name} - STOP`, metric);
    }
    /**
     * Success
     *
     * Logs the target Metric's `success` event
     */
    success(metric) {
        console.log("%c%s", "color: #26ad65; font-weight: bold", `${metric.name} - SUCCESS`, metric);
    }
    /**
     * Failure
     *
     * Logs the target Metric's `failure` event
     */
    failure(metric) {
        console.log("%c%s", "color: rgb(255, 43, 43); font-weight: bold", `${metric.name} - FAILURE`, metric);
    }
    /**
     * Reset
     *
     * Logs the target Metric's `reset` event
     */
    reset(metric) {
        console.log("%c%s", "color: rgb(166, 166, 166); font-weight: bold", `${metric.name} - RESET`, metric);
    }
}
exports.LoggerPlugin = LoggerPlugin;

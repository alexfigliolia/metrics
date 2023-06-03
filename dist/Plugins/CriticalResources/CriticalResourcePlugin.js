"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticalResourcePlugin = void 0;
const Plugin_1 = require("../../Plugin/Plugin");
const Cache_1 = require("./Cache");
/**
 * Critical Resource Plugin
 *
 * A plugin designed to record Critical Path and cache attributes
 * for a given metric. This plugin accepts a list of file extensions
 * and returns the underlying weight of collective resources required
 * to serve the metric to the browser. The aforementioned resources
 * are then calculated against any cache-hits producing a cache-
 * rate percentage
 *
 * ```typescript
 * const metric = new Metric("My Metric", {
 *   resources: new CriticalResourcePlugin("js", "css")
 * });
 * ```
 */
class CriticalResourcePlugin extends Plugin_1.Plugin {
    constructor(extensions = ["js", "css"]) {
        super();
        this.cacheRate = 0;
        this.criticalSize = 0;
        this.browserSupport = CriticalResourcePlugin.browserSupport;
        /**
         * Iterate Resources
         *
         * Filters all loaded resources for those loaded within the
         * duration of the metric. Computes the total size (`criticalSize`)
         * and `cacheRate`
         */
        this.iterateResources = CriticalResourcePlugin.Cache.withCache((startTime, stopTime) => {
            if (!this.browserSupport) {
                return { cacheRate: 0, criticalSize: 0 };
            }
            let cachedSize = 0;
            let criticalSize = 0;
            const resources = performance.getEntriesByType("resource");
            for (const resource of resources) {
                const { name, fetchStart, responseEnd, transferSize, decodedBodySize } = resource;
                if (fetchStart < startTime || responseEnd > stopTime) {
                    continue;
                }
                if (!this.extensions.has(this.parseExtension(name))) {
                    continue;
                }
                criticalSize += decodedBodySize;
                if (transferSize === 0) {
                    cachedSize += decodedBodySize;
                }
            }
            return {
                criticalSize,
                cacheRate: (cachedSize / criticalSize) * 100,
            };
        });
        this.extensions = new Set(extensions);
    }
    /**
     * Reset
     *
     * Resets the Metric's `cacheRate` and `criticalSize` back
     * to zero
     */
    reset() {
        this.cacheRate = 0;
        this.criticalSize = 0;
    }
    /**
     * Stop
     *
     * Records the `criticalSize` and `cacheRate` of resources loaded
     * between the Metric's `start()` and `stop()` events
     */
    stop({ startTime, stopTime }) {
        const { cacheRate, criticalSize } = this.iterateResources(startTime, stopTime);
        this.cacheRate = cacheRate;
        this.criticalSize = criticalSize;
    }
    /**
     * Parse Extension
     *
     * Returns a file extension associated with a given resource
     */
    parseExtension(url) {
        var _a, _b, _c, _d;
        try {
            return ((_d = (_c = (_b = (_a = url === null || url === void 0 ? void 0 : url.split(/[#?]/)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.split(".")) === null || _c === void 0 ? void 0 : _c.pop()) === null || _d === void 0 ? void 0 : _d.trim()) || "";
        }
        catch (error) {
            return "";
        }
    }
}
exports.CriticalResourcePlugin = CriticalResourcePlugin;
CriticalResourcePlugin.Cache = new Cache_1.Cache();
CriticalResourcePlugin.browserSupport = "performance" in window;

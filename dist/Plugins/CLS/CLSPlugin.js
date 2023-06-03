"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLSPlugin = void 0;
const Plugin_1 = require("../../Plugin/Plugin");
/**
 * CLS Plugin
 *
 * A plugin for tracking layout shifts associated with a given metric.
 * By providing this plugin with a DOM selector, it'll track and record
 * the position of the element between `start()` and `stop()` calls. If
 * layout shifts are detected, they'll be available on the plugin instance
 *
 * ```typescript
 * const metric = new Metric("My Metric", {
 *   CLS: new CLSPlugin(".my-ui-element")
 * });
 * ```
 */
class CLSPlugin extends Plugin_1.Plugin {
    constructor(selector) {
        super();
        this.name = "";
        this.layoutShifts = [];
        this.initialLayout = CLSPlugin.DOMRect;
        this.selector = selector;
    }
    register(metric) {
        if (!this.registered) {
            this.name = metric.name;
        }
        super.register(metric);
    }
    /**
     * Start
     *
     * Records the target elements's `boundClientRect`
     */
    start() {
        const element = this.querySelector();
        if (element) {
            this.initialLayout = element.getBoundingClientRect();
        }
    }
    /**
     * Stop
     *
     * Records the target elements's `boundClientRect` and compares
     * it to the element's initial layout position
     */
    stop(metric) {
        this.inspect(metric.stopTime);
    }
    /**
     * Reset
     *
     * Resets all recorded layout positions and shifts
     */
    reset() {
        this.layoutShifts = [];
        this.initialLayout = CLSPlugin.DOMRect;
    }
    /**
     * Inspect
     *
     * Records the position of the target element and compares to the
     * element's initial position
     */
    inspect(time = performance.now()) {
        const element = this.querySelector();
        this.detectLayoutShift(element, time);
    }
    /**
     * Query Selector
     *
     * Queries the DOM for the provided selector and returns the result
     */
    querySelector() {
        const element = document.querySelector(this.selector);
        if (!element) {
            if (this.initialLayout === CLSPlugin.DOMRect) {
                console.warn(`CLS Plugin ${this.name}: A DOM element with the selector "${this.selector}" was not found`);
            }
            else {
                console.warn(`CLS Plugin ${this.name}: The element corresponding to the selector "${this.selector}" has been removed from the DOM`);
            }
        }
        return element;
    }
    /**
     * Detect Layout Shift
     *
     * Calls the target element's `boundingClientRect()` method and
     * compares each position to the element's initial layout position.
     * If a shift is detected, a shift object is pushed to the instance's
     * `layoutShifts` property
     */
    detectLayoutShift(element, time) {
        if (!element) {
            return;
        }
        let shifted = false;
        const nextLayout = element.getBoundingClientRect();
        const layoutShift = {};
        for (const key of CLSPlugin.measures) {
            const currentValue = nextLayout[key];
            const initialValue = this.initialLayout[key];
            if (currentValue !== initialValue) {
                shifted = true;
                layoutShift[key] = currentValue - initialValue;
            }
        }
        if (shifted) {
            this.layoutShifts.push({
                time,
                layoutShift,
            });
        }
    }
}
exports.CLSPlugin = CLSPlugin;
_a = CLSPlugin;
CLSPlugin.measures = [
    "x",
    "y",
    "top",
    "left",
    "right",
    "bottom",
    "width",
    "height",
];
/**
 * Initial Layout
 *
 * A zero'd out `DOMRect` object
 */
CLSPlugin.initialLayout = {
    x: 0,
    y: 0,
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    height: 0,
    width: 0,
};
/**
 * DOM Rect
 *
 * A zero'd out `DOMRect` object
 */
CLSPlugin.DOMRect = Object.assign(Object.assign({}, _a.initialLayout), { toJSON: () => _a.initialLayout });

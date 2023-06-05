import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";
import type { Layout, LayoutShift } from "./types";

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
export class CLSPlugin<
  T extends Metric<any, any> = Metric<any, any>
> extends Plugin<T> {
  private name = "";
  public selector: string;
  public layoutShifts: LayoutShift[] = [];
  public initialLayout: DOMRect = CLSPlugin.DOMRect;
  private static readonly measures = [
    "x",
    "y",
    "top",
    "left",
    "right",
    "bottom",
    "width",
    "height",
  ] as const;
  constructor(selector: string) {
    super();
    this.selector = selector;
  }

  public override register(metric: T) {
    this.name = metric.name;
    super.register(metric);
  }

  /**
   * Start
   *
   * Records the target elements's `boundClientRect`
   */
  protected override start() {
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
  protected override stop(metric: T) {
    this.inspect(metric.stopTime);
  }

  /**
   * Reset
   *
   * Resets all recorded layout positions and shifts
   */
  protected override reset() {
    this.layoutShifts = [];
    this.initialLayout = CLSPlugin.DOMRect;
  }

  /**
   * Inspect
   *
   * Records the position of the target element and compares to the
   * element's initial position
   */
  public inspect(time = performance.now()) {
    const element = this.querySelector();
    this.detectLayoutShift(element, time);
  }

  /**
   * Query Selector
   *
   * Queries the DOM for the provided selector and returns the result
   */
  private querySelector() {
    const element = document.querySelector(this.selector);
    if (!element) {
      if (this.initialLayout === CLSPlugin.DOMRect) {
        console.warn(
          `${this.name}: CLSPlugin error - A DOM element with the selector "${this.selector}" was not found`
        );
      } else {
        console.warn(
          `${this.name}: CLSPlugin error - The element corresponding to the selector "${this.selector}" has been removed from the DOM`
        );
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
  private detectLayoutShift(element: Element | null, time: number) {
    if (!element) {
      return;
    }
    let shifted = false;
    const nextLayout = element.getBoundingClientRect();
    const layoutShift: Partial<Layout> = {};
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

  /**
   * Initial Layout
   *
   * A zero'd out `DOMRect` object
   */
  private static readonly initialLayout = {
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
  private static readonly DOMRect: DOMRect = {
    ...this.initialLayout,
    toJSON: () => this.initialLayout,
  };

  /**
   * To JSON
   *
   * Modifies the return value of the `CLSPlugin` interface when passed
   * to `JSON.stringify`
   */
  public override toJSON() {
    return {
      selector: this.selector,
      layoutShifts: this.layoutShifts,
    };
  }
}

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
 *
 * metric.start() // records the initial layout position of ".my-ui-element"
 * metric.plugins.CLS.inspect() // records additional layout positions of ".my-ui-element"
 * metric.stop() // Records all layout shifts that occurred between the start and stop time
 * ```
 */
export class CLSPlugin<
  T extends Metric<any, any> = Metric<any, any>,
> extends Plugin<T> {
  private name = "";
  public selector: string;
  public layoutShifts: LayoutShift[] = [];
  private static readonly DOMRect = {
    x: 0,
    y: 0,
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    height: 0,
    width: 0,
  };
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
  public initialLayout: Layout = CLSPlugin.DOMRect;
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
   * Records the target elements's height, width and absolute
   * coordinates
   */
  protected override start() {
    const element = this.querySelector();
    if (element) {
      this.initialLayout = this.fromBody(element);
    }
  }

  /**
   * Stop
   *
   * Records the target elements's height, width and absolute
   * coordinates then compares them to the target's initial
   * layout position
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
   * Records the target elements's height, width and absolute
   * coordinates then compares them to the target's initial
   * layout position
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
          `${this.name}: CLSPlugin error - A DOM element with the selector "${this.selector}" was not found`,
        );
      } else {
        console.warn(
          `${this.name}: CLSPlugin error - The element corresponding to the selector "${this.selector}" has been removed from the DOM`,
        );
      }
    }
    return element;
  }

  /**
   * Detect Layout Shift
   *
   * Compares the current positions of the target element to its
   * initial layout position. When shifts are detected, entries
   * are added to the `layoutShifts` array containing shifted
   * layout properties and the number of pixels
   */
  private detectLayoutShift(element: Element | null, time: number) {
    if (!element) {
      return;
    }
    let shifted = false;
    const nextLayout = this.fromBody(element);
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
   * From Body
   *
   * Returns the coordinates of the target element relative
   * to the body
   */
  private fromBody(element: Element) {
    const position = element.getBoundingClientRect();
    const body = document.body.getBoundingClientRect();
    const layout = {} as Layout;
    for (const key of CLSPlugin.measures) {
      if (key === "height" || key === "width") {
        layout[key] = position[key];
      } else {
        layout[key] = position[key] - body[key];
      }
    }
    return layout;
  }

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

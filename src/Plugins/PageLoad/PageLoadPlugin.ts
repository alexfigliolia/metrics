import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";

/**
 * Page Load Plugin
 *
 * This plugin allows metrics to reference the browser's most
 * recent navigation when recording start times. Because the
 * browser's navigation takes place before an application
 * can completely bootstrap, Metrics on their own, cannot produce
 * the durations relative to the applications initial load. By
 * adding this plugin to a metric, it's `startTime` is set equal
 * to the browser's most recent navigation
 *
 * ```typescript
 * const metric = new Metric("My Metric", { pageLoad: PageLoadPlugin });
 * ```
 */
export class PageLoadPlugin<
  T extends Metric<any, any> = Metric<any, any>
> extends Plugin<T> {
  public static timing = 0;
  public transition = false;
  public initialLoad = false;
  public static enabled = false;
  public static transitionID = -1;
  private static compatible = window && window.history;
  constructor(metric?: T) {
    super(metric);
    if (Plugin.IS_DEV && !PageLoadPlugin.enabled) {
      console.warn(
        "Please enable the PageLoadPlugin by calling PageLoadPlugin.enable() before passing the PageLoadPlugin to your metrics. It is recommended to call PageLoadPlugin.enable() as early as possible in your application lifecycle"
      );
    }
  }

  /**
   * Start
   *
   * Sets the target Metric's `startTime` equal to the browser's
   * most recent navigation.
   */
  public override start(metric: T) {
    metric.startTime = PageLoadPlugin.timing;
  }

  /**
   * Reset
   *
   * Resets the `transition` and `initialLoad` properties of the
   * instance
   */
  public override reset() {
    this.transition = false;
    this.initialLoad = false;
  }

  /**
   * Enable
   *
   * Records a high-resolution timestamp each time `History.pushState()`
   * is called and caches it. These high-resolution timestamps are then
   * used by Metrics looking to record durations beginning with the
   * browser's most recent navigation
   */
  public static enable() {
    if (this.enabled) {
      return;
    }
    if (Plugin.IS_DEV && !PageLoadPlugin.compatible) {
      console.warn(
        "The current environment does not support the History API. Please provide a polyfill such as History.js so that your metrics are consistent in legacy browsers. If you're seeing this warning on the server, you can ignore it."
      );
      return;
    }
    const { pushState } = history;
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      this.setTiming();
      this.transitionID++;
      return pushState.apply(history, args);
    };
    window.addEventListener("popstate", () => {
      this.setTiming();
      this.transitionID++;
    });
  }

  /**
   * Set Timing
   *
   * Sets the plugin's `timing` property to a high-resolution timestamp
   */
  private static setTiming() {
    this.timing = performance.now();
  }
}

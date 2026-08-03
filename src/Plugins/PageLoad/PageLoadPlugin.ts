import { Plugin } from "Plugin/Plugin";
import type { Metric } from "Metrics/Metric";

import type { PageLoadJSON } from "./types";

/**
 * Page Load Plugin
 *
 * This plugin allows metrics to reference the browser's most
 * recent navigation when recording start times. Because the
 * browser's navigation takes place before an application
 * can completely bootstrap, Metrics on their own, cannot produce
 * the durations relative to the applications initial load. By
 * adding this plugin to a metric, its `startTime` is set equal
 * to the browser's most recent navigation
 *
 * ```typescript
 * const metric = new Metric("My Metric", {
 *   pageLoad: new PageLoadPlugin()
 * });
 * ```
 */
export class PageLoadPlugin<
  T extends Metric<any, any> = Metric<any, any>,
> extends Plugin<T> {
  private static timing = 0;
  private static enabled = false;
  public transition = false;
  public initialLoad = false;
  constructor() {
    super();
    PageLoadPlugin.enable();
  }

  /**
   * Start
   *
   * Sets the target Metric's `startTime` equal to the browser's
   * most recent navigation.
   */
  protected override start(metric: T) {
    metric.startTime = PageLoadPlugin.timing;
    this.transition = PageLoadPlugin.timing !== 0;
    this.initialLoad = !this.transition;
  }

  /**
   * Reset
   *
   * Resets the `transition` and `initialLoad` properties of the
   * instance
   */
  protected override reset() {
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
    this.enabled = true;
    const { pushState } = history;
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      this.setTiming();
      return pushState.apply(history, args);
    };
    window.addEventListener("popstate", () => {
      this.setTiming();
    });
  }

  /**
   * Set Timing
   *
   * Sets the plugin's `timing` property to a high-resolution timestamp
   */
  public static setTiming() {
    this.timing = performance.now();
  }

  /**
   * To JSON
   *
   * Modifies the return value of the `PageLoadPlugin` interface when passed
   * to `JSON.stringify`
   */
  public override toJSON() {
    const properties: PageLoadJSON = {
      transition: this.transition,
      initialLoad: this.initialLoad,
      lastNavigation: PageLoadPlugin.timing,
    };
    return properties;
  }
}

import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";
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
  T extends Metric<any, any> = Metric<any, any>
> extends Plugin<T> {
  public native = false;
  private static timing = 0;
  public transition = false;
  public initialLoad = false;
  public static historyEnabled = false;
  private static nativeCompatible =
    typeof window !== undefined && !!window.history;
  constructor(native = false) {
    super();
    this.native = native;
    if(native) {
      PageLoadPlugin.enable();
    }
  }

  public override register(metric: T) {
    if (!PageLoadPlugin.historyEnabled && this.native) {
      console.warn(
        `${metric.name}: PageLoadPlugin - Please enable the PageLoadPlugin by calling PageLoadPlugin.enable() before passing the plugin to your metrics. It is recommended to call PageLoadPlugin.enable() as early as possible in your application lifecycle`
      );
    }
    super.register(metric);
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
    if (this.historyEnabled || !PageLoadPlugin.nativeCompatible) {
      return;
    }
    this.historyEnabled = true;
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
    };
    if (this.native) {
      properties.historyAPI = true;
      properties.historyEnabled = PageLoadPlugin.historyEnabled;
      properties.browserSupport = PageLoadPlugin.nativeCompatible;
    }
    return properties;
  }
}

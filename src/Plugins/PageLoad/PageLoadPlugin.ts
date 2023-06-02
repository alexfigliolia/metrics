import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";

export class PageLoadPlugin<T extends Metric<any, any>> extends Plugin<T> {
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

  public override start(metric: T) {
    metric.startTime = PageLoadPlugin.timing;
  }

  public override reset() {
    this.transition = false;
    this.initialLoad = false;
  }

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

  private static setTiming() {
    this.timing = performance.now();
  }
}

import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";

export class PageLoadPlugin<T extends Metric<any, any>> extends Plugin<T> {
  public static timing = 0;
  public transition = false;
  public initialLoad = false;
  public static enabled = false;
  public static transitionID = -1;
  constructor(metric?: T) {
    super(metric);
    if (!PageLoadPlugin.enabled) {
      console.warn(
        "Please enable the PageLoadPlugin by calling PageLoadPlugin.enable() before passing the PageLoadPlugin to your metrics. It is recommended to call PageLoadPlugin.enable() as early as possible in your application lifecycle"
      );
    }
  }

  private static setTiming() {
    this.timing = performance.now();
  }

  public static enable() {
    if (this.enabled) {
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

  public override start(metric: T) {
    metric.startTime = PageLoadPlugin.timing;
  }

  public override reset() {
    this.transition = false;
    this.initialLoad = false;
  }
}

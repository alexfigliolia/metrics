import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";
import type { Layout, LayoutShift } from "./types";

export class CLSPlugin<T extends Metric<any, any>> extends Plugin<T> {
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
    if (!this.registered) {
      this.name = metric.name;
    }
    super.register(metric);
  }

  public override start() {
    const element = this.querySelector();
    if (element) {
      this.initialLayout = element.getBoundingClientRect();
    }
  }

  public override stop(metric: T) {
    const element = this.querySelector();
    if (element) {
      this.detectLayoutShift(element, metric.stopTime);
    }
  }

  public override reset() {
    this.layoutShifts = [];
    this.initialLayout = CLSPlugin.DOMRect;
  }

  public inspect(time = performance.now()) {
    const element = this.querySelector();
    this.detectLayoutShift(element, time);
  }

  private querySelector() {
    const element = document.querySelector(this.selector);
    if (!element && Plugin.IS_DEV) {
      if (this.initialLayout === CLSPlugin.DOMRect) {
        console.warn(
          `CLS Plugin ${this.name}: A DOM element with the selector "${this.selector}" was not found`
        );
      } else {
        console.warn(
          `CLS Plugin ${this.name}: The element corresponding to the selector "${this.selector}" has been removed from the DOM`
        );
      }
    }
    return element;
  }

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

  private static readonly DOMRect: DOMRect = {
    ...this.initialLayout,
    toJSON: () => this.initialLayout,
  };
}

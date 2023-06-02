import type { Metric } from "Metrics/Metric";

export class Plugin<T extends Metric<any, any> = Metric<any, any>> {
  protected registered = false;
  constructor(metric?: T) {
    if (metric) {
      this.register(metric);
    }
  }

  public register(metric: T) {
    if (this.registered && Plugin.IS_DEV) {
      console.warn(
        `The plugin ${this.constructor.name} was registered on ${metric.name} more than once. Registering plugins is only necessary a single time`
      );
      return;
    }
    this.registered = true;
    const extension = Object.getPrototypeOf(this);
    const methods = Object.getOwnPropertyNames(extension);
    methods.forEach((event) => {
      if (this.validateEvent(event, metric)) {
        metric.on(event, this[event]);
      }
    });
  }

  protected validateEvent(event: string, metric: T): event is keyof Plugin<T> {
    return event in metric.events && event !== "constructor";
  }

  public start(metric: T) {}

  public stop(metric: T) {}

  public reset(metric: T) {}

  public success(metric: T) {}

  public failure(metric: T) {}

  public static IS_DEV = process?.env?.NODE_ENV === "development";
}

import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";

export class CriticalResourcePlugin<
  T extends Metric<any, any>
> extends Plugin<T> {
  public cacheRate = 0;
  public criticalSize = 0;
  public extensions: Set<string>;
  public metricName = "critical-resources";
  constructor(extensions: string[] = ["js"]) {
    super();
    this.extensions = new Set(extensions);
  }

  public override reset() {
    this.cacheRate = 0;
    this.criticalSize = 0;
  }

  public override stop(metric: T) {
    this.iterateResources(metric.stopTime);
  }

  private iterateResources(stopTime: number) {
    if ("performance" in window) {
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      let cachedSize = 0;
      for (const resource of resources) {
        if (resource.responseEnd > stopTime) {
          continue;
        }
        if (!this.extensions.has(this.parseExtension(resource.name))) {
          continue;
        }
        const { decodedBodySize, transferSize } = resource;
        this.criticalSize += decodedBodySize;
        if (transferSize === 0) {
          cachedSize += decodedBodySize;
        }
      }
      this.cacheRate = (cachedSize / this.criticalSize) * 100;
    }
  }

  private parseExtension(url: string) {
    try {
      return url?.split(/[#?]/)?.[0]?.split(".")?.pop()?.trim() || "";
    } catch (error) {
      return "";
    }
  }
}

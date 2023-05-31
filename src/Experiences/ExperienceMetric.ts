import { AutoIncrementingID } from "@figliolia/event-emitter";
import { Metric } from "Metrics/Metric";
import type { IExperience } from "./types";
import { CoreEvents, Status } from "Metrics/types";
import type { MetricEvents, PluginTable } from "Metrics/types";

export class ExperienceMetric<
  E extends MetricEvents = MetricEvents,
  M extends Metric<any, any>[] = Metric<any, any>[],
  P extends PluginTable = PluginTable
> extends Metric<E, P> {
  public readonly metrics: M;
  private IDs = new AutoIncrementingID();
  private completedMetrics = new Set<string>();
  private reference: Record<string, string> = {};
  constructor({ name, metrics, plugins }: IExperience<M, P>) {
    super(name, plugins);
    this.metrics = metrics;
    this.indexMetrics();
    this.listenForStops();
    this.listenForStarts();
  }

  public override reset() {
    this.metrics.forEach((metric) => {
      metric.reset();
    });
    super.reset();
    this.completedMetrics.clear();
  }

  private indexMetrics() {
    this.metrics.forEach((metric) => {
      this.reference[metric.name] = this.IDs.get();
    });
  }

  private listenForStops() {
    this.metrics.forEach((metric) => {
      metric.on(CoreEvents.stop, (m) => {
        const ID = this.reference[m.name];
        if (!this.completedMetrics.has(ID)) {
          this.completedMetrics.add(ID);
          if (this.completedMetrics.size === this.metrics.length) {
            super.stop();
          }
        }
      });
    });
  }

  private listenForStarts() {
    this.metrics.forEach((metric) => {
      metric.on(CoreEvents.start, (m) => {
        if (this.status === Status.idol) {
          this.start(m.startTime);
        }
      });
    });
  }
}

import { Metric } from "Metrics/Metric";
import type { MetricEvents, PluginTable } from "Metrics/types";
import { InteractionMetric } from "Interactions/InteractionMetric";
import { ExperienceMetric } from "Experiences/ExperienceMetric";
import {
  ReporterPlugin,
  type ProcessingQueue,
  type WithReporter,
} from "Plugins/Reporter";
import type { PluginFactoryTable, ToPluginTable } from "./types";

export class MetricFactory<U extends PluginFactoryTable> {
  public readonly createReportedMetric;
  public readonly createReportedExperience;
  public readonly createReportedInteraction;
  constructor(Queue: ProcessingQueue, factories = {} as U) {
    this.createReportedMetric = this.reportedMetricFactory(Queue, factories);
    this.createReportedExperience = this.reportedExperienceFactory(
      Queue,
      factories
    );
    this.createReportedInteraction = this.reportedInteractionFactory(
      Queue,
      factories
    );
  }

  private reportedMetricFactory(Queue: ProcessingQueue, factories: U) {
    return <P extends PluginTable = PluginTable>(name: string, plugins: P) => {
      const injection = (plugins || {}) as WithReporter<P & ToPluginTable<U>>;
      injection.reporter = new ReporterPlugin(Queue);
      for (const key in factories) {
        // @ts-ignore
        injection[key] = new factories[key]();
      }
      return new Metric(name, injection);
    };
  }

  private reportedInteractionFactory(Queue: ProcessingQueue, factories: U) {
    return <
      S extends Record<string, any> = Record<string, any>,
      F extends Record<string, any> = Record<string, any>,
      P extends PluginTable = PluginTable
    >(
      ...params: ConstructorParameters<typeof InteractionMetric<S, F, P>>
    ) => {
      const [name, plugins] = params;
      const injection = (plugins || {}) as WithReporter<P & ToPluginTable<U>>;
      injection.reporter = new ReporterPlugin(Queue);
      for (const key in factories) {
        // @ts-ignore
        injection[key] = new factories[key]();
      }
      return new InteractionMetric(name, injection);
    };
  }

  private reportedExperienceFactory(Queue: ProcessingQueue, factories: U) {
    return <
      E extends MetricEvents = MetricEvents,
      M extends Metric<any, any>[] = Metric<any, any>[],
      P extends PluginTable = PluginTable
    >(
      ...params: ConstructorParameters<typeof ExperienceMetric<E, M, P>>
    ) => {
      const [{ name, plugins, metrics }] = params;
      const injection = (plugins || {}) as WithReporter<P> & ToPluginTable<U>;
      injection.reporter = new ReporterPlugin(Queue);
      for (const key in factories) {
        // @ts-ignore
        injection[key] = new factories[key]();
      }
      return new ExperienceMetric({ name, metrics, plugins: injection });
    };
  }
}

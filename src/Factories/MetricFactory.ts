import { Metric } from "Metrics/Metric";
import type { MetricEvents, PluginTable } from "Metrics/types";
import { InteractionMetric } from "Interactions/InteractionMetric";
import { ExperienceMetric } from "Experiences/ExperienceMetric";
import { ReporterPlugin, type ProcessingQueue } from "Plugins/Reporter";
import type { PluginFactoryTable, ToPluginTable } from "./types";

/**
 * Metric Factory
 *
 * A factory for creating Metrics with a standardized plugin
 * configuration.
 *
 * ```typescript
 * const { ProcessingQueue, MetricFactory, LoggerPlugin } from "@figliolia/metrics";
 *
 * const Queue = new ProcessingQueue("/analytics");
 *
 * const Factory = new MetricFactory(Queue, {
 *   logger: LoggerPlugin,
 * });
 *
 * // Construct Metrics with default plugins (Logger and Reporter)
 * const MyMetric = Factory.createMetric("My Metric");
 * ```
 */
export class MetricFactory<U extends PluginFactoryTable> {
  public readonly createMetric;
  public readonly createExperience;
  public readonly createInteraction;
  constructor(factories: U, Queue?: ProcessingQueue) {
    this.createMetric = this.metricFactory(factories, Queue);
    this.createExperience = this.experienceFactory(factories, Queue);
    this.createInteraction = this.interactionFactory(factories, Queue);
  }

  private metricFactory(factories: U, Queue?: ProcessingQueue) {
    return <
      T extends MetricEvents = MetricEvents,
      P extends PluginTable = PluginTable
    >(
      ...params: ConstructorParameters<typeof Metric<T, P>>
    ) => {
      const [name, plugins] = params;
      return new Metric(
        name,
        this.initializePlugins(factories, plugins, Queue)
      );
    };
  }

  private interactionFactory(factories: U, Queue?: ProcessingQueue) {
    return <
      S extends Record<string, any> = Record<string, any>,
      F extends Record<string, any> = Record<string, any>,
      P extends PluginTable = PluginTable
    >(
      ...params: ConstructorParameters<typeof InteractionMetric<S, F, P>>
    ) => {
      const [name, plugins] = params;
      return new InteractionMetric(
        name,
        this.initializePlugins(factories, plugins, Queue)
      );
    };
  }

  private experienceFactory(factories: U, Queue?: ProcessingQueue) {
    return <
      E extends MetricEvents = MetricEvents,
      M extends Metric<any, any>[] = Metric<any, any>[],
      P extends PluginTable = PluginTable
    >(
      ...params: ConstructorParameters<typeof ExperienceMetric<E, M, P>>
    ) => {
      const [{ name, plugins, metrics }] = params;

      return new ExperienceMetric({
        name,
        metrics,
        plugins: this.initializePlugins(factories, plugins, Queue),
      });
    };
  }

  private initializePlugins<P extends PluginTable = PluginTable>(
    factories: U,
    plugins?: P,
    Queue?: ProcessingQueue
  ) {
    const injection = (plugins || {}) as ToPluginTable<U> & P;
    for (const key in factories) {
      const PluginProto = factories[key];
      // @ts-ignore
      if (PluginProto === ReporterPlugin) {
        if (!Queue) {
          throw new Error(
            "Please provide a `ProcessingQueue` to the `MetricFactory` when specifying the `ReporterPlugin`"
          );
        }
        // @ts-ignore
        injection[key] = new PluginProto(Queue);
      } else {
        // @ts-ignore
        injection[key] = new PluginProto();
      }
    }
    return injection;
  }
}

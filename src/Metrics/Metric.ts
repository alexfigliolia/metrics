import { EventEmitter } from "@figliolia/event-emitter";
import { CoreEvents, Status } from "./types";
import type { MetricEvents, PluginTable, RegisteredPlugins } from "./types";
import { Plugin } from "Plugin/Plugin";

export class Metric<
  T extends MetricEvents = MetricEvents,
  P extends PluginTable = PluginTable
> extends EventEmitter<T> {
  public name: string;
  public stopTime = 0;
  public startTime = 0;
  public status: Status = Status.idol;
  public readonly events = CoreEvents;
  public plugins = {} as RegisteredPlugins<P>;
  constructor(name: string, plugins = {} as P) {
    super();
    this.name = name;
    this.registerPlugins(plugins);
  }

  public start(time = performance.now()) {
    this.startTime = time;
    this.status = Status.inProgress;
    this.emit(CoreEvents.start, this);
  }

  public stop(time = performance.now()) {
    this.stopTime = time;
    this.status = Status.complete;
    this.emit(CoreEvents.stop, this);
  }

  public reset() {
    this.stopTime = 0;
    this.startTime = 0;
    this.status = Status.idol;
    this.emit(CoreEvents.reset, this);
  }

  private registerPlugins(plugins: P) {
    for (const [name, plugin] of Object.entries(plugins)) {
      let instance: Plugin;
      if (plugin instanceof Plugin) {
        instance = plugin;
        plugin.register(this);
      } else {
        instance = new Plugin(this);
      }
      // @ts-ignore
      this.plugins[name] = instance;
    }
  }
}

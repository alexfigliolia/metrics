import type { Plugin } from "./Plugin";

export type PluginEvent = "start" | "stop" | "success" | "failure" | "reset";

export type PluginExtension<
  T extends new (...args: any[]) => Plugin = new (...args: any[]) => Plugin,
> = new (...params: ConstructorParameters<T>) => InstanceType<T>;

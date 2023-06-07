import type { PluginExtension } from "Plugin/types";

export type PluginFactoryTable = Record<string, PluginExtension>;

export type ToPluginTable<T extends PluginFactoryTable> = {
  [key in Extract<keyof T, string>]: InstanceType<T[key]>;
};

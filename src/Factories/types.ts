import type { Plugin } from "Plugin/Plugin";

export type PluginFactoryTable = Record<string, typeof Plugin>;

export type ToPluginTable<T extends PluginFactoryTable> = {
  [key in Extract<keyof T, string>]: InstanceType<T[key]>;
};

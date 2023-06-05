import type { InteractionMetric } from "./InteractionMetric";

export enum ReliabilityEvents {
  success = "success",
  failure = "failure",
}

export interface InteractionEvents<
  S extends Record<string, any> = Record<string, any>,
  F extends Record<string, any> = Record<string, any>
> {
  success: InteractionMetric<S, F>;
  failure: InteractionMetric<S, F>;
}

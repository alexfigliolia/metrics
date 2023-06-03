import type { InteractionMetric } from "./InteractionMetric";
export declare enum ReliabilityEvents {
    success = "success",
    failure = "failure"
}
export interface InteractionEvents<S extends Record<string, any> = Record<string, any>, F extends Record<string, any> = Record<string, any>> {
    [ReliabilityEvents.success]: InteractionMetric<S, F>;
    [ReliabilityEvents.failure]: InteractionMetric<S, F>;
}

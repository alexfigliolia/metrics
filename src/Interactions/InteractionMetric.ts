import { Metric } from "Metrics/Metric";
import { ReliabilityEvents } from "./types";
import type { InteractionEvents } from "./types";
import { CoreEvents, Status } from "Metrics/types";
import type { MetricEvents, PluginTable } from "Metrics/types";

export class InteractionMetric<
  S extends Record<string, any> = Record<string, any>,
  F extends Record<string, any> = Record<string, any>,
  P extends PluginTable = PluginTable
> extends Metric<InteractionEvents<S, F> & MetricEvents, P> {
  public data?: S | F;
  public failed = false;
  public succeeded = false;
  public readonly events = { ...CoreEvents, ...ReliabilityEvents };

  public succeed(data?: S, stopTime: number = performance.now()) {
    this.data = data;
    this.failed = false;
    this.succeeded = true;
    this.stopTime = stopTime;
    this.status = Status.complete;
    this.emit(ReliabilityEvents.success, this);
  }

  public fail(data: F, stopTime = performance.now()) {
    this.data = data;
    this.failed = true;
    this.succeeded = false;
    this.stopTime = stopTime;
    this.status = Status.failed;
    this.emit(ReliabilityEvents.failure, this);
  }

  public override reset() {
    this.failed = false;
    this.data = undefined;
    this.succeeded = false;
    super.reset();
  }
}

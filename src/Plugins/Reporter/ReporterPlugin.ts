import type { Metric } from "Metrics/Metric";
import { Plugin } from "Plugin/Plugin";
import type { ProcessingQueue } from "./ProcessingQueue";

export class ReporterPlugin<
  T extends Metric<any, any> = Metric<any, any>,
  C extends Record<string, any> = Record<string, any>
> extends Plugin<T> {
  public processor: ProcessingQueue<T, C>;
  constructor(processor: ProcessingQueue<T, C>) {
    super();
    this.processor = processor;
  }

  public override stop(metric: T) {
    void this.processor.enqueue(metric);
  }

  public override success(metric: T) {
    void this.processor.enqueue(metric);
  }

  public override failure(metric: T) {
    void this.processor.enqueue(metric);
  }
}

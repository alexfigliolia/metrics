import { Beaconer } from "beaconer";
import type { JSONMetric, RequestFormatter } from "./types";
import type { Metric } from "Metrics/Metric";

/**
 * Processing Queue
 *
 * A scheduler for sending batches of metrics to a provided
 * destination
 *
 * ```typescript
 * import { ProcessingQueue } from "@figliolia/metrics";
 *
 * const Queue = new ProcessingQueue("https://my-analytics-service", metrics => {
 *   // optionally format outgoing data
 *   return JSON.stringify(metrics);
 * });
 * ```
 */
export class ProcessingQueue<T extends Metric<any, any> = Metric<any, any>> {
  public url: string;
  public queue: JSONMetric[] = [];
  public formatRequest: RequestFormatter;
  private scheduler: null | ReturnType<typeof setTimeout> = null;
  constructor(
    url: string,
    formatRequest: RequestFormatter = ProcessingQueue.defaultFormatter
  ) {
    this.url = url;
    this.formatRequest = formatRequest;
    this.listenForSessionEnd = this.listenForSessionEnd.bind(this);
  }

  /**
   * Enqueue
   *
   * Adds an item to the queue and schedules its request to the provided
   * destination
   */
  public enqueue(item: T) {
    this.queue.push(item.toJSON());
    return this.schedule();
  }

  /**
   * Beacon
   *
   * Sends a request with the currently enqueued items to the server.
   * Resets the queue.
   */
  private async beacon() {
    this.cancel();
    if (!this.queue.length) {
      return true;
    }
    const success = await Beaconer.send(
      this.url,
      this.formatRequest(this.queue)
    );
    this.queue = [];
    return success;
  }

  /**
   * Schedule
   *
   * Schedules a request to the provided destination containing the
   * currently enqueued items
   */
  private schedule() {
    this.cancel();
    return new Promise<boolean>((resolve) => {
      this.scheduler = setTimeout(() => {
        void this.beacon().then((v) => resolve(v));
      }, 1000);
      document.addEventListener("visibilitychange", this.listenForSessionEnd);
    });
  }

  /**
   * Cancel
   *
   * Cancels a currently scheduled request
   */
  private cancel() {
    if (this.scheduler) {
      clearTimeout(this.scheduler);
      this.scheduler = null;
      document.removeEventListener(
        "visibilitychange",
        this.listenForSessionEnd
      );
    }
  }

  /**
   * Listen For Session End
   *
   * If the document is ever moved to the background or closed, a request is
   * immediately sent to the provided destination containing the contents of
   * the queue
   */
  private listenForSessionEnd() {
    if (document.visibilityState === "hidden") {
      void this.beacon();
    }
  }

  /**
   * Default Formatter
   *
   * Returns a stringified queue
   */
  private static defaultFormatter(items: any[]) {
    return JSON.stringify(items);
  }
}

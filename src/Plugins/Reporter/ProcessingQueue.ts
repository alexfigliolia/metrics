import type { Metric } from "Metrics/Metric";
import { Beaconer } from "beaconer";
import { AutoIncrementingID } from "@figliolia/event-emitter";

import type { RequestFormatter } from "./types";

/**
 * Processing Queue
 *
 * A scheduler for sending batches of metrics to a specified endpoint
 *
 * ```typescript
 * import { ProcessingQueue } from "@ui-perf/metrics";
 *
 * const Queue = new ProcessingQueue("https://my-analytics-service", metrics => {
 *   // optionally format outgoing data
 *   return JSON.stringify(metrics);
 * });
 * ```
 */
export class ProcessingQueue<T extends Metric<any, any> = Metric<any, any>> {
  public readonly queue = new Map<string, T>();
  private readonly IDs = new AutoIncrementingID();
  private scheduler: null | ReturnType<typeof setTimeout> = null;
  constructor(
    public readonly url: string,
    public readonly formatRequest: RequestFormatter = ProcessingQueue.defaultFormatter,
  ) {}

  /**
   * Enqueue
   *
   * Adds an item to the queue and schedules a request to the provided
   * destination
   */
  public enqueue(item: T) {
    this.queue.set(this.IDs.get(), item);
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
    if (!this.queue.size) {
      return true;
    }
    const queuedItems: T[] = [];
    for (const [ID, metric] of this.queue) {
      if (!metric.hasPendingTasks) {
        queuedItems.push(metric);
        this.queue.delete(ID);
      }
    }
    if (this.queue.size && !this.scheduler) {
      void this.schedule();
    }
    if (queuedItems.length) {
      const success = await Beaconer.send(
        this.url,
        this.formatRequest(queuedItems.map(m => m.toJSON())),
      );
      if (!success) {
        for (const metric of queuedItems) {
          this.queue.set(this.IDs.get(), metric);
        }
      }
      return success;
    }
    return true;
  }

  /**
   * Schedule
   *
   * Schedules a request to the provided endpoint containing the
   * currently enqueued items
   */
  private schedule() {
    this.cancel();
    return new Promise<boolean>(resolve => {
      this.scheduler = setTimeout(() => {
        void this.beacon().then(v => resolve(v));
      }, 1000);
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", this.listenForSessionEnd);
      }
    });
  }

  /**
   * Cancel
   *
   * Cancels a currently scheduled request
   */
  private cancel() {
    if (this.scheduler !== null) {
      clearTimeout(this.scheduler);
      this.scheduler = null;
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          this.listenForSessionEnd,
        );
      }
    }
  }

  /**
   * Listen For Session End
   *
   * If the document is ever moved to the background or is closed, a request is
   * immediately sent to the provided destination containing the contents of
   * the queue
   */
  private readonly listenForSessionEnd = () => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      void this.beacon();
    }
  };

  /**
   * Default Formatter
   *
   * Returns a stringified queue
   */
  private static readonly defaultFormatter = (items: any[]) => {
    return JSON.stringify(items);
  };
}

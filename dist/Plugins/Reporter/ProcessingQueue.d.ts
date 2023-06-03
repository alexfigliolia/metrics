import type { RequestFormatter } from "./types";
import type { Metric } from "../../Metrics/Metric";
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
export declare class ProcessingQueue<T extends Metric<any, any> = Metric<any, any>> {
    url: string;
    queue: T[];
    formatRequest: RequestFormatter<T>;
    private scheduler;
    constructor(url: string, formatRequest?: RequestFormatter<T>);
    /**
     * Enqueue
     *
     * Adds an item to the queue and schedules its request to the provided
     * destination
     */
    enqueue(item: T): Promise<boolean>;
    /**
     * Beacon
     *
     * Sends a request with the currently enqueued items to the server.
     * Resets the queue.
     */
    private beacon;
    /**
     * Schedule
     *
     * Schedules a request to the provided destination containing the
     * currently enqueued items
     */
    private schedule;
    /**
     * Cancel
     *
     * Cancels a currently scheduled request
     */
    private cancel;
    /**
     * Listen For Session End
     *
     * If the document is ever moved to the background or closed, a request is
     * immediately sent to the provided destination containing the contents of
     * the queue
     */
    private listenForSessionEnd;
    /**
     * Default Formatter
     *
     * Returns a stringified queue
     */
    private static defaultFormatter;
}

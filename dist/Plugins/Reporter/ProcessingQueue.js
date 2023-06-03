"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingQueue = void 0;
const beaconer_1 = require("beaconer");
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
class ProcessingQueue {
    constructor(url, formatRequest = ProcessingQueue.defaultFormatter) {
        this.queue = [];
        this.scheduler = null;
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
    enqueue(item) {
        this.queue.push(item);
        return this.schedule();
    }
    /**
     * Beacon
     *
     * Sends a request with the currently enqueued items to the server.
     * Resets the queue.
     */
    beacon() {
        return __awaiter(this, void 0, void 0, function* () {
            this.cancel();
            if (!this.queue.length) {
                return true;
            }
            const success = yield beaconer_1.Beaconer.send(this.url, this.formatRequest(this.queue));
            this.queue = [];
            return success;
        });
    }
    /**
     * Schedule
     *
     * Schedules a request to the provided destination containing the
     * currently enqueued items
     */
    schedule() {
        this.cancel();
        return new Promise((resolve) => {
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
    cancel() {
        if (this.scheduler) {
            clearTimeout(this.scheduler);
            this.scheduler = null;
            document.removeEventListener("visibilitychange", this.listenForSessionEnd);
        }
    }
    /**
     * Listen For Session End
     *
     * If the document is ever moved to the background or closed, a request is
     * immediately sent to the provided destination containing the contents of
     * the queue
     */
    listenForSessionEnd() {
        if (document.visibilityState === "hidden") {
            void this.beacon();
        }
    }
    /**
     * Default Formatter
     *
     * Returns a stringified queue
     */
    static defaultFormatter(items) {
        return JSON.stringify(items);
    }
}
exports.ProcessingQueue = ProcessingQueue;

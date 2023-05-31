import { Beaconer } from "beaconer";

export class ProcessingQueue<T, C extends Record<string, any>> {
  public url: string;
  public queue: T[] = [];
  public requestData: Record<string, any>;
  private scheduler: null | ReturnType<typeof setTimeout> = null;
  constructor(url: string, requestData: C) {
    this.url = url;
    this.requestData = requestData;
    this.listenForSessionEnd = this.listenForSessionEnd.bind(this);
  }

  public enqueue(item: T) {
    this.queue.push(item);
    return this.schedule();
  }

  private async beacon() {
    this.cancel();
    const success = await Beaconer.send(
      this.url,
      JSON.stringify({
        ...this.requestData,
        metrics: this.queue,
      })
    );
    this.queue = [];
    return success;
  }

  private schedule() {
    this.cancel();
    return new Promise<boolean>((resolve) => {
      this.scheduler = setTimeout(() => {
        void this.beacon().then((v) => resolve(v));
      }, 1000);
      document.addEventListener("visibilitychange", this.listenForSessionEnd);
    });
  }

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

  private listenForSessionEnd() {
    if (document.visibilityState === "hidden") {
      void this.beacon();
    }
  }
}

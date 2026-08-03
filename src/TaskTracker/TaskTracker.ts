export class TaskTracker {
  private pendingTasks = 0;

  public get hasPendingTasks() {
    return this.pendingTasks !== 0;
  }

  public register<F extends (...args: any[]) => any>(task: F) {
    return (...args: Parameters<F>) => {
      this.pendingTasks++;
      const result = task(...args);
      if (result instanceof Promise) {
        void this.unwrap(result);
      } else {
        this.pendingTasks--;
      }
      return result;
    };
  }

  public async await(pollInterval = 200) {
    while (this.pendingTasks !== 0) {
      await this.sleep(pollInterval);
    }
  }

  private sleep(time = 200) {
    return new Promise<void>(resolve => setTimeout(resolve, time));
  }

  private unwrap<T>(promise: Promise<T>) {
    return promise
      .then(() => {
        this.pendingTasks--;
      })
      .catch(e => {
        this.pendingTasks--;
        throw e;
      });
  }
}

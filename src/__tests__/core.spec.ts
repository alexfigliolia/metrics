import { describe, it, expect, vi } from "vitest";
import { ProcessingQueue, ReporterPlugin } from "Plugins/Reporter";
import type { JSONMetric } from "Plugins/Reporter";
import { Plugin } from "Plugin/Plugin";
import type { Metric } from "Metrics/Metric";
import type { PluginTable } from "Metrics/index";
import { MetricFactory } from "Factories/MetricFactory";

vi.mock("beaconer", () => ({
  Beaconer: {
    send: vi.fn().mockImplementation(() => true),
  },
}));

const metricsEnqueued = vi
  .fn()
  .mockImplementation((metrics: JSONMetric<PluginTable>[]) => {
    return JSON.stringify(metrics);
  });

const queue = new ProcessingQueue("", metricsEnqueued);

class TestPlugin1 extends Plugin {
  public data = "";
  public override stop(metric: Metric<any, any>) {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        metric.plugins.test.data = "hello";
        resolve();
      }, 1100);
    });
  }
}

class TestPlugin2 extends Plugin {
  public data = "";
  public override stop(metric: Metric<any, any>) {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        metric.plugins.test.data = "hello";
        resolve();
      }, 3000);
    });
  }
}

const factory1 = new MetricFactory(
  {
    test: TestPlugin1,
    reporter: ReporterPlugin,
  },
  queue,
);

const factory2 = new MetricFactory(
  {
    test: TestPlugin2,
    reporter: ReporterPlugin,
  },
  queue,
);

describe("Metric Lifecycle", () => {
  it("It processes outgoing metrics via a processing queue", async () => {
    vi.useFakeTimers().setTimerTickMode("nextTimerAsync");
    const metrics1 = [
      factory1.createMetric("metric 1"),
      factory1.createMetric("metric 2"),
      factory1.createMetric("metric 3"),
    ];
    const metrics2 = [
      factory2.createMetric("metric 4"),
      factory2.createMetric("metric 5"),
      factory2.createMetric("metric 6"),
    ];
    const all = [...metrics1, ...metrics2];
    all.forEach(m => {
      m.start();
      m.stop();
    });
    await Promise.all(metrics1.map(m => m.awaitPendingTasks(10)));
    metrics1.forEach(m => expect(m.plugins.test.data).toEqual("hello"));
    metrics2.forEach(m => expect(m.plugins.test.data).not.toEqual("hello"));
    vi.advanceTimersByTime(1000);
    expect(metricsEnqueued).toHaveBeenCalledWith(metrics1.map(m => m.toJSON()));
    await Promise.all(metrics2.map(m => m.awaitPendingTasks(10)));
    metrics2.forEach(m => expect(m.plugins.test.data).toEqual("hello"));
    expect(metricsEnqueued).toHaveBeenCalledWith(metrics2.map(m => m.toJSON()));
  });
});

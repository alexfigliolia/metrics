# Metrics

A frontend performance library for composing metrics from real user experiences.

## Background

In every heavily trafficked frontend application exists a means for monitoring user experience and customer success. This library is designed to allow developers to compose metrics based on the behaviors their of end users and the performance they experience.

## Getting Started

```bash
npm i -S @ui-perf/metrics
# or
yarn add @ui-perf/metrics
# or
pnpm add @ui-perf/metrics
```

1. [Metrics](#metrics)
2. [Interaction Metrics](#interaction-metrics)
3. [Experience Metrics](#experience-metrics)
4. [Plugins](#plugins)
5. [CLS Plugin](#cls-plugin)
6. [Critical Resource Plugin](#critical-resource-plugin)
7. [Performance Measure Plugin](#performance-measure-plugin)
8. [Building Your Own Plugins](#building-your-own-plugins)
9. [Metric Factory](#metric-factory)
10. [Demo Application](#demo-application)

## Metrics

This library's `Metric` API can time any experience pertinent to your end users. This can include render performance, resolution of API calls, or the duration required to complete a certain user action.

In it's most basic form, a metric an be instrumented as follows:

```typescript
import { Metric } from "@ui-perf/metrics";

const MyMetric = new Metric("Initial Render");

async function AppStartup() {
  // Start the metric at the beginning of a critical user flow
  MyMetric.start();
  const response = await fetch("/ui-data");
  const data = await response.json();
  await renderDataPopulatedUI(data);
  // Stop the metric once the user action is complete
  MyMetric.stop();
}

// Optionally, listen to and record events firing:
MyMetric.on("start" | "stop" | "reset", metric => {
  // Listen for events fired!
});
```

## Interaction Metrics

`InteractionMetrics` add reliability indicators to typical performance based `Metrics`. When using `InteractionMetrics`, you have the option to `fail` or `succeed` the metric based on the outcome of the interaction.

```typescript
import { InteractionMetric } from "@ui-perf/metrics";

const UserSignUpMetric = new InteractionMetric("Sign Up");

async function signUp(username: string, password: string) {
  // Start the metric when the user submits the signin form or begins
  // typing into one of the fields
  UserSignUpMetric.start();
  try {
    const response = await fetch({
      method: "POST",
      url: "/sign-up",
      data: JSON.stringify({ username, password }),
    });
    const userData = await response.json();
    await redirectUserToTheHomePage(userData);
    // Succeed the metric and append non-sensitive data to the metric
    UserSignUpMetric.succeed(userData);
  } catch (error: unknown) {
    // Fail the metric and append the error to the metric
    UserSignUpMetric.fail({ error });
  }
}

// Optionally, listen to and record events firing:
UserSignUpMetric.on("success" | "failure", metric => {
  // Listen for events fired!
});
```

## Experience Metrics

`ExperienceMetrics` are designed to allow developers to compose metrics from one or more sub-metrics. They are the "bigger picture" that surrounds multiple concurrent metrics running in unsion - such as multiple elements in a single page app resolving asynchronously.

The `ExperienceMetric` derives it's duration using the **earliest start-time** and the **latest stop-time** across all of its child-metrics.

```typescript
import { Metric, ExperienceMetric } from "@ui-perf/metrics";

// Metrics for HomeScreen components
export const HeaderMetric = new Metric("Header Render Performance");
export const FooterMetric = new Metric("Footer Render Performance");
export const DashboardMetric = new Metric("Dashboard Render Performance");

// Wrap each metric in the the ExperienceMetric
export const HomeScreenMetric = new ExperienceMetric({
  name: "Home Screen Performance",
  metrics: [HeaderMetric, FooterMetric, DashboardMetric],
});

// Post the metric to your analytics service on "stop"
HomeScreenMetric.on("stop", metric => {
  void fetch("/analytics", {
    method: "POST",
    body: JSON.stringify(metric),
  });
});
```

In the example above, the `HomeScreenMetric` will have a `startTime` equal to the _earliest_ `start()` and a `stopTime` equal to the _latest_ `stop()` out of each of the sub-metrics.

`ExperienceMetrics` can accept any combination of `Metrics`, `InteractionMetrics`, and even other `ExperienceMetrics`. If you'd like to have a metric recording not only render performance, but the success-rate of a certain interaction, compose your `ExperienceMetric` using a combination of `Metrics` and `InteractionMetrics`

## Plugins

Plugins are a developer API designed to enhance your metrics with any extra data or functionality your wish to add. This library comes out of the box with a few `Plugins` designed to assist with:

1. Sending your metrics to the backend service of your choosing (`ReporterPlugin`)
2. Tracking your metrics in relation to the most recent browser navigation (`PageLoadPlugin`)
3. Tracking cumulative layout shift for metrics associated with UI features (`CLSPlugin`)
4. Tracking the weight and cache-rates of critical resources required to deliver a feature or metric (`CriticalResourcePlugin`)
5. Setup and testing (`LoggerPlugin`)

Let's dive into each plugin, then build one of our own!

### Reporter Plugin

In a prior example, we subscribed to our `Metric`'s `stop` event in order to send our metrics to a backend server. Using the `ReporterPlugin`, we can actually handle all of our metric reporting without writing individual subscriptions on each metric:

```typescript
import { ReporterPlugin, ProcessingQueue } from "@ui-perf/metrics";

// This queue will batch requests to the destination specified
const Queue = new ProcessingQueue(
  "https://my-analytics-service.com",
  metrics => {
    /* 
    Format outgoing metrics in any way you wish
    and append any extra data to your request. The
    returned value will be passed directly to HTTP
    calls as the body parameter
  */
    return JSON.stringify(metrics);
  },
);
```

Now, let's pass our `ProcessingQueue` to our `Metrics` using the `ReporterPlugin`!

```typescript
import {
  Metric,
  InteractionMetric,
  ExperienceMetric,
  ReporterPlugin,
} from "@ui-perf/metrics";
import { Queue } from "./MyQueue";

const MyMetric = new Metric("My Metric", {
  reporter: new ReporterPlugin(Queue),
});

const MyInteraction = new MyInteraction("My Interaction", {
  reporter: new ReporterPlugin(Queue),
});

const MyExperience = new ExperienceMetric({
  name: "My Experience",
  metrics: [MyMetric, MyInteraction],
  plugins: { reporter: new ReporterPlugin(Queue) },
});
```

Each of the metrics above will now automatically push their results to the `Queue` when their `stop` events are called. The Queue will then make batched post requests to the specified endpoint containing each metric's results.

By default the `ProcessingQueue` will attempt to [Beacon](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API) the data and fallback and standard HTTP Requests.

The `ReporterPlugin` will also reliably push all metrics over the network if a browser session is terminated or moved into the background.

### Page Load Plugin

The `PageLoadPlugin` allows for measuring `Metric` durations using the latest browser navigation. This better occumodates for metrics measuring first paint, TTI, or render times typically relative to browser navigations.

```typescript
import { Metric, PageLoadPlugin } from "@ui-perf/metrics";

const ProfilePageMetric = new Metric("Profile Page", {
  pageLoad: new PageLoadPlugin(),
});
```

When calling `ProfilePageMetric.start()`, the `Metric`'s `startTime` is set to the time of the last navigation. The duration of the `Metric` is equal to the time between the last navigation and when `ProfilePageMetric.stop()` is called.

### CLS Plugin

Cumulative Layout Shift is a visual stability metric designed to measure the propensity for elements on the page to suddenly change positions. CLS occurs most commonly between a page's first-paint and subsequent paints where data begins populating the page. A common strategy for minimizing CLS is to render data-populated pages on the server - however, some UI features require the client to fully function.

This plugin allows for tracking the layout position of a UI element between a Metric's `start()` and `stop()` calls. On `start()` the plugin will capture the target element's absolute position. On `stop()`, the current position will be compared the position previously captured. Any differences in layout will be recorded and attached to the metric.

```tsx
import { useState, useEffect, useId } from "react";
import { Metric, CLSPlugin } from "@ui-perf/metrics";

function UserAvatar({ userID }) {
  const nodeID = useId();

  const metricRef = useRef(
    new Metric("Avatar", {
      CLS: new CLSPlugin(`#${nodeID}`), // any dom selector
    }),
  );

  const [user, setUser] = useState(null);

  useEffect(() => {
    const metric = metricRef.current;
    // Start the metric on mount (this will capture the target
    // element's initial layout)
    metric.start();
    fetch(`/user/${userID}`)
      .then(response => response.json())
      .then(setUser);

    // Reset the metric on unmount or change to userID
    return () => metric.reset();
  }, [userID]);

  useEffect(() => {
    if (user) {
      // stop the metric once the user data has resolved (this
      // will capture the element's layout a second time and
      // compare it)
      metric.stop();
    }
  }, [user]);

  return (
    <div id={nodeID} className="user-avatar">
      {!user ? (
        <Loading />
      ) : (
        <>
          <img src={user.url} />
          <span>{user.name}</span>
        </>
      )}
    </div>
  );
}
```

The Metric found in the example above might look something like this when `stop()` is called:

```typescript
const result = {
  name: "Avatar",
  startTime: 1000,
  stopTime: 1200,
  duration: 200,
  status: "complete",
  plugins: {
    CLS: {
      selector: "#yourNodeID",
      // The Avatar's initial boundingClientRect
      initialLayout: {
        x: 800,
        y: 200,
        top: 200,
        right: 800,
        left: 200,
        bottom: 163,
        height: 50,
        width: 50,
      },
      // A list of layout shifts that took place on Avatar between
      // metric.start() and metric.stop()
      layoutShifts: [
        {
          time: 1200,
          layoutShift: {
            width: 65,
            // a 65 pixel difference on the node's width was
            // detected at the 1200 millisecond mark
          },
        },
      ],
    },
  },
};
```

When using the plugin, you can inspect your target element for CLS any number of times between calls to `Metric.start()` and `Metric.stop()`. To do so invoke the `CLSPlugin.inspect()`

```typescript
const AvatarMetric = new Metric("Avatar", {
  CLS: new CLSPlugin("#userAvatar"),
});

AvatarMetric.plugins.CLS.inspect();
// The `inspect()` method will calculate the elements current
// position and create an entry in the `layoutShifts` array
// if a shift is detected
```

### Critical Resource Plugin

This plugin is designed to track the resources contributing to a feature's [Critical Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path). The plugin will calculate the total weight of JavaScript and CSS required to deliver your feature to the browser as well as the cache-rate of those resources. By default, all `JavaScript` and `CSS` resources served to the browser will be accounted for, but developers may opt in to tracking any file extensions they wish.

Let's dive into an example using our `ExperienceMetric` from a previous example:

```typescript
import {
  Metric,
  PageLoadPlugin,
  CriticalResourcePlugin,
} from "@ui-perf/metrics";

// Home Screen sub-metrics
export const HeaderMetric = new Metric("Header Performance");
export const FooterMetric = new Metric("Footer Performance");
export const DashboardMetric = new Metric("Dashboard Performancea");

// Home Screen Experience
export const HomeScreenMetric = new ExperienceMetric({
  name: "Home Screen",
  metrics: [HeaderMetric, FooterMetric, DashboardMetric],
  plugins: {
    // Let's enable the `PageLoadPlugin` to track durations relative
    // to the browser's most recent navigation
    pageLoad: new PageLoadPlugin(),
    // Let's add our `CriticalResourcePlugin` to track Critical
    // Path and cache rate for JavaScript, CSS, and SVG's
    resources: new CriticalResourcePlugin(["js", "css", "svg"]),
  },
});
```

At `stop()`, the `HomeScreenMetric's` Critical Resource data will look like the following:

```typescript
HomeScreenMetric.on("stop", metric => {
  /*
    HomeScreenMetric {
      "name": "Home Screen",
      "startTime": 0,
      "stopTime": 2500,
      "duration": 2500,
      "status": "complete",
      "metrics": [HeaderMetric, FooterMetric, DashboardMetric],
      "plugins": {
        // The resource-weight and cache reate of your Home Screen
        "resources": {
          "criticalSize": 200000 // (bytes),
          "cacheRate": 75 // (perceent),
          "extensions": ["js", "css", "svg"]
        }
      }
    }
  */
});
```

### Performance Measure Plugin

This plugin allows developers to access their metrics using the native Performance API. When the `PerformanceMeasurePlugin` is enabled, your `Metric` will create a `performance.measure()` each time its `stop()` event is reached:

```typescript
import { Metric, PerformanceMeasurePlugin } from "@ui-perf/metrics";

const MyMetric = new Metric("My Metric", {
  measure: new PerformanceMeasurePlugin(),
});

MyMetric.start();
MyMetric.stop();
const nativeMetric = performance.getEntriesByName("My Metric");
/*
  [{
    name: "My Metric",
    start: 123,
    end: 124,
    duration: 1
  }]
*/
```

### Building Your Own Plugins

To build your own plugin, import the `Plugin` class and extend it:

```typescript
import { Plugin, Metric } from "@ui-perf/metrics";

export class MyLogger extends Plugin {
  // To tap into a Metric's lifecycle, simply override one of its
  // corresponding methods:
  protected override start(metric: Metric) {
    // run some code on a metric's start
    console.log(metric.name, "Started!");
  }

  protected override stop(metric: Metric) {
    // run some code on a metric's stop
    console.log(metric.name, "Stopped!");
  }

  protected override reset(metric: Metric) {
    // run some code on a metric's reset
    console.log(metric.name, "Reset!");
  }

  // Add any public facing API you wish
  public myAttribute = true;
  public method() {
    console.log("Called my method!");
  }
}

// Add your plugin to a metric
const MyMetric = new Metric("My Metric", {
  logger: new MyLogger(),
});

// Run publicly exposed methods
MyMetric.plugins.logger.method();
// Access the current state of your plugin
MyMetric.plugins.logger.myAttribute = true;
```

### Profiling Example

Let's build a plugin for staging/testing environments that can be helpful in catching performance regressions before they reach production.

```typescript
import { Plugin, Metric } from "@ui-perf/metrics";

export class ProfilerPlugin extends Plugin {
  private static readonly enabled = import.meta.env.PROD;
  constructor(public threshold: number) {}

  protected override stop(metric) {
    if (ProfilerPlugin.enabled && metric.duration > this.threshold) {
      console.warn(
        `${metric.name} exceeded the threshold of ${this.threshold} milliseconds.`,
      );
    }
  }
}

export const MyMetric = new Metric("My Metric", {
  profiler: new ProfilerPlugin(1000),
});
```

Using our new plugin, `MyMetric` will log a warning to the console each time its duration exceeds `1000ms`.

## Simplifying Metric Creation

Adding the same set of plugins to every metric in your codebase can be cumbersome to maintain. To make scaffold plugins with a predefined set of plugins, this library comes with the `MetricFactory`.

### Metric Factory

In the following example we'll assume that a resonable number of metrics are going to want to use the `ReporterPlugin` to post their results to an analytics server.

We'll also assume that during development we don't want our metrics posting data to servers. Here's a quick `MetricFactory` recipe for accomplishing that:

```typescript
import {
  MetricFactory,
  LoggerPlugin,
  ReporterPlugin,
  ProcessingQueue,
} from "@ui-perf/metrics";

let Queue: ProcessingQueue | undefined;

const Plugins = {
  // Specify any Plugins you wish
  logger: LoggerPlugin,
  reporter: ReporterPlugin,
} as const;

if (import.meta.env.PROD) {
  // Remove logging in production
  delete Plugins.logger;
  // initialize the ProcessingQueue to report metrics
  // to your server
  Queue = new ProcessingQueue("/analytics");
} else {
  // Remove reporting during development and testing
  delete Plugins.reporter;
}

export const Factory = new MetricFactory(Plugins, Queue);

const MyMetric = Factory.createMetric("My Metric");

const MyInteraction = Factory.createInteraction("My Interaction");

const MyExperience = Factory.createExperience({
  name: "My Experience",
  metrics: [MyMetric, MyInteraction],
});

// In production, each metric will have the `ReporterPlugin` enabled
// During development and testing, each metric will have the
// LoggerPlugin enabled
```

### Demo Application

To find some recipes in an example application, please reference our [Demo App](https://github.com/alexfigliolia/metrics-demo)

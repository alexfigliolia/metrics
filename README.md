# Metrics
A frontend performance library for composing metrics from real user experiences.

## Background
In every heavily trafficked frontend application exists a means for monitoring user experience and customer success. This library is designed to allow developers to compose metrics based on the behaviors their of end users and the performance they experience.

## Getting Started
```bash
npm i -S @figliolia/metrics
# or
yarn add @figliolia/metrics
```
## Basic Usage

### Instrumenting Metrics
Metrics can wrap any experience pertinent to your end users. This can include user-onboarding, core features initializing, UI rendering with resolved API data, and more. Tracking these metrics in production environments will help assess real customer performance, catch regressions and bugs, and assist in identifying pain points within your application.
```typescript
import { Metric } from "@figliolia/metrics";

const MyMetric = new Metric("Initial Render");

MyMetric.on("start" | "stop" | "reset", metric => {
  // Listen for events fired!
});

async function fetchData(query: any) {
  MyMetric.start();
  const response = await fetch({
    url: "/data",
    data: JSON.stringify(query)
  });
  const data = await response.json();
  // format response data for your UI framework
  await renderUI(data);
  // Stop the metric once the UI renders with its data
  MyMetric.stop();
}
```
### Instrumenting Interactions
Interaction Metrics add reliability indicators to typical performance metrics. When using Interaction Metrics, you have the option to `fail` and `succeed` the metric based on the outcome of the interaction.
```typescript
import { InteractionMetric } from "@figliolia/metrics";

const SignUpMetric = new Metric("Sign Up");

SignUpMetric.on("success" | "failure", metric => {
  // Listen for events fired!
});

async function signUp(username: string, password: string) {
  SignUpMetric.start();
  try {
    const response = await fetch({
      url: "/sign-up",
      data: JSON.stringify({ username, password })
    });
    const data = await response.json();
    // Redirect the user to the Home Page
    await redirectToHome();
    // Succeed the metric
    SignUpMetric.succeed();
  } catch(error: unknown) {
    // Fail the metric
    SignUpMetric.fail({ error });
  }
}
```

## Metrics and Recipes
### Metrics
The `Metric` interface is designed for tracking all kinds of performance indicators. The `Metric` class operates as an event emitter, tracking start and stop times for a given user experience.

On top of tracking durations for various user-scenarios, your metrics can be subscribed to from anywhere in your application. This means you can execute any logic you wish that will be deferred entirely behind the successful execution of your `Metric`.

Let's look at a working example:
```typescript
import { Metric } from "@figliolia/metrics";

export const HomePagePerformance = new Metric("Home Page Interactive");

HomePagePerformance.on("stop", async (metric) => {
  // Let's post our Home Page interactivity metric to an analytics service!
  void fetch("/analytics", {
    method: "POST",
    body: JSON.stringify(metric)
  });
  // Let's preload a secondary experience once our Home Page
  // is fully interactive
  ExpensiveOffScreenComponent.preload();
});
```

Next up, let's implement the the metric above in our UI code:

I'm going to use React for spinning up some example UI, but the same principals can apply to any UI framework you wish
```tsx
import { useState, useEffect } from "react";
import { HomePagePerformance } from "./HomePageMetric";

export const HomePage = () => {
  const [state, setState] = useState<{ 
    username: string, 
    friends: string[]
  }>(undefined);

  useEffect(() => {
    // Let's start the metric immediately on mount!
    HomePagePerformance.start();
    fetch("/user-data").then(data => {
      setState(data);
      // Lets stop the metric once all data required
      // for interactivity has loaded successfully
      HomePagePerformance.stop();
    });
  }, []);

  if(!data) {
    return <Loader />
  }

  return (
    <section>
      <h1>{state.username}</h1>
      <ol> 
        {state.data.map(friend => <li>{friend}</li>)}
      </ol>
    </section>
  );
}
```
With less than 10 lines of code, we've implemented a metric that times the interactivity of our Home Screen, preloads secondary content, and sends the results to a backend server! 

But let's take this one step further. The metric above effectively records the duration of the `/user-data` request and the content rendering on the screen. Let's instead, allow the metric to begin recording as soon as the browser navigates to the `HomePage`.

To do this, we need to add two lines of code to our metric's declaration:
```typescript
// First let's import the PageLoadPlugin
import { Metric, PageLoadPlugin } from "@figliolia/metrics";

// Enable the plugin to record a timestamp on each 
// pushstate event
PageLoadPlugin.enable();

export const HomePagePerformance = new Metric("Home Page Interactive", {
  // Next, let's add the plugin to our Metric!
  pageLoad: new PageLoadPlugin(true) 
  // `True` indicates the usage of the browser's History API
});
```

Now our "Home Page Interactive" metric will record the time between the browser navigating to the Home Page and our data-populated UI rendering - giving us a real measurement of the page's interactivity.

### Interaction Metrics
These metrics combine the functionality of the core `Metric` interface with `success/failure` indicators. They're designed for tracking not only performance, but feature-reliability as well. 

Let's take a look at a working example:
```tsx
import { useState, type Dispatch, type SetStateAction } from "react";
import { InteractionMetric } from "@figliolia/metrics":

const SignUpMetric = new InteractionMetric("Sign Up Reliability");

export const SignUpUI = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onChange = (func: Dispatch<SetStateAction<string>>) => {
    return (e: KeyboardEvent<HTMLInputElement>) => {
      func(e.target.value);
    }
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Start the metric on submit
    SignUpMetric.start();
    try {
      await fetch("/sign-up", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      await redirectToHome();
      // Succeed the metric after successfully redirecting
      SignUpMetric.succeed();
    } catch(error) {
      // Fail the metric with an attached error
      SignUpMetric.fail({ error });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input 
        name="Email" 
        type="text" 
        value={email} 
        onChange={onChange(setEmail)} />
      <input 
        name="Password" 
        type="password" 
        value={password}
        onChange={onChange(setPassword)} />
    </form>
  );
}
```
When our form is submitted, our `SignUpMetric` is going to track the duration of our form submission as well as its rate of success and failure. Similar to our first example, we can subscribe to our metric's events and 
1. Post our metrics to a remote service 
2. Run reactionary logic to our Metric succeeding or failing

```typescript
import type { Metric } from "@figliolia/metrics";

const SignUpMetric = new InteractionMetric("Sign Up Reliability");

SignUpMetric.on("stop", async (metric) => {
  if(metric.succeeded) {
    redirectToHomeScreen();
  } else {
    showErrorModal();
  }
  await fetch("/analytics", {
    method: "POST",
    body: JSON.stringify(metric)
  });
});
```

### Experience Metrics
Experience Metrics are designed to allow developers to compose metrics from one or more sub metrics. 

The `ExperienceMetric` derives it's duration using the earliest start-time and the latest stop-time across all of its child-metrics. This metric is great for complex interfaces with numerous moving parts. Some strong use-cases for Experience Metrics are:
1. Complex interactions with several trackable sub-processes
2. UI routes with multiple core features delivered to the browser asynchronously

Let's create a working example:
```typescript
import { Metric, ExperienceMetric } from "@figliolia/metrics";

// Metrics for HomeScreen components
export const HeaderMetric = new Metric("Header Performance");

export const FooterMetric = new Metric("Footer Performance");

export const DashboardMetric = new Metric("Dashboard Performance");

// An Experience Metric for the HomeScreen
export const HomeScreenMetric = new ExperienceMetric({
  name: "Home Screen Performance", 
  metrics: [
    HeaderMetric,
    FooterMetric,
    DashboardMetric
  ]
});

// Post the metric to your analytics service on "stop"
HomeScreenMetric.on("stop", (metric) => {
  await fetch("/analytics", {
    method: "POST",
    body: JSON.stringify(metric)
  });
});
```
In the example above, the `HomeScreenMetric` will have a `startTime` equal to the *earliest* `start()` out of each of the sub-metrics. Similarly, the `HomeScreenMetric` will have a `stopTime` equal to the *last* `stop()` of each of the sub-metrics. The duration will be computed upon the `startTime` and `stopTime` to compose an overarching metric for the Home Screen.

`ExperienceMetrics` can accept any combination of `Metrics` and `InteractionMetrics`.

## Plugins
Plugins are a developer API designed to enhance your metrics with any extra data or functionality your wish to add. This library comes out of the box with a few `Plugins` designed to assist with:
1. Sending your metrics to the backend service of your choosing (`ReporterPlugin`)
2. Tracking your metrics in relation to the most recent browser navigation (`PageLoadPlugin`)
3. Tracking cumulative layout shift for metrics associated with UI features (`CLSPlugin`)
4. Tracking the total weight resources required to deliver a feature or metric (`CriticalResourcePlugin`)
5. Tracking the cache-rate of resources required to deliver a feature or metric (`CriticalResourcePlugin`)

Let's dive into each plugin, then build one of our own!

### Reporter Plugin
In several of the prior examples, we've subscribed to our `Metric`'s `stop` event in order to send our metrics to a backend server. Using the `ReporterPlugin`, we can actually handle all of our metric reporting without writing any individual subscriptions on each metric. 

```typescript
import { ReporterPlugin, ProcessingQueue } from "@figliolia/metrics";

// This queue will batch requests to the destination specified
const Queue = new ProcessingQueue("https://analytics-service.com", metrics => {
  /* 
    Format outgoing metrics in any way you wish
    and append any extra data to your request. The
    returned value will be passed directly to HTTP
    calls as the body parameter
  */
  return JSON.stringify(metrics)
});
```
Now, let's pass our `ProcessingQueue` to Metrics using the `ReporterPlugin`!

```typescript
import { 
  Metric,
  InteractionMetric, 
  ExperienceMetric, 
  ReporterPlugin 
} from "@figliolia/metrics";
import { Queue } from "./MyQueue";

const MyMetric = new Metric("My Metric", { 
  reporter: new ReporterPlugin(Queue)
});

const MyInteraction = new MyInteraction("My Interaction", {
  reporter: new ReporterPlugin(Queue)
});
 
const MyExperience = new ExperienceMetric({
  name: "My Experience",
  metrics: [MyMetric, MyInteraction],
  plugins: { reporter: new ReporterPlugin(Queue) },
});
```
Each of the metrics above will now add their results to the `ProcessingQueue` when their `stop` events are called. The Queue will then make batched post requests to the specified endpoint containing each metric's results.

The `ReporterPlugin` will also reliably send out all metrics in its `Queue` if a browser session is terminated or moved to the background unexpectedly.

### Page Load Plugin
The `PageLoadPlugin` allows for measuring `Metric` durations using the latest browser navigation. This allows for measuring the duration of a feature's first paint (or TTI) relative to moment your application reaches the browser or transitions between routes.

```typescript
import { Metric, PageLoadPlugin } from "@figliolia/metrics";

const ProfilePageMetric = new Metric("Profile Page", { 
  pageLoad: new PageLoadPlugin() 
});
```

When calling `ProfilePageMetric.start()`, the `Metric`'s `startTime` is set to the time of the last navigation. The duration of the `Metric` is equal to the time between the last navigation and when `ProfilePageMetric.stop()` is called.

### CLS Plugin
Cumulative Layout Shift is a visual stability metric designed to measure the propensity for elements on the page to suddenly change positions. CLS occurs most commonly between a page's first-paint and subsequent paints where data begins populating the page. A common strategy for minimizing CLS is to render data-hydrated pages on the server - however, some UI features require the client to fully function. For features such as these, this library provides the `CLSPlugin`. 

This plugin allows for tracking the layout position of a UI element between a Metric's `start()` and `stop()` calls. On `start()` the plugin will capture the target element's absolute position. On `stop()`, the absolute position will be captured again and compared to the prior position:
```tsx
import type { FC } from "react";
import { useState, useEffect } from "react";
import { Metric, CLSPlugin } from "@figliolia/metrics";

const UserAvatar: FC<{ userID: string }> = ({ userID }) => {
  const uniqueID = useRef(crypto.randomUUID());

  const metricRef = useRef(new Metric("Avatar", { 
    CLS: new CLSPlugin(`.user-avatar[data-id="${uniqueID.current}"]`) // any dom selector 
  }));

  const [user, setUser] = useState<{ 
    url: string, 
    name: string 
  }>(null);

  useEffect(() => {
    const metric = metricRef.current;
    metric.start();
    fetch(`/user/${userID}`).then((user) => {
      setUser(user);
      metric.stop();
    });
    return () => {
      metric.reset();
    }
  }, [userID])

  return (
    <div 
      className="user-avatar"
      data-id={uniqueID.current}>
      {
        !user ?
          <Loading />
        : (
          <>
            <img src={user.url} />
            <span>{user.name}</span>
          </>
        )
      }
    </div>
  );
}
```
The Metric found in the example above might look something like this when `stop()` is called:
```json
{
  "name": "Avatar",
  "startTime": 1000,
  "stopTime": 1200,
  "duration": 200,
  "status": "complete",
  "plugins": {
    "CLS": {
      "selector": "user-avatar[data-id='12345']",
      // The Avatar instance's bounding client rect
      "initialLayout": {
        "x": 800,
        "y": 200,
        "top": 200,
        "right": 800,
        "left": 200,
        "bottom": 163,
        "height": 50,
        "width": 50
      },
      // This Avatar instance shifted 65px to the right between 
      // the calls to Metric.start() and Metric.stop()
      "layoutShifts": [{
        "time": 1200,
        "layoutShift": {
          "right": 65,
          "width": 65
        }
      }]
    }
  }
}
```
There's one more cool feature found under-the-hood of the `CLSPlugin`. When using the plugin, you can record the position of an element any number of times between calls to `Metric.start()` and `Metric.stop()`. If you happen to have more rendering conditions than the example found above, you can run the following as many times as you wish:

```typescript
const AvatarMetric = new Metric("Avatar", { 
  CLS: new CLSPlugin(".user-avatar")
});

AvatarMetric.plugins.CLS.inspect();
// The `inspect()` method will calculate the elements current 
// position and create an entry in the `layoutShifts` array
// if a shift is detected!
```

### Critical Resource Plugin
This plugin is designed to track resources contributing to a feature's [Critical Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path). The plugin will calculate the total weight of JavaScript and CSS required to deliver your feature to the browser as well as the cache-rate of those resources. By default, all `JavaScript` and `CSS` resources served to the browser will be accounted for, but developers may opt in to tracking any file extensions they wish.

Let's dive into an example using our `ExperienceMetric` from a previous example:
```typescript
import { Metric, PageLoadPlugin, CriticalResourcePlugin } from "@figliolia/metrics";

// Enable using the browser's navigation as the startTime
PageLoadPlugin.enable();

// Home Screen sub-metrics
export const HeaderMetric = new Metric("Header TTI");

export const FooterMetric = new Metric("Footer TTI");

export const DashboardMetric = new Metric("Dashboard TTI");

// Home Screen Experience
export const HomeScreenMetric = new ExperienceMetric({
  name: "Home Screen", 
  metrics: [
    HeaderMetric,
    FooterMetric,
    DashboardMetric
  ],
  plugins: {
    // Let's enable the `PageLoadPlugin` to track durations from 
    // the browser's most recent navigation 
    pageLoad: new PageLoadPlugin(),
    // Let's add our `CriticalResourcePlugin` to track Critical 
    // Path and cache rate for JavaScript, CSS, and SVG's
    resources: new CriticalResourcePlugin(["js", "css", "svg"])
  }
});

HomeScreenMetric.on("stop", (metric) => {
  /*
    HomeScreenMetric {
      "name": "Home Screen",
      "startTime": 0,
      "stopTime": 2500,
      "duration": 2500,
      "status": "complete",
      "metrics": [HeaderMetric, FooterMetric, DashboardMetric],
      "plugins": {
        "resources": {
          "criticalSize": 200000 // (bytes),
          "cacheRate": 75 // (%),
          "extensions": ["js", ".css", ".svg"]
        }
      }
    }
  */
});
```

### Simplifying Metric Creation
In the past few examples, we've added plugins on an adhoc basis to the Metrics we create. Let's now look at creating Metrics with a default set of enabled plugins to save time and developer effort:
```typescript
import { 
  MetricFactory, 
  LoggerPlugin, 
  ReporterPlugin, 
  ProcessingQueue,
} from "@figliolia/metrics";

let Queue: ProcessingQueue | undefined;
const Plugins = {
  // Specify any Plugins you wish
  logger: LoggerPlugin,
  reporter: ReporterPlugin
}

if(process.env.NODE_ENV === "production") {
  // Remove logging in production
  delete Plugins.logger
  // initialize the ProcessingQueue to report metrics
  // to your server
  Queue = new ProcessingQueue("/analytics");
} else {
  // Remove reporting during development and testing
  delete Plugins.reporter
}

export const Factory = new MetricFactory(Plugins, Queue);
```
Next, let's create metrics using our `Factory`:

```typescript
import { Factory } from "./MyFactory";

const MyMetric = Factory.createMetric("My Metric");
const MyInteraction = Factory.createMetric("My Metric");
const MyExperience = Factory.createMetric({
  name: "My Metric",
  metrics: [MyMetric, MyInteraction]
});
// In production, each metric will have the `ReporterPlugin` enabled

// During development and testing, each metric will have the `LoggerPlugin` enabled
```
Creating factories can save time and effort when creating metrics. In a real world application we might have a `Metric` for each route we support - and each of these Metrics will likely need the `PageLoadPlugin`. To relieve the need to instantiate a `PageLoadPlugin` on each and every metric, we can create another `MetricFactory`.

```typescript
import { MetricFactory, PageLoadPlugin } from "@figliolia/metrics";

const RouteMetricFactory = new MetricFactory({
  pageLoad: PageLoadPlugin
});

// Metrics for each Route in our application
export const HomeMetric = RouteMetricFactory.createMetric("Home Page");
export const ContactPage = RouteMetricFactory.createMetric("Contact Page");
export const ProfileMetric = RouteMetricFactory.createMetric("Profile Page");
```
### Building Your Own Plugins
Now that we've gone through built-in plugins and applying them using Factories, let's talk about building plugins of our own. 

Plugins are designed to be a simple API for attaching functionality to your metrics. `Metrics` by default, emit events for `start`, `stop`, `reset`, and for `InteractionMetrics`, `success` and `failure`. Each of these events can be used to run customized logic through plugins:

```typescript
import { Plugin, Metric } from "@figliolia/metrics";

export class MyLogger extends Plugin {
  public myAttribute = true;
  // To subscribe to a Metric's events, simply override its
  // corresponding method:
  protected override start(metric: Metric) {
    console.log(metric.name, "Started!");
  }

  protected override stop(metric: Metric) {
    console.log(metric.name, "Stopped!");
  }

  protected override reset(metric: Metric) {
    console.log(metric.name, "Stopped!");
  }

  public method() {
    console.log("Called my method!")
  }
}

// Let's add this logging plugin to a Metric!
const MyMetric = new Metric("My Metric", { 
  logger: new MyLogger() 
});
// Run publicly exposed methods
MyMetric.plugins.logger.method();
// Access the current state of your plugin
MyMetric.plugins.logger.myAttribute = true;
```
Now, let's build something that may be helpful in catching performance regressions before they reach production.

Let's build a profiler for staging and development environments that log warnings when a Metric exceeds a certain threshold for duration:

```typescript
import { Plugin, Metric } from "@figliolia/metrics";

export class ProfilerPlugin extends Plugin {
  public threshold: number;
  private static enabled = process.env.NODE_ENV !== "production";
  constructor(threshold: number) {
    this.threshold = threshold;
  }

  protected override stop(metric) {
    if(ProfilerPlugin.enabled && metric.duration > this.threshold) {
      console.warn(
        `${metric.name} exceeded the threshold of ${this.threshold} milliseconds.`
      );
    }
  }
}

export const MyMetric = new Metric("My Metric", {
  profiler: new ProfilerPlugin(1000)
});
```
Using our new plugin, `MyMetric` will log a warning to the console each time its duration exceeds `1000ms`.
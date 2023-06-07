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
Metrics can wrap virtually any experience pertinent to your end users. This can include user-onboarding, a core feature initializing, a graph rendering data from your API, and more. Tracking these metrics in production environments will help prevent and catch performance regressions, bugs, and pain points within your application.
```typescript
import { Metric } from "@figliolia/metrics";

const GraphMetric = new Metric("Graph Rendering");

GraphMetric.on("start" | "stop" | "reset", metric => {
  // Listen for events fired!
});

async function fetchGraphData(query: any) {
  GraphMetric.start();
  const response = await fetch({
    url: "/graph-data",
    data: JSON.stringify(query)
  });
  const data = await response.json();
  // format response data for your visualization framework
  await renderGraph(data);
  // Stop the metric once the graph renders with its data
  GraphMetric.stop();
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
This library provides three core interfaces for composing metrics for customer experiences. 
### Metrics
The `Metric` interface is designed for tracking all kinds of performance indicators. The `Metric` class operates as an event emitter, tracking start and stop times for a given user experience.

On top of tracking durations for various user-scenarios, your metrics can be subscribed to from anywhere in your application. This means you can execute any logic you wish, deferred entirely behind the successful execution of your `Metric`.

Let's look at a working example:
```typescript
import { Metric } from "@figliolia/metrics";

export const HomePagePerformance = new Metric("Home Page Interactive");

HomePagePerformance.on("stop", async (metric) => {
  // Let's post our Home Page interactivity metric to an analytics service!
  await fetch("/analytics", {
    method: "POST",
    body: JSON.stringify(metric)
  });
  // Let's preload a secondary experience once our Home Page
  // is fully interactive
  preloadHomePageFooter();
});
```

Next up, let's implement the `HomePagePerformance` in our UI code:

I'm going to use React for spinning up some example UI, but the same principals can apply to any UI framework you wish
```tsx
import { useState, useEffect } from "react";
import { HomePagePerformance } from "./HomePagePerformance";

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

But let's take this one step further. The metric above effectively records the duration of the `/user-data` request and the content rendering. Let's instead, allow the metric to begin recording as soon as the browser navigates to the `HomePage`.

To do this, we need to add two lines of code to our metric:
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

And that's it! Now our "Home Page Interactive" metric will record the time between the browser navigating to the Home Page and our data-populated UI rendering.

### Interaction Metrics
Now that we've gone over a basic performance metric, lets take a quick dive into `InteractionMetric`'s. These metrics combine the functionality of the core `Metric` interface with `success/failure` indicators. They're designed for tracking not only performance, but feature-reliability as well. 

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

// Post the metric to your analytics service
HomeScreenMetric.on("stop", (metric) => {
  await fetch("/analytics", {
    method: "POST",
    body: JSON.stringify(metric)
  });
});
```
In this example, our `HomeScreenMetric` will have a `startTime` equal to the *earliest* `start()` of each of the sub-metrics. Similarly, the `HomeScreenMetric` will have a `stopTime` equal to the *last* `stop()` of the sub-metrics. The duration will be computed upon the `startTime` and `stopTime` to compose an overarching metric for the Home Screen.

`ExperienceMetrics` can accept any combination of `Metrics` and `InteractionMetrics`.

## Plugins
Plugins are designed to enhance your metrics with any any data you wish to have associated with a given `Metric`. This library comes out of the box with a few `Plugins` designed to assist with:
1. Sending your metrics to the backend service of your choosing (ReporterPlugin)
2. Tracking your metrics in relation to the most recent browser navigation (PageLoadPlugin)
3. Tracking cumulative layout shift for metrics associated with UI features (CLSPlugin)
4. Tracking the total weight resources required to deliver a feature or metric (CriticalResourcePlugin)
5. Tracking the cache-rate of resources required to deliver a feature or metric  (CriticalResourcePlugin)

Let's dive into each plugin, then build one of our own!

### Reporter Plugin
In several of the prior examples, we've subscribed to our `Metric`'s `stop` event in order to send our metrics to a backend server. Using the `ReporterPlugin`, we can actually handle all of our metric reporting without writing any individual subscriptions on each metric. 

```typescript
import { 
  ReporterPlugin, 
  ProcessingQueue,
} from "@figliolia/metrics";

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

// Next, let's create a function that'll attach our the 
// ReporterPlugin to each metric we create:
```
Lastly, let's pass our `Reporter` to some metrics!

```typescript
import { Metric, InteractionMetric, ExperienceMetric } from "@figliolia/metrics";
import { Reporter } from "./MetricReporter";

const MyMetric = new Metric("My Metric", { Reporter });

const MyInteraction = new MyInteraction("My Interaction", { Reporter });
 
const MyExperience = new ExperienceMetric({
  name: "My Experience",
  plugins: { Reporter },
  metrics: [MyMetric, MyInteraction],
});
```
Using our `Reporter`, each metric will now post their results to the service provided above. The `Reporter` also comes with a few optimizations over more standard HTTP Requests:
1. The `Reporter` will batch several metrics together into a single request whenever possible
2. The `Reporter` will send out all metrics in its `Queue` if a browser session is terminated or moved to the background
3. The `Reporter` will use the [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API) whenever possible 

### Page Load Plugin
The `PageLoadPlugin` allows for measuring `Metric` durations using the latest browser navigation. This allows for measuring the duration of a feature's first paint (or TTI) relative to moment your application reaches the browser. This is useful tracking the performance of route-level features that are core to your user-experience.

```typescript
import { Metric, PageLoadPlugin } from "@figliolia/metrics";

const ProfilePageMetric = new Metric("Profile Page", { 
  pageLoad: PageLoadPlugin 
});
```

When calling `ProfilePageMetric.start()`, the `Metric`'s `startTime` is set to the time of the last navigation. The duration of the `Metric` is equal to the time between the last navigation and when `ProfilePageMetric.stop()` is called.

### CLS Plugin
Cumulative Layout Shift is a visual stability metric designed to measure the propensity for elements on the page to suddenly change positions. CLS occurs most commonly between a page's first-paint and subsequent paints where data begins populating the page. A common strategy for minimizing CLS is to render data-hydrated pages on the server - however, some UI features require the client to fully function. For features such as these, this library provides the `CLSPlugin`. 

This plugin allows for tracking the layout position of a UI element between a Metric's `start()` and `stop()` calls. On `start()` the plugin will capture the target element's `boundingClientRect()`. On `stop()`, the `boundingClientRect()` will be captured again and compared to the prior position:
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

Let's dive into an example using our prior `ExperienceMetric` for our application's Home Page:
```typescript
import { Metric, PageLoadPlugin, CriticalResourcePlugin } from "@figliolia/metrics";

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
    // Let's enable the `PageLoadPlugin` to track durations from the browser's
    // most recent navigation 
    pageLoad: PageLoadPlugin,
    // Let's add our `CriticalResourcePlugin` to track Critical Path and
    // cache rate
   resources: new CriticalResourcePlugin(["js", ".css", ".svg", ".png"])
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
        // The total weight of tracked resources loaded before this metric's `stop()` event
        "criticalSize": 200000 (bytes),
        // The cache rate (%) of the tracked resources
        "cacheRate": 75,
        // The allowed extensions for tracked resources
        "extensions": ["js", ".css", ".svg", ".png"]
      }
    }
  }
 */
});
```

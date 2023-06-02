# Metrics
A frontend performance library for composing metrics from real user experiences.

## Background
In every heavily trafficked frontend application exists a means for monitoring user experience and customer success. However, the definitions of a quality UX and customer success can vary heavily from feature to feature, user to user, and application to application. This library is designed to allow developers to compose metrics based on the behaviors their of end users and the performance they experience.

## Getting Started
```bash
npm i -S @figliolia/metrics
# or
yarn add @figliolia/metrics
```

## Metrics and Recipes
This library provides three core interfaces for composing metrics for customer experiences. 
### Metrics
The `Metric` interface is designed for tracking all kinds of performance indicators. The `Metric` class operates as an event emitter, tracking start and stop times for a given user experience. `Metrics` can track experiences such as
1. The Time-to-Interactivity for a feature or page
2. Micro interactions such as the duration between the submission of a form and the user receiving an indication of success
3. The time to render individual features or components
4. Virtually any scenario that's core to your end users! 

On top of tracking durations for various user-scenarios, your metrics can be subscribed to from anywhere in your application! This means you can execute any logic you wish, deferred entirely behind the successful execution of your `Metric`.

Let's look at a working example:
```typescript
import { Metric } from "@figliolia/metrics";

export const HomePageMetric = new Metric("Home Page Interactive");

HomePageMetric.on("stop", async (metric) => {
  // Let's post our Home Page interactivity measure to an analytics service!
  await fetch("/analytics/home", {
    method: "POST",
    body: JSON.stringify(metric)
  });
  // Let's preload a secondary or off-screen experience once our Home Page
  // is fully interactive
  preloadHomePageFooter();
});
```

Next up, let's implement the `HomePageMetric` in our UI code:

I'm going to use React for spinning up some example UI, but the same principals can apply to any UI framework you wish
```tsx
import { useState, useEffect } from "react";
import { HomePageMetric } from "./HomePageMetric";

export const HomePage = () => {
  const [state, setState] = useState<{ 
    username: string, 
    friends: string[]
  }>(undefined);

  useEffect(() => {
    // Let's start the metric immediately on mount!
    HomePageMetric.start();
    fetch("/user-data").then(data => {
      setState(data);
      // Lets stop the metric once all data required
      // for interactivity has loaded successfully
      HomePageMetric.stop();
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
With about 5 lines of code, we've implemented a metric that times the interactivity of our Home Screen. But let's take this one step further. The metric above effectively records the duration of the `/user-data` request. Let's instead, allow the metric to begin recording as soon as the browser navigates to the `HomePage`.

To do this, we need to add one line of code to our metric:
```typescript
// First let's import the PageLoadPlugin
import { Metric, PageLoadPlugin } from "@figliolia/metrics";

// Let's enable it!
PageLoadPlugin.enable();

export const HomePageMetric = new Metric("Home Page Interactive", {
  // Let's add the plugin to our Metric!
  pageLoad: PageLoadPlugin
});
```

And that's it! Now our "Home Page Interactive" metric will record the time between the browser navigating to the Home Page and our data-populated UI rendering.

### Interaction Metrics
Now that we've gone over a basic performance metric, lets take a quick dive into `InteractionMetric`'s. These metrics combine the functionality of the core `Metric` interface with `success/failure` indicators. They're designed for tracking not only performance, but overall reliability! Let's take a look at a working example:
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

  const onSubmit = SignUpMetric.record(async (e: FormEvent<HTMLFormElement>) => {
    return fetch("/sign-up", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <input name="Email" type="text" value={email} onChange={onChange(setEmail)} />
      <input name="Password" type="password" value={password} onChange={onChange(setPassword)} />
    </form>
  );
}
```
In the above example we have a basic sign up form with our `onSubmit` function wrapped in a call to `SignUpMetric.record()`. When our form is submitted, our `SignUpMetric` is going to track the duration of our form submission as well as its reliability. Similar to our first example, we can subscribe to our metrics emissions and 
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
Experience Metrics are designed to allow developers to compose metrics from one or more sub metrics. The `ExperienceMetric` derives it's duration using the earliest start-time and the latest stop-time across all of its child-metrics. The `ExperienceMetric` is great for complex interfaces with numerous moving parts. Some strong use-cases for Experience Metrics are:
1. Complex interactions with several trackable sub-processes
2. UI routes with multiple core features delivered to the browser asynchronously

Let's create a working example:
```typescript
import { Metric, ExperienceMetric } from "@figliolia/metrics";
// HomeScreenMetrics.ts

export const HeaderMetric = new Metric("Header TTI");
export const FooterMetric = new Metric("Footer TTI");
export const DashboardMetric = new Metric("Dashboard TTI");
export const HomeScreenMetric = new ExperienceMetric({
  name: "Home Screen", 
  metrics: [
    HeaderMetric,
    FooterMetric,
    DashboardMetric
  ]
});

HomeScreenMetric.on("stop", (metric) => {
  await fetch("/analytics", {
    method: "POST",
    body: JSON.stringify(metric)
  });
});
```
Similar to the prior examples, our `HeaderMetric`, `FooterMetric`, and `DashboardMetric` will then be implemented in each of their corresponding features tracking the first fully interactive render of each component. Our `HomeScreenMetric` on the other hand, requires no implementation at all! Once each of its sub-metrics complete, it's `stop` event will fire - allowing you to run any reactionary logic you wish.

When composing `ExperienceMetric`'s, you may also provide them with an array of `InteractionMetric`'s - or even a mix of both `Metric`'s and `InteractionMetric`'s.

## Plugins
Plugins are designed to enhance your metrics with any proprietary data you wish to have associated with a given `Metric`. This library comes out of the box with `Plugins` designed to assist with:
1. Posting your metrics to the service of your choosing (ReporterPlugin)
2. Tracking your metrics in relation to the most recent browser navigation (PageLoadPlugin)
3. Tracking cumulative layout shift for metrics associated with UI features (CLSPlugin)
4. Tracking the total weight JavaScript required to deliver a feature or metric (CriticalResourcePlugin)
5. Tracking the browser's cache-rate of a feature or metric (CriticalResourcePlugin)

In this section, we'll implement metrics using each built-in plugin, then we'll build a plugin of our own.

### Reporter Plugin
In several of the prior examples, we've subscribed to our `Metric`'s `stop` event in order to send our data to a hypothetical server. Using the `ReporterPlugin`, we can actually handle all of our metric reporting without writing individual subscriptions to each metric. Instead, we can import this library's `ProcessingQueue` and configure it with our server location.

```typescript
// MetricReporter.ts
import { ReporterPlugin, ProcessingQueue } from "@figliolia/metrics";

// This queue will batch requests to the destination specified
const Queue = new ProcessingQueue("https://your-service.com/analytics", {
  /* 
    Any extra you wish to send to your server such as
    1. User Agent
    2. Locale
    3. Geographic region
    4. Tenant/Customer information
  */
});

// Next, let's create a `ReporterPlugin` instance that uses our Queue
export const Reporter = new ReporterPlugin(Queue);
```
Lastly, let's pass our `Reporter` to some metrics!

```typescript
import { Metric, InteractionMetric, ExperienceMetric } from "@figliolia/metrics";
import { Reporter } from "./MetricReporter";

const MyMetric = new Metric("My Metric", { Reporter });
const MyInteraction = new MyInteraction("My Interaction", { Reporter });
const MyExperience = new ExperienceMetric({
  name: "My Experience",
  metrics: [MyMetric, MyInteraction],
  plugins: { Reporter }
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

export const HeaderMetric = new Metric("Header TTI");
export const FooterMetric = new Metric("Footer TTI");
export const DashboardMetric = new Metric("Dashboard TTI");

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

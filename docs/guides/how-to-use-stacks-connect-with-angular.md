---
title: Angular Authenticator
---

In this tutorial, you'll learn how to work with Stacks Connect when using [Angular](https://angular.io/) as your framework of choice. It builds on what you've learnt in the [Authentication Overview](/build-apps/authentication).

:::note
This article presumes some familiarity with [Angular](https://angular.io/), as well as [Reactive Extensions (RxJS)](https://rxjs.dev/).
:::

### Prerequisites

We'll be using the [Angular CLI](https://cli.angular.io/) to scaffold the project, so make sure you've got the latest version installed. We're using version `10.2.0`.

```sh
npm install --global @angular/cli
```

## Step 1: Scaffold and run

Use the `ng new` command to scaffold a new project. We've named ours `ng-stacks-connect`.

```sh
ng new --minimal --inline-style --inline-template
```

You'll be asked to enter some preferences: whether your app with use routing, and whether you want to use a CSS preprocessor like SASS. For sake of this tutorial, we're keeping things simple. No routing. No preprocessing.

Inside the newly created `ng-stacks-connect` directory, let's boot up the development server which defaults to [localhost:4200](http://localhost:4200).

```sh
cd ng-stacks-connect
ng serve
```

## Step 2: Add Stacks connect

```sh
npm install --save @stacks/connect blockstack
```

:::info
We're also installing the `blockstack` package, as it's a [peer dependency](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies) of Stacks Connect
:::

## Step 3: Declare missing globals

Some dependencies of these packages were written for a Nodejs environment. In a browser environment, tools such as Webpack (v4) often abstract the polyfilling of Nodejs specific APIs. Using the Angular CLI, this must be done manually.

:::info
`Buffer`, for example, is a global class in a Nodejs environment. In the browser is it `undefined` so we must declare it to avoid runtime exceptions
:::

Add the following snippet to your `src/polyfills.ts`

```typescript
(window as any).global = window;
(window as any).process = {
  version: '',
  env: {},
};
global.Buffer = require('buffer').Buffer;
```

This does 3 things:

1. Declares `global` to `window`
2. Declares a global `Buffer` class
3. Declares a global `process` object

## Step 4: Authentication flow

Now everything's set up, we're ready to create our auth components

We can use the CLI's generator to scaffold components.

### Sign-in button

```sh
ng generate component
```

Enter the name: `stacks-sign-in-button`. You'll find the newly generated component in `src/app/stacks-sign-in-button/stacks-sign-in-button.component.ts`.

Here's our Sign In button component. Let's replace this example with the following code.

```typescript
import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-stacks-sign-in-button',
  template: ` <button (click)="onSignIn.emit()">Sign In</button> `,
})
export class StacksSignInButtonComponent {
  @Output() onSignIn = new EventEmitter();
}
```

### Connecting Stacks connect

Let's add this button to our `app-root` component (`app.component.ts`) and wire up the `(onSignIn)` event. Make sure to import `Subject` from `rxjs`.

```typescript
@Component({
  selector: 'app-root',
  template: `<app-stacks-sign-in-button
    (onSignIn)="stacksAuth$.next()"
  ></app-stacks-sign-in-button>`,
})
export class AppComponent {
  stacksAuth$ = new Subject<void>();
}
```

Here we're using an Rxjs `Subject` to represent a stream of sign in events. `stacksAuth$` will emit when we should trigger the sign in action.

### Authentication

First, describe the auth options we need to pass to Connect. [Learn more about `AuthOptions` here](/build-apps/authentication). Let's modify the default component to look like this:

```typescript
import { Component } from '@angular/core';
import { AuthOptions, FinishedData } from '@stacks/connect';
import { ReplaySubject, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <app-stacks-sign-in-button (onSignIn)="stacksAuth$.next()"></app-stacks-sign-in-button>
    <code>
      <pre>{{ authResponse$ | async | json }}</pre>
    </code>
  `,
})
export class AppComponent {
  stacksAuth$ = new Subject<void>();
  authResponse$ = new ReplaySubject<FinishedData>(1);

  authOptions: AuthOptions = {
    finished: response => this.authResponse$.next(response),
    appDetails: {
      name: 'Angular Stacks Connect Demo',
      icon: 'http://placekitten.com/g/100/100',
    },
  };

  ngOnInit() {
    this.stacksAuth$
      .pipe(switchMap(() => import('@stacks/connect')))
      .subscribe(connectLibrary => connectLibrary.showBlockstackConnect(this.authOptions));
  }
}
```

Let's run through what's going on. In the `authOptions` field, we're using the `finished` handler to emit a value to the `authResponse$` which uses a `ReplaySubject` to persist the latest response.

:::info
A [`ReplaySubject`](https://rxjs.dev/api/index/class/ReplaySubject) is an Observable that starts without an initial value, but replays the latest x emissions when subscribed to
:::

For initial load performance, we're using `import("@stacks/connect")` to only load the Stacks Connect library when it's needed. The `switchMap` operators "switches" out the `stacksAuth$` event for the library.

The output of `authResponse$` can be added to the template for debugging purposes. This uses Angular's `async` and `json` pipes.

### Loading text

One problem with the current implementation is that there's a network delay while waiting to load the Connect library. Let's keep track of the loading state and display some text in the sign in button component. You'll need to `import { tap, switchMap } from 'rxjs/operators';`.

```typescript
// src/app/app.component.ts
isLoadingConnect$ = new BehaviorSubject(false);

ngOnInit() {
  this.stacksAuth$
    .pipe(
      tap(() => this.isLoadingConnect$.next(true)),
      switchMap(() => import("@stacks/connect")),
      tap(() => this.isLoadingConnect$.next(false))
    )
    .subscribe(connectLibrary =>
      connectLibrary.showBlockstackConnect(this.authOptions)
    );
}
```

We can keep track of it with a [BehaviorSubject](https://rxjs.dev/api/index/class/BehaviorSubject), which always emits its initial value when subscribed to.

Let's add a `loading` input to the `StacksSignInButtonComponent` component.

```typescript highlight=3,6
@Component({
  selector: 'app-stacks-sign-in-button',
  template: `
    <button (click)="onSignIn.emit()">
      {{ loading ? 'Loading' : 'Sign in' }}
    </button>
  `,
})
export class StacksSignInButtonComponent {
  @Input() loading: boolean;
  @Output() onSignIn = new EventEmitter();
}
```

Then, pass the `isLoadingConnect$` Observable into the component, and hide it when the user has already authenticated.

```html
// Edit src/app/app.component.ts
<app-stacks-sign-in-button
  *ngIf="!(authResponse$ | async)"
  (onSignIn)="stacksAuth$.next()"
  [loading]="isLoadingConnect$ | async"
></app-stacks-sign-in-button>
```

### Next steps

This tutorial has shown you how to integrate Stacks Connect with an Angular application. You may want to consider abstracting the Stacks Connect logic behind an [Angular service](https://angular.io/guide/architecture-services), or using [Material Design](https://material.angular.io/) to theme your app.

# delegate-it [![][badge-gzip]][link-bundlephobia]

[badge-gzip]: https://img.shields.io/bundlephobia/minzip/delegate-it.svg?label=gzipped
[link-bundlephobia]: https://bundlephobia.com/result?p=delegate-it

> Lightweight event delegation

This is a fork of the popular but abandoned [`delegate`](https://github.com/zenorocha/delegate) with some improvements:

- modern: ES2022, TypeScript, Edge 16+ (it uses `WeakMap` and `Element.closest()`)
- idempotent: identical listeners aren't added multiple times, just like the native `addEventListener`
- debugged ([2d54c11](https://github.com/fregante/delegate-it/commit/2d54c1182aefd3ec9d8250fda76290971f5d7166), [c6bb88c](https://github.com/fregante/delegate-it/commit/c6bb88c2aa8097b25f22993a237cf09c96bcbfb8))
- supports [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

## Install

```
npm install delegate-it
```

```js
// This module is only offered as a ES Module
import delegate from 'delegate-it';
```

## Usage

### Add event delegation

```js
delegate('.btn', 'click', event => {
	console.log(event.delegateTarget); // The element matching '.btn' that was clicked
});
```

### Multiple selectors or event types

```js
// Listen to multiple selectors
delegate(['.btn', '.link'], 'click', event => {
	console.log(event.delegateTarget);
});

// Listen to multiple event types
delegate('.btn', ['click', 'keypress'], event => {
	console.log(event.delegateTarget);
});
```

### With listener options

```js
delegate('.btn', 'click', event => {
	console.log(event.delegateTarget);
}, {
	capture: true
});
```

### On a custom base

Use this option if you don't want to have a global listener attached on `html`, it improves performance:

```js
delegate('.btn', 'click', event => {
	console.log(event.delegateTarget);
}, {
	base: document.querySelector('main')
});
```

### Remove event delegation

```js
const controller = new AbortController();
delegate('.btn', 'click', event => {
	console.log(event.delegateTarget);
}, {
	signal: controller.signal,
});

controller.abort();
```

### Listen to one event only

```js
delegate('.btn', 'click', event => {
	console.log('This will only be called once');
}, {
	once: true
});
```

### Listen to one event only, with a promise

```js
import {oneEvent} from 'delegate-it';

const event = await oneEvent('.btn', 'click');
console.log(event.delegateTarget); // The element matching '.btn' that was clicked
```

## API

### `delegate(selector, type, callback, options?)`

Attaches a delegated event listener. The actual listener is added to the `base` element (defaults to `document.documentElement`) and the `callback` is only called when the event's target matches `selector`.

Unlike raw `addEventListener`, identical listeners (same `selector`, `type`, `callback`, and `capture` value) are not added multiple times.

#### `selector`

Type: `string | string[]`

A CSS selector string or array of CSS selector strings to match against. The `callback` is called when the event target (or one of its ancestors) matches the selector and is a descendant of `base`.

#### `type`

Type: `string | string[]`

The event type (e.g. `'click'`) or array of event types to listen for.

#### `callback`

Type: `(event: DelegateEvent) => void`

The function to call when the event is triggered. Receives a [`DelegateEvent`](#delegateevent) — a standard `Event` with an added `delegateTarget` property.

#### `options`

Type: [`DelegateOptions`](#delegateoptions)

Optional object extending [`AddEventListenerOptions`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options) with one extra field:

| Option | Type | Description |
|---|---|---|
| `base` | `EventTarget` | The element to attach the listener to. Defaults to `document.documentElement`. Use a specific element for better performance. |
| `capture` | `boolean` | Whether to use capture phase. Default: `false`. |
| `once` | `boolean` | If `true`, the listener is removed after its first invocation. |
| `signal` | `AbortSignal` | If provided, the listener is removed when the signal is aborted. |

---

### `oneEvent(selector, type, options?)`

Returns a `Promise` that resolves with the first matching `DelegateEvent`. Useful as an alternative to `delegate` with `{once: true}`.

If the signal is already aborted when `oneEvent` is called, or is aborted before the event fires, the promise resolves with `undefined`.

```js
import {oneEvent} from 'delegate-it';

const event = await oneEvent('.btn', 'click');
// event is a DelegateEvent, or undefined if the signal was aborted
```

#### `selector`

Type: `string | string[]`

A CSS selector string or array of CSS selector strings.

#### `type`

Type: `string`

The event type to listen for.

#### `options`

Type: [`DelegateOptions`](#delegateoptions)

Same as `delegate` options. Note that `once` is always `true` and is set automatically.

---

### `DelegateEvent`

A regular DOM [`Event`](https://developer.mozilla.org/en-US/docs/Web/API/Event) extended with one additional property:

#### `delegateTarget`

Type: `Element`

The element that matched the selector. This is different from `event.target`, which is the innermost element that was actually interacted with (e.g. a `<span>` inside a `<button>`), while `delegateTarget` is always the element matching the `selector` (e.g. the `<button>` itself).

```js
delegate('.btn', 'click', event => {
	event.target;         // e.g. <span> inside the button
	event.delegateTarget; // always the <button> matching '.btn'
});
```

---

### `DelegateOptions`

Type: `AddEventListenerOptions & {base?: EventTarget}`

The options object accepted by `delegate` and `oneEvent`. Extends the standard [`AddEventListenerOptions`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options) with an optional `base` property.

---

### `DelegateEventHandler<TEvent, TElement>`

The type of the callback passed to `delegate`. This is a function that receives a `DelegateEvent<TEvent, TElement>`.

---

### `EventType`

Type: `keyof GlobalEventHandlersEventMap`

A union of all known DOM event type strings (e.g. `'click'`, `'keydown'`, etc.). Can be extended via [declaration merging](#typescript).

## TypeScript

The type of `event.delegateTarget` is inferred from `selector` when possible, using [`typed-query-selector`](https://github.com/nicolo-ribaudo/typed-query-selector). For example, `delegate('button', 'click', ...)` will type `event.delegateTarget` as `HTMLButtonElement` automatically.

If you're using TypeScript and have event types that are custom, you can override the global `GlobalEventHandlersEventMap` interface via declaration merging. e.g. say you have a `types/globals.d.ts` file, you can add the following.

```ts
interface GlobalEventHandlersEventMap {
	'details:toggle': UIEvent;
}
```

In the file that imports `EventType`, you will now be able to set the event type to `'details:toggle'`.

```ts
import type {EventType} from 'delegate-it';

const someEventType1: EventType = 'details:toggle'; // all good
const someEventType2: EventType = 'click'; // all good
const someEventType3: EventType = 'some-invalid-event-type'; // no good
```

## Related

- [select-dom](https://github.com/fregante/select-dom) - Lightweight `querySelector`/`All` wrapper that outputs an Array.
- [doma](https://github.com/fregante/doma) - Parse an HTML string into `DocumentFragment` or one `Element`, in a few bytes.
- [Refined GitHub](https://github.com/sindresorhus/refined-github) - Uses this module.

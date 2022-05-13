# delegate-it [![][badge-gzip]][link-bundlephobia]

[badge-gzip]: https://img.shields.io/bundlephobia/minzip/delegate-it.svg?label=gzipped
[link-bundlephobia]: https://bundlephobia.com/result?p=delegate-it

> Lightweight event delegation

This is a fork of the popular [`delegate`](https://github.com/zenorocha/delegate) with some improvements:

- modern: ES6, TypeScript, Edge 15+ (it uses `WeakMap` and `Element.closest()`)
- idempotent: identical listeners aren't added multiple times, just like the native `addEventListener`
- debugged ([2d54c11](https://github.com/fregante/delegate-it/commit/2d54c1182aefd3ec9d8250fda76290971f5d7166), [c6bb88c](https://github.com/fregante/delegate-it/commit/c6bb88c2aa8097b25f22993a237cf09c96bcbfb8))

If you need IE support, you can keep using [`delegate`](https://github.com/zenorocha/delegate)

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

#### With an element as base

```js
delegate(document.body, '.btn', 'click', event => {
	console.log(event.delegateTarget);
});
```

#### With a selector (of existing elements) as base

```js
delegate('.container', '.btn', 'click', event => {
	console.log(event.delegateTarget);
});
```

#### With an array/array-like of elements as base

```js
delegate(document.querySelectorAll('.container'), '.btn', 'click', event => {
	console.log(event.delegateTarget);
});
```

#### With listener options

```js
delegate(document.body, '.btn', 'click', event => {
	console.log(event.delegateTarget);
}, true);

// Or equivalent:
delegate(document.body, '.btn', 'click', event => {
	console.log(event.delegateTarget);
}, {
	capture: true
});
```

**Note:** the `once` option is currently not supported.

### Remove event delegation

```js
const delegation = delegate(document.body, '.btn', 'click', event => {
	console.log(event.delegateTarget);
});

delegation.destroy();
```

### Custom event types in Typescript

If you're using TypeScript and have event types that are custom, you can override the global `GlobalEventHandlersEventMap` interface via declaration merging. e.g. say you have a `types/globals.d.ts` file, you can add the following.

```js
interface GlobalEventHandlersEventMap {
	'details:toggle': UIEvent;
}
```

In the file that imports `EventType`, you will now be able to set the event type to `'details:toggled'`.

```js
import {EventType} from 'delegate-it';

const someEventType1: EventType = 'details:toggled'; // all good
const someEventType2: EventType = 'click'; // all good
const someEventType3: EventType = 'some-invalid-event-type'; // no good
```

## Browser Support

| <img src="https://clipboardjs.com/assets/images/chrome.png" width="48px" height="48px" alt="Chrome logo"> | <img src="https://clipboardjs.com/assets/images/edge.png" width="48px" height="48px" alt="Edge logo"> | <img src="https://clipboardjs.com/assets/images/firefox.png" width="48px" height="48px" alt="Firefox logo"> | <img src="https://clipboardjs.com/assets/images/ie.png" width="48px" height="48px" alt="Internet Explorer logo"> | <img src="https://clipboardjs.com/assets/images/opera.png" width="48px" height="48px" alt="Opera logo"> | <img src="https://clipboardjs.com/assets/images/safari.png" width="48px" height="48px" alt="Safari logo"> |
|:---:|:---:|:---:|:---:|:---:|:---:|
| Latest ✔ | Latest ✔ | Latest ✔ | No ✕ | Latest ✔ | Latest ✔ |


## Related

- [select-dom](https://github.com/fregante/select-dom) - Lightweight `querySelector`/`All` wrapper that outputs an Array.
- [doma](https://github.com/fregante/doma) - Parse an HTML string into `DocumentFragment` or one `Element`, in a few bytes.
- [Refined GitHub](https://github.com/sindresorhus/refined-github) - Uses this module.

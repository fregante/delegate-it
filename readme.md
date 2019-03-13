# delegate-it [![Build Status](https://api.travis-ci.com/bfred-it/delegate-it.svg?branch=master)](https://travis-ci.com/bfred-it/delegate-it)

> Lightweight event delegation

This is a fork of the popular [`delegate`](https://github.com/zenorocha/delegate) with some improvements:

- debugged ([2d54c11](https://github.com/bfred-it/delegate-it/commit/2d54c1182aefd3ec9d8250fda76290971f5d7166), [c6bb88c](https://github.com/bfred-it/delegate-it/commit/c6bb88c2aa8097b25f22993a237cf09c96bcbfb8))
- modern: ES6, TypeScript, Edge 15+ (it uses `WeakMap` and `Element.closest()`)
- idempotent: identical listeners aren't added multiple times, just like the native `addEventListener`

If you need IE support, you can keep using [`delegate`](https://github.com/zenorocha/delegate)

## Install

```
npm install delegate-it
```

## Setup

```js
const delegate = require('delegate-it');
```

```js
import delegate from 'delegate-it';
```

## Usage

### Add event delegation

#### With the default base (`document`)

```js
delegate('.btn', 'click', event => {
    console.log(event.delegateTarget);
});
```

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

### Remove event delegation

#### With a single base element (default or specified)

```js
const delegation = delegate(document.body, '.btn', 'click', event => {
    console.log(event.delegateTarget);
});

delegation.destroy();
```

#### With multiple elements (via selector or array)

Note: selectors are always treated as multiple elements, even if one or none are matched. `delegate()` will return an array.

```js
const delegations = delegate('.container', '.btn', 'click', event => {
    console.log(event.delegateTarget);
});

delegations.forEach(function (delegation) {
    delegation.destroy();
});
```

## Browser Support

| <img src="https://clipboardjs.com/assets/images/chrome.png" width="48px" height="48px" alt="Chrome logo"> | <img src="https://clipboardjs.com/assets/images/edge.png" width="48px" height="48px" alt="Edge logo"> | <img src="https://clipboardjs.com/assets/images/firefox.png" width="48px" height="48px" alt="Firefox logo"> | <img src="https://clipboardjs.com/assets/images/ie.png" width="48px" height="48px" alt="Internet Explorer logo"> | <img src="https://clipboardjs.com/assets/images/opera.png" width="48px" height="48px" alt="Opera logo"> | <img src="https://clipboardjs.com/assets/images/safari.png" width="48px" height="48px" alt="Safari logo"> |
|:---:|:---:|:---:|:---:|:---:|:---:|
| Latest ✔ | Latest ✔ | Latest ✔ | No ✕ | Latest ✔ | Latest ✔ |

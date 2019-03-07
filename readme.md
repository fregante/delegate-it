# delegate-it [![Build Status](https://api.travis-ci.com/bfred-it/delegate-it.svg?branch=master)](https://travis-ci.com/bfred-it/delegate-it)

> Lightweight event delegation


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
var delegation = delegate(document.body, '.btn', 'click', event => {
    console.log(event.delegateTarget);
});

delegation.destroy();
```

#### With multiple elements (via selector or array)

Note: selectors are always treated as multiple elements, even if one or none are matched. `delegate()` will return an array.

```js
var delegations = delegate('.container', '.btn', 'click', event => {
    console.log(event.delegateTarget);
});

delegations.forEach(function (delegation) {
    delegation.destroy();
});
```

## Browser Support

| <img src="https://clipboardjs.com/assets/images/chrome.png" width="48px" height="48px" alt="Chrome logo"> | <img src="https://clipboardjs.com/assets/images/edge.png" width="48px" height="48px" alt="Edge logo"> | <img src="https://clipboardjs.com/assets/images/firefox.png" width="48px" height="48px" alt="Firefox logo"> | <img src="https://clipboardjs.com/assets/images/ie.png" width="48px" height="48px" alt="Internet Explorer logo"> | <img src="https://clipboardjs.com/assets/images/opera.png" width="48px" height="48px" alt="Opera logo"> | <img src="https://clipboardjs.com/assets/images/safari.png" width="48px" height="48px" alt="Safari logo"> |
|:---:|:---:|:---:|:---:|:---:|:---:|
| Latest ✔ | Latest ✔ | Latest ✔ | 9+ ✔ | Latest ✔ | Latest ✔ |

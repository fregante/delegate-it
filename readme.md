# delegate

Lightweight event delegation.

## Install

You can get it on npm.

```
npm install delegate --save
```

Or bower, too.

```
bower install delegate --save
```

If you're not into package management, just [download a ZIP](https://github.com/zenorocha/delegate/archive/master.zip) file.

## Setup

###### Node (Browserify)

```js
var delegate = require('delegate');
```

###### Browser (Standalone)

```html
<script src="dist/delegate.js"></script>
```

## Usage

### Add event delegation

```js
delegate(document.body, '.btn', 'click', function(e) {
    console.log(e.target);
});
```

### Remove event delegation

```js
var delegation = delegate('.btn', 'click', function(e) {
    console.log(e.target);
});

delegation.destroy();
```

## License

[MIT License](http://zenorocha.mit-license.org/) © Zeno Rocha

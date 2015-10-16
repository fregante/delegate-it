# delegate

  Low-level event delegation component.

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

## Example

```js
var delegate = require('delegate');
var ul = document.querySelector('ul');
var n = 0;

var fn = delegate.bind(ul, 'li a', 'click', function(e){
  console.log(e.target);
  console.log(e.delegateTarget); // => "<a>"
  if (++n == 3) {
    console.log('unbind');
    delegate.unbind(ul, 'click', fn, false);
  }
}, false);
```

## API

### .bind(el, selector, type, callback, [capture])

  Bind and return a callback which may be passed to `.unbind()`.

### .unbind(el, type, callback, [capture])

  Unbind.

## License

  MIT

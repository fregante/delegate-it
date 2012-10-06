
# delegate

  Low-level event delegation component.

## Installation

    $ component install component/delegate

## Example

```js
var delegate = require('delegate');
var ul = document.querySelector('ul');
var n = 0;

var fn = delegate.bind(ul, 'li a', 'click', function(e){
  console.log(e.target);
  if (++n == 3) {
    console.log('unbind');
    delegate.unbind('click', fn, false);
  }
}, false);
```

## API

### .bind(el, selector, type, callback, [capture])

  Bind and return a callback which may be passed to `.unbind()`.

### .unbind(type, callback, [capture])

  Unbind.

## License

  MIT

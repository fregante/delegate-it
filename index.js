
/**
 * Module dependencies.
 */

var matches = require('matches-selector');

/**
 * Contained by flag.
 */

var containedBy = 16;

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  document.addEventListener(type, callback, capture);

  function callback(e) {
    if (el.compareDocumentPosition(e.target) & containedBy) {
      if (matches(e.target, selector)) fn(e);
    }
  }

  return callback;
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(type, fn, capture){
  document.removeEventListener(type, fn, capture);
};
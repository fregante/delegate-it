var closest = require('closest');

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
 */

exports.bind = function(el, selector, type, fn, capture){
    return el.addEventListener(type, function(e){
        var target = e.target || e.srcElement;
        e.delegateTarget = closest(target, selector, true, el);
        if (e.delegateTarget) fn.call(el, e);
    }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 */

exports.unbind = function(el, type, fn, capture){
    el.removeEventListener(type, fn, capture);
};

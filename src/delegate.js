var closest = require('closest');

/**
 * Delegates event `type` to `selector`.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function delegate(element, selector, type, callback) {
    this.element  = element;
    this.selector = selector;
    this.type     = type;
    this.callback = callback;

    var cachedListener = listener.bind(this);

    element.addEventListener(type, cachedListener);

    return {
        destroy: function() {
            element.removeEventListener(type, cachedListener);
        }
    }
}

/**
 * Finds closest match and invokes `callback(e)`.
 *
 * @param {Event} e
 */
function listener(e) {
    var delegateTarget = closest(e.target, selector, true);

    if (delegateTarget) {
        e.target = delegateTarget;
        callback.call(element, e);
    }
}

module.exports = delegate;

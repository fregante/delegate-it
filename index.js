const elements = new WeakMap();

/**
 * Delegates event to a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function _delegate(element, selector, type, callback, useCapture) {
    const listenerFn = e => {
        e.delegateTarget = e.target.closest(selector);

        // Closest may match elements outside of the currentTarget
        // so it needs to be limited to elements inside it
        if (e.delegateTarget && e.currentTarget.contains(e.delegateTarget)) {
            callback.call(element, e);
        }
    };

    const elementMap = elements.get(element) || new WeakMap();
    const setups = elementMap.get(callback) || new Set();
    if (setups.size > 0) {
        for (const setup of setups) {
            if (setup.selector === selector && setup.type === type && setup.useCapture === useCapture) {
                return;
            }
        }
    }
    setups.add({selector, type, useCapture})
    element.addEventListener(type, listenerFn, useCapture);
    elements.set(element, elementMap);
    elementMap.set(callback, setups);

    return {
        destroy() {
            element.removeEventListener(type, listenerFn, useCapture);
            if (!elements.has(element)) {
                return;
            }

            const elementMap = elements.get(element);
            if (!elementMap.has(callback)) {
                return;
            }

            const setups = elementMap.get(callback);
            for (const setup of setups) {
                if (setup.selector === selector && setup.type === type && setup.useCapture === useCapture) {
                    setups.delete(setup);
                    if (setups.size === 0) {
                        elementMap.delete(callback);
                        if (elementMap.size === 0) {
                            elements.delete(element);
                        }
                    }
                    return;
                }
            }
        }
    };
}

/**
 * Delegates event to a selector.
 *
 * @param {Element|String|Array} [elements]
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function delegate(elements, selector, type, callback, useCapture) {
    // Handle the regular Element usage
    if (typeof elements.addEventListener === 'function') {
        return _delegate(...arguments);
    }

    // Handle Element-less usage, it defaults to global delegation
    if (typeof type === 'function') {
        return _delegate(document, ...arguments);
    }

    // Handle Selector-based usage
    if (typeof elements === 'string') {
        elements = document.querySelectorAll(elements);
    }

    // Handle Array-like based usage
    return Array.prototype.map.call(elements, element => {
        return _delegate(element, selector, type, callback, useCapture);
    });
}

module.exports = delegate;

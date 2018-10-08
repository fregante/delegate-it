/**
 * Local polyfills for Element.matches() and Element.closest()
 */

var matches = Element.prototype.matches ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;


/**
 * Finds the closest parent that matches a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @return {Function}
 */
function closest (element, selector) {
    do {
        if (matches.call(element, selector)) return element;
        element = element.parentElement || element.parentNode;
    } while (element !== null && element.nodeType === 1);
    return null;
}

module.exports = closest;

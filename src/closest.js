var matches = require('component-matches-selector');

/**
 * Finds the closest parent that matches a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @return {Function}
 */
function closest (element, selector) {
  while (element && element !== document) {
    if (matches(element, selector)) return element;
    element = element.parentNode;
  }
}

module.exports = closest;

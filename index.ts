const elements = new WeakMap();

function _delegate(
	element: EventTarget,
	selector: string,
	type: string,
	callback: () => any,
	useCapture: boolean | AddEventListenerOptions
) {
	const listenerFn = event => {
		event.delegateTarget = event.target.closest(selector);

		// Closest may match elements outside of the currentTarget
		// so it needs to be limited to elements inside it
		if (event.delegateTarget && event.currentTarget.contains(event.delegateTarget)) {
			callback.call(element, event);
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
	setups.add({selector, type, useCapture});
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
 */
type CombinedElements = EventTarget | EventTarget[] | NodeListOf<Element> | String;
export = function delegate(
	elements: CombinedElements,
	selector: string,
	type: string,
	callback: () => any,
	useCapture: boolean | AddEventListenerOptions
) {
	// Handle the regular Element usage
	if (typeof (elements as EventTarget).addEventListener === 'function') {
		return _delegate(elements as EventTarget, selector, type, callback, useCapture);
	}

	// Handle Element-less usage, it defaults to global delegation
	if (typeof type === 'function') {
		return _delegate(document, elements as string, selector as string, type as () => any, callback as boolean | AddEventListenerOptions);
	}

	// Handle Selector-based usage
	if (typeof elements === 'string') {
		elements = document.querySelectorAll(elements);
	}

	// Handle Array-like based usage
	return Array.prototype.map.call(elements, (element: EventTarget) => {
		return _delegate(element, selector, type, callback, useCapture);
	});
}

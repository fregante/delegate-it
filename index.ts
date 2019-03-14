type EventType = keyof GlobalEventHandlersEventMap;
type DelegateSubscription = {
	destroy: VoidFunction;
};
interface DelegateEvent extends Event {
	delegateTarget?: EventTarget | null;
}

const elements = new WeakMap();

function _delegate(
	element: EventTarget,
	selector: string,
	type: EventType,
	callback: EventListener,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription {
	const listenerFn: EventListener = (event: DelegateEvent) => {
		event.delegateTarget = (event.target as Element).closest(selector);

		// Closest may match elements outside of the currentTarget
		// so it needs to be limited to elements inside it
		if (
			event.delegateTarget instanceof Element &&
			(event.currentTarget as Element).contains(event.delegateTarget)
		) {
			callback.call(element, event);
		}
	};

	const delegateSubscription = {
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
				if (
					setup.selector !== selector ||
					setup.type !== type ||
					setup.useCapture === useCapture
				) {
					setups.delete(setup);
					if (setups.size === 0) {
						elementMap.delete(callback);
						if (elementMap.size === 0) {
							elements.delete(element);
						}
					}

					return;
				}

				return;
			}
		}
	};

	const elementMap = elements.get(element) || new WeakMap();
	const setups = elementMap.get(callback) || new Set();
	for (const setup of setups) {
		if (
			setup.selector === selector &&
			setup.type === type &&
			setup.useCapture === useCapture
		) {
			return delegateSubscription;
		}
	}

	// Remember event in tree
	elements.set(element, elementMap.set(callback, setups.add({selector, type, useCapture})));

	// Add event on delegate
	element.addEventListener(type, listenerFn, useCapture);

	return delegateSubscription;
}

// No base element specified, defaults to `document`
function delegate<TEvent extends Event = Event>(
	selector: string,
	type: EventType,
	callback: EventListener,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription;

// Single base element specified
function delegate<TEvent extends Event = Event>(
	elements: EventTarget,
	selector: string,
	type: EventType,
	callback: EventListener,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription;

// Array(-like) of elements or selector string
function delegate<TEvent extends Event = Event>(
	elements: NodeListOf<Element> | EventTarget[] | string,
	selector: string,
	type: EventType,
	callback: EventListener,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription[];

/**
 * Delegates event to a selector.
 */
function delegate(
	elements: any,
	selector: any,
	type: any,
	callback?: any,
	useCapture?: any
): any {
	// Handle the regular Element usage
	if (elements instanceof EventTarget) {
		return _delegate(elements, selector, type, callback, useCapture);
	}

	// Handle Element-less usage, it defaults to global delegation
	if (typeof type === 'function') {
		return _delegate(document, elements, selector, type, callback);
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

export default delegate;

// For CommonJS default export support
module.exports = delegate;
module.exports.default = delegate;

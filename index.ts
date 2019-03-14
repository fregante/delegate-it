export type EventType = keyof GlobalEventHandlersEventMap;

export type DelegateSubscription = {
	destroy: VoidFunction;
};

export type DelegateEventHandler<TElement extends Element, T extends Event> = (event: DelegateEvent<T, TElement>) => any;

export type DelegateEvent<T extends Event = Event, E extends Element = Element> = T & {
	delegateTarget: E;
}

const elements = new WeakMap();

function _delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	element: EventTarget,
	selector: string,
	type: EventType,
	callback: DelegateEventHandler<TElement, TEvent>,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription {
	const listenerFn: EventListener = (event: Partial<DelegateEvent>) => {
		event.delegateTarget = (event.target as Element).closest(selector) as TElement;

		// Closest may match elements outside of the currentTarget
		// so it needs to be limited to elements inside it
		if (
			event.delegateTarget instanceof Element &&
			(event.currentTarget as Element).contains(event.delegateTarget)
		) {
			callback.call(element, event as DelegateEvent<TEvent, TElement>);
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
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	selector: string,
	type: EventType,
	callback: DelegateEventHandler<TElement, TEvent>,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription;

// Single base element specified
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: EventTarget | Document,
	selector: string,
	type: EventType,
	callback: DelegateEventHandler<TElement, TEvent>,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription;

// Array(-like) of elements or selector string
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: NodeListOf<Element> | EventTarget[] | string,
	selector: string,
	type: EventType,
	callback: DelegateEventHandler<TElement, TEvent>,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription[];

/**
 * Delegates event to a selector.
 */
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: any,
	selector: any,
	type: any,
	callback?: any,
	useCapture?: any
): any {
	// Handle the regular Element usage
	if (elements instanceof EventTarget) {
		return _delegate<TElement, TEvent>(elements, selector, type, callback, useCapture);
	}

	// Handle Element-less usage, it defaults to global delegation
	if (typeof type === 'function') {
		return _delegate<TElement, TEvent>(document, elements, selector, type, callback);
	}

	// Handle Selector-based usage
	if (typeof elements === 'string') {
		elements = document.querySelectorAll(elements);
	}

	// Handle Array-like based usage
	return Array.prototype.map.call(elements, (element: EventTarget) => {
		return _delegate<TElement, TEvent>(element, selector, type, callback, useCapture);
	});
}

export default delegate;

// For CommonJS default export support
module.exports = delegate;
module.exports.default = delegate;

type EventType = keyof GlobalEventHandlersEventMap;

type DelegateSubscription = {
	destroy: VoidFunction;
};

type DelegateEvent<T extends Event = Event> = T & {
	delegateTarget: EventTarget;
};

type DelegateEventHandler<T extends Event> =
	| ((event: DelegateEvent<T>) => Promise<void>)
	| ((event: DelegateEvent<T>) => void);

const elements = new WeakMap();

function _delegate<TEvent extends Event = Event>(
	element: EventTarget,
	selector: string,
	type: EventType,
	callback?: DelegateEventHandler<TEvent>,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription {
	const listenerFn: DelegateEventHandler<TEvent> = event => {
		event.delegateTarget = (event.target as Element).closest(selector);

		// Closest may match elements outside of the currentTarget
		// so it needs to be limited to elements inside it
		if (
			event.delegateTarget &&
			(event.currentTarget as Element).contains(event.delegateTarget as Node)
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

/**
 * Delegates event to a selector.
 */
type CombinedElements =
	| EventTarget
	| EventTarget[]
	| NodeListOf<Element>
	| string;

function delegate<TEvent extends Event = Event>(
	selector: string,
	type: EventType,
	callback?: DelegateEventHandler<TEvent>,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription;
function delegate<TEvent extends Event = Event>(
	elements: CombinedElements,
	selector: string,
	type: EventType,
	callback?: DelegateEventHandler<TEvent>,
	useCapture?: boolean | AddEventListenerOptions
): DelegateSubscription {
	// Handle the regular Element usage
	if (elements instanceof EventTarget) {
		return _delegate(elements, selector, type, callback, useCapture);
	}

	// Handle Element-less usage, it defaults to global delegation
	if (typeof type === 'function') {
		return _delegate(
			document,
			elements as string,
			selector as EventType,
			type as DelegateEventHandler<TEvent>,
			callback as boolean | AddEventListenerOptions
		);
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

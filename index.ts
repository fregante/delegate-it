namespace delegate {
	export type EventType = keyof GlobalEventHandlersEventMap;

	export type DelegateSubscription = {
		destroy: VoidFunction;
	};

	export type Setup = {
		selector: string;
		type: EventType;
		capture: boolean;
	};

	export type DelegateEventHandler<TEvent extends Event = Event, TElement extends Element = Element> = (event: DelegateEvent<TEvent, TElement>) => void;

	export type DelegateEvent<TEvent extends Event = Event, TElement extends Element = Element> = TEvent & {
		delegateTarget: TElement;
	};
}

const elements = new WeakMap<EventTarget, WeakMap<delegate.DelegateEventHandler<any, any>, Set<delegate.Setup>>>();

function _delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	element: EventTarget,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	options?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription {
	const capture = Boolean(typeof options === 'object' ? options.capture : options);
	const listenerFn: EventListener = (event: Partial<delegate.DelegateEvent>): void => {
		const delegateTarget = (event.target as Element).closest(selector) as TElement;

		if (!delegateTarget) {
			return;
		}

		event.delegateTarget = delegateTarget;

		// Closest may match elements outside of the currentTarget
		// so it needs to be limited to elements inside it
		if ((event.currentTarget as Element).contains(event.delegateTarget)) {
			callback.call(element, event as delegate.DelegateEvent<TEvent, TElement>);
		}
	};

	const delegateSubscription = {
		destroy() {
			element.removeEventListener(type, listenerFn, options);
			if (!elements.has(element)) {
				return;
			}

			const elementMap = elements.get(element)!;
			if (!elementMap.has(callback)) {
				return;
			}

			const setups = elementMap.get(callback);

			if (!setups) {
				return;
			}

			for (const setup of setups) {
				if (
					setup.selector !== selector ||
					setup.type !== type ||
					setup.capture === capture
				) {
					continue;
				}

				setups.delete(setup);
				if (setups.size === 0) {
					elementMap.delete(callback);
				}

				return;
			}
		}
	};

	const elementMap = elements.get(element) ?? new WeakMap<delegate.DelegateEventHandler<TEvent, TElement>, Set<delegate.Setup>>();
	const setups = elementMap.get(callback) ?? new Set<delegate.Setup>();
	for (const setup of setups) {
		if (
			setup.selector === selector &&
			setup.type === type &&
			setup.capture === capture
		) {
			return delegateSubscription;
		}
	}

	// Remember event in tree
	elements.set(element,
		elementMap.set(callback,
			setups.add({selector, type, capture})
		)
	);

	// Add event on delegate
	element.addEventListener(type, listenerFn, options);

	return delegateSubscription;
}

// Single base element specified
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: EventTarget | Document,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	options?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription;

// Array(-like) of elements or selector string
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: ArrayLike<Element> | string,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	options?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription[];

/**
 * Delegates event to a selector.
 */
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: EventTarget | Document | ArrayLike<Element> | string,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	options?: boolean | AddEventListenerOptions
): any {
	// Handle the regular Element usage
	if (typeof (elements as EventTarget).addEventListener === 'function') {
		return _delegate<TElement, TEvent>(elements as EventTarget, selector, type, callback, options);
	}

	// Handle Selector-based usage
	if (typeof elements === 'string') {
		elements = document.querySelectorAll(elements);
	}

	// Handle Array-like based usage
	return Array.prototype.map.call(elements, (element: EventTarget) => {
		return _delegate<TElement, TEvent>(element, selector, type, callback, options);
	});
}

export = delegate;

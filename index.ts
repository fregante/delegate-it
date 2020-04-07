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

const ledger = new WeakMap<EventTarget, WeakMap<delegate.DelegateEventHandler<any, any>, Set<delegate.Setup>>>();

function isEventTarget(elements: EventTarget | Document | ArrayLike<Element> | string): elements is EventTarget {
	return typeof (elements as EventTarget).addEventListener === 'function';
}

/**
 * Delegates event to a selector.
 */
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	base: EventTarget | Document | ArrayLike<Element> | string,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	options?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription {
	// Handle Selector-based usage
	if (typeof base === 'string') {
		base = document.querySelectorAll(base);
	}

	// Handle Array-like based usage
	if (!isEventTarget(base)) {
		const subscriptions = Array.prototype.map.call(base, (element: EventTarget) => {
			return delegate<TElement, TEvent>(element, selector, type, callback, options);
		}) as delegate.DelegateSubscription[];

		return {
			destroy(): void {
				subscriptions.forEach(subscription => subscription.destroy());
			}
		};
	}

	const baseElement = base; // Required for TypeScript

	// Handle the regular Element usage
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
			callback.call(baseElement, event as delegate.DelegateEvent<TEvent, TElement>);
		}
	};

	const delegateSubscription = {
		destroy() {
			baseElement.removeEventListener(type, listenerFn, options);
			if (!ledger.has(baseElement)) {
				return;
			}

			const elementMap = ledger.get(baseElement)!;
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

	const elementMap = ledger.get(baseElement) ?? new WeakMap<delegate.DelegateEventHandler<TEvent, TElement>, Set<delegate.Setup>>();
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
	ledger.set(baseElement,
		elementMap.set(callback,
			setups.add({selector, type, capture})
		)
	);

	// Add event on delegate
	baseElement.addEventListener(type, listenerFn, options);

	return delegateSubscription;
}

export = delegate;

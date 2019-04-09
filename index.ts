// eslint-disable-next-line @typescript-eslint/no-namespace
namespace delegate {
	export type EventType = keyof GlobalEventHandlersEventMap;

	export type DelegateSubscription = {
		destroy: VoidFunction;
	};

	export type Setup = {
		selector: string;
		type: EventType;
		useCapture?: boolean | AddEventListenerOptions;
	}

	export type DelegateEventHandler<TEvent extends Event = Event, TElement extends Element = Element> = (event: DelegateEvent<TEvent, TElement>) => void;

	export type DelegateEvent<TEvent extends Event = Event, TElement extends Element = Element> = TEvent & {
		delegateTarget: TElement;
	}

	const elements = new WeakMap<EventTarget, WeakMap<DelegateEventHandler<any, any>, Set<Setup>>>();

	// eslint-disable-next-line no-inner-declarations
	function _delegate<TElement extends Element = Element, TEvent extends Event = Event>(
		element: EventTarget,
		selector: string,
		type: EventType,
		callback: DelegateEventHandler<TEvent, TElement>,
		useCapture?: boolean | AddEventListenerOptions
	): DelegateSubscription {
		const listenerFn: EventListener = (event: Partial<DelegateEvent>): void => {
			const delegateTarget = (event.target as Element).closest(selector) as TElement;

			if (!delegateTarget) {
				return;
			}

			event.delegateTarget = delegateTarget;

			// Closest may match elements outside of the currentTarget
			// so it needs to be limited to elements inside it
			if ((event.currentTarget as Element).contains(event.delegateTarget)) {
				callback.call(element, event as DelegateEvent<TEvent, TElement>);
			}
		};

		const delegateSubscription = {
			destroy() {
				element.removeEventListener(type, listenerFn, useCapture);
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
					setup.useCapture === useCapture
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

		const elementMap = elements.get(element) || new WeakMap<DelegateEventHandler<TEvent, TElement>, Set<Setup>>();
		const setups = elementMap.get(callback) || new Set<Setup>();
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
		elements.set(element,
			elementMap.set(callback,
				setups.add({selector, type, useCapture})
			)
		);

		// Add event on delegate
		element.addEventListener(type, listenerFn, useCapture);

		return delegateSubscription;
	}

	// No base element specified, defaults to `document`
	// eslint-disable-next-line import/export
	export function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
		selector: string,
		type: EventType,
		callback: DelegateEventHandler<TEvent, TElement>,
		useCapture?: boolean | AddEventListenerOptions
	): DelegateSubscription;

	// Single base element specified
	// eslint-disable-next-line import/export
	export function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
		elements: EventTarget | Document,
		selector: string,
		type: EventType,
		callback: DelegateEventHandler<TEvent, TElement>,
		useCapture?: boolean | AddEventListenerOptions
	): DelegateSubscription;

	// Array(-like) of elements or selector string
	// eslint-disable-next-line import/export
	export function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
		elements: ArrayLike<Element> | string,
		selector: string,
		type: EventType,
		callback: DelegateEventHandler<TEvent, TElement>,
		useCapture?: boolean | AddEventListenerOptions
	): DelegateSubscription[];

	/**
 * Delegates event to a selector.
 */
	// eslint-disable-next-line import/export, no-inner-declarations
	export function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
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
}

export = delegate;

import mem from 'mem';
import ManyKeysMap from 'many-keys-map';

namespace delegate {
	export type EventType = keyof GlobalEventHandlersEventMap;

	export type DelegateSubscription = {
		remove: VoidFunction;
	};

	export type DelegateEventHandler<TEvent extends Event = Event, TElement extends Element = Element> = (event: DelegateEvent<TEvent, TElement>) => void;

	export type DelegateEvent<TEvent extends Event = Event, TElement extends Element = Element> = TEvent & {
		delegateTarget: TElement;
	}
}

// `mem` ensures that there's only ever 1 handler per `DelegateEventHandler + selector` callback, so the same DelegateEventHandler can't be attached twice
const getDelegatingHandler = mem(<TElement extends Element = Element, TEvent extends Event = Event>(
	selector: string,
	callback: delegate.DelegateEventHandler<TEvent, TElement>
) => (event: Partial<delegate.DelegateEvent>): void => {
	const delegateTarget = (event.target as Element).closest(selector) as TElement;
	if (!delegateTarget) {
		return;
	}

	// Closest may match elements outside of the currentTarget so it needs to be limited to elements inside it
	if ((event.currentTarget as Element).contains(delegateTarget)) {
		event.delegateTarget = delegateTarget;
		callback.call(delegateTarget, event as delegate.DelegateEvent<TEvent, TElement>);
	}
}, {
	cache: new ManyKeysMap(), // TODO: switch to `many-keys-weakmap` after https://github.com/bfred-it/many-keys-weakmap/pull/1
	cacheKey: (...arguments_) => arguments_
});

function _delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	element: EventTarget,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	useCapture?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription {
	const handler = getDelegatingHandler<TElement, TEvent>(selector, callback);
	element.addEventListener(type, handler, useCapture);

	return {
		remove() {
			element.removeEventListener(type, handler, useCapture);
		}
	};
}

// No base element specified, defaults to `document`
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	useCapture?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription;

// Single base element specified
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: EventTarget | Document,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	useCapture?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription;

// Array(-like) of elements or selector string
function delegate<TElement extends Element = Element, TEvent extends Event = Event>(
	elements: ArrayLike<Element> | string,
	selector: string,
	type: delegate.EventType,
	callback: delegate.DelegateEventHandler<TEvent, TElement>,
	useCapture?: boolean | AddEventListenerOptions
): delegate.DelegateSubscription[];

/**
 * Delegates event to a selector.
 */
// eslint-disable-next-line no-redeclare
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

export = delegate;

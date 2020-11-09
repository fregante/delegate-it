export type EventType = keyof GlobalEventHandlersEventMap;
type GlobalEvent = Event;

namespace delegate {
	export type Subscription = {
		destroy: VoidFunction;
	};

	export type EventHandler<
		TEvent extends GlobalEvent = GlobalEvent,
		TElement extends Element = Element
	> = (event: Event<TEvent, TElement>) => void;

	export type Event<
		TEvent extends GlobalEvent = GlobalEvent,
		TElement extends Element = Element
	> = TEvent & {
		delegateTarget: TElement;
	};
}

/** Keeps track of raw listeners added to the base elements to avoid duplication */
const ledger = new WeakMap<
EventTarget,
WeakMap<delegate.EventHandler, Set<string>>
>();

function editLedger(
	wanted: boolean,
	baseElement: EventTarget | Document,
	callback: delegate.EventHandler<any, any>,
	setup: string
): boolean {
	if (!wanted && !ledger.has(baseElement)) {
		return false;
	}

	const elementMap =
		ledger.get(baseElement) ??
		new WeakMap<delegate.EventHandler, Set<string>>();
	ledger.set(baseElement, elementMap);

	if (!wanted && !ledger.has(baseElement)) {
		return false;
	}

	const setups = elementMap.get(callback) ?? new Set<string>();
	elementMap.set(callback, setups);

	const existed = setups.has(setup);
	if (wanted) {
		setups.add(setup);
	} else {
		setups.delete(setup);
	}

	return existed && wanted;
}

function isEventTarget(
	elements: EventTarget | Document | ArrayLike<Element> | string
): elements is EventTarget {
	return typeof (elements as EventTarget).addEventListener === 'function';
}

function safeClosest(event: Event, selector: string): Element | void {
	let target = event.target;
	if (target instanceof Text) {
		target = target.parentElement;
	}

	if (target instanceof Element && event.currentTarget instanceof Element) {
		// `.closest()` may match ancestors of `currentTarget` but we only need its children
		const closest = target.closest(selector);
		if (closest && event.currentTarget.contains(closest)) {
			return closest;
		}
	}
}

/**
 * Delegates event to a selector.
 */
function delegate<
	TElement extends Element = Element,
	TEvent extends Event = Event
>(
	base: EventTarget | Document | ArrayLike<Element> | string,
	selector: string,
	type: EventType,
	callback: delegate.EventHandler<TEvent, TElement>,
	options?: boolean | AddEventListenerOptions
): delegate.Subscription {
	// Handle Selector-based usage
	if (typeof base === 'string') {
		base = document.querySelectorAll(base);
	}

	// Handle Array-like based usage
	if (!isEventTarget(base)) {
		const subscriptions = Array.prototype.map.call(base, (element: EventTarget) => {
			return delegate<TElement, TEvent>(element, selector, type, callback, options);
		}) as delegate.Subscription[];

		return {
			destroy(): void {
				subscriptions.forEach(subscription => subscription.destroy());
			}
		};
	}

	// `document` should never be the base, it's just an easy way to define "global event listeners"
	const baseElement = base instanceof Document ? base.documentElement : base;

	// Handle the regular Element usage
	const capture = Boolean(typeof options === 'object' ? options.capture : options);
	const listenerFn: EventListener = (event: Event): void => {
		const delegateTarget = safeClosest(event, selector);
		if (delegateTarget) {
			(event as any).delegateTarget = delegateTarget;
			callback.call(baseElement, event as delegate.Event<TEvent, TElement>);
		}
	};

	const setup = JSON.stringify({selector, type, capture});
	const isAlreadyListening = editLedger(true, baseElement, callback, setup);
	const delegateSubscription = {
		destroy() {
			baseElement.removeEventListener(type, listenerFn, options);
			editLedger(false, baseElement, callback, setup);
		}
	};

	if (!isAlreadyListening) {
		baseElement.addEventListener(type, listenerFn, options);
	}

	return delegateSubscription;
}

export default delegate;

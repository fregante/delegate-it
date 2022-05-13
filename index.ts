import type {ParseSelector} from 'typed-query-selector/parser';

export type DelegateOptions = boolean | Omit<AddEventListenerOptions, 'once'>;
export type EventType = keyof GlobalEventHandlersEventMap;
type GlobalEvent = Event;

namespace delegate {
	export type EventHandler<
		TEvent extends GlobalEvent = GlobalEvent,
		TElement extends Element = Element,
	> = (event: Event<TEvent, TElement>) => void;

	export type Event<
		TEvent extends GlobalEvent = GlobalEvent,
		TElement extends Element = Element,
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
	setup: string,
): boolean {
	if (!wanted && !ledger.has(baseElement)) {
		return false;
	}

	const elementMap
		= ledger.get(baseElement)
		?? new WeakMap<delegate.EventHandler, Set<string>>();
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
	elements: EventTarget | Document | ArrayLike<Element> | string,
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
 * @param options A boolean value setting options.capture or an options object of type AddEventListenerOptions without the `once` option
 */
function delegate<
	Selector extends string,
	TElement extends Element = ParseSelector<Selector, HTMLElement>,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | ArrayLike<Element> | string,
	selector: Selector,
	type: TEventType,
	callback: delegate.EventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions
): AbortController;

function delegate<
	TElement extends Element = HTMLElement,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | ArrayLike<Element> | string,
	selector: string,
	type: TEventType,
	callback: delegate.EventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions
): AbortController;

// This type isn't exported as a declaration, so it needs to be duplicated above
function delegate<
	TElement extends Element,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | ArrayLike<Element> | string,
	selector: string,
	type: TEventType,
	callback: delegate.EventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions
): AbortController {
	const listenerOptions: AddEventListenerOptions = typeof options === 'object' ? options : {capture: options};
	const internalController = new AbortController();

	if (listenerOptions.signal) {
		if (listenerOptions.signal.aborted) {
			internalController.abort();
			return internalController;
		}

		listenerOptions.signal.addEventListener('abort', () => {
			internalController.abort();
		}, {
			once: true
		});
	}

	// Handle Selector-based usage
	if (typeof base === 'string') {
		base = document.querySelectorAll(base);
	}

	// Handle Array-like based usage
	if (!isEventTarget(base)) {
		Array.prototype.forEach.call(base, element => {
			delegate(element, selector, type, callback, listenerOptions);
		});

		return internalController;
	}

	// `document` should never be the base, it's just an easy way to define "global event listeners"
	const baseElement = base instanceof Document ? base.documentElement : base;

	// Handle the regular Element usage
	const capture = Boolean(typeof options === 'object' ? options.capture : options);
	const listenerFn: EventListener = (event: Event): void => {
		const delegateTarget = safeClosest(event, selector);
		if (delegateTarget) {
			(event as any).delegateTarget = delegateTarget;
			callback.call(baseElement, event as delegate.Event<GlobalEventHandlersEventMap[TEventType], TElement>);
		}
	};

	// Drop unsupported `once` option https://github.com/fregante/delegate-it/pull/28#discussion_r863467939
	if (typeof options === 'object') {
		delete (options as AddEventListenerOptions).once;
	}

	const setup = JSON.stringify({selector, type, capture});
	const isAlreadyListening = editLedger(true, baseElement, callback, setup);
	if (!isAlreadyListening) {
		baseElement.addEventListener(type, listenerFn, listenerOptions);
	}

	internalController.signal.addEventListener('abort', () => {
		editLedger(false, baseElement, callback, setup);
	}, {
		once: true
	});

	return internalController;
}

export default delegate;

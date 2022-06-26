import type {ParseSelector} from 'typed-query-selector/parser.d.js';

export type DelegateOptions = boolean | Omit<AddEventListenerOptions, 'once'>;
export type EventType = keyof GlobalEventHandlersEventMap;

export type DelegateEventHandler<
	TEvent extends Event = Event,
	TElement extends Element = Element,
> = (event: DelegateEvent<TEvent, TElement>) => void;

export type DelegateEvent<
	TEvent extends Event = Event,
	TElement extends Element = Element,
> = TEvent & {
	delegateTarget: TElement;
};

/** Keeps track of raw listeners added to the base elements to avoid duplication */
const ledger = new WeakMap<
EventTarget,
WeakMap<DelegateEventHandler, Set<string>>
>();

function editLedger(
	wanted: boolean,
	baseElement: EventTarget | Document,
	callback: DelegateEventHandler<any, any>,
	setup: string,
): boolean {
	if (!wanted && !ledger.has(baseElement)) {
		return false;
	}

	const elementMap
		= ledger.get(baseElement)
		?? new WeakMap<DelegateEventHandler, Set<string>>();
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
	elements: EventTarget | Document | Iterable<Element> | string,
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
	base: EventTarget | Document | Iterable<Element> | string,
	selector: Selector,
	type: TEventType,
	callback: DelegateEventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions
): AbortController;

function delegate<
	TElement extends Element = HTMLElement,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | Iterable<Element> | string,
	selector: string,
	type: TEventType,
	callback: DelegateEventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions
): AbortController;

// This type isn't exported as a declaration, so it needs to be duplicated above
function delegate<
	TElement extends Element,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | Iterable<Element> | string,
	selector: string,
	type: TEventType,
	callback: DelegateEventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions,
): AbortController {
	const internalController = new AbortController();
	const listenerOptions: AddEventListenerOptions = typeof options === 'object' ? options : {capture: options};
	// Drop unsupported `once` option https://github.com/fregante/delegate-it/pull/28#discussion_r863467939
	delete listenerOptions.once;

	if (listenerOptions.signal) {
		if (listenerOptions.signal.aborted) {
			internalController.abort();
			return internalController;
		}

		listenerOptions.signal.addEventListener('abort', () => {
			internalController.abort();
		});
	} else {
		listenerOptions.signal = internalController.signal;
	}

	// Handle Selector-based usage
	if (typeof base === 'string') {
		base = document.querySelectorAll(base);
	}

	// Handle Array-like based usage
	if (!isEventTarget(base)) {
		for (const element of base) {
			delegate(element, selector, type, callback, listenerOptions);
		}

		return internalController;
	}

	// `document` should never be the base, it's just an easy way to define "global event listeners"
	const baseElement = base instanceof Document ? base.documentElement : base;

	// Handle the regular Element usage
	const capture = Boolean(typeof options === 'object' ? options.capture : options);
	const listenerFn = (event: Event): void => {
		const delegateTarget = safeClosest(event, selector);
		if (delegateTarget) {
			const delegateEvent = Object.assign(event, {delegateTarget});
			callback.call(baseElement, delegateEvent as DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement>);
		}
	};

	const setup = JSON.stringify({selector, type, capture});
	const isAlreadyListening = editLedger(true, baseElement, callback, setup);
	if (!isAlreadyListening) {
		baseElement.addEventListener(type, listenerFn, listenerOptions);
	}

	internalController.signal.addEventListener('abort', () => {
		editLedger(false, baseElement, callback, setup);
	});

	return internalController;
}

export default delegate;

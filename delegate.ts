import type {ParseSelector} from 'typed-query-selector/parser.d.js';

export type DelegateOptions = AddEventListenerOptions & {base?: EventTarget};
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
	baseElement: EventTarget,
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
 * @param options A boolean value setting options.capture or an options object of type AddEventListenerOptions
 */
function delegate<
	Selector extends string,
	TElement extends Element = ParseSelector<Selector, HTMLElement>,
	TEventType extends EventType = EventType,
>(
	selector: Selector | readonly Selector[],
	type: TEventType,
	callback: DelegateEventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions
): void;

function delegate<
	TElement extends Element = HTMLElement,
	TEventType extends EventType = EventType,
>(
	selector: string | readonly string[],
	type: TEventType,
	callback: DelegateEventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options?: DelegateOptions
): void;

// This type isn't exported as a declaration, so it needs to be duplicated above
function delegate<
	TElement extends Element,
	TEventType extends EventType = EventType,
>(
	selector: string | readonly string[],
	type: TEventType,
	callback: DelegateEventHandler<GlobalEventHandlersEventMap[TEventType], TElement>,
	options: DelegateOptions = {},
): void {
	const {signal, base = document} = options;

	if (signal?.aborted) {
		return;
	}

	// Don't pass `once` to `addEventListener` because it needs to be handled in `delegate-it`
	const {once, ...nativeListenerOptions} = options;

	// `document` should never be the base, it's just an easy way to define "global event listeners"
	const baseElement = base instanceof Document ? base.documentElement : base;

	// Handle the regular Element usage
	const capture = Boolean(typeof options === 'object' ? options.capture : options);
	const listenerFunction = (event: Event): void => {
		const delegateTarget = safeClosest(event, String(selector));
		if (delegateTarget) {
			const delegateEvent = Object.assign(event, {delegateTarget});
			callback.call(baseElement, delegateEvent as DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement>);
			if (once) {
				baseElement.removeEventListener(type, listenerFunction, nativeListenerOptions);
				editLedger(false, baseElement, callback, setup);
			}
		}
	};

	const setup = JSON.stringify({selector, type, capture});
	const isAlreadyListening = editLedger(true, baseElement, callback, setup);
	if (!isAlreadyListening) {
		baseElement.addEventListener(type, listenerFunction, nativeListenerOptions);
	}

	signal?.addEventListener('abort', () => {
		editLedger(false, baseElement, callback, setup);
	});
}

export default delegate;

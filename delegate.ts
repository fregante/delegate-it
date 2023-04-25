import type {ParseSelector} from 'typed-query-selector/parser.d.js';

export type EventType = keyof GlobalEventHandlersEventMap;

type ThirdParameter<
	TEvent extends Event = Event,
	TElement extends Element = Element,
> = DelegateEventHandler<TEvent, TElement> | DelegateOptions<TEvent, TElement>;

export type OneEventOptions = AddEventListenerOptions & {
	base?: EventTarget;
};

export type DelegateOptions<
	TEvent extends Event = Event,
	TElement extends Element = Element,
> = OneEventOptions & {
	callback: DelegateEventHandler<TEvent, TElement>;
};

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
	selector: Selector,
	type: TEventType,
	optionsOrCallback: ThirdParameter<GlobalEventHandlersEventMap[TEventType], TElement>,
): void;

function delegate<
	TElement extends Element = HTMLElement,
	TEventType extends EventType = EventType,
>(
	selector: string,
	type: TEventType,
	optionsOrCallback: ThirdParameter<GlobalEventHandlersEventMap[TEventType], TElement>,
): void;

// This type isn't exported as a declaration, so it needs to be duplicated above
function delegate<
	TElement extends Element,
	TEventType extends EventType = EventType,
>(
	selector: string,
	type: TEventType,
	optionsOrCallback: ThirdParameter<GlobalEventHandlersEventMap[TEventType], TElement>,
): void {
	const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : {
		callback: optionsOrCallback,
	};
	const {signal, base = document} = options;

	if (signal?.aborted) {
		return;
	}

	// Don't pass `once`/`callback` to `addEventListener` because they're handled in `delegate-it`
	const {once, callback, ...nativeListenerOptions} = options;

	// `document` should never be the base, it's just an easy way to define "global event listeners"
	const baseElement = base instanceof Document ? base.documentElement : base;

	// Handle the regular Element usage
	const capture = Boolean(typeof options === 'object' ? options.capture : options);
	const listenerFn = (event: Event): void => {
		const delegateTarget = safeClosest(event, selector);
		if (delegateTarget) {
			const delegateEvent = Object.assign(event, {delegateTarget});
			callback.call(baseElement, delegateEvent as DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement>);
			if (once) {
				baseElement.removeEventListener(type, listenerFn, nativeListenerOptions);
				editLedger(false, baseElement, callback, setup);
			}
		}
	};

	const setup = JSON.stringify({selector, type, capture});
	const isAlreadyListening = editLedger(true, baseElement, callback, setup);
	if (!isAlreadyListening) {
		baseElement.addEventListener(type, listenerFn, nativeListenerOptions);
	}

	signal?.addEventListener('abort', () => {
		editLedger(false, baseElement, callback, setup);
	});
}

export default delegate;

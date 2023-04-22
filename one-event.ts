import type {ParseSelector} from 'typed-query-selector/parser.d.js';
import delegate, {castAddEventListenerOptions, type DelegateEvent, type DelegateOptions, type EventType} from './lib.js';

/**
 * Delegates event to a selector and resolves after the first event
 */
async function oneEvent<
	Selector extends string,
	TElement extends Element = ParseSelector<Selector, HTMLElement>,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | Iterable<Element> | string,
	selector: Selector,
	type: TEventType,
	options?: DelegateOptions
): Promise<DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement>>;

async function oneEvent<
	TElement extends Element = HTMLElement,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | Iterable<Element> | string,
	selector: string,
	type: TEventType,
	options?: DelegateOptions
): Promise<DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement>>;

// This type isn't exported as a declaration, so it needs to be duplicated above
async function oneEvent<
	TElement extends Element,
	TEventType extends EventType = EventType,
>(
	base: EventTarget | Document | Iterable<Element> | string,
	selector: string,
	type: TEventType,
	options?: DelegateOptions,
): Promise<DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement> | undefined> {
	return new Promise(resolve => {
		const listenerOptions = castAddEventListenerOptions(options);
		listenerOptions.once = true;

		if (listenerOptions.signal?.aborted) {
			resolve(undefined);
		}

		listenerOptions.signal?.addEventListener('abort', () => {
			resolve(undefined);
		});

		delegate(
			base,
			selector,
			type,
			// @ts-expect-error Seems to work fine
			resolve,
			listenerOptions,
		);
	});
}

export default oneEvent;

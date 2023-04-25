import type {ParseSelector} from 'typed-query-selector/parser.d.js';
import delegate, {
	type DelegateEvent,
	type DelegateOptions,
	type EventType,
} from './delegate.js';

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
	options: DelegateOptions = {},
): Promise<DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement> | undefined> {
	return new Promise(resolve => {
		options.once = true;

		if (options.signal?.aborted) {
			resolve(undefined);
		}

		options.signal?.addEventListener('abort', () => {
			resolve(undefined);
		});

		delegate(
			base,
			selector,
			type,
			// @ts-expect-error Seems to work fine
			resolve,
			options,
		);
	});
}

export default oneEvent;

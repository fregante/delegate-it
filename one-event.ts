import type {ParseSelector} from 'typed-query-selector/parser.d.js';
import delegate, {
	type DelegateEvent,
	type DelegateOptions,
	type EventType,
} from './delegate.js';

export type OneEventOptions<
	TEvent extends Event = Event,
	TElement extends Element = Element,
> = Omit<DelegateOptions, 'once'> & {
	filter?: (event: DelegateEvent<TEvent, TElement>) => boolean;
};

/**
 * Delegates event to a selector and resolves after the first event
 */
async function oneEvent<
	Selector extends string,
	TElement extends Element = ParseSelector<Selector, HTMLElement>,
	TEventType extends EventType = EventType,
>(
	selector: Selector | Selector[],
	type: TEventType,
	options?: OneEventOptions<GlobalEventHandlersEventMap[TEventType], TElement>
): Promise<DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement>>;

async function oneEvent<
	TElement extends Element = HTMLElement,
	TEventType extends EventType = EventType,
>(
	selector: string | string[],
	type: TEventType,
	options?: OneEventOptions<GlobalEventHandlersEventMap[TEventType], TElement>
): Promise<DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement>>;

// This type isn't exported as a declaration, so it needs to be duplicated above
async function oneEvent<
	TElement extends Element,
	TEventType extends EventType = EventType,
>(
	selector: string | string[],
	type: TEventType,
	options: OneEventOptions<GlobalEventHandlersEventMap[TEventType], TElement> = {},
): Promise<DelegateEvent<GlobalEventHandlersEventMap[TEventType], TElement> | undefined> {
	return new Promise(resolve => {
		const {filter, ...delegateOptions} = options;

		if (delegateOptions.signal?.aborted) {
			resolve(undefined);
			return;
		}

		if (filter) {
			const controller = new AbortController();

			delegateOptions.signal?.addEventListener('abort', () => {
				controller.abort();
				resolve(undefined);
			});

			delegate<TElement, TEventType>(
				selector,
				type,
				event => {
					if (filter(event)) {
						controller.abort();
						resolve(event);
					}
				},
				{...delegateOptions, signal: controller.signal},
			);
		} else {
			delegateOptions.signal?.addEventListener('abort', () => {
				resolve(undefined);
			});

			delegate(
				selector,
				type,
				resolve,
				{...delegateOptions, once: true},
			);
		}
	});
}

export default oneEvent;

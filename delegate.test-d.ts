import {expectTypeOf, test} from 'vitest';
import delegate, {
	type DelegateEvent,
	type DelegateEventHandler,
} from './delegate.js';

test('should infer delegateTarget from selector (issue #25)', () => {
	delegate('button', 'click', event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLButtonElement>();
	});

	delegate('textarea', 'keydown', event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLTextAreaElement>();
	});

	delegate('a', 'click', event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLAnchorElement>();
	});
});

test('should default to HTMLElement for non-specific selectors', () => {
	delegate('.class', 'click', event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLElement>();
	});

	delegate('#id', 'click', event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLElement>();
	});
});

test('should infer event type from event name', () => {
	delegate('button', 'click', event => {
		expectTypeOf(event).toMatchTypeOf<MouseEvent>();
	});

	delegate('button', 'keydown', event => {
		expectTypeOf(event).toMatchTypeOf<KeyboardEvent>();
	});
});

test('should respect explicit element type override', () => {
	delegate<HTMLButtonElement>('.my-button', 'click', event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLButtonElement>();
	});
});

test('DelegateEvent type should extend the base event with delegateTarget', () => {
	type ClickEvent = DelegateEvent<MouseEvent, HTMLButtonElement>;
	expectTypeOf<ClickEvent>().toMatchTypeOf<MouseEvent>();
	expectTypeOf<ClickEvent['delegateTarget']>().toEqualTypeOf<HTMLButtonElement>();
});

test('DelegateEventHandler type should accept the correct event type', () => {
	type ButtonClickHandler = DelegateEventHandler<MouseEvent, HTMLButtonElement>;
	expectTypeOf<ButtonClickHandler>().toMatchTypeOf<(event: DelegateEvent<MouseEvent, HTMLButtonElement>) => void>();
});

test('should handle multiple event types as array', () => {
	// Two mouse events: union collapses to MouseEvent
	delegate('a', ['click', 'auxclick'], event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLAnchorElement>();
		expectTypeOf(event).toMatchTypeOf<MouseEvent>();
	});

	// Mixed event types: event is the union type
	delegate('a', ['click', 'keypress'], event => {
		expectTypeOf(event.delegateTarget).toEqualTypeOf<HTMLAnchorElement>();
		expectTypeOf(event).toMatchTypeOf<MouseEvent | KeyboardEvent>();
	});
});

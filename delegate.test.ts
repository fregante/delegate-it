import {test, vi, expect} from 'vitest';
import {base, anchor} from './vitest.setup.js';
import delegate from './delegate.js';

test('should add an event listener', () => {
	const spy = vi.fn();
	delegate('a', 'click', spy);
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1);
});

test('should handle events on text nodes', () => {
	const spy = vi.fn();
	delegate('a', 'click', spy);
	anchor.firstChild!.dispatchEvent(new MouseEvent('click', {bubbles: true}));
	expect(spy).toHaveBeenCalledTimes(1);
});

test('should remove an event listener', () => {
	const spy = vi.fn();
	const controller = new AbortController();
	delegate('a', 'click', spy, {signal: controller.signal});
	controller.abort();

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should handle multiple selectors', () => {
	const spy = vi.fn();
	delegate(['a', 'b'], 'click', spy);
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1);
});

test('should not add an event listener of the controller has already aborted', () => {
	const spy = vi.fn();
	delegate('a', 'click', spy, {signal: AbortSignal.abort()});

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should not fire when the selector matches an ancestor of the base element', () => {
	const spy = vi.fn();
	delegate('body', 'click', spy, {base});

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should not add an event listener when passed an already aborted signal', () => {
	const spy = vi.spyOn(base, 'addEventListener');
	delegate('a', 'click', () => ({}), {base, signal: AbortSignal.abort()});

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should call the listener once with the `once` option', () => {
	const spy = vi.fn();
	delegate('a', 'click', spy, {base, once: true});

	base.click();
	expect(spy).toHaveBeenCalledTimes(0); // It should not be called on the container
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1); // It should be called on the delegate target
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1); // It should not be called again on the delegate target
});

test('should add a specific event listener only once', () => {
	const spy = vi.fn();

	// Only deduplicates the `capture` flag
	// https://github.com/fregante/delegate-it/pull/11#discussion_r285481625

	// Capture: false
	delegate('a', 'click', spy);
	delegate('a', 'click', spy, {passive: true});
	delegate('a', 'click', spy, {capture: false});

	// Capture: true
	delegate('a', 'click', spy, {capture: true});

	// Once
	delegate('a', 'click', spy, {once: true});
	delegate('a', 'click', spy, {once: false});

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(2);
});

test('should deduplicate identical listeners added after `once:true`', () => {
	const spy = vi.fn();
	delegate('a', 'click', spy, {once: true});
	delegate('a', 'click', spy, {once: false});

	base.click();
	expect(spy).toHaveBeenCalledTimes(0); // It should not be called on the container
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1); // It should be called on the delegate target
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1); // It should not be called again on the delegate target
});

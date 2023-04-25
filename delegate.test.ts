import {test, vi, expect} from 'vitest';
import {base, anchor} from './vitest.setup.js';
import delegate from './delegate.js';

test('should add an event listener', () => {
	const callback = vi.fn();
	delegate('a', 'click', callback);
	anchor.click();
	expect(callback).toHaveBeenCalledTimes(1);
});

test('should handle events on text nodes', () => {
	const callback = vi.fn();
	delegate('a', 'click', callback);
	anchor.firstChild!.dispatchEvent(new MouseEvent('click', {bubbles: true}));
	expect(callback).toHaveBeenCalledTimes(1);
});

test('should remove an event listener', () => {
	const callback = vi.fn();
	const controller = new AbortController();
	delegate('a', 'click', {callback, signal: controller.signal});
	controller.abort();

	anchor.click();
	expect(callback).toHaveBeenCalledTimes(0);
});

test('should not add an event listener of the controller has already aborted', () => {
	const callback = vi.fn();
	delegate('a', 'click', {callback, signal: AbortSignal.abort()});

	anchor.click();
	expect(callback).toHaveBeenCalledTimes(0);
});

test('should not fire when the selector matches an ancestor of the base element', () => {
	const callback = vi.fn();
	delegate('body', 'click', {base, callback});

	anchor.click();
	expect(callback).toHaveBeenCalledTimes(0);
});

test('should not add an event listener when passed an already aborted signal', () => {
	const callback = vi.spyOn(base, 'addEventListener');
	delegate('a', 'click', {base, signal: AbortSignal.abort(), callback: () => ({})});

	anchor.click();
	expect(callback).toHaveBeenCalledTimes(0);
});

test('should call the listener once with the `once` option', () => {
	const callback = vi.fn();
	delegate('a', 'click', {callback, base, once: true});

	base.click();
	expect(callback).toHaveBeenCalledTimes(0); // It should not be called on the container
	anchor.click();
	expect(callback).toHaveBeenCalledTimes(1); // It should be called on the delegate target
	anchor.click();
	expect(callback).toHaveBeenCalledTimes(1); // It should not be called again on the delegate target
});

test('should add a specific event listener only once', () => {
	const callback = vi.fn();

	// Only deduplicates the `capture` flag
	// https://github.com/fregante/delegate-it/pull/11#discussion_r285481625

	// Capture: false
	delegate('a', 'click', callback);
	delegate('a', 'click', {callback, passive: true});
	delegate('a', 'click', {callback, capture: false});

	// Capture: true
	delegate('a', 'click', {callback, capture: true});

	// Once
	delegate('a', 'click', {callback, once: true});
	delegate('a', 'click', {callback, once: false});

	anchor.click();
	expect(callback).toHaveBeenCalledTimes(2);
});

test('should deduplicate identical listeners added after `once:true`', () => {
	const callback = vi.fn();
	delegate('a', 'click', {callback, once: true});
	delegate('a', 'click', {callback, once: false});

	base.click();
	expect(callback).toHaveBeenCalledTimes(0); // It should not be called on the container
	anchor.click();
	expect(callback).toHaveBeenCalledTimes(1); // It should be called on the delegate target
	anchor.click();
	expect(callback).toHaveBeenCalledTimes(1); // It should not be called again on the delegate target
});

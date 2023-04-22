import {test, vi, expect} from 'vitest';
import {container, anchor} from './vitest.setup.js';
import delegate from './delegate.js';

test('should add an event listener', () => {
	const spy = vi.fn();
	delegate(container, 'a', 'click', spy);
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1);
});

test('should handle events on text nodes', () => {
	const spy = vi.fn();
	delegate(container, 'a', 'click', spy);
	anchor.firstChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
	expect(spy).toHaveBeenCalledTimes(1);
});

test('should remove an event listener', () => {
	const spy = vi.fn();
	const controller = new AbortController();
	delegate(container, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should not add an event listener of the controller has already aborted', () => {
	const spy = vi.fn();
	delegate(container, 'a', 'click', spy, {signal: AbortSignal.abort()});

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should add event listeners to all the elements in a base selector', () => {
	const spy = vi.fn();
	delegate('li', 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	expect(spy).toHaveBeenCalledTimes(2);
});

test('should remove the event listeners from all the elements in a base selector', () => {
	const spy = vi.fn();
	const controller = new AbortController();
	delegate('li', 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	expect(spy).toHaveBeenCalledTimes(0);
});

test('should pass an AbortSignal to the event listeners on all the elements in a base selector', () => {
	const spy = vi.fn();
	const controller = new AbortController();
	delegate('li', 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	expect(spy).toHaveBeenCalledTimes(0);
});

test('should add event listeners to all the elements in a base array', () => {
	const spy = vi.fn();
	const items = document.querySelectorAll('li');
	delegate(items, 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	expect(spy).toHaveBeenCalledTimes(2);
});

test('should remove the event listeners from all the elements in a base array', () => {
	const spy = vi.fn();
	const items = document.querySelectorAll('li');
	const controller = new AbortController();
	delegate(items, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	expect(spy).toHaveBeenCalledTimes(0);
});

test('should pass an AbortSignal to the event listeners on all the elements in a base array', () => {
	const spy = vi.fn();
	const items = document.querySelectorAll('li');
	const controller = new AbortController();
	delegate(items, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	expect(spy).toHaveBeenCalledTimes(0);
});

test('should not fire when the selector matches an ancestor of the base element', () => {
	const spy = vi.fn();
	delegate(container, 'body', 'click', spy);

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should not add an event listener when passed an already aborted signal', () => {
	const spy = vi.spyOn(container, 'addEventListener');
	delegate(container, 'a', 'click', spy, {signal: AbortSignal.abort()});

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(0);
});

test('should call the listener once with the `once` option', () => {
	const spy = vi.fn();
	delegate(container, 'a', 'click', spy, {once: true});

	container.click();
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
	delegate(container, 'a', 'click', spy);
	delegate(container, 'a', 'click', spy, {passive: true});
	delegate(container, 'a', 'click', spy, {capture: false});

	// Capture: true
	delegate(container, 'a', 'click', spy, true);
	delegate(container, 'a', 'click', spy, {capture: true});

	// Once
	delegate(container, 'a', 'click', spy, {once: true});
	delegate(container, 'a', 'click', spy, {once: false});

	anchor.click();
	expect(spy).toHaveBeenCalledTimes(2);
});

test('should deduplicate identical listeners added after `once:true`', () => {
	const spy = vi.fn();
	delegate(container, 'a', 'click', spy, {once: true});
	delegate(container, 'a', 'click', spy, {once: false});

	container.click();
	expect(spy).toHaveBeenCalledTimes(0); // It should not be called on the container
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1); // It should be called on the delegate target
	anchor.click();
	expect(spy).toHaveBeenCalledTimes(1); // It should not be called again on the delegate target
});

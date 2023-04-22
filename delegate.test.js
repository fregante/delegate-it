import {test, assert as t} from 'vitest';
import sinon from 'sinon';
import {container, anchor} from './vitest.setup.js';
import delegate from './delegate.js';

test.serial('should add an event listener', () => {
	delegate(container, 'a', 'click', t.pass);
	anchor.click();
});

test.serial('should handle events on text nodes', () => {
	delegate(container, 'a', 'click', t.pass);
	anchor.firstChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
});

test.serial('should remove an event listener', () => {
	const spy = sinon.spy();
	const controller = new AbortController();
	delegate(container, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should not add an event listener of the controller has already aborted', () => {
	const spy = sinon.spy();
	delegate(container, 'a', 'click', spy, {signal: AbortSignal.abort()});

	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should add event listeners to all the elements in a base selector', () => {
	const spy = sinon.spy();
	delegate('li', 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	t.true(spy.calledTwice);
});

test.serial('should remove the event listeners from all the elements in a base selector', () => {
	const spy = sinon.spy();
	const controller = new AbortController();
	delegate('li', 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	t.true(spy.notCalled);
});

test.serial('should pass an AbortSignal to the event listeners on all the elements in a base selector', () => {
	const spy = sinon.spy();
	const controller = new AbortController();
	delegate('li', 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	t.true(spy.notCalled);
});

test.serial('should add event listeners to all the elements in a base array', () => {
	const spy = sinon.spy();
	const items = document.querySelectorAll('li');
	delegate(items, 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	t.true(spy.calledTwice);
});

test.serial('should remove the event listeners from all the elements in a base array', () => {
	const spy = sinon.spy();
	const items = document.querySelectorAll('li');
	const controller = new AbortController();
	delegate(items, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	t.true(spy.notCalled);
});

test.serial('should pass an AbortSignal to the event listeners on all the elements in a base array', () => {
	const spy = sinon.spy();
	const items = document.querySelectorAll('li');
	const controller = new AbortController();
	delegate(items, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	t.true(spy.notCalled);
});

test.serial('should not fire when the selector matches an ancestor of the base element', () => {
	const spy = sinon.spy();
	delegate(container, 'body', 'click', spy);

	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should not add an event listener when passed an already aborted signal', () => {
	const spy = sinon.spy(container, 'addEventListener');
	delegate(container, 'a', 'click', spy, {signal: AbortSignal.abort()});

	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should call the listener once with the `once` option', () => {
	const spy = sinon.spy();
	delegate(container, 'a', 'click', spy, {once: true});

	container.click();
	t.true(spy.notCalled, 'It should not be called on the container');
	anchor.click();
	t.true(spy.calledOnce, 'It should be called on the delegate target');
	anchor.click();
	t.true(spy.calledOnce, 'It should not be called again on the delegate target');
});

test.serial('should add a specific event listener only once', () => {
	t.plan(2);

	// Only deduplicates the `capture` flag
	// https://github.com/fregante/delegate-it/pull/11#discussion_r285481625

	// Capture: false
	delegate(container, 'a', 'click', t.pass);
	delegate(container, 'a', 'click', t.pass, {passive: true});
	delegate(container, 'a', 'click', t.pass, {capture: false});

	// Capture: true
	delegate(container, 'a', 'click', t.pass, true);
	delegate(container, 'a', 'click', t.pass, {capture: true});

	// Once
	delegate(container, 'a', 'click', t.pass, {once: true});
	delegate(container, 'a', 'click', t.pass, {once: false});

	anchor.click();
});

test.serial('should deduplicate identical listeners added after `once:true`', () => {
	const spy = sinon.spy();
	delegate(container, 'a', 'click', spy, {once: true});
	delegate(container, 'a', 'click', spy, {once: false});

	container.click();
	t.true(spy.notCalled, 'It should not be called on the container');
	anchor.click();
	t.true(spy.calledOnce, 'It should be called on the delegate target');
	anchor.click();
	t.true(spy.calledOnce, 'It should not be called again on the delegate target');
});

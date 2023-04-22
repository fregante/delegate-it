import test from 'ava';
import sinon from 'sinon';
import {JSDOM} from 'jsdom';
import delegate from './index.js';

const {window} = new JSDOM(`
	<ul>
		<li><a>Item 1</a></li>
		<li><a>Item 2</a></li>
		<li><a>Item 3</a></li>
		<li><a>Item 4</a></li>
		<li><a>Item 5</a></li>
	</ul>
`);

global.Text = window.Text;
global.Event = window.Event;
global.Element = window.Element;
global.Document = window.Document;
global.MouseEvent = window.MouseEvent;
global.AbortController = window.AbortController;
global.document = window.document;
const container = window.document.querySelector('ul');
const anchor = window.document.querySelector('a');

test.serial('should add an event listener', t => {
	delegate(container, 'a', 'click', t.pass);
	anchor.click();
});

test.serial('should handle events on text nodes', t => {
	delegate(container, 'a', 'click', t.pass);
	anchor.firstChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
});

test.serial('should remove an event listener', t => {
	const spy = sinon.spy();
	const controller = new AbortController();
	delegate(container, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	const anchor = document.querySelector('a');
	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should pass an AbortSignal to an event listener', t => {
	const spy = sinon.spy();
	const controller = new AbortController();
	delegate(container, 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	const anchor = document.querySelector('a');
	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should add event listeners to all the elements in a base selector', t => {
	const spy = sinon.spy();
	delegate('li', 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	t.true(spy.calledTwice);
});

test.serial('should remove the event listeners from all the elements in a base selector', t => {
	const spy = sinon.spy();
	const controller = new AbortController();
	delegate('li', 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	t.true(spy.notCalled);
});

test.serial('should pass an AbortSignal to the event listeners on all the elements in a base selector', t => {
	const spy = sinon.spy();
	const controller = new AbortController();
	delegate('li', 'a', 'click', spy, {signal: controller.signal});
	controller.abort();

	for (const anchor of document.querySelectorAll('a')) {
		anchor.click();
	}

	t.true(spy.notCalled);
});

test.serial('should add event listeners to all the elements in a base array', t => {
	const spy = sinon.spy();
	const items = document.querySelectorAll('li');
	delegate(items, 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	t.true(spy.calledTwice);
});

test.serial('should remove the event listeners from all the elements in a base array', t => {
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

test.serial('should pass an AbortSignal to the event listeners on all the elements in a base array', t => {
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

test.serial('should not fire when the selector matches an ancestor of the base element', t => {
	const spy = sinon.spy();
	delegate(container, 'body', 'click', spy);

	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should not add an event listener when passed an already aborted signal', t => {
	const spy = sinon.spy(container, 'addEventListener');
	delegate(container, 'a', 'click', spy, {signal: AbortSignal.abort()});

	anchor.click();
	t.true(spy.notCalled);
});

test.serial('should call the listener once with the `once` option', t => {
	const spy = sinon.spy();
	delegate(container, 'a', 'click', spy, {once: true});

	container.click();
	t.true(spy.notCalled, 'It should not be called on the container');
	anchor.click();
	t.true(spy.calledOnce, 'It should be called on the delegate target');
	anchor.click();
	t.true(spy.calledOnce, 'It should not be called again on the delegate target');
});

test.serial('should add a specific event listener only once', t => {
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

test.serial('should deduplicate identical listeners added after `once:true`', t => {
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

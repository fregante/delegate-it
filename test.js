import test from 'ava';
import sinon from 'sinon';
import {createRequire} from 'module';
import delegate from './index.js';

const require = createRequire(import.meta.url);
export const {JSDOM} = require('jsdom');

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
global.document = window.document;
const container = window.document.querySelector('ul');
const anchor = window.document.querySelector('a');

test.serial('should add an event listener', t => {
	delegate(container, 'a', 'click', t.pass);
	anchor.click();
});

test.serial('should add an event listener only once', t => {
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

	anchor.click();
});

test.serial('should handle events on text nodes', t => {
	delegate(container, 'a', 'click', t.pass);
	anchor.firstChild.dispatchEvent(new MouseEvent('click', {bubbles: true}));
});

test.serial('should remove an event listener', t => {
	const spy = sinon.spy(container, 'removeEventListener');

	const delegation = delegate(container, 'a', 'click', () => {});
	delegation.destroy();

	t.true(spy.calledOnce);
	spy.restore();
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
	const items = document.querySelectorAll('li');
	const spies = Array.prototype.map.call(items, li => {
		return sinon.spy(li, 'removeEventListener');
	});

	const delegation = delegate('li', 'a', 'click', () => {});
	delegation.destroy();

	t.true(spies.every(spy => {
		const success = spy.calledOnce;
		spy.restore();
		return success;
	}));
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
	const items = document.querySelectorAll('li');
	const spies = Array.prototype.map.call(items, li => {
		return sinon.spy(li, 'removeEventListener');
	});

	const delegation = delegate(items, 'a', 'click', () => {});
	delegation.destroy();

	t.true(spies.every(spy => {
		const success = spy.calledOnce;
		spy.restore();
		return success;
	}));
});

test.serial('should not fire when the selector matches an ancestor of the base element', t => {
	const spy = sinon.spy();
	delegate(container, 'body', 'click', spy);

	anchor.click();
	t.true(spy.notCalled);
});

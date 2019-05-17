import test from 'ava';
import sinon from 'sinon';
import {JSDOM} from 'jsdom';
import delegate from '.';

const {window} = new JSDOM(`
    <ul>
        <li><a>Item 1</a></li>
        <li><a>Item 2</a></li>
        <li><a>Item 3</a></li>
        <li><a>Item 4</a></li>
        <li><a>Item 5</a></li>
    </ul>
`);

global.Event = window.Event;
global.Element = window.Element;
global.EventTarget = window.EventTarget;
global.document = window.document;
const container = window.document.querySelector('ul');
const anchor = window.document.querySelector('a');

test('should add an event listener', t => {
	delegate(container, 'a', 'click', t.pass);
	anchor.click();
});

test('should add an event listener only once', t => {
	t.plan(2);

	delegate(container, 'a', 'click', t.pass, {passive: true});
	delegate(container, 'a', 'click', t.pass, {passive: true});
	delegate(container, 'a', 'click', t.pass, {capture: true});
	anchor.click();
});

test('should remove an event listener', t => {
	const spy = sinon.spy(container, 'removeEventListener');

	const delegation = delegate(container, 'a', 'click', () => {});
	delegation.remove();

	t.true(spy.calledOnce);
	spy.restore();
});

test('should use `document` if the element is unspecified', t => {
	delegate('a', 'click', t.pass);

	anchor.click();
});

test('should remove an event listener the unspecified base (`document`)', t => {
	const delegation = delegate('a', 'click', () => {});
	const spy = sinon.spy(document, 'removeEventListener');

	delegation.remove();
	t.true(spy.calledOnce);
	spy.restore();
});

test('should add event listeners to all the elements in a base selector', t => {
	const spy = sinon.spy();
	delegate('li', 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	t.true(spy.calledTwice);
});

test('should remove the event listeners from all the elements in a base selector', t => {
	const items = document.querySelectorAll('li');
	const spies = Array.prototype.map.call(items, li => {
		return sinon.spy(li, 'removeEventListener');
	});

	const delegations = delegate('li', 'a', 'click', () => {});
	delegations.forEach(delegation => {
		delegation.remove();
	});

	t.true(spies.every(spy => {
		const success = spy.calledOnce;
		spy.restore();
		return success;
	}));
});

test('should add event listeners to all the elements in a base array', t => {
	const spy = sinon.spy();
	const items = document.querySelectorAll('li');
	delegate(items, 'a', 'click', spy);

	const anchors = document.querySelectorAll('a');
	anchors[0].click();
	anchors[1].click();
	t.true(spy.calledTwice);
});

test('should remove the event listeners from all the elements in a base array', t => {
	const items = document.querySelectorAll('li');
	const spies = Array.prototype.map.call(items, li => {
		return sinon.spy(li, 'removeEventListener');
	});

	const delegations = delegate(items, 'a', 'click', () => {});
	delegations.forEach(delegation => {
		delegation.remove();
	});

	t.true(spies.every(spy => {
		const success = spy.calledOnce;
		spy.restore();
		return success;
	}));
});

test('should not fire when the selector matches an ancestor of the base element', t => {
	const spy = sinon.spy();
	delegate(container, 'body', 'click', spy);

	anchor.click();
	t.true(spy.notCalled);
});

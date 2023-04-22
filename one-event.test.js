import test from 'ava';
import sinon from 'sinon';
import {JSDOM} from 'jsdom';
import oneEvent from './one-event.js';

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

test.serial('should add an event listener', async t => {
	const promise = oneEvent(container, 'a', 'click');
	anchor.click();
	const event = await promise;
	t.true(event instanceof MouseEvent);
});

test.serial('should remove an event listener', async t => {
	const spy = sinon.spy();
	const controller = new AbortController();
	const promise = oneEvent(container, 'a', 'click', {signal: controller.signal});
	controller.abort();

	const event = await promise;
	t.is(event, undefined);
});

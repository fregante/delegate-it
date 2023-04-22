import test from 'ava';
import {container, anchor} from './ava.setup.js';
import oneEvent from './one-event.js';

test.serial('should resolve after one event', async t => {
	const promise = oneEvent(container, 'a', 'click');
	anchor.click();
	const event = await promise;
	t.true(event instanceof MouseEvent);
});

test.serial('should resolve with `undefined` after it’s aborted', async t => {
	const controller = new AbortController();
	const promise = oneEvent(container, 'a', 'click', {signal: controller.signal});
	controller.abort();

	const event = await promise;
	t.is(event, undefined);
});

test.serial('should resolve with `undefined` if the signal has already aborted', async t => {
	const promise = oneEvent(container, 'a', 'click', {signal: AbortSignal.abort()});
	const event = await promise;
	t.is(event, undefined);
});

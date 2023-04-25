import {test, expect} from 'vitest';
import {anchor} from './vitest.setup.js';
import oneEvent from './one-event.js';

test('should resolve after one event', async t => {
	const promise = oneEvent('a', 'click');
	anchor.click();
	const event = await promise;
	expect(event).toBeInstanceOf(MouseEvent);
});

test('should resolve with `undefined` after it’s aborted', async t => {
	const controller = new AbortController();
	const promise = oneEvent('a', 'click', {signal: controller.signal});
	controller.abort();

	const event = await promise;
	expect(event).toBeUndefined();
});

test('should resolve with `undefined` if the signal has already aborted', async t => {
	const promise = oneEvent('a', 'click', {signal: AbortSignal.abort()});
	const event = await promise;
	expect(event).toBeUndefined();
});

const delegate = require('../src/delegate');
const simulant = require('simulant');

describe('delegate', () => {
    before(() => {
        const html = `
            <ul>
                <li><a>Item 1</a></li>
                <li><a>Item 2</a></li>
                <li><a>Item 3</a></li>
                <li><a>Item 4</a></li>
                <li><a>Item 5</a></li>
            </ul>
        `;

        document.body.innerHTML += html;

        global.container = document.querySelector('ul');
        global.anchor = document.querySelector('a');

        global.spy = sinon.spy(global.container, 'removeEventListener');
    });

    after(() => {
        global.spy.restore();
        document.body.innerHTML = '';
    });

    it('should add an event listener', done => {
        delegate(global.container, 'a', 'click', () => {
            done();
        });

        simulant.fire(global.anchor, simulant('click'));
    });

    it('should remove an event listener', () => {
        const delegation = delegate(global.container, 'a', 'click', () => {});

        delegation.destroy();
        assert.ok(global.spy.calledOnce);
    });

    it('should use `document` if the element is unspecified', done => {
        delegate('a', 'click', () => {
            done();
        });

        simulant.fire(global.anchor, simulant('click'));
    });

    it('should remove an event listener the unspecified base (`document`)', () => {
        const delegation = delegate('a', 'click', () => {});
        const spy = sinon.spy(document, 'removeEventListener');

        delegation.destroy();
        assert.ok(spy.calledOnce);

        spy.restore();
    });

    it('should add event listeners to all the elements in a base selector', () => {
        const spy = sinon.spy();
        delegate('li', 'a', 'click', spy);

        const anchors = document.querySelectorAll('a');
        simulant.fire(anchors[0], simulant('click'));
        simulant.fire(anchors[1], simulant('click'));
        assert.ok(spy.calledTwice);
    });

    it('should remove the event listeners from all the elements in a base selector', () => {
        const items = document.querySelectorAll('li');
        const spies = Array.prototype.map.call(items, li => {
            return sinon.spy(li, 'removeEventListener');
        });

        const delegations = delegate('li', 'a', 'click', () => {});
        delegations.forEach(delegation => {
            delegation.destroy();
        });

        spies.every(spy => {
            const success = spy.calledOnce;
            spy.restore();
            return success;
        });
    });

    it('should add event listeners to all the elements in a base array', () => {
        const spy = sinon.spy();
        const items = document.querySelectorAll('li');
        delegate(items, 'a', 'click', spy);

        const anchors = document.querySelectorAll('a');
        simulant.fire(anchors[0], simulant('click'));
        simulant.fire(anchors[1], simulant('click'));
        assert.ok(spy.calledTwice);
    });

    it('should remove the event listeners from all the elements in a base array', () => {
        const items = document.querySelectorAll('li');
        const spies = Array.prototype.map.call(items, li => {
            return sinon.spy(li, 'removeEventListener');
        });

        const delegations = delegate(items, 'a', 'click', () => {});
        delegations.forEach(delegation => {
            delegation.destroy();
        });

        spies.every(spy => {
            const success = spy.calledOnce;
            spy.restore();
            return success;
        });
    });

    it('should not fire when the selector matches an ancestor of the base element', () => {
        const spy = sinon.spy();
        delegate(global.container, 'body', 'click', spy);

        simulant.fire(global.anchor, simulant('click'));
        assert.ok(spy.notCalled);

    });
});

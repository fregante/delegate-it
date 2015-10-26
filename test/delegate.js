var delegate = require('../src/delegate');
var simulant = require('simulant');

describe('delegate', function() {
    before(function() {
        var html = '<ul>' +
                        '<li><a href="#">Item 1</a></li>' +
                        '<li><a href="#">Item 2</a></li>' +
                        '<li><a href="#">Item 3</a></li>' +
                        '<li><a href="#">Item 4</a></li>' +
                        '<li><a href="#">Item 5</a></li>' +
                   '</ul>';

        document.body.innerHTML += html;

        global.container = document.querySelector('ul');
        global.anchor = document.querySelector('a');

        global.spy = sinon.spy(global.container, 'removeEventListener');
    });

    after(function() {
        global.spy.restore();
        document.body.innerHTML = '';
    });

    it('should add an event listener', function(done) {
        delegate(global.container, 'a', 'click', function() {
            done();
        });

        simulant.fire(global.anchor, simulant('click'));
    });

    it('should remove an event listener', function() {
        var delegation = delegate(global.container, 'a', 'click', function() {});

        delegation.destroy();
        assert.ok(global.spy.calledOnce);
    });
});

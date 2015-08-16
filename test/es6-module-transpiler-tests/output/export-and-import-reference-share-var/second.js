'use strict';

var first = require('./first');

// This variable declaration is going to be altered because `b` needs to be
// re-written. We need to make sure that the `a` re-writing and the unaffected
// `c` declarator are not being clobbered by that alteration.
var a_ = first.a, b = 9, c = 'c';

assert.equal(first.a, 1);
assert.equal(a_, 1);
assert.equal(b, 9);
assert.equal(c, 'c');

exports.b = b;
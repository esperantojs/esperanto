'use strict';

var a = 1;
assert.equal(a, 1);

<<<<<<< HEAD
var a_ = a;
exports.b = 9;
var c = 'c';
=======
// This variable declaration is going to be altered because `b` needs to be
// re-written. We need to make sure that the `a` re-writing and the unaffected
// `c` declarator are not being clobbered by that alteration.
var a_ = a, b = 9, c = 'c';

>>>>>>> master
assert.equal(a, 1);
assert.equal(a_, 1);
assert.equal(exports.b, 9);
assert.equal(c, 'c');

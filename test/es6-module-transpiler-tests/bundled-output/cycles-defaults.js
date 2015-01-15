'use strict';

var b = { b: 2, get a() { return a.a; } };

var a = { a: 1, get b() { return b.b; } };

assert.equal(a.a, 1);
assert.equal(a.b, 2);
assert.equal(b.a, 1);
assert.equal(b.b, 2);
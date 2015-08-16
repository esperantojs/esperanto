'use strict';

var foo = {
  get a () { return a; },
  get b () { return b; },
  get default () { return foo__default; }
};

var a = 'a';
var b = 'b';
var foo__default = 'DEF';

assert.equal(foo['default'], 'DEF');
assert.equal(foo.b, 'b');
assert.equal(foo.a, 'a');

var keys = [];
for (var key in foo) {
  keys.push(key);
}
assert.deepEqual(keys.sort(), ['a', 'b', 'default']);
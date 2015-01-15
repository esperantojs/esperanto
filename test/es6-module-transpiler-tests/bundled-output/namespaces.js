'use strict';

var exporter = {
	get a () { return a; },
	get b () { return b; },
	get default () { return exporter__default; }
};

var a = 'a';
var b = 'b';
var exporter__default = 'DEF';

assert.equal(exporter['default'], 'DEF');
assert.equal(exporter.b, 'b');
assert.equal(exporter.a, 'a');

var keys = [];
for (var key in exporter) {
  keys.push(key);
}
assert.deepEqual(keys.sort(), ['a', 'b', 'default']);
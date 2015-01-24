'use strict';

var value = require('./exporter');

assert.equal(value['default'], 42);

value.change();
assert.equal(
  value['default'],
  42,
  'default export should not be bound'
);
'use strict';

require('./exporter');
require('./consumer');

assert.equal(global.sideEffectyOutput, 42);
'use strict';

var b = require('./b');

exports['default'] = { a: 1, get b() { return b['default'].b; } };
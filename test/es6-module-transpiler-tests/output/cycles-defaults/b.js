'use strict';

var a = require('./a');

exports['default'] = { b: 2, get a() { return a['default'].a; } };
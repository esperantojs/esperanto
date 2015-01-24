'use strict';

Object.defineProperty(exports, 'a', { get: function () { return first.a; }});

var first = require('./first');

assert.equal(typeof a, 'undefined');
'use strict';

Object.defineProperty(exports, 'a', { enumerable: true, get: function () { return first.a; }});

var first = require('./first');

assert.equal(typeof a, 'undefined');
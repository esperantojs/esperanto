'use strict';

Object.defineProperty(exports, 'foo', { enumerable: true, get: function () { return bar.foo; }});

var bar = require('bar');
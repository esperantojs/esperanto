define(['exports', 'bar'], function (exports, bar) {

	'use strict';

	Object.defineProperty(exports, 'foo', { enumerable: true, get: function () { return bar.foo; }});

});
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory((global.myModule = {}))
}(this, function (exports) { 'use strict';

	var _exports = {};
	_exports.foo = 'bar';

	exports['default'] = _exports;

}));
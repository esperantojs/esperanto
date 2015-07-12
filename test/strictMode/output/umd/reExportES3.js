(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('foo')) :
	typeof define === 'function' && define.amd ? define(['exports', 'foo'], factory) :
	factory((global.myModule = {}), global.foo)
}(this, function (exports, foo) { 'use strict';



	exports['default'] = foo['default'];

}));
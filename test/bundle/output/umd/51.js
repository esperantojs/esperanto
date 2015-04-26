(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('highlight.js')) :
	typeof define === 'function' && define.amd ? define(['highlight.js'], factory) :
	factory(global.highlight)
}(this, function (highlight) { 'use strict';

	highlight = ('default' in highlight ? highlight['default'] : highlight);

	var foo = 42;



}));
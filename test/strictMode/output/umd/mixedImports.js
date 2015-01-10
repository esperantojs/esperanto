(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('asap')) :
	typeof define === 'function' && define.amd ? define(['asap'], factory) :
	factory(global.asap)
}(this, function (asap) { 'use strict';

}));
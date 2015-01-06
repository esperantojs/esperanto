(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['asap'], factory) :
	typeof exports === 'object' ? factory(require('asap')) :
	factory(global.asap)
}(this, function (asap) { 'use strict';

}));
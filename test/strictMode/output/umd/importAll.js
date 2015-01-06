(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['fs'], factory) :
	typeof exports === 'object' ? factory(require('fs')) :
	factory(global.fs)
}(this, function (fs) { 'use strict';

}));
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('fo\no')) :
	typeof define === 'function' && define.amd ? define(['fo\no'], factory) :
	factory(global.foo)
}(this, function (foo) { 'use strict';

}));
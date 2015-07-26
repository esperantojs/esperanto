(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('external')) :
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	factory(global.Correct);
}(this, function (Correct) { 'use strict';

	Correct = 'default' in Correct ? Correct['default'] : Correct;

}));
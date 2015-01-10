(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('external')) :
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	factory(global.ImplicitlyNamed)
}(this, function (ImplicitlyNamed) { 'use strict';

	ImplicitlyNamed = ('default' in ImplicitlyNamed ? ImplicitlyNamed['default'] : ImplicitlyNamed);

}));
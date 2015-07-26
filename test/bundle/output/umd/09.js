(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('external')) :
	typeof define === 'function' && define.amd ? define(['external'], factory) :
	factory(global.Correct);
}(this, function (ExplicitlyNamed) { 'use strict';

	ExplicitlyNamed = 'default' in ExplicitlyNamed ? ExplicitlyNamed['default'] : ExplicitlyNamed;

	new ExplicitlyNamed();

}));

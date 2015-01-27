(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('./mod/path/location')) :
	typeof define === 'function' && define.amd ? define(['./mod/path/location'], factory) :
	factory(global.path__location)
}(this, function (path__location) { 'use strict';

	path__location.find();
	console.log(location.href);

}));
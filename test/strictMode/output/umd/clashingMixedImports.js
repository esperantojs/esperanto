(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('duplicated'), require('elsewhere')) :
	typeof define === 'function' && define.amd ? define(['exports', 'duplicated', 'elsewhere'], factory) :
	factory((global.myModule = {}), global.duplicated, global.elsewhere)
}(this, function (exports, duplicated, elsewhere) { 'use strict';

	exports['default'] = function() {
		return [duplicated.something, elsewhere['default']];
	}

}));
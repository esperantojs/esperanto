(function (global, factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	typeof exports === 'object' ? module.exports = factory() :
	global.myModule = factory()
}(this, function () { 'use strict';

	'use strict';

	function foo ( str ) {
		return str.toUpperCase();
	}

	return foo;

}));
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('whatever')) :
	typeof define === 'function' && define.amd ? define(['whatever'], factory) :
	global.myModule = factory(global.whatever)
}(this, function (whatever) { 'use strict';

	whatever();


	return 'someExport';

}));
/* this is a footer */
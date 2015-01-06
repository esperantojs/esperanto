/* this is a banner */
(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['exports', 'whatever'], factory) :
	typeof exports === 'object' ? factory(exports, require('whatever')) :
	(global.myModule = {}, factory(global.myModule, global.whatever))
}(this, function (exports, whatever) { 'use strict';

	whatever['default']();

	exports['default'] = 'someExport';

}));
/* this is a footer */
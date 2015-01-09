(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('whatever')) :
	typeof define === 'function' && define.amd ? define(['exports', 'whatever'], factory) :
	factory((global.myModule = {}), global.whatever)
}(this, function (exports, whatever) { 'use strict';

	whatever['default']();

	exports['default'] = 'someExport';

}));
/* this is a footer */
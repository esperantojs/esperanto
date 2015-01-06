(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['whatever'], factory) :
	typeof exports === 'object' ? module.exports = factory(require('whatever')) :
	global.myModule = factory(global.whatever)
}(this, function (whatever) { 'use strict';

	'use strict';

	whatever();


	return 'someExport';

}));
/* this is a footer */
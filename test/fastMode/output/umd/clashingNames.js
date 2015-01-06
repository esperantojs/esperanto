(function (global, factory) {
	typeof define === 'function' && define.amd ? define(['foo'], factory) :
	typeof exports === 'object' ? factory(require('foo')) :
	factory()
}(this, function () { 'use strict';

	'use strict';

	var foo = 'should not clash';

	bar();

}));
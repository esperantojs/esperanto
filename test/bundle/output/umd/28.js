(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	var foo = () => undefined;

	assert.strictEqual( undefined, undefined );

	var ctx = {};
	var arrow = (x => assert.strictEqual( undefined, undefined ));
	var fn = function () { assert.strictEqual( this, ctx ); };

	arrow.call(ctx);
	fn.call(ctx);

	assert.strictEqual(foo(), undefined);

}));
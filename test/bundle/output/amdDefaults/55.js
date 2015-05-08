define(function () {

	'use strict';

	class A {
		b () {
			return new _B();
		}

		c () {
			return new _C();
		}
	}

	var _A = A;

	class B extends _A {}

	var _B = B;

	class C extends _A {}

	var _C = C;



});
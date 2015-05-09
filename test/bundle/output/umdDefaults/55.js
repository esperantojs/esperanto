(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(factory) :
	factory()
}(function () { 'use strict';

	class A {
		b () {
			return new B();
		}

		c () {
			return new C();
		}
	}

	class B extends A {}

	class C extends A {}



}));
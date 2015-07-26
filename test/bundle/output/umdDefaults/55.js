(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

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
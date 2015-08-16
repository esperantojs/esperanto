(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}(this, function () { 'use strict';

	class A {
		constructor () {
			console.log( 'creating A' );
		}

		b () {
			return new B();
		}
	}

	class B extends A {
		constructor () {
			console.log( 'creating B' );
		}
	}

	class D {
		constructor () {
			console.log( 'creating D' );
		}

		c () {
			return new C();
		}
	}

	class C extends D {
		constructor () {
			console.log( 'creating C' );
		}
	}

	new A().b();
	new B();
	new C();
	new D().c();

}));
define(function () { 'use strict';

	class A {
		b () {
			return new B();
		}

		c () {
			return new C();
		}
	}

	class C extends A {}

	class B extends A {}

	new A();

});

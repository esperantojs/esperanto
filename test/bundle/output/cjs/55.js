'use strict';

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


import B from './B';
import C from './C';

class A {
	b () {
		return new B();
	}

	c () {
		return new C();
	}
}

export default A;

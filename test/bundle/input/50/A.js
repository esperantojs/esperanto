import B from './B';

export default class A {
	constructor () {
		console.log( 'creating A' );
	}

	b () {
		return new B();
	}
}
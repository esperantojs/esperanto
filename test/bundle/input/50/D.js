import C from './C';

export default class D {
	constructor () {
		console.log( 'creating D' );
	}

	c () {
		return new C();
	}
}
import a from 'a';
import b from 'b';

export default function external () {
	console.log( 'I am an external dependency' );
	a();
	b();
}
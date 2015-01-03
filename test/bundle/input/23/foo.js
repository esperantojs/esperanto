import { baz } from './foo';

export function bar () {
	baz();
}

export function baz () {
	console.log( 'bazzing' );
}
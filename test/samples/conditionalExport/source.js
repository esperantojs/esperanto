var foo = function () {};
var bar = 'a';

if ( false ) {
	foo = function () {
		bar = 'b';
	};
}

export { foo, bar };
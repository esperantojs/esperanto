export default notActuallyFoo;

function notActuallyFoo () {
	foo();
}

function foo () {
	console.log( 'actually foo' );
}

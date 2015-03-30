var a = 1;

function incr () {
	var b = a++;
	console.log( 'incremented from %s to %s', b, a );
}

export { a as num, incr };
var a = 100;

function decr () {
	console.log( '%d bottles of beer on the wall', --a );
	console.log( '%d bottles of beer', a-- );
}

export { a as num, decr };
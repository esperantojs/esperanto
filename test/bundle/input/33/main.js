import Promise from './Promise';
import * as Math from './Math';
import foo from './foo';

var promise = new Promise();
promise.keep();

console.log( Math.add( 40, 2 ) );

foo().then( function ( num ) {
	console.log( num );
});

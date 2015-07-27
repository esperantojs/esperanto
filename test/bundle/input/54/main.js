import Promise from 'bluebird';
import foo from './foo';

Promise.resolve( foo ).then( function ( foo ) {
	console.log( foo );
});

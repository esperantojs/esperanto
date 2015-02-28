import hasOwnProp from './hasOwnProp';

export default function disallowConflictingImports ( imports ) {
	let usedNames = {};

	imports.forEach( x => {
		if ( x.name ) {
			checkName( x.name );
		}

		else {
			x.specifiers.forEach( checkSpecifier );
		}
	});

	function checkSpecifier ( s ) {
		checkName( s.as );
	}

	function checkName ( name ) {
		if ( hasOwnProp.call( usedNames, name ) ) {
			throw new SyntaxError( `Duplicated import ('${name}')` );
		}

		usedNames[ name ] = true;
	}
}

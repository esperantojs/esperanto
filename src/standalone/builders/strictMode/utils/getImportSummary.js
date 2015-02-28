import hasOwnProp from 'utils/hasOwnProp';

export default function getImportSummary ( mod ) {
	var importPaths = [], importNames = [], seen = {}, placeholders = 0;

	mod.imports.forEach( x => {
		if ( !hasOwnProp.call( seen, x.path ) ) {
			importPaths.push( x.path );

			if ( x.specifiers.length ) {
				while ( placeholders ) {
					importNames.push( '__dep' + importNames.length + '__' );
					placeholders--;
				}
				importNames.push( x.name );
			} else {
				placeholders++;
			}

			seen[ x.path ] = true;
		}
	});

	return [ importPaths, importNames ];
}

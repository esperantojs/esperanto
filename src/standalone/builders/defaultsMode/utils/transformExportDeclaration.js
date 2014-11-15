export default function transformExportDeclaration ( declaration, body ) {
	var exportedValue;

	if ( declaration ) {
		switch ( declaration.type ) {
			case 'namedFunction':
				body.remove( declaration.start, declaration.valueStart );
				exportedValue = declaration.name;
				break;

			case 'anonFunction':
				if ( declaration.isFinal ) {
					body.replace( declaration.start, declaration.valueStart, 'return ' );
				} else {
					body.replace( declaration.start, declaration.valueStart, 'var __export = ' );
					exportedValue = '__export';
				}

				// add semi-colon, if necessary
				if ( declaration.value.slice( -1 ) !== ';' ) {
					body.insert( declaration.end, ';' );
				}

				break;

			case 'expression':
				body.remove( declaration.start, declaration.next );
				exportedValue = declaration.value;
				break;

			default:
				throw new Error( 'Unexpected export type' );
		}

		if ( exportedValue ) {
			body.append( '\nreturn ' + exportedValue + ';' );
		}
	}
}
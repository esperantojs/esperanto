import template from '../../../../utils/template';

var outroTemplate;

export default function getExportBlock ( bundle, entry, indentStr ) {
	var exportBlock = '', statements = [], name;

	name = bundle.uniqueNames[ bundle.entry ];

	// create an export block
	if ( entry.defaultExport ) {
		var defaultName = name;
		if ( bundle.conflicts.hasOwnProperty( name ) ) {
			defaultName += '__default';
		}
		exportBlock = indentStr + 'exports[\'default\'] = ' + defaultName + ';';
	}

	entry.exports.forEach( x => {
		if ( x.default ) {
			return;
		}

		if ( x.declaration ) {
			var declName = bundle.conflicts.hasOwnProperty( x.name ) ?
				name + '__' + x.name :
				x.name;
			statements.push( indentStr + `__export('${x.name}', function () { return ${declName}; });`  );
		}

		else {
			x.specifiers.forEach( s => {
				var declName = bundle.conflicts.hasOwnProperty( s.name ) ?
					name + '__' + s.name :
					s.name;
				statements.push( indentStr + `__export('${s.name}', function () { return ${declName}; });`  );
			});
		}
	});

	if ( statements.length ) {
		if ( exportBlock ) {
			exportBlock += '\n\n';
		}

		exportBlock += outroTemplate({
			exportStatements: statements.join( '\n' )
		}).replace( /\t/g, indentStr );
	}

	return exportBlock;
}

outroTemplate = template( `

	(function (__export) {
	<%= exportStatements %>
	}(function (prop, get) {
		Object.defineProperty(exports, prop, {
			enumerable: true,
			get: get
		});
	}));

` );

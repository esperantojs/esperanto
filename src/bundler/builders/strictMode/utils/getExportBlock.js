import template from '../../../../utils/template';

var outroTemplate;

export default function getExportBlock ( bundle, entry, indentStr ) {
	var exportBlock = '', statements = [], name;

	name = bundle.uniqueNames[ bundle.entry ];

	// create an export block
	if ( entry.defaultExport ) {
		exportBlock = indentStr + 'exports.default = ' + name + '__default;';
	}

	entry.exports.forEach( x => {
		if ( x.default ) {
			return;
		}

		if ( x.declaration ) {
			statements.push( indentStr + `__export('${x.name}', function () { return ${name}__${x.name}; });`  );
		}

		else {
			x.specifiers.forEach( s => {
				statements.push( indentStr + `__export('${s.name}', function () { return ${name}__${s.name}; });`  );
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

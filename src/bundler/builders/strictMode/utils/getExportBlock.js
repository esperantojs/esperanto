export default function getExportBlock ( bundle, entry, indentStr ) {
	var name;

	if ( bundle.entryModule.defaultExport.hasDeclaration ) {
		name = bundle.entryModule.defaultExport.name;
	} else {
		name = bundle.identifierReplacements[ bundle.entry ].default;
	}

	return indentStr + `exports['default'] = ${name};`;
}
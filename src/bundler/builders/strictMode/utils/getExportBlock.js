export default function getExportBlock ( bundle, entry, indentStr ) {
	var name;

	if ( bundle.entryModule.defaultExport.declaration ) {
		name = bundle.entryModule.defaultExport.name;
	} else {
		name = bundle.identifierReplacements[ bundle.entry ].default.name;
	}

	return indentStr + `exports['default'] = ${name};`;
}
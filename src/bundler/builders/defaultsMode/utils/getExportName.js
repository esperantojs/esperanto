export default function getExportName ( bundle ) {
	var x = bundle.entryModule.defaultExport;

	if ( x.declaration ) {
		return x.name;
	}

	return bundle.identifierReplacements[ bundle.entry ].default.name;
}
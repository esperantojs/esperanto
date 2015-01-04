export default function getExportName ( bundle ) {
	var x = bundle.entryModule.defaultExport;

	if ( x.hasDeclaration ) {
		return x.name;
	}

	return bundle.identifierReplacements[ bundle.entry ].default;
}
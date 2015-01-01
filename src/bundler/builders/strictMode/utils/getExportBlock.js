export default function getExportBlock ( bundle, entry, indentStr ) {
	return indentStr + `exports['default'] = ${bundle.identifierReplacements[ bundle.entry ].default.name};`;
}
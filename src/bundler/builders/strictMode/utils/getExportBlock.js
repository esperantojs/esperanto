export default function getExportBlock ( entry, indentStr ) {
	var name = entry.identifierReplacements.default;
	return indentStr + `exports['default'] = ${name};`;
}
export default function getExportBlock ( entry ) {
	var name = entry.identifierReplacements.default;
	return `exports['default'] = ${name};`;
}

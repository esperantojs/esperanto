export default function getExportBlock ( bundle, entry, indentStr ) {
	var name = bundle.uniqueNames[ bundle.entry ];

	return indentStr + 'exports[\'default\'] = ' + name + '__default;';
}
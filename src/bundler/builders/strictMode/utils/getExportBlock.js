export default function getExportBlock ( bundle, entry, indentStr ) {
	var exportBlock = '', name;

	name = bundle.uniqueNames[ bundle.entry ];

	// create an export block
	if ( entry.defaultExport ) {
		exportBlock = indentStr + 'exports[\'default\'] = ' + name + '__default;';
	}

	return exportBlock;
}